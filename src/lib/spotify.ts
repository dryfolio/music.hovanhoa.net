import { readFileSync, writeFileSync } from 'fs'
import { resolve } from 'path'

const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`
const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=25`
const TOP_ARTISTS_ENDPOINT = `https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=24`
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played?limit=5`
const PROFILE_ENDPOINT = `https://api.spotify.com/v1/me`
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`

// In-memory cache: one token refresh per process lifetime (until expiry)
let cachedToken: { accessToken: string; expiresAt: number } | null = null
let refreshLock: Promise<{ accessToken: string; expiresAt: number }> | null = null
const TOKEN_PATH = resolve('/tmp', '.spotify-refresh-token')

const persistRefreshToken = (newToken: string) => {
    try {
        // Write to a separate file to avoid triggering Next.js .env hot-reload
        writeFileSync(TOKEN_PATH, newToken)
        console.log('[Spotify] Refresh token rotated and persisted')
    } catch (e) {
        console.error('[Spotify] Failed to persist refresh token:', e)
    }
}

// Live refresh token — updated after each successful rotation so concurrent requests use the latest.
// Initialized from env; the retry path can overwrite it from the /tmp file.
let liveRefreshToken: string = process.env.SPOTIFY_REFRESH_TOKEN ?? ''

const getStoredRefreshToken = (): string | null => {
    try {
        return readFileSync(TOKEN_PATH, 'utf8').trim() || null
    } catch {
        return null
    }
}

const doRefresh = async (): Promise<{ accessToken: string; expiresAt: number }> => {
    const basic = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64')
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: new URLSearchParams({
            grant_type: 'refresh_token',
            refresh_token: liveRefreshToken,
        }),
    })
    const result = await response.json()
    console.log('[Spotify] Token response:', result)
    if (result.error) {
        console.error('[Spotify] Token error:', result.error_description)
        throw new Error(result.error_description)
    }
    if (result.refresh_token) {
        liveRefreshToken = result.refresh_token
        persistRefreshToken(result.refresh_token)
    }
    // Cache with a 60s buffer before actual expiry
    const expiresAt = Date.now() + (result.expires_in - 60) * 1000
    return { accessToken: result.access_token, expiresAt }
}

const getAccessToken = async (): Promise<string> => {
    // Return cached token if still valid (with 60s buffer)
    if (cachedToken && Date.now() < cachedToken.expiresAt) {
        return cachedToken.accessToken
    }

    // If a refresh is already in progress, wait for it
    if (refreshLock) {
        const result = await refreshLock
        return result.accessToken
    }

    // Start a new refresh
    refreshLock = doRefresh()
    try {
        cachedToken = await refreshLock
        return cachedToken!.accessToken
    } catch (err) {
        // Token was revoked (rotated by a concurrent request). The winner's new
        // refresh token is in env (shared across all Lambdas). Retry with that.
        cachedToken = null
        liveRefreshToken = process.env.SPOTIFY_REFRESH_TOKEN ?? ''
        // Also check /tmp — the winner may have persisted there.
        const stored = getStoredRefreshToken()
        if (stored) liveRefreshToken = stored
        if (liveRefreshToken) {
            // Small delay to let the winning Lambda finish persisting.
            await new Promise((resolve) => setTimeout(resolve, 200))
            refreshLock = doRefresh()
            try {
                cachedToken = await refreshLock
                return cachedToken!.accessToken
            } catch {
                // Give up — throw original error
            }
        }
        throw err
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
        const res = await fetch(PROFILE_ENDPOINT, {
            headers: {
                Authorization: `Bearer ${access_token}`,
            },
        })
        if (!res.ok) return null
        return res.json()
    } catch {
        return null
    }
}

const getNowPlaying = async (): Promise<NowPlaying> => {
    const access_token = await getAccessToken()

    const res = await fetch(NOW_PLAYING_ENDPOINT, {
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
    const access_token = await getAccessToken()

    const res1 = await fetch(TOP_TRACKS_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    })
    console.log('[Spotify] TopTracks status:', res1.status)
    const text1 = await res1.text()
    console.log('[Spotify] TopTracks body:', text1.substring(0, 200))
    let topItems: any[] = []
    try {
        const data = JSON.parse(text1)
        topItems = data.items || []
    } catch (e) {
        console.error('[Spotify] TopTracks parse error:', e)
    }
    console.log('[Spotify] TopTracks items:', topItems?.length ?? 0)
    const tracks: TopTrack[] =
        topItems?.map((track: any) => ({
            id: track.id,
            artist: track.artists,
            songUrl: track.external_urls.spotify,
            title: track.name,
            imageUrl: track.album.images[1]?.url ?? track.album.images[0]?.url ?? '',
            previewUrl: track.preview_url ?? '',
        })) || []
    return tracks
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
    const access_token = await getAccessToken()
    const response = await fetch(RECENTLY_PLAYED_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    })
    console.log('[Spotify] RecentlyPlayed status:', response.status)
    const text = await response.text()
    console.log('[Spotify] RecentlyPlayed body:', text.substring(0, 200))
    let items: any[] = []
    try {
        const data = JSON.parse(text)
        items = data.items || []
    } catch (e) {
        console.error('[Spotify] RecentlyPlayed parse error:', e)
    }
    console.log('[Spotify] RecentlyPlayed items:', items?.length ?? 0)
    const tracks: RecentlyPlayedTrack[] =
        items?.map((track: any) => ({
            id: track.track.id,
            artist: track.track.artists,
            songUrl: track.track.external_urls.spotify,
            title: track.track.name,
            imageUrl: track.track.album.images[1]?.url ?? track.track.album.images[0]?.url ?? '',
            played_at: track.played_at,
        })) || []

    return tracks
}

export interface TopArtist {
    external_urls: {
        spotify: string
    }
    followers: {
        href: string | null
        total: number
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
    popularity: number
    type: 'artist'
    uri: string
}

const getTopArtists = async (): Promise<TopArtist[]> => {
    const access_token = await getAccessToken()

    const res2 = await fetch(TOP_ARTISTS_ENDPOINT, {
        headers: {
            Authorization: `Bearer ${access_token}`,
        },
    })
    console.log('[Spotify] TopArtists status:', res2.status)
    const text2 = await res2.text()
    console.log('[Spotify] TopArtists body:', text2.substring(0, 200))
    let artistItems: any[] = []
    try {
        const data = JSON.parse(text2)
        artistItems = data.items || []
    } catch (e) {
        console.error('[Spotify] TopArtists parse error:', e)
    }
    console.log('[Spotify] TopArtists items:', artistItems?.length ?? 0)
    const artists: TopArtist[] =
        artistItems?.map((artist: any) => ({
            external_urls: artist.external_urls,
            followers: artist.followers,
            genres: artist.genres,
            href: artist.href,
            id: artist.id,
            images: artist.images,
            name: artist.name,
            popularity: artist.popularity,
            type: artist.type,
            uri: artist.uri,
        })) || []
    return artists
}

export { getNowPlaying, getTopTracks, getRecentlyPlayed, getTopArtists, getProfile }
