import NextAuth from "next-auth";
import Spotify from "next-auth/providers/spotify";

export const { handlers, auth, signIn, signOut } = NextAuth({
  trustHost: true,

  secret: process.env.AUTH_SECRET,

  providers: [
    Spotify({
      clientId: process.env.AUTH_SPOTIFY_ID!,
      clientSecret: process.env.AUTH_SPOTIFY_SECRET!,

      checks: ["pkce", "state"],

      authorization: {
        url: "https://accounts.spotify.com/authorize",
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