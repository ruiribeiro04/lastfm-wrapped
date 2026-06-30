"use client";

import { StorySlide, StoryBadge, LastFmLogo, formatNumber } from "./StorySlide";
import type { WrappedData } from "@/store/wrapped";
import { motion } from "framer-motion";
import { useState } from "react";

export function TopArtistsSlide({ data, slideIndex = 0 }: { data: WrappedData; slideIndex?: number }) {
  const { topArtists, overview } = data;
  const artists = topArtists.slice(0, 8);
  const maxPlaycount = artists[0]?.playcount || 1;
  const [viewMode, setViewMode] = useState<"list" | "grid">("list");

  return (
    <StorySlide bg="#0d0d0d" slideIndex={slideIndex}>
      <div className="flex items-center justify-between mb-2">
        <LastFmLogo />
        <div className="flex items-center gap-2">
          {/* View toggle */}
          <button
            onClick={() => setViewMode(viewMode === "list" ? "grid" : "list")}
            className="text-[9px] text-white/25 hover:text-white/50 transition-colors font-semibold uppercase tracking-wider px-2 py-0.5 rounded border border-white/10"
          >
            {viewMode === "list" ? "Grid" : "List"}
          </button>
          <StoryBadge>Top Artists</StoryBadge>
        </div>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em]">
            Your favorite artists / {overview.periodLabel}
          </p>
        </motion.div>

        {viewMode === "list" ? (
          /* ─── List View with images ─── */
          <div className="flex flex-col gap-2.5">
            {artists.map((artist, i) => {
              const width = (artist.playcount / maxPlaycount) * 100;
              return (
                <motion.div
                  key={artist.name}
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.12 + i * 0.05 }}
                >
                  <div className="flex items-center gap-2.5 mb-1">
                    {/* Artist image */}
                    <div className="w-7 h-7 rounded-md bg-white/5 overflow-hidden flex-shrink-0 border border-white/5">
                      {artist.image ? (
                        <img
                          src={artist.image}
                          alt=""
                          className="w-full h-full object-cover"
                          crossOrigin="anonymous"
                        />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-[9px] font-bold text-white/20">
                          {artist.name[0]?.toUpperCase()}
                        </div>
                      )}
                    </div>
                    {/* Rank */}
                    <span
                      className="text-sm font-black w-4 text-right tabular-nums"
                      style={{ color: i < 3 ? "#d51007" : "rgba(255,255,255,0.2)" }}
                    >
                      {i + 1}
                    </span>
                    {/* Name + bar */}
                    <span className="text-sm font-bold text-white truncate flex-1">
                      {artist.name}
                    </span>
                    <span className="text-[10px] text-white/25 tabular-nums flex-shrink-0">
                      {formatNumber(artist.playcount)}
                    </span>
                  </div>
                  <div className="ml-[52px] h-[3px] bg-white/[0.06] rounded-sm overflow-hidden">
                    <motion.div
                      initial={{ width: 0 }}
                      animate={{ width: `${width}%` }}
                      transition={{ delay: 0.2 + i * 0.05, duration: 0.4, ease: "easeOut" }}
                      className="h-full rounded-sm"
                      style={{
                        backgroundColor: i < 3 ? "#d51007" : "rgba(255,255,255,0.25)",
                      }}
                    />
                  </div>
                </motion.div>
              );
            })}
          </div>
        ) : (
          /* ─── Grid View with large images ─── */
          <div className="grid grid-cols-3 gap-3">
            {artists.map((artist, i) => (
              <motion.div
                key={artist.name}
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: 0.12 + i * 0.05 }}
                className="flex flex-col items-center gap-1.5"
              >
                <div className="relative w-full aspect-square rounded-xl bg-white/5 overflow-hidden border border-white/5">
                  {artist.image ? (
                    <img
                      src={artist.image}
                      alt=""
                      className="w-full h-full object-cover"
                      crossOrigin="anonymous"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-2xl font-black text-white/10">
                      {artist.name[0]?.toUpperCase()}
                    </div>
                  )}
                  {/* Rank badge */}
                  <div
                    className="absolute top-1.5 left-1.5 w-5 h-5 rounded-md flex items-center justify-center text-[9px] font-black tabular-nums"
                    style={{
                      backgroundColor: i < 3 ? "rgba(213,16,7,0.9)" : "rgba(0,0,0,0.6)",
                      color: "white",
                    }}
                  >
                    {i + 1}
                  </div>
                  {/* Subtle gradient overlay at bottom */}
                  <div className="absolute bottom-0 left-0 right-0 h-8 bg-gradient-to-t from-black/60 to-transparent" />
                  {/* Playcount at bottom */}
                  <div className="absolute bottom-1.5 left-0 right-0 text-center">
                    <span className="text-[8px] text-white/60 tabular-nums font-semibold">
                      {formatNumber(artist.playcount)}
                    </span>
                  </div>
                </div>
                <p className="text-[10px] font-semibold text-white/60 text-center truncate w-full leading-tight">
                  {artist.name}
                </p>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-white/15 text-[10px]">
          {artists.reduce((s, a) => s + a.percentage, 0).toFixed(0)}% of scrobbles from these {artists.length} artists
        </p>
      </motion.div>
    </StorySlide>
  );
}