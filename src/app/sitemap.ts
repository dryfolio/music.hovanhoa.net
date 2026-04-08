import { MetadataRoute } from 'next'
import { MUSIC_URL, BASE_URL, INSIGHT_URL, GALLERY_URL, INFO_URL } from '@/constants'

const STATUS_URL = 'https://status.hovanhoa.net'

export default function sitemap(): MetadataRoute.Sitemap {
  return [
    {
      url: MUSIC_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1.0,
    },
    {
      url: `${MUSIC_URL}/spotify/profile`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${MUSIC_URL}/spotify/top-tracks`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${MUSIC_URL}/spotify/recently-played`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: `${MUSIC_URL}/spotify/top-artists`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.9,
    },
    {
      url: BASE_URL,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.9,
    },
    {
      url: INSIGHT_URL,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
    {
      url: GALLERY_URL,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: INFO_URL,
      lastModified: new Date(),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: STATUS_URL,
      lastModified: new Date(),
      changeFrequency: 'always',
      priority: 0.8,
    },
  ]
}
