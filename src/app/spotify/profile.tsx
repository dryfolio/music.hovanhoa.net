import { getProfile } from '@/lib/spotify'
import Image from 'next/image'

export function SpotifyMark({ className = '' }: { className?: string }) {
    return (
        <svg
            xmlns="http://www.w3.org/2000/svg"
            viewBox="0 0 24 24"
            aria-hidden
            className={`shrink-0 text-[#1db954] ${className}`}
            fill="currentColor"
        >
            <path d="M12 0C5.4 0 0 5.4 0 12s5.4 12 12 12 12-5.4 12-12S18.66 0 12 0zm5.521 17.34c-.24.359-.66.48-1.021.24-2.82-1.74-6.36-2.101-10.561-1.141-.418.122-.779-.179-.899-.539-.12-.421.18-.78.54-.9 4.56-1.021 8.52-.6 11.64 1.32.42.18.479.659.301 1.02zm1.44-3.3c-.301.42-.841.6-1.262.3-3.239-1.98-8.159-2.58-11.939-1.38-.479.12-1.02-.12-1.14-.6-.12-.48.12-1.021.6-1.141C9.6 9.9 15 10.561 18.72 12.84c.361.181.54.78.241 1.2zm.12-3.36C15.24 8.4 8.82 8.16 5.16 9.301c-.6.179-1.2-.181-1.38-.721-.18-.601.18-1.2.72-1.381 4.26-1.26 11.28-1.02 15.721 1.621.539.3.719 1.02.419 1.56-.299.421-1.02.599-1.559.3z" />
        </svg>
    )
}

// Profile — a quiet byline under the page title: avatar, name, followers.
export async function Profile() {
    const profile = await getProfile()

    if (!profile || !profile.id) {
        return null
    }

    const profileUrl =
        profile.external_urls?.spotify ??
        `https://open.spotify.com/user/${profile.id}`
    const name = profile.display_name ?? 'Spotify profile'

    return (
        <a
            href={profileUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group inline-flex items-center gap-3"
        >
            {profile.images[0]?.url ? (
                <Image
                    src={profile.images[0].url}
                    alt={name}
                    width={80}
                    height={80}
                    className="h-10 w-10 shrink-0 rounded-full border border-[var(--rd-border)] object-cover"
                />
            ) : (
                <span className="h-10 w-10 shrink-0 rounded-full border border-[var(--rd-border)] bg-[var(--rd-surface-2)]" />
            )}
            <span className="flex flex-col">
                <span className="inline-flex items-center gap-1.5 text-[0.9rem] font-medium tracking-[-0.01em] text-[var(--rd-text)] transition-colors group-hover:text-[var(--rd-accent-ink)]">
                    {name}
                    <SpotifyMark className="h-3.5 w-3.5" />
                </span>
                <span className="font-[family-name:var(--font-mono)] text-[0.72rem] text-[var(--rd-text-3)]">
                    {(profile.followers?.total ?? 0).toLocaleString('en-US')}{' '}
                    followers
                </span>
            </span>
        </a>
    )
}
