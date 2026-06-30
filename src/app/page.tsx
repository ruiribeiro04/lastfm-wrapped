"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Music, Loader2, ArrowRight, AlertCircle, Info,
  Key, Sparkles, Share2, Layers, SlidersHorizontal,
  Check, X, Clock, Link2, Copy,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useWrappedStore } from "@/store/wrapped";
import { StoryCarousel } from "@/components/wrapped/StoryCarousel";
import { DenseShareCard } from "@/components/wrapped/DenseShareCard";
import { CustomStoryBuilder } from "@/components/wrapped/CustomStoryBuilder";

const PERIODS = [
  { value: "7day", label: "7d" },
  { value: "1month", label: "1mo" },
  { value: "3month", label: "3mo" },
  { value: "6month", label: "6mo" },
  { value: "12month", label: "12mo" },
  { value: "overall", label: "all" },
];

type ViewMode = "search" | "stories" | "share" | "custom";

type Toast = {
  id: number;
  message: string;
};

type UserValidation = {
  valid: boolean;
  username?: string;
  realname?: string;
  playcount?: number;
  avatar?: string;
};

/* ─── Equalizer Bars (CSS-only) ─── */
const EQ_BAR_DELAYS = ["0s", "0.15s", "0.3s", "0.1s", "0.25s"];

function EqualizerBars({ opacity = 0.4, barH = "h-10" }: { opacity?: number; barH?: string }) {
  return (
    <>
      <style>{`
        @keyframes eq-bounce {
          0%, 100% { transform: scaleY(0.25); }
          50% { transform: scaleY(1); }
        }
        .eq-bar {
          animation: eq-bounce 1.2s ease-in-out infinite;
          transform-origin: bottom;
        }
        @keyframes shimmer {
          0% { background-position: 200% 0; }
          100% { background-position: -200% 0; }
        }
        .shimmer-sweep {
          animation: shimmer 2.5s ease-in-out infinite;
        }
        @keyframes float {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-6px); }
        }
        .float-anim {
          animation: float 4s ease-in-out infinite;
        }
        @keyframes pulse-glow {
          0%, 100% { box-shadow: 0 0 20px rgba(213,16,7,0.15); }
          50% { box-shadow: 0 0 40px rgba(213,16,7,0.3); }
        }
        .pulse-glow {
          animation: pulse-glow 3s ease-in-out infinite;
        }
        @keyframes gradient-shift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
        .gradient-bg-anim {
          background-size: 200% 200%;
          animation: gradient-shift 8s ease-in-out infinite;
        }
      `}</style>
      <div className="flex items-end gap-[3px]" style={{ height: barH === "h-10" ? 40 : 48 }}>
        {EQ_BAR_DELAYS.map((delay, i) => (
          <div
            key={i}
            className="eq-bar w-[3px] rounded-full"
            style={{
              backgroundColor: "#d51007",
              opacity,
              height: "100%",
              animationDelay: delay,
            }}
          />
        ))}
      </div>
    </>
  );
}

/* ─── Loading Overlay ─── */
function LoadingOverlay({ username }: { username: string }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.3 }}
      className="absolute inset-0 z-50 flex flex-col items-center justify-center bg-[#0a0a0a]/95"
    >
      <div className="flex flex-col items-center gap-5">
        <div className="w-16 h-16 rounded-2xl bg-[#d51007]/10 flex items-center justify-center pulse-glow">
          <EqualizerBars opacity={0.8} barH="h-12" />
        </div>
        <div className="text-center">
          <p className="text-sm font-semibold text-white/70">Fetching your music data...</p>
          {username && (
            <p className="text-xs text-white/30 mt-1">@{username}</p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

/* ─── Toast Component ─── */
function ToastNotification({ toast }: { toast: Toast }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.25 }}
      className="fixed bottom-6 left-1/2 -translate-x-1/2 z-[100] px-5 py-2.5 rounded-full bg-white/10 backdrop-blur-md border border-white/10 text-xs font-medium text-white/80 shadow-lg"
    >
      {toast.message}
    </motion.div>
  );
}

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

const RECENT_SEARCHES_KEY = "playback_recent_searches";

function getRecentSearches(): string[] {
  try {
    return JSON.parse(localStorage.getItem(RECENT_SEARCHES_KEY) || "[]") as string[];
  } catch {
    return [];
  }
}

function addRecentSearch(username: string) {
  const recent = getRecentSearches().filter((u) => u !== username);
  recent.unshift(username);
  localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(recent.slice(0, 5)));
}

export default function Home() {
  const store = useWrappedStore();
  const { username, period, data, loading, error, setUsername, setPeriod } = store;

  const [view, setView] = useState<ViewMode>("search");
  const [inputValue, setInputValue] = useState("");
  const [searching, setSearching] = useState(false);
  const [apiKey, setApiKey] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [toast, setToast] = useState<Toast | null>(null);
  const toastCounter = useRef(0);

  // User validation
  const [userValidation, setUserValidation] = useState<UserValidation | null>(null);
  const [validating, setValidating] = useState(false);
  const validateTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [recentSearches, setRecentSearches] = useState<string[]>([]);

  // Shareable URL state
  const [shareUrlCopied, setShareUrlCopied] = useState(false);
  const isFromUrl = useRef(false);

  const showToast = useCallback((message: string) => {
    toastCounter.current += 1;
    setToast({ id: toastCounter.current, message });
    setTimeout(() => setToast(null), 3000);
  }, []);

  useEffect(() => {
    const saved = localStorage.getItem("lastfm_api_key");
    if (saved) setApiKey(saved);
    setRecentSearches(getRecentSearches());

    // Parse URL params for shareable links
    const params = new URLSearchParams(window.location.search);
    const urlUser = params.get("u");
    const urlPeriod = params.get("p");

    if (urlUser) {
      setInputValue(urlUser);
      setUsername(urlUser);
      if (urlPeriod && PERIODS.some((p) => p.value === urlPeriod)) {
        setPeriod(urlPeriod);
      }
      isFromUrl.current = true;
      // Auto-trigger search
      handleSearchWithURL(urlUser, urlPeriod || "6month");
    }
  }, []);

  // Update URL when viewing results
  useEffect(() => {
    if (data && username && view !== "search") {
      const params = new URLSearchParams();
      params.set("u", username);
      params.set("p", period);
      const newUrl = `${window.location.pathname}?${params.toString()}`;
      window.history.replaceState({}, "", newUrl);
    }
  }, [data, username, period, view]);

  // Debounced user validation
  useEffect(() => {
    if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    const val = inputValue.trim();
    if (val.length < 2) {
      setUserValidation(null);
      setValidating(false);
      return;
    }
    setValidating(true);
    validateTimerRef.current = setTimeout(async () => {
      try {
        const res = await fetch(`/api/lastfm/validate?username=${encodeURIComponent(val)}`);
        const json = await res.json();
        setUserValidation(json);
      } catch {
        setUserValidation(null);
      } finally {
        setValidating(false);
      }
    }, 600);
    return () => {
      if (validateTimerRef.current) clearTimeout(validateTimerRef.current);
    };
  }, [inputValue]);

  const saveApiKey = (key: string) => {
    setApiKey(key);
    if (key) localStorage.setItem("lastfm_api_key", key);
    else localStorage.removeItem("lastfm_api_key");
  };

  const doSearch = async (uname: string, per: string) => {
    setUsername(uname);
    setSearching(true);
    store.setLoading(true);
    store.setError(null);
    store.setData(null);

    try {
      let json: Record<string, unknown>;
      if (!apiKey) {
        const res = await fetch(
          `/api/lastfm/wrapped?username=${encodeURIComponent(uname)}&period=${per}`
        );
        json = await res.json();
        if (!res.ok) throw new Error((json as { error?: string }).error || "Failed to fetch data");
      } else {
        const res = await fetch("/api/lastfm/proxy", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ username: uname, period: per, apiKey }),
        });
        json = await res.json();
        if (!res.ok) throw new Error((json as { error?: string }).error || "Failed to fetch data");
      }
      store.setData(json as import("@/store/wrapped").WrappedData);
      store.setLoading(false);
      addRecentSearch(uname);
      setRecentSearches(getRecentSearches());
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong";
      store.setError(msg);
      store.setLoading(false);
      showToast(msg);
    } finally {
      setSearching(false);
    }
  };

  const handleSearch = async () => {
    if (!inputValue.trim()) return;
    await doSearch(inputValue.trim(), period);
  };

  const handleSearchWithURL = async (uname: string, per: string) => {
    await doSearch(uname, per);
  };

  const handleDemo = async () => {
    store.setLoading(true);
    store.setError(null);
    store.setData(null);
    try {
      const res = await fetch("/api/lastfm/demo");
      const json = await res.json();
      store.setData(json);
      store.setUsername("demo_user");
      store.setLoading(false);
    } catch {
      store.setError("Failed to load demo");
      store.setLoading(false);
      showToast("Failed to load demo");
    }
  };

  const handleRecentClick = (uname: string) => {
    setInputValue(uname);
  };

  const handleCopyShareLink = useCallback(async () => {
    if (!username) return;
    const params = new URLSearchParams();
    params.set("u", username);
    params.set("p", period);
    const url = `${window.location.origin}${window.location.pathname}?${params.toString()}`;
    try {
      await navigator.clipboard.writeText(url);
      setShareUrlCopied(true);
      showToast("Link copied to clipboard!");
      setTimeout(() => setShareUrlCopied(false), 2000);
    } catch {
      showToast("Failed to copy link");
    }
  }, [username, period, showToast]);

  useEffect(() => {
    if (data && !isFromUrl.current) setView("share");
    else if (data && isFromUrl.current) {
      setView("share");
      isFromUrl.current = false;
    }
  }, [data]);

  const handleBack = () => {
    setView("search");
    store.setData(null);
    store.setError(null);
    window.history.replaceState({}, "", window.location.pathname);
  };

  const isLoadingSearch = loading && view === "search";
  const hasUsername = inputValue.trim().length > 0;

  return (
    <div
      className="min-h-screen flex flex-col gradient-bg-anim"
      style={{
        background: "radial-gradient(ellipse at 30% 20%, #0f0a0a 0%, #050505 40%, #080508 70%, #050505 100%)",
      }}
    >
      {/* Ambient floating orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div
          className="absolute w-64 h-64 rounded-full opacity-[0.03] blur-3xl"
          style={{
            background: "radial-gradient(circle, #d51007, transparent)",
            top: "10%",
            right: "-5%",
            animation: "float 8s ease-in-out infinite",
          }}
        />
        <div
          className="absolute w-48 h-48 rounded-full opacity-[0.02] blur-3xl"
          style={{
            background: "radial-gradient(circle, #d51007, transparent)",
            bottom: "20%",
            left: "-10%",
            animation: "float 10s ease-in-out infinite reverse",
          }}
        />
      </div>

      <main className="flex-1 flex flex-col items-center p-4 py-8 relative z-10">
        <AnimatePresence mode="wait">
          {/* ===== SEARCH ===== */}
          {view === "search" && !isLoadingSearch && (
            <motion.div
              key="search"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="flex flex-col items-center gap-6 w-full max-w-md"
            >
              {/* Logo + Equalizer */}
              <div className="flex flex-col items-center gap-3">
                <motion.div
                  className="w-16 h-16 rounded-2xl bg-[#d51007] flex items-center justify-center pulse-glow"
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, type: "spring", stiffness: 200 }}
                >
                  <Music className="w-8 h-8 text-white" />
                </motion.div>
                <div className="text-center">
                  <motion.h1
                    className="text-3xl font-black text-white tracking-tight uppercase leading-none"
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.15 }}
                  >
                    PLAYBACK
                  </motion.h1>
                  <motion.p
                    className="text-white/20 text-xs mt-1.5 tracking-[0.2em] uppercase"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.25 }}
                  >
                    Your half-year in music
                  </motion.p>
                </div>
                <EqualizerBars />
              </div>

              <div className="w-full space-y-3">
                {/* Search input with validation indicator */}
                <div className="relative group">
                  <div className="absolute -inset-0.5 bg-gradient-to-r from-[#d51007]/20 via-transparent to-[#d51007]/20 rounded-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                  <div className="relative">
                    <Input
                      type="text"
                      placeholder="Last.fm username"
                      value={inputValue}
                      onChange={(e) => setInputValue(e.target.value)}
                      onKeyDown={(e) => e.key === "Enter" && handleSearch()}
                      disabled={loading || searching}
                      className="h-12 bg-white/[0.04] border-white/[0.06] text-white placeholder:text-white/20 rounded-xl text-sm pl-11 pr-11 font-medium focus-visible:ring-[#d51007]/30 focus-visible:border-[#d51007]/30 transition-all duration-300"
                      autoFocus
                    />
                    <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/20 group-focus-within:text-[#d51007]/60 transition-colors" />
                    {/* Validation indicator */}
                    {hasUsername && (
                      <div className="absolute right-3.5 top-1/2 -translate-y-1/2">
                        {validating ? (
                          <Loader2 className="w-4 h-4 text-white/20 animate-spin" />
                        ) : userValidation?.valid ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                            transition={{ type: "spring", stiffness: 300 }}
                            className="flex items-center gap-1.5"
                          >
                            <Check className="w-4 h-4 text-emerald-400" />
                            {userValidation.avatar && (
                              <img
                                src={userValidation.avatar}
                                alt=""
                                className="w-5 h-5 rounded-full border border-white/10"
                                crossOrigin="anonymous"
                              />
                            )}
                          </motion.div>
                        ) : userValidation && !userValidation.valid ? (
                          <motion.div
                            initial={{ scale: 0 }}
                            animate={{ scale: 1 }}
                          >
                            <X className="w-4 h-4 text-red-400/60" />
                          </motion.div>
                        ) : null}
                      </div>
                    )}
                  </div>
                </div>

                {/* User preview card */}
                <AnimatePresence>
                  {userValidation?.valid && userValidation.avatar && hasUsername && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.03] border border-white/5">
                        <div className="relative">
                          <img
                            src={userValidation.avatar}
                            alt=""
                            className="w-10 h-10 rounded-full border border-white/10"
                            crossOrigin="anonymous"
                          />
                          <div className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full bg-emerald-400 border-2 border-[#111]" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-white/80 truncate">
                            {userValidation.realname || userValidation.username}
                          </p>
                          <p className="text-[10px] text-white/30">
                            {fmt(userValidation.playcount || 0)} scrobbles
                          </p>
                        </div>
                        <ArrowRight className="w-4 h-4 text-white/15" />
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* Recent searches */}
                <AnimatePresence>
                  {recentSearches.length > 0 && !hasUsername && (
                    <motion.div
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                    >
                      <p className="text-[10px] text-white/20 font-semibold uppercase tracking-[0.12em] mb-1.5 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        Recent
                      </p>
                      <div className="flex flex-wrap gap-1.5">
                        {recentSearches.map((u, i) => (
                          <motion.button
                            key={u}
                            initial={{ opacity: 0, scale: 0.9 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: i * 0.05 }}
                            onClick={() => handleRecentClick(u)}
                            className="px-2.5 py-1 rounded-lg bg-white/[0.03] border border-white/5 text-[11px] text-white/30 hover:text-white/60 hover:bg-white/[0.06] hover:border-white/10 transition-all duration-200"
                          >
                            @{u}
                          </motion.button>
                        ))}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                {/* API Key */}
                <div>
                  <button
                    onClick={() => setShowApiKey(!showApiKey)}
                    className="flex items-center gap-1.5 text-[11px] text-white/25 hover:text-white/50 transition-colors"
                  >
                    <Key className="w-3 h-3" />
                    {showApiKey ? "Hide" : "Set"} API Key
                    {apiKey && <span className="text-emerald-400/70">saved</span>}
                  </button>
                  {showApiKey && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      className="mt-1.5"
                    >
                      <Input
                        type="password"
                        placeholder="Paste your Last.fm API key"
                        value={apiKey}
                        onChange={(e) => saveApiKey(e.target.value)}
                        disabled={loading}
                        className="h-9 bg-white/5 border-white/8 text-white placeholder:text-white/15 rounded-lg text-xs pl-3 pr-3 font-mono focus-visible:ring-white/10"
                      />
                      <p className="text-[9px] text-white/15 mt-1 leading-relaxed">
                        Free at last.fm/api/account/create. Stored in your browser only.
                      </p>
                    </motion.div>
                  )}
                </div>

                {/* Period */}
                <div className="flex gap-1.5 justify-center">
                  {PERIODS.map((p, i) => (
                    <motion.button
                      key={p.value}
                      initial={{ opacity: 0, y: 4 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.3 + i * 0.03 }}
                      onClick={() => setPeriod(p.value)}
                      className={`px-3 py-1.5 rounded-lg text-[11px] font-semibold transition-all duration-200 ${
                        period === p.value
                          ? "bg-[#d51007] text-white shadow-lg shadow-[#d51007]/20 cursor-default"
                          : "text-white/30 hover:text-white/50 hover:bg-white/5 cursor-pointer"
                      }`}
                    >
                      {p.label}
                    </motion.button>
                  ))}
                </div>

                {/* Divider line */}
                <div className="h-px bg-gradient-to-r from-transparent via-white/8 to-transparent" />

                {/* Generate */}
                <div className="relative">
                  <Button
                    onClick={handleSearch}
                    disabled={loading || searching || !inputValue.trim()}
                    className="w-full h-12 bg-[#d51007] hover:bg-[#e81209] text-white rounded-xl text-sm font-bold gap-2 disabled:opacity-40 shadow-lg shadow-[#d51007]/20 hover:shadow-[#d51007]/30 transition-all duration-300 active:scale-[0.98]"
                  >
                    {loading || searching ? (
                      <><Loader2 className="w-4 h-4 animate-spin" />Fetching...</>
                    ) : (
                      <><ArrowRight className="w-4 h-4" />Generate Playback</>
                    )}
                  </Button>
                  {/* Red dot pulse when username is typed */}
                  {hasUsername && !loading && !searching && (
                    <span className="absolute -top-1.5 -right-1.5 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-[#d51007] opacity-75" />
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-[#d51007]" />
                    </span>
                  )}
                </div>

                {/* Demo — with shimmer on hover */}
                <div className="relative overflow-hidden rounded-xl">
                  <div className="absolute inset-0 opacity-0 hover:opacity-100 transition-opacity duration-500 pointer-events-none">
                    <div
                      className="absolute inset-0 shimmer-sweep"
                      style={{
                        background: "linear-gradient(105deg, transparent 40%, rgba(255,255,255,0.06) 50%, transparent 60%)",
                        backgroundSize: "200% 100%",
                      }}
                    />
                  </div>
                  <button
                    onClick={handleDemo}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-1.5 h-10 rounded-xl text-[11px] text-white/25 hover:text-white/40 hover:bg-white/5 border border-white/5 border-dashed transition-colors disabled:opacity-50"
                  >
                    <Sparkles className="w-3 h-3" />
                    Try with demo data
                  </button>
                </div>

                {/* Error */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-start gap-2 p-3 rounded-xl bg-red-500/8 border border-red-500/15"
                  >
                    <AlertCircle className="w-3.5 h-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                    <p className="text-xs text-red-300/80">{error}</p>
                  </motion.div>
                )}
              </div>

              <div className="flex items-start gap-1.5 max-w-xs text-center">
                <Info className="w-3 h-3 text-white/15 mt-0.5 flex-shrink-0" />
                <p className="text-[10px] text-white/15 leading-relaxed">
                  Data fetched from Last.fm API in real-time. Never stored on any server. Profile must be public.
                </p>
              </div>
            </motion.div>
          )}

          {/* ===== RESULTS: tabbed views ===== */}
          {data && view !== "search" && (
            <motion.div
              key="results"
              initial={{ opacity: 0, y: 16 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.3 }}
              className="w-full flex flex-col items-center gap-4"
            >
              {/* Nav: back + tabs */}
              <div className="flex items-center justify-between w-full max-w-lg">
                <button
                  onClick={handleBack}
                  className="text-[11px] text-white/30 hover:text-white/60 transition-colors font-medium flex items-center gap-1"
                >
                  <ChevronLeftIcon /> back
                </button>
                <div className="flex gap-0">
                  {([
                    ["share", "Share Card", Share2],
                    ["stories", "Stories", Layers],
                    ["custom", "Customize", SlidersHorizontal],
                  ] as const).map(([id, label, Icon]) => (
                    <button
                      key={id}
                      onClick={() => setView(id as ViewMode)}
                      className={`px-4 py-1.5 text-[11px] font-semibold transition-all flex items-center gap-1.5 relative ${
                        view === id
                          ? "text-white"
                          : "text-white/30 hover:text-white/50"
                      }`}
                    >
                      <Icon className="w-3.5 h-3.5" />
                      {label}
                      {view === id && (
                        <motion.div
                          layoutId="tab-underline"
                          className="absolute bottom-0 left-1 right-1 h-[2px] bg-[#d51007] rounded-full"
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handleCopyShareLink}
                  className="text-[11px] text-white/30 hover:text-white/60 transition-colors font-medium flex items-center gap-1"
                  title="Copy share link"
                >
                  {shareUrlCopied ? (
                    <><Check className="w-3.5 h-3.5 text-emerald-400" /></>
                  ) : (
                    <><Link2 className="w-3.5 h-3.5" /></>
                  )}
                </button>
              </div>

              {/* Tab content */}
              {view === "share" && (
                <DenseShareCard data={data} period={period} username={inputValue || username} onToast={showToast} />
              )}
              {view === "stories" && (
                <StoryCarousel data={data} />
              )}
              {view === "custom" && (
                <CustomStoryBuilder data={data} username={inputValue || username} />
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Loading overlay */}
        <AnimatePresence>
          {isLoadingSearch && <LoadingOverlay username={username || inputValue} />}
        </AnimatePresence>
      </main>

      {/* Toast */}
      <AnimatePresence>
        {toast && <ToastNotification key={toast.id} toast={toast} />}
      </AnimatePresence>

      <footer className="mt-auto py-3 text-center relative z-10">
        <div className="flex items-center justify-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#d51007]" />
          <p className="text-[10px] text-white/20">
            Built with Last.fm API
          </p>
        </div>
      </footer>
    </div>
  );
}

/* Small chevron left icon for back button */
function ChevronLeftIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  );
}