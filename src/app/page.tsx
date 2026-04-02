import Navbar from '@/components/nav'
import { Footer } from '@/components/footer'
import { Metadata } from 'next'
import Link from 'next/link'
import Image from 'next/image'
import { BASE_URL, NAME, FULL_NAME, ROLE, TWITTER, IMAGE as AVATAR, SPOTIFY_PROFILE_URL } from '@/constants'
import { Suspense } from 'react'
import { RecentlyPlayed } from './spotify/recently-played'
import { TopTracks } from './spotify/top-tracks'
import { TopArtists } from './spotify/top-artists'
import { Profile } from './spotify/profile'
import { SkeletonCard } from '../components/skeleton-card'

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

export const revalidate = 0

export default async function Music() {
    return (
        <main className="min-h-screen relative pt-8">
            <section className="relative mx-auto max-w-3xl px-4 sm:px-6 lg:px-8 overflow-hidden">
                <div className="items-center flex justify-between mb-4 sm:mb-6 gap-2 sm:gap-0">
                    <Link href={BASE_URL}>
                        <div className="border border-slate-200 p-1 rounded-full">
                            <Image
                                src={AVATAR}
                                alt={NAME}
                                className="h-10 w-10 sm:h-12 sm:w-12 rounded-full"
                                height={100}
                                width={100}
                            />
                        </div>
                    </Link>
                    <Navbar />
                </div>
                <div className="mt-12 sm:mt-20 space-y-8 sm:space-y-10">
                    <div className="mb-2">
                        <h1 className="text-4xl sm:text-3xl font-bold tracking-tight text-slate-900 mb-3">
                            my music library
                        </h1>
                        <p className="text-slate-500 leading-relaxed max-w-2xl text-base sm:text-lg">
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
                        {/* <blockquote className="mt-6 pl-4 border-l border-slate-300">
                            <p className="text-slate-400 italic text-sm sm:text-base leading-relaxed max-w-2xl">
                                &ldquo;Music is that voice that tells us that the human race is greater than it knows.&rdquo;
                                <span className="not-italic text-slate-400 font-normal"> — Napoleon Bonaparte</span>
                            </p>
                        </blockquote> */}
                    </div>
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
            </section>
            <div className="py-6 sm:py-8 md:py-12 pb-0 px-4 sm:px-6 lg:pl-52 mb-8 md:mb-0">
                <Footer />
            </div>
        </main>
    )
}
