"use client";

import { StorySlide, StoryBadge, LastFmLogo } from "./StorySlide";
import type { WrappedData } from "@/store/wrapped";
import { motion } from "framer-motion";

export function ListeningPatternsSlide({ data, slideIndex = 0 }: { data: WrappedData; slideIndex?: number }) {
  const { listeningPatterns, overview } = data;
  const { hourlyDistribution, dayOfWeekDistribution, peakHour, peakDay, longestStreak, busiestDay } =
    listeningPatterns;
  const maxHourly = Math.max(...hourlyDistribution, 1);
  const maxDow = Math.max(...dayOfWeekDistribution, 1);
  const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

  return (
    <StorySlide bg="#121210" slideIndex={slideIndex}>
      <div className="flex items-center justify-between mb-2">
        <LastFmLogo />
        <StoryBadge>Patterns</StoryBadge>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-6">
        {/* Hourly Distribution */}
        <div>
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em] mb-2">
            By hour
          </p>
          <div className="flex items-end gap-[2px] h-16">
            {hourlyDistribution.map((count, i) => {
              const height = (count / maxHourly) * 100;
              const isPeak = i === peakHour;
              return (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 4)}%` }}
                  transition={{ delay: 0.15 + i * 0.02, duration: 0.3, ease: "easeOut" }}
                  className="flex-1 rounded-[1px]"
                  style={{
                    backgroundColor: isPeak ? "#d51007" : "rgba(255,255,255,0.18)",
                  }}
                />
              );
            })}
          </div>
          <div className="flex justify-between mt-1">
            <span className="text-[8px] text-white/15 tabular-nums">0</span>
            <span className="text-[8px] text-white/15 tabular-nums">6</span>
            <span className="text-[8px] text-white/15 tabular-nums">12</span>
            <span className="text-[8px] text-white/15 tabular-nums">18</span>
            <span className="text-[8px] text-white/15 tabular-nums">23</span>
          </div>
          <p className="text-[10px] text-white/20 mt-1.5">
            Peak at <span className="text-[#d51007] font-bold tabular-nums">{peakHour}:00</span>
          </p>
        </div>

        {/* Day of Week */}
        <div>
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em] mb-2">
            By day
          </p>
          <div className="flex gap-1.5">
            {dayNames.map((day, i) => {
              const pct = (dayOfWeekDistribution[i] / maxDow) * 100;
              const isPeak = day === peakDay;
              return (
                <div key={day} className="flex-1 flex flex-col items-center gap-1">
                  <motion.div
                    initial={{ height: 0 }}
                    animate={{ height: `${Math.max(pct, 6)}%` }}
                    transition={{ delay: 0.4 + i * 0.04, duration: 0.3 }}
                    className="w-full rounded-[1px]"
                    style={{
                      backgroundColor: isPeak ? "#d51007" : "rgba(255,255,255,0.15)",
                      minHeight: "6px",
                    }}
                  />
                  <span
                    className="text-[8px] tabular-nums"
                    style={{ color: isPeak ? "#d51007" : "rgba(255,255,255,0.25)" }}
                  >
                    {day}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Streak + Busiest Day — two plain stats */}
        <div className="grid grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-2xl font-black text-white tabular-nums">
              {longestStreak}d
            </div>
            <div className="text-[9px] text-white/25 font-semibold uppercase tracking-[0.12em] mt-0.5">
              Longest Streak
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
          >
            <div className="text-2xl font-black text-white tabular-nums">
              {busiestDay.count}
            </div>
            <div className="text-[9px] text-white/25 font-semibold uppercase tracking-[0.12em] mt-0.5">
              Busiest Day
            </div>
          </motion.div>
        </div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.7 }}
      >
        <p className="text-white/15 text-[10px]">{overview.periodLabel}</p>
      </motion.div>
    </StorySlide>
  );
}