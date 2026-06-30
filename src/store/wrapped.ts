import { create } from "zustand";

export interface WrappedData {
  overview: {
    username: string;
    realname: string;
    avatar: string;
    totalScrobbles: number;
    periodScrobbles: number;
    estimatedHoursListened: number;
    daysActive: number;
    averagePerDay: number;
    periodLabel: string;
    tracksWithoutDuration: number;
  };
  topArtists: Array<{
    name: string;
    playcount: number;
    rank: number;
    image: string;
    mbid: string;
    percentage: number;
  }>;
  topAlbums: Array<{
    name: string;
    artist: string;
    playcount: number;
    rank: number;
    image: string;
    mbid: string;
  }>;
  topTags: Array<{
    name: string;
    count: number;
    rank: number;
  }>;
  topTracks: Array<{
    name: string;
    artist: string;
    playcount: number;
    rank: number;
    image: string;
    duration: number;
    mbid: string;
  }>;
  listeningPatterns: {
    hourlyDistribution: number[];
    dayOfWeekDistribution: number[];
    monthlyDistribution: Array<{ month: string; count: number }>;
    peakHour: number;
    peakDay: string;
    longestStreak: number;
    busiestDay: { date: string; count: number };
  };
  diversity: {
    uniqueArtists: number;
    uniqueAlbums: number;
    uniqueTracks: number;
    genreCount: number;
  };
  funFacts: {
    firstTrack: { name: string; artist: string; date: string };
    lastTrack: { name: string; artist: string; date: string };
    longestTrack: { name: string; artist: string; duration: number };
    shortestTrack: { name: string; artist: string; duration: number };
    averageTrackDuration: number;
    mostProductiveHour: number;
    midnightListener: boolean;
    weekendWarrior: boolean;
  };
}

interface WrappedStore {
  username: string;
  period: string;
  data: WrappedData | null;
  loading: boolean;
  error: string | null;
  currentSlide: number;
  totalSlides: number;
  setUsername: (u: string) => void;
  setPeriod: (p: string) => void;
  setData: (d: WrappedData | null) => void;
  setLoading: (l: boolean) => void;
  setError: (e: string | null) => void;
  setCurrentSlide: (s: number) => void;
  setTotalSlides: (t: number) => void;
  fetchWrapped: () => Promise<void>;
}

export const useWrappedStore = create<WrappedStore>((set, get) => ({
  username: "",
  period: "6month",
  data: null,
  loading: false,
  error: null,
  currentSlide: 0,
  totalSlides: 8,

  setUsername: (username) => set({ username }),
  setPeriod: (period) => set({ period }),
  setData: (data) => set({ data: data as WrappedData | null }),
  setLoading: (loading) => set({ loading }),
  setError: (error) => set({ error }),
  setCurrentSlide: (currentSlide) => set({ currentSlide }),
  setTotalSlides: (totalSlides) => set({ totalSlides }),

  fetchWrapped: async () => {
    const { username, period } = get();
    if (!username.trim()) {
      set({ error: "Please enter a username" });
      return;
    }

    set({ loading: true, error: null, data: null, currentSlide: 0 });

    try {
      const res = await fetch(
        `/api/lastfm/wrapped?username=${encodeURIComponent(username)}&period=${period}`
      );
      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Failed to fetch wrapped data");
      }

      set({ data: json, loading: false });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : "Something went wrong",
        loading: false,
      });
    }
  },
}));