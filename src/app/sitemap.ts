import { MetadataRoute } from 'next'
import {
    MUSIC_URL,
    BASE_URL,
    INSIGHT_URL,
    GALLERY_URL,
    INFO_URL,
} from '@/constants'

const STATUS_URL = 'https://status.hovanhoa.net'

type Entry = {
    url: string
    changeFrequency: MetadataRoute.Sitemap[number]['changeFrequency']
    priority: number
}

const ENTRIES: Entry[] = [
    { url: MUSIC_URL, changeFrequency: 'daily', priority: 1.0 },
    { url: BASE_URL, changeFrequency: 'always', priority: 0.9 },
    { url: INSIGHT_URL, changeFrequency: 'daily', priority: 0.8 },
    { url: GALLERY_URL, changeFrequency: 'weekly', priority: 0.8 },
    { url: INFO_URL, changeFrequency: 'monthly', priority: 0.8 },
    { url: STATUS_URL, changeFrequency: 'always', priority: 0.8 },
]

export default function sitemap(): MetadataRoute.Sitemap {
    const lastModified = new Date()
    return ENTRIES.map((entry) => ({ ...entry, lastModified }))
}
