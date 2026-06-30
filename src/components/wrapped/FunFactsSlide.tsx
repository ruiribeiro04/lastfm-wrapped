"use client";

import { StorySlide, StoryBadge, LastFmLogo, formatDuration } from "./StorySlide";
import type { WrappedData } from "@/store/wrapped";
import { motion } from "framer-motion";

export function FunFactsSlide({ data, slideIndex = 0 }: { data: WrappedData; slideIndex?: number }) {
  const { funFacts } = data;

  const facts: Array<{
    label: string;
    value: string;
    sub?: string;
    date?: string;
  }> = [
    {
      label: "First Scrobble",
      value: funFacts.firstTrack.name !== "N/A" ? funFacts.firstTrack.name : "N/A",
      sub: funFacts.firstTrack.artist !== "N/A" ? `by ${funFacts.firstTrack.artist}` : "",
      date: funFacts.firstTrack.date !== "N/A" ? funFacts.firstTrack.date : "",
    },
    {
      label: "Last Scrobble",
      value: funFacts.lastTrack.name !== "N/A" ? funFacts.lastTrack.name : "N/A",
      sub: funFacts.lastTrack.artist !== "N/A" ? `by ${funFacts.lastTrack.artist}` : "",
      date: funFacts.lastTrack.date !== "N/A" ? funFacts.lastTrack.date : "",
    },
    {
      label: "Avg Track Length",
      value: formatDuration(funFacts.averageTrackDuration),
      sub: "your average listen",
    },
    {
      label: "Night Owl",
      value: funFacts.midnightListener ? "Yes" : "No",
      sub: funFacts.midnightListener
        ? ">10% scrobbles after midnight"
        : "You sleep before midnight",
    },
  ];

  return (
    <StorySlide bg="#0f0d0d" slideIndex={slideIndex}>
      <div className="flex items-center justify-between mb-2">
        <LastFmLogo />
        <StoryBadge>Fun Facts</StoryBadge>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-1"
        >
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em]">
            Quirky details about you
          </p>
        </motion.div>

        {/* Facts with left border accent */}
        <div className="flex flex-col gap-2.5">
          {facts.map((fact, i) => (
            <motion.div
              key={fact.label}
              initial={{ opacity: 0, x: -8 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.15 + i * 0.07 }}
              className="border-l-2 border-[#d51007] pl-3 py-1"
            >
              <p className="text-[9px] text-white/30 font-semibold uppercase tracking-[0.12em]">
                {fact.label}
              </p>
              <p className="text-[13px] font-bold text-white truncate mt-0.5 leading-tight">
                {fact.value}
              </p>
              {fact.sub && (
                <p className="text-[10px] text-white/30 truncate mt-0.5">
                  {fact.sub}
                </p>
              )}
              {fact.date && (
                <p className="text-[9px] text-white/15 mt-0.5 tabular-nums">{fact.date}</p>
              )}
            </motion.div>
          ))}
        </div>

        {/* Longest / Shortest row */}
        <div className="grid grid-cols-2 gap-3 mt-2">
          {funFacts.longestTrack.name !== "N/A" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="border-l-2 border-white/15 pl-3 py-1"
            >
              <p className="text-[9px] text-white/30 font-semibold uppercase tracking-[0.12em]">
                Longest Track
              </p>
              <p className="text-[11px] font-bold text-white truncate mt-0.5 leading-tight">
                {funFacts.longestTrack.name}
              </p>
              <p className="text-[10px] text-white/25 truncate">
                {funFacts.longestTrack.artist}
              </p>
              <p className="text-[9px] text-white/15 mt-0.5 tabular-nums">
                {formatDuration(funFacts.longestTrack.duration)}
              </p>
            </motion.div>
          )}
          {funFacts.shortestTrack.name !== "N/A" && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.55 }}
              className="border-l-2 border-white/15 pl-3 py-1"
            >
              <p className="text-[9px] text-white/30 font-semibold uppercase tracking-[0.12em]">
                Shortest Track
              </p>
              <p className="text-[11px] font-bold text-white truncate mt-0.5 leading-tight">
                {funFacts.shortestTrack.name}
              </p>
              <p className="text-[10px] text-white/25 truncate">
                {funFacts.shortestTrack.artist}
              </p>
              <p className="text-[9px] text-white/15 mt-0.5 tabular-nums">
                {formatDuration(funFacts.shortestTrack.duration)}
              </p>
            </motion.div>
          )}
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <p className="text-white/15 text-[10px]">
          {funFacts.weekendWarrior ? "Weekend Warrior detected" : "Consistent weekday listener"}
        </p>
      </motion.div>
    </StorySlide>
  );
}