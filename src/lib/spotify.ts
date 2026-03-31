const NOW_PLAYING_ENDPOINT = `https://api.spotify.com/v1/me/player/currently-playing`
const TOP_TRACKS_ENDPOINT = `https://api.spotify.com/v1/me/top/tracks?time_range=short_term&limit=25`
const TOP_ARTISTS_ENDPOINT = `https://api.spotify.com/v1/me/top/artists?time_range=short_term&limit=24`
const RECENTLY_PLAYED_ENDPOINT = `https://api.spotify.com/v1/me/player/recently-played?limit=5`
const TOKEN_ENDPOINT = `https://accounts.spotify.com/api/token`

const getAccessToken = async () => {
    const basic = Buffer.from(
        `${process.env.SPOTIFY_CLIENT_ID}:${process.env.SPOTIFY_CLIENT_SECRET}`
    ).toString('base64')
    const body = new URLSearchParams()
    body.append('grant_type', 'refresh_token')
    body.append('refresh_token', process.env.SPOTIFY_REFRESH_TOKEN ?? '')
    const response = await fetch(TOKEN_ENDPOINT, {
        method: 'POST',
        headers: {
            Authorization: `Basic ${basic}`,
            'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: body,
    })
    const result = await response.json()
    console.log('[Spotify] Token response:', result)
    return result
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

const getNowPlaying = async (): Promise<NowPlaying> => {
    const { access_token } = await getAccessToken()

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
    const { access_token } = await getAccessToken()

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
    const { access_token } = await getAccessToken()
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
    const { access_token } = await getAccessToken()

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

export { getNowPlaying, getTopTracks, getRecentlyPlayed, getTopArtists }
