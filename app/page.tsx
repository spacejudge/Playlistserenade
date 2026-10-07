import { auth, signIn, signOut } from "@/auth";

async function signInWithSpotify() {
  "use server";
  await signIn("spotify");
}

async function signOutOfSpotify() {
  "use server";
  await signOut();
}

export default async function Home() {
  const session = await auth();

  return (
    <main className="home-shell">
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />

      <header className="topbar">
        <a className="brand" href="/" aria-label="Playlist Serenade home">
          <span className="brand-icon" aria-hidden="true">
            <svg viewBox="0 0 24 24" fill="none">
              <path d="M5 16V8m7 12V4m7 12v-8" />
            </svg>
          </span>
          <span>playlist<span className="brand-light">serenade</span></span>
        </a>
        <span className="topbar-note"><span className="status-dot" /> Made for your music</span>
      </header>

      <section className="hero" aria-labelledby="hero-title">
        <div className="hero-copy">
          <span className="eyebrow"><span className="eyebrow-line" /> YOUR MUSIC, YOUR FLOW</span>
          <h1 id="hero-title">Every playlist<br />has a <span>perfect order.</span></h1>
          <p className="hero-description">
            Rearrange your Spotify playlists seamlessly by Tempo, Release Date, or Popularity.
            Find a new rhythm in the music you already love.
          </p>

          {session?.user ? (
            <div className="auth-panel">
              <div className="signed-in-avatar" aria-hidden="true">
                {(session.user.name || session.user.email || "S").charAt(0).toUpperCase()}
              </div>
              <div className="signed-in-copy">
                <span className="signed-in-label">CONNECTED AS</span>
                <span className="signed-in-name">{session.user.name || session.user.email}</span>
              </div>
              <form action={signOutOfSpotify}>
                <button className="sign-out-button" type="submit">Sign out</button>
              </form>
            </div>
          ) : (
            <div className="sign-in-area">
              <form action={signInWithSpotify}>
                <button className="spotify-button" type="submit">
                  <svg className="spotify-mark" viewBox="0 0 24 24" aria-hidden="true">
                    <path d="M12 1.8A10.2 10.2 0 1 0 12 22.2 10.2 10.2 0 0 0 12 1.8Zm4.68 14.7a.64.64 0 0 1-.88.21c-2.4-1.47-5.42-1.8-8.98-.99a.64.64 0 1 1-.28-1.25c3.9-.89 7.25-.5 9.93 1.15.3.19.39.58.21.88Zm1.25-2.78a.8.8 0 0 1-1.1.26c-2.75-1.69-6.94-2.18-10.19-1.19a.8.8 0 1 1-.47-1.53c3.71-1.13 8.32-.58 11.49 1.36.38.23.5.72.27 1.1Zm.1-2.9c-3.3-1.96-8.75-2.14-11.9-1.18a.96.96 0 1 1-.56-1.83c3.61-1.1 9.61-.89 13.4 1.36a.96.96 0 0 1-.94 1.65Z" />
                  </svg>
                  <span>Continue with Spotify</span>
                  <span className="button-arrow" aria-hidden="true">↗</span>
                </button>
              </form>
              <p className="privacy-note"><span aria-hidden="true">◇</span> Secure sign-in. Your playlists stay yours.</p>
            </div>
          )}

          <div className="feature-list" aria-label="Sorting options">
            <span><span className="feature-icon">♫</span> Tempo</span>
            <i aria-hidden="true" />
            <span><span className="feature-icon">◷</span> Release date</span>
            <i aria-hidden="true" />
            <span><span className="feature-icon">↗</span> Popularity</span>
          </div>
        </div>

        <div className="visual-wrap" aria-hidden="true">
          <div className="orbit orbit-outer" />
          <div className="orbit orbit-inner" />
          <div className="vinyl-disc">
            <div className="vinyl-grooves" />
            <div className="vinyl-label"><span>PS</span><i /></div>
          </div>
          <div className="floating-card tempo-card">
            <span className="card-kicker">SORT BY TEMPO</span>
            <div className="waveform"><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /><i /></div>
            <div className="tempo-reading"><strong>124</strong><span>BPM</span><b>↗</b></div>
          </div>
          <div className="floating-card track-card">
            <div className="track-art"><span>♫</span></div>
            <div className="track-details"><strong>your next favorite</strong><span>is already in your playlist</span></div>
            <span className="track-equalizer"><i /><i /><i /></span>
          </div>
          <div className="sparkle sparkle-one">✳</div>
          <div className="sparkle sparkle-two">✳</div>
        </div>
      </section>

      <footer className="page-footer">
        <span>MADE FOR THE WAY YOU LISTEN</span>
        <span className="footer-center"><i /> A little more rhythm in your day</span>
        <span className="footer-version">PLAYLIST SERENADE <b>•</b> 01</span>
      </footer>
    </main>
  );
}
