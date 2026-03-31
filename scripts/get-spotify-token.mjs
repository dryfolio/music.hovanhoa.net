#!/usr/bin/env node
/**
 * Get a Spotify refresh token.
 *
 * Usage:
 *   node scripts/get-spotify-token.mjs <CLIENT_ID> <CLIENT_SECRET>
 */

import { readFileSync } from 'fs'
import readline from 'readline'
import crypto from 'crypto'
import { fileURLToPath } from 'url'
import { dirname, join } from 'path'

const __dirname = dirname(fileURLToPath(import.meta.url))

// Read .env manually
function getEnv(key) {
    const envPath = join(__dirname, '../.env')
    try {
        const content = readFileSync(envPath, 'utf8')
        for (const line of content.split('\n')) {
            const [k, ...rest] = line.split('=')
            if (k.trim() === key) return rest.join('=').trim()
        }
    } catch {}
    return undefined
}

const CLIENT_ID = process.argv[2] || getEnv('SPOTIFY_CLIENT_ID')
const CLIENT_SECRET = process.argv[3] || getEnv('SPOTIFY_CLIENT_SECRET')

if (!CLIENT_ID || !CLIENT_SECRET) {
    console.error('Usage: node scripts/get-spotify-token.mjs <CLIENT_ID> <CLIENT_SECRET>')
    console.error('Or ensure SPOTIFY_CLIENT_ID and SPOTIFY_CLIENT_SECRET are in .env')
    process.exit(1)
}

const SCOPES = [
    'user-read-currently-playing',
    'user-top-read',
    'user-read-recently-played',
].join(' ')

const codeVerifier = crypto.randomBytes(64).toString('base64url')
const codeChallenge = crypto
    .createHash('sha256')
    .update(codeVerifier)
    .digest('base64url')

const params = new URLSearchParams({
    client_id: CLIENT_ID,
    response_type: 'code',
    redirect_uri: 'https://music.hovanhoa.net/callback',
    scope: SCOPES,
    code_challenge_method: 'S256',
    code_challenge: codeChallenge,
})

const authUrl = `https://accounts.spotify.com/authorize?${params}`
console.log('\nOpen this URL in your browser:\n')
console.log(authUrl)
console.log('\nAfter authorizing, paste the full redirect URL here:\n')

const rl = readline.createInterface({ input: process.stdin, output: process.stdout })
rl.question('Redirect URL: ', async (redirectUrl) => {
    rl.close()
    const url = new URL(redirectUrl)
    const code = url.searchParams.get('code')
    if (!code) {
        console.error('No code found in redirect URL')
        process.exit(1)
    }

    const basic = Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString('base64')
    const res = await fetch('https://accounts.spotify.com/api/token', {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded',
            Authorization: `Basic ${basic}`,
        },
        body: new URLSearchParams({
            grant_type: 'authorization_code',
            code,
            redirect_uri: 'https://music.hovanhoa.net/callback',
            code_verifier: codeVerifier,
        }),
    })

    const data = await res.json()
    if (data.error) {
        console.error('Error:', data.error, data.error_description)
        process.exit(1)
    }

    console.log('\nAdd this to your .env:\n')
    console.log(`SPOTIFY_REFRESH_TOKEN=${data.refresh_token}`)
    console.log(`\nAccess token expires in ${data.expires_in} seconds.\n`)
})
