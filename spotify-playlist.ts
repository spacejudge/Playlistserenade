type SpotifyTrack = {
  id: string | null;
  name: string;
  artists: Array<{ name: string }>;
  album: { name: string; release_date: string };
  popularity?: number;
  duration_ms?: number;
};

type PlaylistTrack = {
  id: string;
  name: string;
  artists: string[];
  album: string;
  releaseDate: string | null;
  popularity: number | null;
  tempo: number | null;
  durationMs: number | null;
};

export type Track = {
  id?: string;
  name?: string;
  tempo?: number | null;
  release_date?: string | null;
  releaseDate?: string | null;
  popularity?: number | null;
  duration_ms?: number | null;
  durationMs?: number | null;
};

export type PlaylistReport = {
  trackCount: number;
  totalDurationMs: number;
  totalDurationFormatted: string;
  averageBpm: number | null;
  minBpm: number | null;
  maxBpm: number | null;
  averagePopularity: number | null;
  releaseYearDistribution: Record<string, number>;
  changeSummary: {
    originalTrackCount: number;
    sortedTrackCount: number;
    movedTrackCount: number;
    addedTrackCount: number;
    removedTrackCount: number;
  };
};

/** Summarize playlist metrics and compare the original and sorted sequences. */
export function generatePlaylistReport(
  originalTracks: Track[],
  sortedTracks: Track[],
): PlaylistReport {
  const validNumbers = (values: Array<number | null | undefined>): number[] =>
    values.filter(
      (value): value is number =>
        typeof value === "number" && Number.isFinite(value),
    );
  const mean = (values: number[]): number | null =>
    values.length
      ? values.reduce((sum, value) => sum + value, 0) / values.length
      : null;

  const durations = validNumbers(
    sortedTracks.map((track) => track.duration_ms ?? track.durationMs),
  );
  const totalDurationMs = durations.reduce((sum, duration) => sum + duration, 0);
  const totalMinutes = Math.floor(totalDurationMs / 60_000);
  const hours = Math.floor(totalMinutes / 60);
  const minutes = totalMinutes % 60;
  const tempos = validNumbers(sortedTracks.map((track) => track.tempo));
  const popularities = validNumbers(sortedTracks.map((track) => track.popularity));

  const releaseYearDistribution: Record<string, number> = {};
  for (const track of sortedTracks) {
    const releaseDate = track.release_date ?? track.releaseDate;
    const year = releaseDate?.match(/^\d{4}/)?.[0] ?? "Unknown";
    releaseYearDistribution[year] = (releaseYearDistribution[year] ?? 0) + 1;
  }

  const trackKey = (track: Track): string =>
    track.id ?? `${track.name ?? ""}:${track.release_date ?? track.releaseDate ?? ""}`;
  const originalKeys = originalTracks.map(trackKey);
  const sortedKeys = sortedTracks.map(trackKey);
  const countKeys = (keys: string[]): Map<string, number> => {
    const counts = new Map<string, number>();
    for (const key of keys) counts.set(key, (counts.get(key) ?? 0) + 1);
    return counts;
  };
  const originalCounts = countKeys(originalKeys);
  const sortedCounts = countKeys(sortedKeys);
  const addedTrackCount = [...sortedCounts].reduce(
    (total, [key, count]) => total + Math.max(0, count - (originalCounts.get(key) ?? 0)),
    0,
  );
  const removedTrackCount = [...originalCounts].reduce(
    (total, [key, count]) => total + Math.max(0, count - (sortedCounts.get(key) ?? 0)),
    0,
  );
  const originalPositions = new Map<string, number[]>();
  originalKeys.forEach((key, index) => {
    const positions = originalPositions.get(key) ?? [];
    positions.push(index);
    originalPositions.set(key, positions);
  });
  const usedPositions = new Map<string, number>();
  const commonPositions = sortedKeys.flatMap((key) => {
    const positions = originalPositions.get(key);
    const used = usedPositions.get(key) ?? 0;
    if (!positions || used >= positions.length) return [];
    usedPositions.set(key, used + 1);
    return [positions[used]];
  });
  // Minimum tracks that must move to transform one common-track ordering into
  // the other is the common count minus the longest increasing subsequence.
  const increasingSubsequence: number[] = [];
  for (const position of commonPositions) {
    let low = 0;
    let high = increasingSubsequence.length;
    while (low < high) {
      const middle = (low + high) >>> 1;
      if (increasingSubsequence[middle] < position) low = middle + 1;
      else high = middle;
    }
    increasingSubsequence[low] = position;
  }
  const movedTrackCount = commonPositions.length - increasingSubsequence.length;

  return {
    trackCount: sortedTracks.length,
    totalDurationMs,
    totalDurationFormatted: hours ? `${hours}h ${minutes}m` : `${minutes}m`,
    averageBpm: mean(tempos),
    minBpm: tempos.length ? Math.min(...tempos) : null,
    maxBpm: tempos.length ? Math.max(...tempos) : null,
    averagePopularity: mean(popularities),
    releaseYearDistribution,
    changeSummary: {
      originalTrackCount: originalTracks.length,
      sortedTrackCount: sortedTracks.length,
      movedTrackCount,
      addedTrackCount,
      removedTrackCount,
    },
  };
}

/** Return a sorted copy; unavailable or invalid values are placed last. */
export function sortPlaylistTracks(
  tracks: Track[],
  criterion: "tempo" | "release_date" | "popularity",
  order: "asc" | "desc",
): Track[] {
  const getValue = (track: Track): number | null => {
    if (criterion === "release_date") {
      const date = track.release_date ?? track.releaseDate;
      if (!date || !/^\d{4}(?:-\d{2})?(?:-\d{2})?$/.test(date)) return null;
      const timestamp = Date.parse(
        date.length === 4
          ? `${date}-01-01`
          : date.length === 7
            ? `${date}-01`
            : date,
      );
      return Number.isFinite(timestamp) ? timestamp : null;
    }

    const value = track[criterion];
    return typeof value === "number" && Number.isFinite(value) ? value : null;
  };

  const direction = order === "asc" ? 1 : -1;
  return tracks
    .map((track, index) => ({ track, index, value: getValue(track) }))
    .sort((a, b) => {
      if (a.value === null) return b.value === null ? a.index - b.index : 1;
      if (b.value === null) return -1;
      return (a.value - b.value) * direction || a.index - b.index;
    })
    .map(({ track }) => track);
}

/** Replace a playlist with ordered URIs, sending at most 100 per request. */
export async function updateSpotifyPlaylist(
  playlistId: string,
  sortedTrackUris: string[],
  accessToken: string,
): Promise<void> {
  const endpoint = `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/items`;
  const headers = {
    Authorization: `Bearer ${accessToken}`,
    "Content-Type": "application/json",
  };

  // PUT replaces the playlist, so use it only for the first batch. Later
  // batches must use POST to append, otherwise each PUT would erase prior ones.
  const firstBatch = sortedTrackUris.slice(0, 100);
  const initialResponse = await fetch(endpoint, {
    method: "PUT",
    headers,
    body: JSON.stringify({ uris: firstBatch }),
  });
  if (!initialResponse.ok) {
    throw new Error(
      `Spotify playlist update failed (${initialResponse.status}): ${await initialResponse.text()}`,
    );
  }

  for (let i = 100; i < sortedTrackUris.length; i += 100) {
    const response = await fetch(endpoint, {
      method: "POST",
      headers,
      body: JSON.stringify({ uris: sortedTrackUris.slice(i, i + 100) }),
    });
    if (!response.ok) {
      throw new Error(
        `Spotify playlist append failed (${response.status}): ${await response.text()}`,
      );
    }
  }
}

type SongBpmResult = {
  song_title?: string;
  artist?: string;
  tempo?: string | number;
};

function normalize(value: string): string {
  return value.toLowerCase().replace(/[^a-z0-9]/g, "");
}

async function getTempoFromSongBpm(
  track: SpotifyTrack,
  apiKey: string,
): Promise<number | null> {
  const artist = track.artists[0]?.name;
  if (!artist) return null;

  const params = new URLSearchParams({
    api_key: apiKey,
    type: "both",
    lookup: `${artist} ${track.name}`,
  });

  const response = await fetch(`https://api.getsongbpm.com/search/?${params}`);
  if (!response.ok) {
    throw new Error(
      `GetSongBPM error ${response.status}: ${await response.text()}`,
    );
  }

  const result = (await response.json()) as { search?: SongBpmResult[] };
  const match = result.search?.find(
    (song) =>
      normalize(song.song_title ?? "") === normalize(track.name) &&
      normalize(song.artist ?? "").includes(normalize(artist)),
  );

  const tempo = Number(match?.tempo);
  return Number.isFinite(tempo) && tempo > 0 ? tempo : null;
}

/** Fetch playlist metadata from Spotify and resolve tempo via GetSongBPM. */
export async function getPlaylistTracksWithFeatures(
  playlistId: string,
  accessToken: string,
): Promise<PlaylistTrack[]> {
  const apiKey = process.env.GETSONGBPM_API_KEY;

  const headers = { Authorization: `Bearer ${accessToken}` };
  const tracks: SpotifyTrack[] = [];
  let nextUrl: string | null =
    `https://api.spotify.com/v1/playlists/${encodeURIComponent(playlistId)}/items?limit=50&additional_types=track`;

  while (nextUrl) {
    const response = await fetch(nextUrl, { headers });
    if (!response.ok) {
      throw new Error(
        `Spotify API error ${response.status}: ${await response.text()}`,
      );
    }

    const page = (await response.json()) as {
      items: Array<{ item?: SpotifyTrack | null; track?: SpotifyTrack | null }>;
      next: string | null;
    };

    tracks.push(
      ...page.items.flatMap(({ item, track }) => {
        const playlistItem = item ?? track;
        return playlistItem ? [playlistItem] : [];
      }),
    );
    nextUrl = page.next;
  }

  // Cache repeated song lookups within this playlist.
  const tempoCache = new Map<string, Promise<number | null>>();
  const validTracks = tracks.filter(
    (track): track is SpotifyTrack & { id: string } => Boolean(track.id),
  );

  const results = new Array<PlaylistTrack>(validTracks.length);
  let nextIndex = 0;
  const worker = async (): Promise<void> => {
    while (nextIndex < validTracks.length) {
      const index = nextIndex++;
      const track = validTracks[index];
      const artist = track.artists[0]?.name ?? "";
      const cacheKey = `${normalize(artist)}:${normalize(track.name)}`;

      let tempoLookup = tempoCache.get(cacheKey);
      if (!tempoLookup) {
        tempoLookup = apiKey
          ? getTempoFromSongBpm(track, apiKey).catch(() => {
              // Tempo is supplemental; retain playlist data if lookup fails.
              return null;
            })
          : Promise.resolve(null);
        tempoCache.set(cacheKey, tempoLookup);
      }
      const tempo = await tempoLookup;

      results[index] = {
        id: track.id,
        name: track.name,
        artists: track.artists.map(({ name }) => name),
        album: track.album.name,
        releaseDate: track.album.release_date ?? null,
        popularity: track.popularity ?? null,
        tempo,
        durationMs: track.duration_ms ?? null,
      };
    }
  };

  await Promise.all(
    Array.from({ length: Math.min(5, validTracks.length) }, () => worker()),
  );
  return results;
}
