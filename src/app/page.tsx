import Navbar from '@/components/nav'
import { Footer } from '@/components/footer'
import { Metadata } from 'next'
import {
    BASE_URL,
    NAME,
    FULL_NAME,
    ROLE,
    TWITTER,
    SPOTIFY_PROFILE_URL,
} from '@/constants'
import { Suspense } from 'react'
import { RecentlyPlayed } from './spotify/recently-played'
import { TopTracks } from './spotify/top-tracks'
import { TopArtists } from './spotify/top-artists'
import { Profile } from './spotify/profile'
import { SkeletonCard } from '@/components/skeleton-card'
import { Eyebrow } from '@/components/redesign/eyebrow'

export const metadata: Metadata = {
    title: `${NAME} | music`,
    description: `${FULL_NAME} - ${ROLE}. My music library powered by Spotify.`,
    keywords: [
        FULL_NAME,
        'Hồ Văn Hòa',
        NAME,
        'hovanhoa',
        ROLE,
        'Software Engineer',
        'Music',
        'Spotify',
        'Top Tracks',
        'Top Artists',
    ],
    authors: [{ name: FULL_NAME }],
    openGraph: {
        title: `${NAME} | music`,
        description: `${FULL_NAME} - ${ROLE}. My music library powered by Spotify.`,
        url: BASE_URL,
        siteName: NAME,
        locale: 'en_US',
        type: 'website',
    },
    twitter: {
        card: 'summary_large_image',
        title: `${NAME} | music`,
        description: `${FULL_NAME} - ${ROLE}. My music library powered by Spotify.`,
        creator: `@${TWITTER}`,
    },
    alternates: {
        canonical: BASE_URL,
    },
}

export const revalidate = 60

export default async function Music() {
    return (
        <main className="min-h-screen relative">
            {/* sticky header */}
            <header className="sticky top-0 z-50 border-b border-[var(--rd-border-2)] bg-[var(--rd-bg-sub)] shadow-[0_1px_3px_rgba(0,0,0,0.03)]">
                <div className="mx-auto w-full max-w-[var(--rd-maxw)] px-[var(--rd-pad)] py-3">
                    <Navbar />
                </div>
            </header>
            {/* header panel — matches the footer treatment */}
            <div
                className="border-b border-[var(--rd-border)]"
                style={{
                    background:
                        'radial-gradient(100% 140% at 0% 0%, var(--rd-accent-bg), transparent 55%), var(--rd-surface-2)',
                }}
            >
                <div className="mx-auto max-w-[var(--rd-maxw)] px-[var(--rd-pad)] pt-12 pb-12">
                    <Eyebrow>hovanhoa · music</Eyebrow>
                    <h1 className="mt-[18px] text-[clamp(2rem,4.6vw,3.4rem)] font-semibold tracking-[-0.04em] text-[var(--rd-text)]">
                        my music library
                    </h1>
                    <p className="rd-lead mt-5">
                        what i&apos;ve been listening to, powered by{' '}
                        <a
                            href={SPOTIFY_PROFILE_URL}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-emerald-500 hover:text-emerald-600 transition-colors font-medium"
                        >
                            spotify
                        </a>
                        .
                    </p>
                </div>
            </div>
            {/* body */}
            <div className="mx-auto max-w-[var(--rd-maxw)] px-[var(--rd-pad)] pt-14">
                <div className="space-y-8 sm:space-y-10">
                    <Suspense fallback={<SkeletonCard />}>
                        <Profile />
                    </Suspense>
                    <Suspense fallback={<SkeletonCard />}>
                        <RecentlyPlayed />
                    </Suspense>
                    <Suspense fallback={<SkeletonCard />}>
                        <TopTracks />
                    </Suspense>
                    <Suspense fallback={<SkeletonCard />}>
                        <TopArtists />
                    </Suspense>
                </div>
            </div>
            <Footer />
        </main>
    )
}
