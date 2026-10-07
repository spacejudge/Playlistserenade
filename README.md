# Spotify Playlist Tools

Next.js App Router API authentication and server-side playlist helpers.

## Setup

1. Install Node.js 20.9 or newer, then run `npm install`.
2. Copy `.env.example` to `.env.local` and fill in the Spotify app credentials.
   `AUTH_SECRET` must be a long, randomly generated value. The app also accepts
   `NEXTAUTH_SECRET`, `SPOTIFY_CLIENT_ID`, and `SPOTIFY_CLIENT_SECRET` as legacy
   aliases. GetSongBPM's API key is optional; without it, playlist results have
   `tempo: null`.
3. In the Spotify Developer Dashboard, set the redirect URI to
   `http://localhost:3000/api/auth/callback/spotify`.
4. Run `npm run dev` and open `http://localhost:3000/api/auth/signin` to sign in.

The Auth.js handler is at `/api/auth/[...nextauth]`. Playlist utilities are
exported from `spotify-playlist.ts` and must only be called on the server. Spotify
access tokens are passed to the helpers by the caller; keep them private.

Run `npm run typecheck` and `npm run build` to validate the project.

For Vercel, set `AUTH_SECRET`, `AUTH_SPOTIFY_ID`, and
`AUTH_SPOTIFY_SECRET` in the project's Environment Variables for Production,
then redeploy. Register the exact production callback URL
`https://playlistserenade.grittyflint.com/api/auth/callback/spotify` in the
Spotify Developer Dashboard. Do not commit `.env.local` or share OAuth secrets;
rotate credentials that have been exposed.