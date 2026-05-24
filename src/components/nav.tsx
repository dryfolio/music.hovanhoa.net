import { BASE_URL, MUSIC_URL, INSIGHT_URL, GALLERY_URL } from '@/constants'
import Link from 'next/link'

const linkClass =
    'hover:underline hover:decoration-wavy hover:underline-offset-8 transition duration-300 ease-in-out'

const LINKS = [
    { href: BASE_URL, label: 'home' },
    { href: INSIGHT_URL, label: 'insight' },
    { href: GALLERY_URL, label: 'gallery' },
    { href: MUSIC_URL, label: 'music' },
]

export default function Navbar() {
    return (
        <header>
            <nav className="relative mx-auto max-w-xl">
                <ul className="flex items-center space-x-3 sm:space-x-6 text-sm sm:text-base text-slate-600 cursor-pointer">
                    {LINKS.map(({ href, label }) => (
                        <Link key={label} className={linkClass} href={href}>
                            {label}
                        </Link>
                    ))}
                </ul>
            </nav>
        </header>
    )
}
