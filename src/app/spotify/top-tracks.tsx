import { getTopTracks, type TopTrack } from '@/lib/spotify'
import Image from 'next/image'

export async function TopTracks() {
    const tracks = await getTopTracks()

    if (!tracks || tracks.length === 0) {
        return null
    }

    return (
        <div>
            <h2 className="text-sm font-mono text-black-500 tracking-wider mb-4">
                Top Tracks
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {tracks.map((track: TopTrack) => (
                    <a
                        key={track.id}
                        href={track.songUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block p-2 bg-white/50 backdrop-blur-sm rounded-lg border border-slate-200 transition-all hover:bg-white/80 hover:shadow-sm"
                    >
                        <div className="relative aspect-square mb-2">
                            <Image
                                src={track.imageUrl}
                                alt={track.title}
                                width={300}
                                height={300}
                                loading="lazy"
                                decoding="async"
                                className="rounded-md object-cover w-full h-full"
                            />
                            <div className="absolute inset-0 bg-black/30 rounded-md opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center">
                                <div className="bg-white/20 p-2 rounded-full backdrop-blur-sm">
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
                        </div>
                        <h3 className="font-medium text-xs sm:text-sm text-slate-800 group-hover:text-slate-900 transition-colors line-clamp-1">
                            {track.title}
                        </h3>
                        <p className="text-slate-500 text-xs line-clamp-1">
                            {track.artist.map((a) => a.name).join(', ')}
                        </p>
                    </a>
                ))}
            </div>
        </div>
    )
}
