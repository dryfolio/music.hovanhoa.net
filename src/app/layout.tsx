import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { BASE_URL, NAME, FULL_NAME, ROLE, IMAGE, TWITTER } from '@/constants'
import { Analytics } from '@vercel/analytics/react'
import ScrollToTop from '@/components/scroll-to-top'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
    metadataBase: new URL(BASE_URL),
    title: {
        default: `${NAME} | music`,
        template: `%s | ${NAME}`,
    },
    description: `${FULL_NAME} - ${ROLE}. My music library powered by Spotify.`,
    keywords: [
        FULL_NAME,
        'Hồ Văn Hòa',
        NAME,
        'hovanhoa',
        ROLE,
        'Software Engineer',
        'Music',
        'Spotify',
    ],
    authors: [{ name: FULL_NAME }],
    openGraph: {
        title: `${NAME} | music`,
        description: `${FULL_NAME} - ${ROLE}. My music library powered by Spotify.`,
        url: BASE_URL,
        siteName: NAME,
        images: [
            {
                url: IMAGE,
                width: 800,
                height: 600,
                alt: FULL_NAME,
            },
        ],
        locale: 'en_US',
        type: 'website',
    },
    robots: {
        index: true,
        follow: true,
        googleBot: {
            index: true,
            follow: true,
            'max-video-preview': -1,
            'max-image-preview': 'large',
            'max-snippet': -1,
        },
    },
    twitter: {
        card: 'summary_large_image',
        title: `${NAME} | music`,
        description: `${FULL_NAME} - ${ROLE}. My music library powered by Spotify.`,
        creator: `@${TWITTER}`,
        images: [IMAGE],
    },
    alternates: {
        canonical: BASE_URL,
    },
}

export default function RootLayout({
    children,
}: {
    children: React.ReactNode
}) {
    return (
        <html lang="en" className="scroll-smooth">
            <body className={inter.className}>
                {children}
                <ScrollToTop />
            </body>
            <Analytics />
        </html>
    )
}
