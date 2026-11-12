import { Metadata } from 'next'
import {
    BASE_URL,
    NAME,
    FULL_NAME,
    ROLE,
    TWITTER,
    SPOTIFY_PROFILE_URL,
} from '@/constants'
import { RecentlyPlayed } from './spotify/recently-played'
import { TopTracks } from './spotify/top-tracks'
import { TopArtists } from './spotify/top-artists'
import { Profile } from './spotify/profile'
import { SpotifyLive } from './spotify/live-data'
import { getSpotifyData } from '@/lib/spotify'
import { SectionHead } from '@/components/section-head'

const SECTION =
    'mx-auto max-w-[var(--rd-maxw)] px-[var(--rd-pad)] py-[clamp(48px,6vw,80px)]'

const spotifyLink = [{ label: 'Open on Spotify', href: SPOTIFY_PROFILE_URL }]

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

// The static export is rendered with the Spotify data from build time;
// SpotifyLive then refreshes it in the browser from /api/spotify.
export const dynamic = 'force-static'

export default async function Music() {
    const initial = await getSpotifyData()

    return (
        <SpotifyLive initial={initial}>
            <main className="relative min-h-screen bg-[var(--rd-bg)] text-[var(--rd-text)]">
                <section className="mx-auto w-full max-w-[var(--rd-maxw)] px-[var(--rd-pad)] pb-[clamp(1rem,3vw,2rem)] pt-[clamp(3.5rem,8vw,6.5rem)]">
                    <div className="rd-rise min-w-0 max-w-[46rem]">
                        <h1 className="m-0 flex flex-col gap-3">
                            <span className="rd-display text-[var(--rd-text)]">
                                Music
                            </span>
                            <span className="text-pretty text-[clamp(1.08rem,1.7vw,1.28rem)] font-medium leading-[1.35] tracking-[-0.02em] text-[var(--rd-text-2)]">
                                What I&apos;ve been listening to lately.
                            </span>
                        </h1>
                        <p className="m-0 mt-[clamp(1.1rem,2vw,1.5rem)] max-w-[56ch] text-[clamp(0.98rem,1.25vw,1.0625rem)] leading-[1.65] text-[var(--rd-text-2)]">
                            Recent plays, top tracks and the artists I keep
                            coming back to, pulled live from{' '}
                            <a
                                href={SPOTIFY_PROFILE_URL}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="font-medium text-[var(--rd-text)] underline decoration-[color-mix(in_srgb,var(--rd-accent)_40%,transparent)] underline-offset-2 transition-colors hover:decoration-[var(--rd-accent)]"
                            >
                                Spotify
                            </a>{' '}
                            and refreshed every minute.
                        </p>
                        <div className="mt-[clamp(1.2rem,2.2vw,1.7rem)]">
                            <Profile />
                        </div>
                    </div>
                </section>

                <section className={SECTION}>
                    <SectionHead title="Recently played" links={spotifyLink} />
                    <RecentlyPlayed />
                </section>

                <section className={SECTION}>
                    <SectionHead title="Top tracks">
                        <p className="m-0 mt-2 max-w-[58ch] text-[0.95rem] leading-[1.6] text-[var(--rd-text-2)]">
                            Most played over the last four weeks.
                        </p>
                    </SectionHead>
                    <TopTracks />
                </section>

                <section className={SECTION}>
                    <SectionHead title="Top artists">
                        <p className="m-0 mt-2 max-w-[58ch] text-[0.95rem] leading-[1.6] text-[var(--rd-text-2)]">
                            Who has been on rotation over the same stretch.
                        </p>
                    </SectionHead>
                    <TopArtists />
                </section>
            </main>
        </SpotifyLive>
    )
}
