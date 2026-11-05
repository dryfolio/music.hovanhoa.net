import { getTopTracks } from '@/lib/spotify'
import { EmptyState, card } from '@/components/skeleton-card'
import { TrackRow, artists } from './track-row'

export async function TopTracks() {
    const tracks = await getTopTracks()

    if (!tracks || tracks.length === 0) return <EmptyState />

    // one card, two ranked columns on wide screens
    const half = Math.ceil(tracks.length / 2)
    const columns = [tracks.slice(0, half), tracks.slice(half)].filter(
        (c) => c.length > 0
    )

    return (
        <div
            className={`${card} grid min-[900px]:grid-cols-2 min-[900px]:divide-x divide-[var(--rd-line)]`}
        >
            {columns.map((col, ci) => (
                <div
                    key={ci}
                    className="min-w-0 border-[var(--rd-line)] [&:nth-child(2)]:border-t min-[900px]:[&:nth-child(2)]:border-t-0"
                >
                    {col.map((track, i) => (
                        <TrackRow
                            key={track.id}
                            href={track.songUrl}
                            title={track.title}
                            artist={artists(track.artist)}
                            imageUrl={track.imageUrl}
                            rank={ci * half + i + 1}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}
