'use client'

import { useSpotify } from './live-data'
import Image from 'next/image'
import { EmptyState } from '@/components/skeleton-card'

export function TopArtists() {
    const { topArtists: artists } = useSpotify()

    if (!artists || artists.length === 0) return <EmptyState />

    return (
        <ol className="m-0 grid list-none grid-cols-3 gap-x-4 gap-y-6 p-0 sm:grid-cols-4 lg:grid-cols-6">
            {artists.map((artist, i) => (
                <li key={artist.id} className="min-w-0">
                    <a
                        href={artist.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex flex-col gap-2.5"
                    >
                        <span className="relative block aspect-square w-full overflow-hidden rounded-[var(--rd-r)] border border-[var(--rd-border)] bg-[var(--rd-bg-sub)]">
                            {artist.images[0]?.url && (
                                <Image
                                    src={artist.images[0].url}
                                    alt=""
                                    fill
                                    sizes="(min-width: 1024px) 170px, (min-width: 640px) 25vw, 33vw"
                                    className="object-cover transition-transform duration-500 group-hover:scale-[1.03]"
                                />
                            )}
                        </span>
                        <span className="flex min-w-0 items-baseline gap-2">
                            <span className="hidden shrink-0 font-[family-name:var(--font-mono)] text-[0.72rem] tabular-nums text-[var(--rd-text-3)] sm:inline">
                                {String(i + 1).padStart(2, '0')}
                            </span>
                            <span className="truncate text-[0.9rem] font-medium tracking-[-0.02em] text-[var(--rd-text)] transition-colors group-hover:text-[var(--rd-accent-ink)]">
                                {artist.name}
                            </span>
                        </span>
                    </a>
                </li>
            ))}
        </ol>
    )
}
