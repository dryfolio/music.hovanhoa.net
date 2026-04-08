# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
yarn dev           # Start development server
yarn build         # Production build
yarn lint          # Run ESLint
yarn format        # Format TS and Markdown with Prettier
yarn format-check  # Check formatting without modifying files
```

## Architecture

**Next.js 14 personal music library** using the App Router, TypeScript, Tailwind CSS. Fetches music data from the Spotify Web API and displays it with ISR (revalidate every 60 seconds).

### Data Flow

All music data comes from the Spotify Web API via `src/lib/spotify.ts`:
- `getRecentlyPlayed()` — last 5 tracks played
- `getTopTracks()` — top 25 tracks (short term)
- `getTopArtists()` — top 24 artists (short term)

The Spotify API uses OAuth2 refresh token flow. No client-side JS handles auth.

### Key Files

- `src/app/page.tsx` — Main page composing Hero + Spotify sections
- `src/app/spotify/` — Server Components that fetch and render each Spotify section
- `src/lib/spotify.ts` — All Spotify API functions
- `src/components/nav.tsx` — Navigation with links to other hovanhoa services
- `src/app/spotify/profile.tsx` — Spotify profile card with follower count
- `src/constants/index.tsx` — Central config for URLs and site metadata

### Styling

Tailwind CSS with light theme (slate/slate colors). Uses Next.js `<Image>` for Spotify album/artist artwork. Prettier uses 4-space indent and single quotes (see `.prettierrc.json`).

### Environment Variables

Required in `.env` (see `.env.example`):
```
SPOTIFY_CLIENT_ID=
SPOTIFY_CLIENT_SECRET=
SPOTIFY_REFRESH_TOKEN=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Spotify tokens are cached in Upstash Redis (with a 60s buffer before expiry). The refresh token is also persisted to Redis to handle Spotify's token rotation. To get credentials: create a Spotify app at https://developer.spotify.com/dashboard, enable required scopes, and generate a refresh token. Create a Redis database at https://console.upstash.com/redis.
