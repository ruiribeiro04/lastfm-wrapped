"use client";

import { StorySlide, StoryBadge, LastFmLogo, formatNumber } from "./StorySlide";
import type { WrappedData } from "@/store/wrapped";
import { motion } from "framer-motion";

export function DiversitySlide({ data, slideIndex = 0 }: { data: WrappedData; slideIndex?: number }) {
  const { diversity, overview, topArtists } = data;

  const stats = [
    { label: "Artists Discovered", value: formatNumber(diversity.uniqueArtists), sub: "unique artists" },
    { label: "Albums Played", value: formatNumber(diversity.uniqueAlbums), sub: "unique albums" },
    { label: "Tracks Scrobbled", value: formatNumber(diversity.uniqueTracks), sub: "unique tracks" },
    { label: "Genres Explored", value: formatNumber(diversity.genreCount), sub: "different tags" },
  ];

  const top3Pct =
    topArtists.length >= 3
      ? topArtists.slice(0, 3).reduce((s, a) => s + a.percentage, 0)
      : 100;
  const diversityScore = Math.round(100 - top3Pct);

  return (
    <StorySlide bg="#0f1210" slideIndex={slideIndex}>
      <div className="flex items-center justify-between mb-2">
        <LastFmLogo />
        <StoryBadge>Diversity</StoryBadge>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em]">
            How wide your taste goes
          </p>
        </motion.div>

        {/* Explorer Score */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center"
        >
          <div className="relative w-32 h-32">
            <svg className="w-full h-full -rotate-90" viewBox="0 0 100 100">
              <circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="6"
              />
              <motion.circle
                cx="50" cy="50" r="42"
                fill="none"
                stroke="#d51007"
                strokeWidth="6"
                strokeLinecap="round"
                strokeDasharray={`${diversityScore * 2.64} 264`}
                initial={{ strokeDasharray: "0 264" }}
                animate={{ strokeDasharray: `${diversityScore * 2.64} 264` }}
                transition={{ delay: 0.4, duration: 0.8, ease: "easeOut" }}
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center">
              <span className="text-3xl font-black text-white tabular-nums">{diversityScore}</span>
              <span className="text-[9px] text-white/30 font-semibold uppercase tracking-[0.12em]">
                Explorer Score
              </span>
            </div>
          </div>
        </motion.div>

        {/* Stats */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-3">
          {stats.map((stat, i) => (
            <motion.div
              key={stat.label}
              initial={{ opacity: 0, y: 6 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35 + i * 0.06 }}
            >
              <div className="text-xl font-black text-white tabular-nums">{stat.value}</div>
              <div className="text-[9px] text-white/25 font-semibold uppercase tracking-[0.12em] mt-0.5">{stat.label}</div>
            </motion.div>
          ))}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <p className="text-white/15 text-[10px]">
          {diversityScore >= 70
            ? "You're a true musical explorer"
            : diversityScore >= 40
            ? "Solid taste with room to explore"
            : "You know what you like"}
        </p>
      </motion.div>
    </StorySlide>
  );
}