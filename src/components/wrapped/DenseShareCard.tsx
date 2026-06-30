"use client";

import { useRef, useState, useCallback } from "react";
import { Download, Share2, GitCompareArrows, Loader2 } from "lucide-react";
import type { WrappedData } from "@/store/wrapped";

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

function fmtH(h: number): string {
  if (h >= 24) return `${Math.floor(h / 24)}d ${Math.round(h % 24)}h`;
  return `${Math.round(h)}h`;
}

function Delta({ current, previous, unit = "" }: { current: number; previous: number; unit?: string }) {
  if (previous === 0 && current === 0) return null;
  const delta = previous > 0 ? ((current - previous) / previous) * 100 : 0;
  if (Math.abs(delta) < 1) return null;
  const isUp = delta > 0;
  return (
    <span
      className="text-[8px] font-bold tabular-nums ml-1"
      style={{ color: isUp ? "#34d399" : "#f87171" }}
    >
      {isUp ? "+" : ""}
      {delta.toFixed(0)}%{unit}
    </span>
  );
}

const PREVIOUS_PERIOD_MAP: Record<string, string> = {
  "7day": "1month",
  "1month": "3month",
  "3month": "6month",
  "6month": "12month",
  "12month": "overall",
  overall: "overall",
};

interface DenseShareCardProps {
  data: WrappedData;
  period?: string;
  username?: string;
  onToast?: (message: string) => void;
}

export function DenseShareCard({
  data,
  period = "6month",
  username,
  onToast,
}: DenseShareCardProps) {
  const cardRef = useRef<HTMLDivElement>(null);
  const [exporting, setExporting] = useState(false);
  const [comparing, setComparing] = useState(false);
  const [compareData, setCompareData] = useState<WrappedData | null>(null);
  const accentColor = "#FFD600";
  const { overview, topArtists, topAlbums, topTags, topTracks, listeningPatterns, diversity } = data;

  const handleExport = useCallback(async () => {
    if (!cardRef.current) return;
    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(cardRef.current, {
        pixelRatio: 3,
        backgroundColor: "#111111",
      });
      const link = document.createElement("a");
      link.download = `playback-${overview.username}.png`;
      link.href = dataUrl;
      link.click();
      onToast?.("Image saved!");
    } catch (err) {
      console.error("Export failed", err);
      onToast?.("Failed to save image");
    } finally {
      setExporting(false);
    }
  }, [overview.username, onToast]);

  const handleShare = useCallback(async () => {
    try {
      if (navigator.share) {
        await navigator.share({
          title: `Last.fm Playback — ${overview.username}`,
          text: `I listened to ${fmt(overview.periodScrobbles)} tracks (${fmtH(overview.estimatedHoursListened)}) on Last.fm. #LastfmPlayback`,
        });
        onToast?.("Shared successfully!");
      } else {
        handleExport();
      }
    } catch {
      onToast?.("Sharing cancelled");
    }
  }, [overview, handleExport, onToast]);

  const handleCompare = useCallback(async () => {
    if (compareData) {
      setCompareData(null);
      return;
    }
    const prevPeriod = PREVIOUS_PERIOD_MAP[period] || "12month";
    if (prevPeriod === period) {
      onToast?.("No previous period to compare");
      return;
    }
    setComparing(true);
    try {
      const res = await fetch(
        `/api/lastfm/wrapped?username=${encodeURIComponent(overview.username)}&period=${prevPeriod}`
      );
      const json = await res.json();
      if (!res.ok) throw new Error("Failed to fetch comparison data");
      setCompareData(json);
    } catch {
      onToast?.("Comparison failed — try demo data");
    } finally {
      setComparing(false);
    }
  }, [compareData, period, overview.username, onToast]);

  const artists = topArtists.slice(0, 5);
  const albums = topAlbums.slice(0, 4);
  const tags = topTags.slice(0, 8);
  const tracks = topTracks.slice(0, 3);
  const tagString = tags.map((t) => `#${t.name.replace(/\s+/g, "")}`).join(" ");

  const prevOverview = compareData?.overview;

  return (
    <div className="flex flex-col items-center gap-3 w-full">
      <div className="flex gap-2">
        <button
          onClick={handleExport}
          disabled={exporting}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {exporting ? "Saving..." : "Save Image"}
        </button>
        <button
          onClick={handleShare}
          className="flex items-center gap-1.5 px-4 py-2 rounded-lg bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 text-xs font-medium transition-colors"
        >
          <Share2 className="w-3.5 h-3.5" />
          Share
        </button>
        <button
          onClick={handleCompare}
          disabled={comparing}
          className={`flex items-center gap-1.5 px-3 py-2 rounded-lg border text-xs font-medium transition-all ${
            compareData
              ? "bg-[#d51007]/10 border-[#d51007]/30 text-[#d51007]"
              : "bg-white/5 border-white/10 text-white/60 hover:text-white hover:bg-white/10"
          } disabled:opacity-50`}
        >
          {comparing ? (
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
          ) : (
            <GitCompareArrows className="w-3.5 h-3.5" />
          )}
          {comparing ? "Loading..." : compareData ? "Hide" : "Compare"}
        </button>
      </div>

      {/* THE CARD */}
      <div
        ref={cardRef}
        className="relative w-full overflow-hidden select-none rounded-2xl"
        style={{ aspectRatio: "9/16", backgroundColor: "#111111" }}
      >
        {/* Paper grain texture */}
        <div
          className="absolute inset-0 pointer-events-none z-50"
          style={{
            opacity: 0.045,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            mixBlendMode: "overlay",
          }}
        />

        {/* Subtle vignette */}
        <div
          className="absolute inset-0 pointer-events-none z-40"
          style={{
            background: "radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.25) 100%)",
          }}
        />

        <div className="absolute inset-0 flex flex-col p-5 sm:p-7">
          {/* === HEADER: Logo + Period === */}
          <div className="flex items-end justify-between mb-3.5">
            <div>
              <div className="flex items-center gap-1.5 mb-0.5">
                <svg viewBox="0 0 24 24" className="w-4 h-4" style={{ fill: accentColor }}>
                  <path d="M12.009 0C5.376 0 0 5.376 0 12.009c0 6.632 5.376 12.008 12.009 12.008 6.632 0 12.008-5.376 12.008-12.008C24.017 5.376 18.641 0 12.009 0z" />
                </svg>
                <span className="text-[10px] font-bold uppercase tracking-[0.2em]" style={{ color: accentColor }}>
                  PLAYBACK
                </span>
                <svg viewBox="0 0 24 24" className="w-3.5 h-3.5 ml-1 opacity-60" fill="none" stroke={accentColor} strokeWidth="1.5">
                  <circle cx="12" cy="12" r="10" />
                  <circle cx="12" cy="12" r="3" />
                </svg>
              </div>
              <p className="text-[10px] text-white/30 leading-tight">{overview.periodLabel}</p>
            </div>
            <p className="text-[9px] text-white/20 text-right">last.fm</p>
          </div>

          {/* === USER ROW === */}
          <div className="flex items-center gap-3 mb-3.5 pb-3" style={{ borderBottom: `2px solid ${accentColor}` }}>
            <div className="w-11 h-11 rounded-full bg-white/10 flex-shrink-0 overflow-hidden ring-2 ring-white/5">
              {overview.avatar ? (
                <img src={overview.avatar} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-lg font-black text-white/20">
                  {(username || overview.username)[0]?.toUpperCase()}
                </div>
              )}
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-black text-white leading-tight truncate">
                {username || overview.realname || overview.username}
              </p>
              <p className="text-[10px] text-white/30">@{overview.username}</p>
            </div>
            <div className="text-right flex-shrink-0">
              <p className="text-lg font-black text-white leading-none tabular-nums">{fmt(overview.periodScrobbles)}</p>
              <p className="text-[8px] text-white/30 uppercase tracking-wider mt-0.5">scrobbles</p>
            </div>
          </div>

          {/* === GENRE DNA BAR === */}
          {tags.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] text-white/25 uppercase tracking-[0.15em] mb-1.5 font-semibold">Genre DNA</p>
              <div className="flex h-2.5 rounded-full overflow-hidden bg-white/5 border border-white/5">
                {tags.slice(0, 6).map((tag, i) => {
                  const total = tags.slice(0, 6).reduce((s, t) => s + t.count, 0);
                  const pct = (tag.count / total) * 100;
                  const dnaColors = [accentColor, `${accentColor}AA`, `${accentColor}77`, `${accentColor}55`, `${accentColor}33`, `${accentColor}22`];
                  return (
                    <div
                      key={tag.name}
                      className="h-full first:rounded-l-full last:rounded-r-full"
                      style={{ width: `${pct}%`, backgroundColor: dnaColors[i] || `${accentColor}22` }}
                      title={`${tag.name}: ${tag.count}`}
                    />
                  );
                })}
              </div>
              <div className="flex flex-wrap gap-x-2.5 gap-y-0.5 mt-1.5">
                {tags.slice(0, 6).map((tag, i) => (
                  <span key={tag.name} className="text-[8px] text-white/30 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full flex-shrink-0" style={{ backgroundColor: [accentColor, `${accentColor}AA`, `${accentColor}77`, `${accentColor}55`, `${accentColor}33`, `${accentColor}22`][i] }} />
                    {tag.name}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* === TOP ARTISTS (with images) === */}
          {artists.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] text-white/25 uppercase tracking-[0.15em] mb-2 font-semibold">Top Artists</p>
              <div className="flex flex-col gap-1.5">
                {artists.map((a, i) => {
                  const maxPc = artists[0].playcount;
                  const pct = (a.playcount / maxPc) * 100;
                  return (
                    <div key={a.name} className="flex items-center gap-2.5">
                      {/* Artist image */}
                      <div className="w-7 h-7 rounded-md bg-white/5 overflow-hidden flex-shrink-0 border border-white/5">
                        {a.image ? (
                          <img src={a.image} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white/15">
                            {a.name[0]?.toUpperCase()}
                          </div>
                        )}
                      </div>
                      <span className="w-3 text-[10px] font-bold text-right tabular-nums" style={{ color: accentColor }}>
                        {i + 1}
                      </span>
                      <span className="text-[11px] font-semibold text-white/80 flex-1 truncate">{a.name}</span>
                      <div className="w-14 h-1 bg-white/10 rounded-full overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accentColor }} />
                      </div>
                      <span className="w-8 text-[9px] text-white/30 text-right tabular-nums">{fmt(a.playcount)}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* === TOP ALBUMS (compact grid) === */}
          {albums.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] text-white/25 uppercase tracking-[0.15em] mb-2 font-semibold">Top Albums</p>
              <div className="grid grid-cols-4 gap-2">
                {albums.map((alb, i) => (
                  <div key={`${alb.artist}-${alb.name}-${i}`} className="flex flex-col gap-1">
                    <div className="aspect-square rounded-lg bg-white/5 overflow-hidden border border-white/5">
                      {alb.image ? (
                        <img src={alb.image} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center">
                          <svg viewBox="0 0 24 24" className="w-5 h-5 text-white/10" fill="none" stroke="currentColor" strokeWidth="1.5">
                            <circle cx="12" cy="12" r="10" /><circle cx="12" cy="12" r="3" />
                          </svg>
                        </div>
                      )}
                    </div>
                    <div className="min-w-0">
                      <p className="text-[8px] font-semibold text-white/50 truncate leading-tight">{alb.name}</p>
                      <p className="text-[7px] text-white/25 truncate">{alb.artist}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Decorative HR between albums and tracks */}
          {albums.length > 0 && tracks.length > 0 && (
            <div className="my-1.5 h-px w-full" style={{ background: `linear-gradient(to right, transparent, ${accentColor}66, transparent)` }} />
          )}

          {/* === TOP TRACKS (compact) === */}
          {tracks.length > 0 && (
            <div className="mb-3">
              <p className="text-[9px] text-white/25 uppercase tracking-[0.15em] mb-1.5 font-semibold">Top Tracks</p>
              {tracks.map((t, i) => (
                <div key={`${t.artist}-${t.name}`} className="flex items-baseline gap-1.5 mb-1">
                  <span className="text-[10px] font-bold tabular-nums" style={{ color: accentColor }}>{i + 1}.</span>
                  <span className="text-[10px] font-semibold text-white/70 truncate flex-1">{t.name}</span>
                  <span className="text-[9px] text-white/25 truncate flex-shrink-0">{t.artist}</span>
                </div>
              ))}
            </div>
          )}

          {/* === TAGS AS HASHTAGS === */}
          {tags.length > 0 && (
            <div className="mb-2">
              <p className="text-[9px] text-white/25 uppercase tracking-[0.15em] mb-1 font-semibold">Your Sound</p>
              <p className="text-[10px] leading-relaxed" style={{ color: `${accentColor}CC` }}>
                {tagString}
              </p>
            </div>
          )}

          {/* === BOTTOM STATS ROW === */}
          <div className="mt-auto pt-2 flex flex-wrap gap-x-3 gap-y-1" style={{ borderTop: "1px solid rgba(255,255,255,0.06)" }}>
            <span className="text-[9px] text-white/25">
              <span className="font-bold text-white/40">{fmtH(overview.estimatedHoursListened)}</span> listened
              {prevOverview && (
                <Delta current={overview.estimatedHoursListened} previous={prevOverview.estimatedHoursListened} unit="h" />
              )}
            </span>
            <span className="text-[9px] text-white/25">
              <span className="font-bold text-white/40">{fmt(diversity.uniqueArtists)}</span> artists
              {prevOverview && (
                <Delta current={diversity.uniqueArtists} previous={compareData!.diversity.uniqueArtists} />
              )}
            </span>
            <span className="text-[9px] text-white/25">
              <span className="font-bold text-white/40">{fmt(diversity.uniqueAlbums)}</span> albums
            </span>
            <span className="text-[9px] text-white/25">
              <span className="font-bold text-white/40">{listeningPatterns.longestStreak}d</span> streak
              {prevOverview && (
                <Delta current={listeningPatterns.longestStreak} previous={compareData!.listeningPatterns.longestStreak} unit="d" />
              )}
            </span>
            <span className="text-[9px] text-white/25">
              peak <span className="font-bold text-white/40">{listeningPatterns.peakHour}:00</span>
            </span>
          </div>

          {/* === FOOTER === */}
          <div className="flex items-center justify-between mt-2">
            <p className="text-[8px] text-white/15">unofficial playback</p>
            <p className="text-[8px] text-white/15">{fmt(overview.totalScrobbles)} all-time</p>
          </div>
        </div>
      </div>
    </div>
  );
}