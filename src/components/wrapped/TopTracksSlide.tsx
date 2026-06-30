"use client";

import { StorySlide, StoryBadge, LastFmLogo, formatNumber, formatDuration } from "./StorySlide";
import type { WrappedData } from "@/store/wrapped";
import { motion } from "framer-motion";

export function TopTracksSlide({ data, slideIndex = 0 }: { data: WrappedData; slideIndex?: number }) {
  const { topTracks } = data;
  const tracks = topTracks.slice(0, 8);

  return (
    <StorySlide bg="#0e0e0e" slideIndex={slideIndex}>
      <div className="flex items-center justify-between mb-2">
        <LastFmLogo />
        <StoryBadge>Top Tracks</StoryBadge>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-4"
        >
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em]">
            Songs you couldn&apos;t skip
          </p>
        </motion.div>

        {/* Printed chart style — numbered list with separators */}
        <div className="flex flex-col">
          {tracks.map((track, i) => (
            <motion.div
              key={`${track.artist}-${track.name}`}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.12 + i * 0.05 }}
            >
              <div className="flex items-baseline gap-2 py-2.5">
                {/* Rank */}
                <span
                  className="text-xs font-black w-4 text-right tabular-nums flex-shrink-0"
                  style={{ color: i < 3 ? "#d51007" : "rgba(255,255,255,0.2)" }}
                >
                  {i + 1}
                </span>

                {/* Track info */}
                <div className="flex-1 min-w-0">
                  <p className="text-[13px] font-bold text-white truncate leading-tight">
                    {track.name}
                  </p>
                  <p className="text-[10px] text-white/30 truncate mt-0.5">
                    {track.artist}
                    {track.duration > 0 && (
                      <span className="ml-1.5 text-white/15">
                        {formatDuration(track.duration)}
                      </span>
                    )}
                  </p>
                </div>

                {/* Playcount */}
                <span className="text-[11px] font-bold text-white/50 tabular-nums flex-shrink-0">
                  {formatNumber(track.playcount)}
                </span>
              </div>
              {/* Thin separator */}
              {i < tracks.length - 1 && (
                <div className="ml-6 h-px bg-white/[0.06]" />
              )}
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-white/15 text-[10px]">
          Swipe for more stats
        </p>
      </motion.div>
    </StorySlide>
  );
}