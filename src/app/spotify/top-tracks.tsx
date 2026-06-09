import { getTopTracks, type TopTrack } from '@/lib/spotify'
import Image from 'next/image'
import { Eyebrow } from '@/components/redesign/eyebrow'

export async function TopTracks() {
    const tracks = await getTopTracks()

    return (
        <div>
            <div className="mb-4">
                <Eyebrow>top tracks</Eyebrow>
            </div>
            {(!tracks || tracks.length === 0) && (
                <p className="text-[var(--rd-text-3)] text-sm mt-2">
                    couldn&apos;t load right now — try refreshing.
                </p>
            )}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {tracks.map((track: TopTrack) => (
                    <a
                        key={track.id}
                        href={track.songUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rd-card group block p-2 transition-all duration-200 hover:border-[var(--rd-border-2)]"
                    >
                        <div className="relative aspect-square mb-2">
                            <Image
                                src={track.imageUrl}
                                alt={track.title}
                                width={300}
                                height={300}
                                loading="lazy"
                                decoding="async"
                                className="rounded-lg object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 rounded-lg flex items-center justify-center transition-all duration-200">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-6 h-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                                >
                                    <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
                                </svg>
                            </div>
                        </div>
                        <h3 className="font-medium text-xs sm:text-sm text-[var(--rd-text)] group-hover:text-[var(--rd-accent-ink)] transition-colors line-clamp-1">
                            {track.title}
                        </h3>
                        <p className="text-[var(--rd-text-2)] text-xs line-clamp-1">
                            {track.artist.map((a) => a.name).join(', ')}
                        </p>
                    </a>
                ))}
            </div>
        </div>
    )
}
