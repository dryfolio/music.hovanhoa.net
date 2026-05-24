import Link from 'next/link'

export function Footer() {
    return (
        <footer>
            <nav className="relative mx-auto max-w-xl">
                <p className="text-slate-500 hover:text-slate-600 transition duration-300 ease-in-out">
                    © 2026{' '}
                    <Link
                        href={'https://hovanhoa.net'}
                        target="_self"
                        className="text-sky-600"
                    >
                        hovanhoa.net
                    </Link>{' '}
                    | Software Engineer
                </p>
            </nav>
        </footer>
    )
}
