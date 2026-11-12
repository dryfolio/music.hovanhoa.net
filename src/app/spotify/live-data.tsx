'use client'

import { createContext, useContext, useEffect, useState } from 'react'
import type { SpotifyData } from '@/lib/spotify'

const REFRESH_MS = 60_000

const SpotifyContext = createContext<SpotifyData | null>(null)

// The page is a static export rendered with the Spotify data from build time.
// Once loaded, the browser swaps in fresh data from the /api/spotify Worker
// (worker/index.ts) and keeps polling it while the tab is visible.
export function SpotifyLive({
    initial,
    children,
}: {
    initial: SpotifyData
    children: React.ReactNode
}) {
    const [data, setData] = useState(initial)

    useEffect(() => {
        let cancelled = false
        const refresh = async () => {
            if (document.visibilityState !== 'visible') return
            try {
                const res = await fetch('/api/spotify')
                if (!res.ok) return
                const next = (await res.json()) as SpotifyData
                // A section that comes back empty (Spotify or token hiccup)
                // keeps what it showed before rather than blanking out
                if (!cancelled)
                    setData((prev) => ({
                        profile: next.profile ?? prev.profile,
                        recentlyPlayed: next.recentlyPlayed?.length
                            ? next.recentlyPlayed
                            : prev.recentlyPlayed,
                        topTracks: next.topTracks?.length
                            ? next.topTracks
                            : prev.topTracks,
                        topArtists: next.topArtists?.length
                            ? next.topArtists
                            : prev.topArtists,
                    }))
            } catch {
                // keep showing what we have
            }
        }
        refresh()
        const id = setInterval(refresh, REFRESH_MS)
        document.addEventListener('visibilitychange', refresh)
        return () => {
            cancelled = true
            clearInterval(id)
            document.removeEventListener('visibilitychange', refresh)
        }
    }, [])

    return (
        <SpotifyContext.Provider value={data}>
            {children}
        </SpotifyContext.Provider>
    )
}

export function useSpotify(): SpotifyData {
    const data = useContext(SpotifyContext)
    if (!data) throw new Error('useSpotify must be used inside <SpotifyLive>')
    return data
}
