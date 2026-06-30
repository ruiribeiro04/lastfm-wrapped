"use client";

import { StorySlide, StoryBadge, LastFmLogo, formatNumber } from "./StorySlide";
import type { WrappedData } from "@/store/wrapped";
import { motion } from "framer-motion";

export function MonthlySlide({ data, slideIndex = 0 }: { data: WrappedData; slideIndex?: number }) {
  const { listeningPatterns, overview } = data;
  const { monthlyDistribution } = listeningPatterns;
  const maxMonthly = Math.max(...monthlyDistribution.map((m) => m.count), 1);
  const peakMonthIndex = monthlyDistribution.reduce(
    (maxI, m, i, arr) => (m.count > arr[maxI].count ? i : maxI),
    0
  );

  return (
    <StorySlide bg="#111" slideIndex={slideIndex}>
      <div className="flex items-center justify-between mb-2">
        <LastFmLogo />
        <StoryBadge>Timeline</StoryBadge>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-5">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em]">
            Your listening over time
          </p>
        </motion.div>

        {/* Monthly vertical bars */}
        <div className="flex items-end gap-2 h-44">
          {monthlyDistribution.map((month, i) => {
            const height = (month.count / maxMonthly) * 100;
            const isPeak = i === peakMonthIndex;
            return (
              <div
                key={month.month}
                className="flex-1 flex flex-col items-center h-full justify-end gap-1"
              >
                <motion.span
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 + i * 0.06 }}
                  className="text-[8px] font-bold tabular-nums"
                  style={{ color: isPeak ? "#d51007" : "rgba(255,255,255,0.3)" }}
                >
                  {formatNumber(month.count)}
                </motion.span>
                <motion.div
                  initial={{ height: 0 }}
                  animate={{ height: `${Math.max(height, 4)}%` }}
                  transition={{ delay: 0.15 + i * 0.06, duration: 0.4, ease: "easeOut" }}
                  className="w-full rounded-t-[2px]"
                  style={{
                    backgroundColor: isPeak ? "#d51007" : "rgba(255,255,255,0.2)",
                  }}
                />
              </div>
            );
          })}
        </div>

        {/* Month labels */}
        <div className="flex gap-2">
          {monthlyDistribution.map((month) => (
            <div key={month.month} className="flex-1 text-center">
              <span className="text-[8px] text-white/20 font-medium">
                {month.month.split(" ")[0]}
              </span>
            </div>
          ))}
        </div>

        {/* Summary stats */}
        <div className="grid grid-cols-2 gap-6">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            <div className="text-xl font-black text-white tabular-nums">
              {monthlyDistribution.length}
            </div>
            <div className="text-[9px] text-white/25 font-semibold uppercase tracking-[0.12em] mt-0.5">
              Active Months
            </div>
          </motion.div>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.65 }}
          >
            <div className="text-xl font-black text-white tabular-nums">
              {monthlyDistribution.length > 0
                ? formatNumber(Math.round(monthlyDistribution.reduce((s, m) => s + m.count, 0) / monthlyDistribution.length))
                : 0}
            </div>
            <div className="text-[9px] text-white/25 font-semibold uppercase tracking-[0.12em] mt-0.5">
              Avg Scrobbles / Month
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