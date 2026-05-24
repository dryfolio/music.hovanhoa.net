const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`
const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=25`
const TOP_ARTISTS_ENDPOINT = `https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=24`
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played?limit=5`
const PROFILE_ENDPOINT = `https://api.spotify.com/v1/me`
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`

// In-memory lock: prevents concurrent refresh calls within a single warm Lambda
let refreshLock: Promise<{ accessToken: string; expiresAt: number }> | null = null

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
        if (!res.ok && retries > 0 && (res.status >= 500 || res.status === 429)) {
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
        'spotify_token',
        JSON.stringify({
            accessToken: result.access_token,
            expiresAt,
            refreshToken: newRefreshToken,
        })
    )

    return { accessToken: result.access_token, expiresAt }
}

const getAccessToken = async (): Promise<string> => {
    // Re-use an in-flight refresh to avoid hammering Spotify with concurrent requests
    if (refreshLock) {
        const result = await refreshLock
        return result.accessToken
    }

    const redis = await getRedis()
    const cached = (await redis.get('spotify_token')) as
        | { accessToken: string; expiresAt: number; refreshToken: string }
        | null

    // Return cached token if still valid (with 60s buffer)
    if (cached && Date.now() < cached.expiresAt) {
        return cached.accessToken
    }

    // No valid token — refresh using the stored (or env) refresh token
    const refreshToken = cached?.refreshToken ?? process.env.SPOTIFY_REFRESH_TOKEN ?? ''

    refreshLock = doRefresh(redis, refreshToken)
    try {
        return (await refreshLock).accessToken
    } catch (e) {
        console.error('[Spotify] Token refresh failed:', e)
        return ''
    } finally {
        refreshLock = null
    }
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
    try {
        const access_token = await getAccessToken()
        if (!access_token) return null
        const res = await fetchWithTimeout(PROFILE_ENDPOINT, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            next: { revalidate: 60 },
        })
        if (!res.ok) return null
        return res.json()
    } catch (e) {
        console.error('[Spotify] Profile fetch failed:', e)
        return null
    }
}

const getNowPlaying = async (): Promise<NowPlaying> => {
    const access_token = await getAccessToken()
    if (!access_token) return { isPlaying: false }

    const res = await fetchWithTimeout(NOW_PLAYING_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    })
    if (res.status === 204 || res.status > 400) {
        return { isPlaying: false }
    }
    const song = await res.json()
    if (song.item === null) {
        return { isPlaying: false }
    }

    const isPlaying = song.is_playing
    const title = song.item.name
    const artist = song.item.artists
        .map((_artist: any) => _artist.name)
        .join(', ')
    const album = song.item.album.name
    const albumImageUrl = song.item.album.images[0].url
    const songUrl = song.item.external_urls.spotify
    return {
        album,
        albumImageUrl,
        artist,
        isPlaying,
        songUrl,
        title,
    }
}

export interface TopTrack {
    id: string
    artist: {
        href: string
        id: string
        name: string
        external_urls: {
            spotify: string
        }
        followers: {
            href: string | null
            total: number
        }
        genres: string[]
        images: {
            url: string
            height: number | null
            width: number | null
        }[]
        popularity: number
        type: string
        uri: string
    }[]
    songUrl: string
    title: string
    imageUrl: string
    previewUrl: string
}

const getTopTracks = async (): Promise<TopTrack[]> => {
    try {
        const access_token = await getAccessToken()
        if (!access_token) return []

        const res1 = await fetchWithTimeout(TOP_TRACKS_ENDPOINT, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            next: { revalidate: 60 },
        })
        if (!res1.ok) {
            console.error('[Spotify] TopTracks status:', res1.status)
            return []
        }
        const data = await res1.json()
        const topItems: any[] = data.items || []
        return topItems.map((track: any) => ({
            id: track.id,
            artist: track.artists,
            songUrl: track.external_urls.spotify,
            title: track.name,
            imageUrl: track.album.images[1]?.url ?? track.album.images[0]?.url ?? '',
            previewUrl: track.preview_url ?? '',
        }))
    } catch (e) {
        console.error('[Spotify] TopTracks fetch failed:', e)
        return []
    }
}

export interface RecentlyPlayedTrack {
    id: string
    artist: {
        href: string
        id: string
        name: string
        external_urls: {
            spotify: string
        }
        followers: {
            href: string | null
            total: number
        }
        genres: string[]
        images: {
            url: string
            height: number | null
            width: number | null
        }[]
        popularity: number
        type: string
        uri: string
    }[]
    songUrl: string
    title: string
    imageUrl: string
    played_at: string
}

const getRecentlyPlayed = async (): Promise<RecentlyPlayedTrack[]> => {
    try {
        const access_token = await getAccessToken()
        if (!access_token) return []

        const response = await fetchWithTimeout(RECENTLY_PLAYED_ENDPOINT, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            next: { revalidate: 60 },
        })
        if (!response.ok) {
            console.error('[Spotify] RecentlyPlayed status:', response.status)
            return []
        }
        const data = await response.json()
        const items: any[] = data.items || []
        return items.map((track: any) => ({
            id: track.track.id,
            artist: track.track.artists,
            songUrl: track.track.external_urls.spotify,
            title: track.track.name,
            imageUrl: track.track.album.images[1]?.url ?? track.track.album.images[0]?.url ?? '',
            played_at: track.played_at,
        }))
    } catch (e) {
        console.error('[Spotify] RecentlyPlayed fetch failed:', e)
        return []
    }
}

export interface TopArtist {
    external_urls: {
        spotify: string
    }
    genres: string[]
    href: string
    id: string
    images: {
        url: string
        height: number | null
        width: number | null
    }[]
    name: string
    popularity?: number
    type: 'artist'
    uri: string
}

const getTopArtists = async (): Promise<TopArtist[]> => {
    try {
        const access_token = await getAccessToken()
        if (!access_token) return []

        const res2 = await fetchWithTimeout(TOP_ARTISTS_ENDPOINT, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
            next: { revalidate: 60 },
        })
        if (!res2.ok) {
            console.error('[Spotify] TopArtists status:', res2.status)
            return []
        }
        const data = await res2.json()
        const artistItems: any[] = data.items || []
        return artistItems.map((artist: any) => ({
            external_urls: artist.external_urls,
            genres: artist.genres,
            href: artist.href,
            id: artist.id,
            images: artist.images,
            name: artist.name,
            popularity: artist.popularity,
            type: artist.type,
            uri: artist.uri,
        }))
    } catch (e) {
        console.error('[Spotify] TopArtists fetch failed:', e)
        return []
    }
}

export { getNowPlaying, getTopTracks, getRecentlyPlayed, getTopArtists, getProfile }
