import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";

export const { handlers, auth, signIn, signOut } = NextAuth({
  // Vercel is a trusted reverse proxy; accept either Auth.js or legacy
  // NextAuth environment variable names for deployments already configured.
  trustHost: true,
  secret: process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET,
  providers: [
    Spotify({
      clientId:
        process.env.AUTH_SPOTIFY_ID || process.env.SPOTIFY_CLIENT_ID || "",
      clientSecret:
        process.env.AUTH_SPOTIFY_SECRET ||
        process.env.SPOTIFY_CLIENT_SECRET ||
        "",
      checks: ["pkce", "state"],
      authorization: {
        params: {
          scope: [
            "playlist-read-private",
            "playlist-read-collaborative",
            "playlist-modify-public",
            "playlist-modify-private",
          ].join(" "),
        },
      },
    }),
  ],
});