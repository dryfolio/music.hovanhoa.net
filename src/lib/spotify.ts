const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`
const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=25`
const TOP_ARTISTS_ENDPOINT = `https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=24`
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played?limit=5`
const PROFILE_ENDPOINT = `https://api.spotify.com/v1/me`
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`

// In-memory token cache + in-flight dedupe: the 4 page sections render
// concurrently and would otherwise each hit Redis/Spotify for a token
let memToken: { accessToken: string; expiresAt: number } | null = null
let tokenInFlight: Promise<string> | null = null

const TOKEN_KEY = 'spotify_token'
const TOKEN_LOCK_KEY = 'spotify_token_lock'
const REFRESH_BACKOFF_KEY = 'spotify_refresh_backoff'

const FETCH_TIMEOUT_MS = 6000
const FETCH_RETRIES = 2

const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const fetchWithTimeout = async (
    url: string,
    init: RequestInit = {},
    retries = FETCH_RETRIES
): Promise<Response> => {
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS)
    try {
        const res = await fetch(url, { ...init, signal: controller.signal })
        // Retry on 5xx / 429 (rate limit). 4xx (other) is a real error — don't retry.
        if (
            !res.ok &&
            retries > 0 &&
            (res.status >= 500 || res.status === 429)
        ) {
            await sleep(300)
            return fetchWithTimeout(url, init, retries - 1)
        }
        return res
    } catch (e) {
        if (retries > 0) {
            await sleep(300)
            return fetchWithTimeout(url, init, retries - 1)
        }
        throw e
    } finally {
        clearTimeout(timeoutId)
    }
}

const getRedis = async () => {
    const { Redis } = await import('@upstash/redis')
    return new Redis({
        url: process.env.UPSTASH_REDIS_REST_URL!,
        token: process.env.UPSTASH_REDIS_REST_TOKEN!,
    })
}

type CachedToken = {
    accessToken: string
    expiresAt: number
    refreshToken: string
}

const doRefresh = async (
    redis: Awaited<ReturnType<typeof getRedis>>,
    refreshToken: string
): Promise<{ accessToken: string; expiresAt: number }> => {
    const basic = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64')
    const response = await fetchWithTimeout(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: refreshToken,
        }),
    })
    const result = await response.json()
    if (result.error) {
        console.error('[Spotify] Token error:', result.error_description)
        return { accessToken: '', expiresAt: 0 }
    }

    // Persist the new tokens to Redis (handles rotating refresh_token)
    const expiresAt = Date.now() + (result.expires_in - 60) * 1000
    const newRefreshToken = result.refresh_token ?? refreshToken
    await redis.set(
        TOKEN_KEY,
        JSON.stringify({
            accessToken: result.access_token,
            expiresAt,
            refreshToken: newRefreshToken,
        })
    )

    return { accessToken: result.access_token, expiresAt }
}

// Spotify rotates the refresh token on every refresh: if two serverless
// instances refresh concurrently, the loser uses an already-rotated token and
// Spotify revokes the whole chain. A Redis NX lock makes refresh exclusive
// across instances — losers poll for the winner's persisted token instead.
const refreshWithLock = async (
    redis: Awaited<ReturnType<typeof getRedis>>
): Promise<{ accessToken: string; expiresAt: number }> => {
    const gotLock = await redis.set(TOKEN_LOCK_KEY, '1', { nx: true, ex: 15 })
    if (!gotLock) {
        for (let i = 0; i < 20; i++) {
            await sleep(500)
            const cached = (await redis.get(TOKEN_KEY)) as CachedToken | null
            if (cached && Date.now() < cached.expiresAt) return cached
        }
        return { accessToken: '', expiresAt: 0 }
    }

    try {
        // Re-read under the lock — another instance may have just refreshed
        const cached = (await redis.get(TOKEN_KEY)) as CachedToken | null
        if (cached && Date.now() < cached.expiresAt) return cached

        if (await redis.get(REFRESH_BACKOFF_KEY)) {
            return { accessToken: '', expiresAt: 0 }
        }

        const envToken = process.env.SPOTIFY_REFRESH_TOKEN ?? ''
        let result = await doRefresh(redis, cached?.refreshToken || envToken)
        // The cached token can be stale (e.g. a deploy raced a rotation) —
        // fall back to the env token once before giving up
        if (
            !result.accessToken &&
            cached?.refreshToken &&
            envToken &&
            cached.refreshToken !== envToken
        ) {
            result = await doRefresh(redis, envToken)
        }
        if (!result.accessToken) {
            // Both tokens dead — needs manual re-auth. Back off so every
            // page render doesn't hammer Spotify's token endpoint.
            await redis.set(REFRESH_BACKOFF_KEY, '1', { ex: 60 })
        }
        return result
    } finally {
        await redis.del(TOKEN_LOCK_KEY)
    }
}

const getAccessToken = async (): Promise<string> => {
    if (memToken && Date.now() < memToken.expiresAt) {
        return memToken.accessToken
    }
    if (tokenInFlight) return tokenInFlight

    tokenInFlight = (async () => {
        const redis = await getRedis()
        const cached = (await redis.get(TOKEN_KEY)) as CachedToken | null
        if (cached && Date.now() < cached.expiresAt) {
            memToken = cached
            return cached.accessToken
        }
        try {
            const result = await refreshWithLock(redis)
            if (result.accessToken) memToken = result
            return result.accessToken
        } catch (e) {
            console.error('[Spotify] Token refresh failed:', e)
            return ''
        }
    })()
    try {
        return await tokenInFlight
    } finally {
        tokenInFlight = null
    }
}

// On failure, fall back to the last successful payload stored in Redis so a
// transient token/API hiccup never blanks out a section
const lastGood = async <T>(url: string): Promise<T | null> => {
    try {
        const redis = await getRedis()
        const data = (await redis.get(`spotify_data:${url}`)) as T | null
        if (data) console.error('[Spotify] serving last-good data for:', url)
        return data
    } catch {
        return null
    }
}

const spotifyFetch = async <T>(url: string): Promise<T | null> => {
    try {
        const accessToken = await getAccessToken()
        if (!accessToken) return lastGood<T>(url)
        const res = await fetchWithTimeout(url, {
            headers: { Authorization: `Bearer ${accessToken}` },
            next: { revalidate: 60 },
        })
        if (!res.ok) {
            console.error('[Spotify] fetch failed:', url, res.status)
            return lastGood<T>(url)
        }
        const data = (await res.json()) as T
        if (data) {
            // A failed cache write shouldn't fail the render
            try {
                const redis = await getRedis()
                await redis.set(`spotify_data:${url}`, JSON.stringify(data))
            } catch {}
        }
        return data
    } catch (e) {
        console.error('[Spotify] fetch error:', url, e)
        return lastGood<T>(url)
    }
}

export interface SpotifyArtistRef {
    href: string
    id: string
    name: string
    external_urls: { spotify: string }
    followers: { href: string | null; total: number }
    genres: string[]
    images: { url: string; height: number | null; width: number | null }[]
    popularity: number
    type: string
    uri: string
}

type NowPlayingTrue = {
    album: string
    albumImageUrl: string
    artist: string
    isPlaying: true
    songUrl: string
    title: string
}

type NowPlayingFalse = {
    isPlaying: false
}

export type NowPlaying = NowPlayingTrue | NowPlayingFalse

export interface SpotifyProfile {
    id: string
    display_name: string
    images: { url: string }[]
    external_urls: { spotify: string }
    followers: { total: number }
}

const getProfile = async (): Promise<SpotifyProfile | null> => {
    return spotifyFetch<SpotifyProfile>(PROFILE_ENDPOINT)
}

const getNowPlaying = async (): Promise<NowPlaying> => {
    const song = await spotifyFetch<any>(NOW_PLAYING_ENDPOINT)
    if (!song || song.item === null) {
        return { isPlaying: false }
    }

    return {
        album: song.item.album.name,
        albumImageUrl: song.item.album.images[0].url,
        artist: song.item.artists.map((a: any) => a.name).join(', '),
        isPlaying: song.is_playing,
        songUrl: song.item.external_urls.spotify,
        title: song.item.name,
    }
}

export interface TopTrack {
    id: string
    artist: SpotifyArtistRef[]
    songUrl: string
    title: string
    imageUrl: string
    previewUrl: string
}

const getTopTracks = async (): Promise<TopTrack[]> => {
    const data = await spotifyFetch<{ items: any[] }>(TOP_TRACKS_ENDPOINT)
    return (
        data?.items?.map((track) => ({
            id: track.id,
            artist: track.artists,
            songUrl: track.external_urls.spotify,
            title: track.name,
            imageUrl:
                track.album.images[1]?.url ?? track.album.images[0]?.url ?? '',
            previewUrl: track.preview_url ?? '',
        })) ?? []
    )
}

export interface RecentlyPlayedTrack {
    id: string
    artist: SpotifyArtistRef[]
    songUrl: string
    title: string
    imageUrl: string
    played_at: string
}

const getRecentlyPlayed = async (): Promise<RecentlyPlayedTrack[]> => {
    const data = await spotifyFetch<{ items: any[] }>(RECENTLY_PLAYED_ENDPOINT)
    return (
        data?.items?.map((item) => ({
            id: item.track.id,
            artist: item.track.artists,
            songUrl: item.track.external_urls.spotify,
            title: item.track.name,
            imageUrl:
                item.track.album.images[1]?.url ??
                item.track.album.images[0]?.url ??
                '',
            played_at: item.played_at,
        })) ?? []
    )
}

export interface TopArtist {
    external_urls: { spotify: string }
    genres: string[]
    href: string
    id: string
    images: { url: string; height: number | null; width: number | null }[]
    name: string
    popularity?: number
    type: 'artist'
    uri: string
}

const getTopArtists = async (): Promise<TopArtist[]> => {
    const data = await spotifyFetch<{ items: TopArtist[] }>(
        TOP_ARTISTS_ENDPOINT
    )
    return data?.items ?? []
}

export {
    getNowPlaying,
    getTopTracks,
    getRecentlyPlayed,
    getTopArtists,
    getProfile,
}
