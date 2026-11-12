import Image from 'next/image'
import type { SpotifyArtistRef } from '@/lib/spotify'

export const artists = (list: Pick<SpotifyArtistRef, 'name'>[]) =>
    list.map((a) => a.name).join(', ')

// TrackRow — one hairline-separated row inside a list card.
export function TrackRow({
    href,
    title,
    artist,
    imageUrl,
    rank,
    meta,
}: {
    href: string
    title: string
    artist: string
    imageUrl: string
    rank?: number
    meta?: string
}) {
    return (
        <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="group flex items-center gap-3 border-b border-[var(--rd-line)] px-[1.15rem] py-3 transition-colors last:border-b-0 hover:bg-[var(--rd-surface-2)]"
        >
            {rank !== undefined && (
                <span className="w-5 shrink-0 text-right font-[family-name:var(--font-mono)] text-[0.72rem] tabular-nums text-[var(--rd-text-3)]">
                    {String(rank).padStart(2, '0')}
                </span>
            )}
            <span className="relative h-11 w-11 shrink-0 overflow-hidden rounded-[8px] border border-[var(--rd-border)] bg-[var(--rd-bg-sub)]">
                {imageUrl && (
                    <Image
                        src={imageUrl}
                        alt=""
                        fill
                        sizes="44px"
                        className="object-cover"
                    />
                )}
            </span>
            <span className="flex min-w-0 flex-1 flex-col">
                <span className="truncate text-[0.95rem] font-medium leading-[1.3] tracking-[-0.02em] text-[var(--rd-text)] transition-colors group-hover:text-[var(--rd-accent-ink)]">
                    {title}
                </span>
                <span className="truncate text-[0.8rem] leading-[1.45] text-[var(--rd-text-2)]">
                    {artist}
                </span>
            </span>
            {meta && (
                // relative times ("3 min ago") differ between build and load
                <span
                    suppressHydrationWarning
                    className="shrink-0 font-[family-name:var(--font-mono)] text-[0.72rem] text-[var(--rd-text-3)]"
                >
                    {meta}
                </span>
            )}
        </a>
    )
}
