import Link from 'next/link'
import React from 'react'

export function Footer() {
    return (
        <footer>
            <nav className="relative mx-auto max-w-xl">
                <ul className="flex items-center space-x-6 text-slate-500">
                    <p className="hover:text-slate-600 transition duration-300 ease-in-out">
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
                </ul>
            </nav>
        </footer>
    )
}
