'use client'

import { type RecentlyPlayedTrack } from '@/lib/spotify'
import { useSpotify } from './live-data'
import { formatDistanceToNowStrict } from 'date-fns'
import Image from 'next/image'
import { EmptyState, card } from '@/components/skeleton-card'
import { TrackRow, artists } from './track-row'

const ago = (iso: string) =>
    formatDistanceToNowStrict(new Date(iso), { addSuffix: true })

function FeaturedTrack({ track }: { track: RecentlyPlayedTrack }) {
    return (
        <article
            className={`${card} group relative flex gap-[clamp(1rem,2.5vw,1.5rem)] p-[1.15rem] max-[560px]:flex-col`}
        >
            <div className="relative aspect-square w-[clamp(8rem,22vw,13.5rem)] shrink-0 overflow-hidden rounded-[var(--rd-r)] border border-[var(--rd-border)] bg-[var(--rd-bg-sub)]">
                {track.imageUrl && (
                    <Image
                        src={track.imageUrl}
                        alt=""
                        fill
                        sizes="216px"
                        className="object-cover transition-transform duration-500 group-hover:scale-[1.02]"
                    />
                )}
            </div>
            <div className="flex min-w-0 flex-1 flex-col gap-2 min-[561px]:pt-1">
                <span
                    suppressHydrationWarning
                    className="font-[family-name:var(--font-mono)] text-[0.72rem] text-[var(--rd-text-3)]"
                >
                    Last played · {ago(track.played_at)}
                </span>
                <h3 className="m-0 font-[family-name:var(--font-display)] text-[clamp(1.35rem,2.4vw,1.8rem)] font-normal leading-[1.15] tracking-[-0.03em] text-[var(--rd-text)] transition-colors group-hover:text-[var(--rd-accent-ink)]">
                    <a
                        href={track.songUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="after:absolute after:inset-0 after:content-['']"
                    >
                        {track.title}
                    </a>
                </h3>
                <p className="m-0 text-[0.95rem] leading-[1.45] text-[var(--rd-text-2)]">
                    {artists(track.artist)}
                </p>
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-[0.875rem] text-[var(--rd-text-2)] transition-colors group-hover:text-[var(--rd-text)]">
                    Listen on Spotify <span aria-hidden>→</span>
                </span>
            </div>
        </article>
    )
}

export function RecentlyPlayed() {
    const { recentlyPlayed: tracks } = useSpotify()
    const [latest, ...rest] = tracks ?? []

    if (!latest) return <EmptyState />

    // desktop: latest play as a featured block, earlier plays as rows
    return (
        <div className="grid items-start gap-x-8 gap-y-4 min-[900px]:grid-cols-[minmax(0,1.2fr)_minmax(0,0.9fr)]">
            <FeaturedTrack track={latest} />
            {rest.length > 0 && (
                <div className={card}>
                    {rest.map((track) => (
                        <TrackRow
                            key={`${track.id}-${track.played_at}`}
                            href={track.songUrl}
                            title={track.title}
                            artist={artists(track.artist)}
                            imageUrl={track.imageUrl}
                            meta={ago(track.played_at)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}
