import { getRecentlyPlayed, type RecentlyPlayedTrack } from '@/lib/spotify'
import { formatDistanceToNow } from 'date-fns'
import Image from 'next/image'

export async function RecentlyPlayed() {
    const tracks = await getRecentlyPlayed()

    if (!tracks || tracks.length === 0) {
        return null
    }

    return (
        <div>
            <h2 className="text-sm font-mono text-black-500 tracking-wider mb-4">
                Recently Played
            </h2>
            <div className="space-y-2">
                {tracks.map((track: RecentlyPlayedTrack) => (
                    <a
                        key={track.id}
                        href={track.songUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group flex items-center gap-3 p-2 bg-white/50 backdrop-blur-sm rounded-lg border border-slate-200 transition-all hover:bg-white/80 hover:shadow-sm"
                    >
                        <div className="relative w-12 h-12 sm:w-16 sm:h-16 flex-shrink-0">
                            <Image
                                src={track.imageUrl}
                                alt={track.title}
                                width={64}
                                height={64}
                                loading="lazy"
                                decoding="async"
                                className="rounded-md object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/20 group-hover:bg-black/40 rounded-md flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <svg
                                    xmlns="http://www.w3.org/2000/svg"
                                    viewBox="0 0 24 24"
                                    fill="currentColor"
                                    className="w-6 h-6 text-white"
                                >
                                    <path d="M4.5 5.653c0-1.426 1.529-2.33 2.779-1.643l11.54 6.348c1.295.712 1.295 2.573 0 3.285L7.28 19.991c-1.25.687-2.779-.217-2.779-1.643V5.653z" />
                                </svg>
                            </div>
                        </div>
                        <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm sm:text-base text-slate-800 group-hover:text-slate-900 transition-colors line-clamp-1">
                                {track.title}
                            </h3>
                            <p className="text-slate-500 text-xs sm:text-sm line-clamp-1">
                                {track.artist.map((a) => a.name).join(', ')}
                            </p>
                            <p className="text-slate-400 text-xs mt-0.5">
                                Played{' '}
                                {formatDistanceToNow(new Date(track.played_at), {
                                    addSuffix: true,
                                })}
                            </p>
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
}
