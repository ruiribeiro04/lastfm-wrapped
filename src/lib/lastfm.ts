// Last.fm API Client
// Base URL: https://ws.audioscrobbler.com/2.0/
// Auth: API Key only for public data
// Rate limit: ~5 req/sec
// Response format: JSON (add format=json)

const BASE_URL = "https://ws.audioscrobbler.com/2.0/";
const DEFAULT_API_KEY = process.env.LASTFM_API_KEY || "";

// In-memory cache
const cache = new Map<string, { data: unknown; expires: number }>();
const CACHE_TTL_CHARTS = 5 * 60 * 1000; // 5 minutes
const CACHE_TTL_RECENT = 2 * 60 * 1000; // 2 minutes

// Rate limiter - max 5 requests per second
const requestQueue: Array<() => void> = [];
let isProcessing = false;
const MIN_REQUEST_INTERVAL = 220; // ms between requests (~4.5 req/sec to be safe)

function getCacheKey(params: Record<string, string>): string {
  return JSON.stringify(params);
}

function getFromCache(key: string): unknown | null {
  const entry = cache.get(key);
  if (entry && Date.now() < entry.expires) {
    return entry.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key: string, data: unknown, ttl: number): void {
  cache.set(key, { data, expires: Date.now() + ttl });
}

function processQueue(): void {
  if (isProcessing || requestQueue.length === 0) return;
  isProcessing = true;
  const fn = requestQueue.shift()!;
  fn();
  setTimeout(() => {
    isProcessing = false;
    processQueue();
  }, MIN_REQUEST_INTERVAL);
}

const FETCH_TIMEOUT_MS = 20_000;

function rateLimitedFetch(url: string, signal?: AbortSignal): Promise<Response> {
  return new Promise((resolve, reject) => {
    requestQueue.push(() => {
      fetch(url, { signal })
        .then(resolve)
        .catch(reject);
    });
    processQueue();
  });
}

async function lastfmFetch(
  params: Record<string, string>,
  cacheTTL: number = CACHE_TTL_CHARTS,
  apiKey?: string
): Promise<Record<string, unknown>> {
  const key = apiKey || DEFAULT_API_KEY;
  if (!key) {
    throw new Error(
      "LASTFM_API_KEY is not set. Please add it to your environment variables or provide one in the UI."
    );
  }

  const allParams = { ...params, api_key: key, format: "json" };
  const cacheKey = getCacheKey(allParams);
  const cached = getFromCache(cacheKey);
  if (cached) return cached as Record<string, unknown>;

  const searchParams = new URLSearchParams(allParams);
  const url = `${BASE_URL}?${searchParams.toString()}`;

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  const response = await rateLimitedFetch(url, controller.signal).finally(() => clearTimeout(timeoutId));
  if (!response.ok) {
    throw new Error(`Last.fm API error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (data.error) {
    throw new Error(`Last.fm API error: ${data.message} (code: ${data.error})`);
  }

  setCache(cacheKey, data, cacheTTL);
  return data;
}

// --- Types ---

export interface LfmImage {
  "#text": string;
  size: string;
}

export interface UserInfo {
  username: string;
  realname: string;
  playcount: number;
  registered: { unixtime: string; "#text": string };
  country: string;
  image: string[];
}

export interface TopArtist {
  name: string;
  playcount: number;
  rank: number;
  image: string;
  mbid: string;
}

export interface TopAlbum {
  name: string;
  artist: string;
  playcount: number;
  rank: number;
  image: string;
  mbid: string;
}

export interface TopTrack {
  name: string;
  artist: string;
  playcount: number;
  rank: number;
  image: string;
  duration: number;
  mbid: string;
}

export interface TopTag {
  name: string;
  count: number;
  rank: number;
}

export interface RecentTrack {
  artist: string;
  artistMbid: string;
  name: string;
  album: string;
  albumMbid: string;
  dateUts: number;
  dateText: string;
  duration: number;
  image: string;
  nowplaying: boolean;
}

// --- Helper to get largest image ---
function getLargestImage(images: LfmImage[]): string {
  if (!images || images.length === 0) return "";
  const order = ["mega", "extralarge", "large", "medium", "small"];
  for (const size of order) {
    const found = images.find((img) => img.size === size);
    if (found && found["#text"]) return found["#text"];
  }
  return images[images.length - 1]?.["#text"] || "";
}

// --- API Functions ---

export async function getUserInfo(username: string, apiKey?: string): Promise<UserInfo> {
  const data = await lastfmFetch({
    method: "user.getInfo",
    user: username,
  }, CACHE_TTL_CHARTS, apiKey);

  const user = data.user as Record<string, unknown>;
  const images = (user.image as LfmImage[]) || [];

  return {
    username: (user.name as string) || username,
    realname: (user.realname as string) || "",
    playcount: parseInt((user.playcount as string) || "0", 10),
    registered: user.registered as { unixtime: string; "#text": string },
    country: (user.country as string) || "",
    image: images.map((img) => img["#text"] || ""),
  };
}

export async function getTopArtists(
  username: string,
  period: string,
  limit: number = 50,
  apiKey?: string
): Promise<TopArtist[]> {
  const data = await lastfmFetch({
    method: "user.getTopArtists",
    user: username,
    period,
    limit: limit.toString(),
  }, CACHE_TTL_CHARTS, apiKey);

  const topartists = data.topartists as {
    artist: Array<Record<string, unknown>>;
  };

  if (!topartists?.artist) return [];

  return topartists.artist.map((a) => ({
    name: (a.name as string) || "",
    playcount: parseInt((a.playcount as string) || "0", 10),
    rank: parseInt((a["@attr"] as Record<string, unknown>)?.rank as string || "0", 10),
    image: getLargestImage((a.image as LfmImage[]) || []),
    mbid: (a.mbid as string) || "",
  }));
}

export async function getTopAlbums(
  username: string,
  period: string,
  limit: number = 50,
  apiKey?: string
): Promise<TopAlbum[]> {
  const data = await lastfmFetch({
    method: "user.getTopAlbums",
    user: username,
    period,
    limit: limit.toString(),
  }, CACHE_TTL_CHARTS, apiKey);

  const topalbums = data.topalbums as {
    album: Array<Record<string, unknown>>;
  };

  if (!topalbums?.album) return [];

  return topalbums.album.map((a) => ({
    name: (a.name as string) || "",
    artist:
      typeof a.artist === "string"
        ? (a.artist as string)
        : ((a.artist as Record<string, unknown>)?.name as string) || "",
    playcount: parseInt((a.playcount as string) || "0", 10),
    rank: parseInt(
      ((a["@attr"] as Record<string, unknown>)?.rank as string) || "0",
      10
    ),
    image: getLargestImage((a.image as LfmImage[]) || []),
    mbid: (a.mbid as string) || "",
  }));
}

export async function getTopTracks(
  username: string,
  period: string,
  limit: number = 50,
  apiKey?: string
): Promise<TopTrack[]> {
  const data = await lastfmFetch({
    method: "user.getTopTracks",
    user: username,
    period,
    limit: limit.toString(),
  }, CACHE_TTL_CHARTS, apiKey);

  const toptracks = data.toptracks as {
    track: Array<Record<string, unknown>>;
  };

  if (!toptracks?.track) return [];

  return toptracks.track.map((t) => ({
    name: (t.name as string) || "",
    artist:
      typeof t.artist === "string"
        ? (t.artist as string)
        : ((t.artist as Record<string, unknown>)?.name as string) || "",
    playcount: parseInt((t.playcount as string) || "0", 10),
    rank: parseInt(
      ((t["@attr"] as Record<string, unknown>)?.rank as string) || "0",
      10
    ),
    image: getLargestImage((t.image as LfmImage[]) || []),
    duration: parseInt((t.duration as string) || "0", 10),
    mbid: (t.mbid as string) || "",
  }));
}

export async function getTopTags(
  username: string,
  limit: number = 50,
  apiKey?: string
): Promise<TopTag[]> {
  const data = await lastfmFetch({
    method: "user.getTopTags",
    user: username,
    limit: limit.toString(),
  }, CACHE_TTL_CHARTS, apiKey);

  const toptags = data.toptags as {
    tag: Array<Record<string, unknown>>;
  };

  if (!toptags?.tag) return [];

  return toptags.tag.map((t) => ({
    name: (t.name as string) || "",
    count: parseInt((t.count as string) || "0", 10),
    rank: parseInt(
      ((t["@attr"] as Record<string, unknown>)?.rank as string) || "0",
      10
    ),
  }));
}

export async function getRecentTracks(
  username: string,
  from?: number,
  to?: number,
  maxPages: number = 50,
  apiKey?: string
): Promise<RecentTrack[]> {
  const allTracks: RecentTrack[] = [];
  let page = 1;
  const limit = 200;

  while (page <= maxPages) {
    const params: Record<string, string> = {
      method: "user.getRecentTracks",
      user: username,
      limit: limit.toString(),
      page: page.toString(),
      extended: "1",
    };

    if (from) params.from = from.toString();
    if (to) params.to = to.toString();

    const data = await lastfmFetch(params, CACHE_TTL_RECENT, apiKey);

    const recenttracks = data.recenttracks as {
      track: Array<Record<string, unknown>>;
      "@attr": Record<string, unknown>;
    };

    if (!recenttracks?.track || recenttracks.track.length === 0) break;

    for (const t of recenttracks.track) {
      const nowplaying = (
        (t["@attr"] as Record<string, unknown>)?.nowplaying as string
      ) === "true";

      if (nowplaying) continue; // Skip currently playing

      const dateObj = t.date as { uts: string; "#text": string } | undefined;
      const dateUts = dateObj ? parseInt(dateObj.uts, 10) : 0;
      const dateText = dateObj?.["#text"] || "";

      const artistObj = t.artist as Record<string, unknown>;
      const albumObj = t.album as Record<string, unknown>;

      // Duration: try extended data first, default to 0
      let duration = 0;
      if (t.duration) {
        duration = parseInt(String(t.duration), 10);
      }

      allTracks.push({
        artist: typeof artistObj === "string" ? artistObj : (artistObj?.name as string) || "",
        artistMbid:
          typeof artistObj === "string" ? "" : (artistObj?.mbid as string) || "",
        name: (t.name as string) || "",
        album: typeof albumObj === "string" ? albumObj : (albumObj?.name as string) || "",
        albumMbid:
          typeof albumObj === "string" ? "" : (albumObj?.mbid as string) || "",
        dateUts,
        dateText,
        duration,
        image: getLargestImage((t.image as LfmImage[]) || []),
        nowplaying,
      });
    }

    // Check if there are more pages
    const totalPages = parseInt(
      (recenttracks["@attr"]?.totalPages as string) || "1",
      10
    );
    if (page >= totalPages) break;
    page++;
  }

  return allTracks;
}

export async function getTrackInfo(
  artist: string,
  track: string,
  apiKey?: string
): Promise<{ duration: number }> {
  try {
    const data = await lastfmFetch({
      method: "track.getInfo",
      artist,
      track,
      autocorrect: "1",
    }, CACHE_TTL_CHARTS, apiKey);

    const trackData = data.track as Record<string, unknown>;
    return {
      duration: parseInt((trackData?.duration as string) || "0", 10),
    };
  } catch {
    return { duration: 0 };
  }
}

// --- Utility: Calculate period timestamps ---

export function getPeriodRange(period: string): {
  from: number;
  to: number;
  label: string;
} {
  const now = new Date();
  const to = Math.floor(now.getTime() / 1000);

  let from: number;
  let label: string;

  switch (period) {
    case "7day": {
      const d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      from = Math.floor(d.getTime() / 1000);
      label = `Last 7 Days`;
      break;
    }
    case "1month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 1, now.getDate());
      from = Math.floor(d.getTime() / 1000);
      label = `Last Month`;
      break;
    }
    case "3month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 3, now.getDate());
      from = Math.floor(d.getTime() / 1000);
      label = `Last 3 Months`;
      break;
    }
    case "6month": {
      const d = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
      from = Math.floor(d.getTime() / 1000);
      const startMonth = d.toLocaleString("en-US", { month: "long" });
      const startYear = d.getFullYear();
      const endMonth = now.toLocaleString("en-US", { month: "long" });
      const endYear = now.getFullYear();
      label = `${startMonth} ${startYear} – ${endMonth} ${endYear}`;
      break;
    }
    case "12month": {
      const d = new Date(now.getFullYear() - 1, now.getMonth(), now.getDate());
      from = Math.floor(d.getTime() / 1000);
      const startMonth = d.toLocaleString("en-US", { month: "long" });
      const startYear = d.getFullYear();
      const endMonth = now.toLocaleString("en-US", { month: "long" });
      const endYear = now.getFullYear();
      label = `${startMonth} ${startYear} – ${endMonth} ${endYear}`;
      break;
    }
    default: {
      from = 0;
      label = "All Time";
    }
  }

  return { from, to, label };
}