import { getTopArtists, type TopArtist } from '@/lib/spotify'
import Image from 'next/image'

export async function TopArtists() {
    const artists = await getTopArtists()

    if (!artists || artists.length === 0) {
        return null
    }

    return (
        <div>
            <h2 className="text-slate-500 leading-relaxed max-w-2xl text-base sm:text-lg">
                top artists
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {artists.map((artist: TopArtist) => (
                    <a
                        key={artist.id}
                        href={artist.external_urls.spotify}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="group block relative overflow-hidden rounded-xl aspect-[4/3]"
                    >
                        <Image
                            src={artist.images[0]?.url ?? ''}
                            alt={artist.name}
                            fill
                            loading="lazy"
                            decoding="async"
                            className="object-cover w-full h-full transition-transform duration-500 group-hover:scale-110"
                        />
                        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent opacity-80 group-hover:opacity-100 transition-opacity" />
                        <div className="absolute inset-0 p-4 flex flex-col justify-end">
                            <h3 className="text-lg sm:text-xl font-bold text-white drop-shadow-sm line-clamp-1">
                                {artist.name}
                            </h3>
                            {artist.popularity != null && (
                                <div className="flex items-center gap-1 text-xs text-zinc-300">
                                    <svg
                                        xmlns="http://www.w3.org/2000/svg"
                                        className="w-4 h-4"
                                        viewBox="0 0 20 20"
                                        fill="currentColor"
                                    >
                                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                                    </svg>
                                    <span>{artist.popularity}%</span>
                                </div>
                            )}
                        </div>
                    </a>
                ))}
            </div>
        </div>
    )
}
