import type { Metadata } from 'next'
import { GeistSans } from 'geist/font/sans'
import { GeistMono } from 'geist/font/mono'
import './globals.css'
import { BASE_URL, NAME, FULL_NAME, ROLE, IMAGE, TWITTER } from '@/constants'
import { Analytics } from '@vercel/analytics/react'
import Navbar from '@/components/nav'
import { Footer } from '@/components/footer'

// serif display face for headings — non-blocking stylesheet; Geist itself
// comes from next/font above
const DISPLAY_FONTS =
    'https://fonts.googleapis.com/css2?family=Libertinus+Serif:ital,wght@0,400;0,600;1,400&family=Noto+Serif:ital,wght@0,400;0,600;1,400&display=swap'

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
        <html
            lang="en"
            className={`motion-safe:scroll-smooth ${GeistSans.variable} ${GeistMono.variable}`}
        >
            <head>
                <link rel="preconnect" href="https://fonts.googleapis.com" />
                <link
                    rel="preconnect"
                    href="https://fonts.gstatic.com"
                    crossOrigin="anonymous"
                />
                <link rel="stylesheet" href={DISPLAY_FONTS} />
            </head>
            <body className={GeistSans.className}>
                <script
                    dangerouslySetInnerHTML={{
                        __html: `(function(){var d=document.documentElement,fam=/(^|\\.)hovanhoa\\.net$/.test(location.hostname);function apply(){var m=document.cookie.match(/(?:^|; )theme=(dark|light)/);d.classList.toggle('dark',!!m&&m[1]==='dark')}try{if(fam)document.cookie='theme=; path=/; max-age=0';apply();addEventListener('focus',apply);addEventListener('pageshow',apply);document.addEventListener('visibilitychange',function(){if(!document.hidden)apply()});if(window.cookieStore)cookieStore.addEventListener('change',apply)}catch(e){}})()`,
                    }}
                />
                <Navbar />
                {children}
                <Footer />
            </body>
            <Analytics />
        </html>
    )
}
