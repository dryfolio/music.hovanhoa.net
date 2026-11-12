// Cloudflare Worker for music.hovanhoa.net. Static assets (the Next.js export
// in ./out) are served by Cloudflare directly; only /api/* reaches this code
// (see run_worker_first in wrangler.jsonc).
import { getSpotifyData } from '../src/lib/spotify'

type Env = { ASSETS: { fetch: (request: Request) => Promise<Response> } }
type Ctx = { waitUntil: (promise: Promise<unknown>) => void }

// Spotify is hit at most once a minute per data center, however many
// visitors are polling.
const CACHE_SECONDS = 60

async function spotify(request: Request, ctx: Ctx): Promise<Response> {
    const cache = (caches as unknown as { default: Cache }).default
    const cacheKey = new Request(new URL('/api/spotify', request.url))
    const cached = await cache.match(cacheKey)
    if (cached) return cached

    const res = Response.json(await getSpotifyData(), {
        headers: { 'Cache-Control': `public, max-age=${CACHE_SECONDS}` },
    })
    ctx.waitUntil(cache.put(cacheKey, res.clone()))
    return res
}

export default {
    async fetch(request: Request, env: Env, ctx: Ctx): Promise<Response> {
        const { pathname } = new URL(request.url)
        if (pathname === '/api/spotify' && request.method === 'GET') {
            return spotify(request, ctx)
        }
        return env.ASSETS.fetch(request)
    },
}
