"use client";

import { StorySlide, StoryBadge, LastFmLogo, formatNumber } from "./StorySlide";
import type { WrappedData } from "@/store/wrapped";
import { motion } from "framer-motion";

export function TopAlbumsSlide({ data, slideIndex = 0 }: { data: WrappedData; slideIndex?: number }) {
  const { topAlbums, overview } = data;
  const albums = topAlbums.slice(0, 6);

  return (
    <StorySlide bg="#141210" slideIndex={slideIndex}>
      <div className="flex items-center justify-between mb-2">
        <LastFmLogo />
        <StoryBadge>Top Albums</StoryBadge>
      </div>

      <div className="flex-1 flex flex-col justify-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-3"
        >
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em]">
            Albums you had on repeat
          </p>
        </motion.div>

        {/* 2x3 grid of album covers */}
        <div className="grid grid-cols-3 gap-2.5">
          {albums.map((album, i) => (
            <motion.div
              key={`${album.artist}-${album.name}`}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15 + i * 0.06 }}
            >
              <div className="relative aspect-square bg-white/[0.04] overflow-hidden">
                {album.image ? (
                  <img
                    src={album.image}
                    alt={album.name}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <svg className="w-6 h-6 text-white/10" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 14.5c-2.49 0-4.5-2.01-4.5-4.5S9.51 7.5 12 7.5s4.5 2.01 4.5 4.5-2.01 4.5-4.5 4.5zm0-5.5c-.55 0-1 .45-1 1s.45 1 1 1 1-.45 1-1-.45-1-1-1z"/>
                    </svg>
                  </div>
                )}
                {/* Rank in top-left */}
                <div className="absolute top-1.5 left-1.5">
                  <span
                    className="text-[11px] font-black tabular-nums"
                    style={{ color: i < 3 ? "#d51007" : "rgba(255,255,255,0.5)" }}
                  >
                    {i + 1}
                  </span>
                </div>
              </div>
              {/* Album info below */}
              <div className="mt-1.5 min-w-0">
                <p className="text-[11px] font-bold text-white truncate leading-tight">
                  {album.name}
                </p>
                <p className="text-[10px] text-white/30 truncate mt-0.5">
                  {album.artist}
                </p>
                <p className="text-[9px] text-white/15 tabular-nums mt-0.5">
                  {formatNumber(album.playcount)} plays
                </p>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
      >
        <p className="text-white/15 text-[10px]">{overview.periodLabel}</p>
      </motion.div>
    </StorySlide>
  );
}