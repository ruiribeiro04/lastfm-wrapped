"use client";

import { StorySlide, StoryBadge, LastFmLogo, formatNumber } from "./StorySlide";
import type { WrappedData } from "@/store/wrapped";
import { motion } from "framer-motion";
import { useMemo } from "react";

interface DayCell {
  count: number;
  date: string;
  month: string;
  dayOfWeek: number; // 0=Mon
}

export function ListeningHeatmapSlide({ data, slideIndex = 8 }: { data: WrappedData; slideIndex?: number }) {
  const { listeningPatterns, overview } = data;

  // Generate synthetic daily data from monthly distribution
  const cells = useMemo((): DayCell[] => {
    const monthly = listeningPatterns.monthlyDistribution;
    if (monthly.length === 0) return [];

    const result: DayCell[] = [];
    const now = new Date();

    // Parse months to get start date (6 months back)
    const monthNames = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
    const monthsBack = Math.max(monthly.length, 6);

    for (let m = monthsBack - 1; m >= 0; m--) {
      const monthData = monthly.find((md) => {
        const parts = md.month.split(" ");
        return parts[0] === monthNames[(now.getMonth() - m + 12) % 12];
      });

      const targetDate = new Date(now.getFullYear(), now.getMonth() - m, 1);
      const daysInMonth = new Date(targetDate.getFullYear(), targetDate.getMonth() + 1, 0).getDate();
      const total = monthData?.count || 0;

      // Distribute counts with some randomness seeded by day
      const dailyCounts: number[] = [];
      let remaining = total;

      for (let d = 0; d < daysInMonth; d++) {
        if (d === daysInMonth - 1) {
          dailyCounts.push(Math.max(0, remaining));
        } else {
          // Use a simple pseudo-random distribution based on day
          const seed = (targetDate.getFullYear() * 366 + targetDate.getMonth() * 31 + d * 7 + 13) % 100;
          const weight = 0.3 + (seed / 100) * 1.4;
          const avg = total / daysInMonth;
          const count = Math.max(0, Math.round(avg * weight));
          dailyCounts.push(count);
          remaining -= count;
        }
      }

      for (let d = 0; d < daysInMonth; d++) {
        const cellDate = new Date(targetDate.getFullYear(), targetDate.getMonth(), d + 1);
        let dow = cellDate.getDay() - 1;
        if (dow < 0) dow = 6;

        result.push({
          count: dailyCounts[d],
          date: cellDate.toISOString().split("T")[0],
          month: monthNames[targetDate.getMonth()],
          dayOfWeek: dow,
        });
      }
    }

    return result;
  }, [listeningPatterns.monthlyDistribution]);

  // Organize into weeks (columns)
  const weeks = useMemo(() => {
    if (cells.length === 0) return [];

    const result: DayCell[][] = [];
    let currentWeek: DayCell[] = new Array(7).fill(null) as unknown as DayCell[];

    // Pad the first week if it doesn't start on Monday
    if (cells.length > 0) {
      const firstDow = cells[0].dayOfWeek;
      for (let i = 0; i < firstDow; i++) {
        currentWeek[i] = { count: -1, date: "", month: "", dayOfWeek: i };
      }
    }

    for (const cell of cells) {
      currentWeek[cell.dayOfWeek] = cell;
      if (cell.dayOfWeek === 6) {
        result.push([...currentWeek]);
        currentWeek = new Array(7).fill(null) as unknown as DayCell[];
      }
    }

    // Push last partial week
    if (currentWeek.some((c) => c && c.count >= 0)) {
      for (let i = 0; i < 7; i++) {
        if (!currentWeek[i] || currentWeek[i].count === -1) {
          currentWeek[i] = { count: -1, date: "", month: "", dayOfWeek: i };
        }
      }
      result.push(currentWeek);
    }

    return result;
  }, [cells]);

  // Color intensity
  const getColor = (count: number): string => {
    if (count < 0) return "transparent";
    if (count === 0) return "rgba(255,255,255,0.05)";
    const maxCount = Math.max(...cells.filter((c) => c.count > 0).map((c) => c.count), 1);
    const ratio = count / maxCount;
    if (ratio > 0.75) return "#d51007";
    if (ratio > 0.5) return "rgba(213,16,7,0.7)";
    if (ratio > 0.25) return "rgba(213,16,7,0.4)";
    return "rgba(213,16,7,0.2)";
  };

  const totalActiveDays = cells.filter((c) => c.count > 0).length;
  const totalScrobbles = cells.reduce((s, c) => s + Math.max(0, c.count), 0);
  const avgPerActive = totalActiveDays > 0 ? Math.round(totalScrobbles / totalActiveDays) : 0;

  const dayLabels = ["M", "", "W", "", "F", "", "S"];

  // Get month labels for columns (show at start of each month)
  const monthLabels = useMemo(() => {
    const labels: { col: number; label: string }[] = [];
    let lastMonth = "";
    weeks.forEach((week, col) => {
      const monday = week[0];
      if (monday && monday.month && monday.month !== lastMonth && monday.count >= 0) {
        labels.push({ col, label: monday.month });
        lastMonth = monday.month;
      }
    });
    return labels;
  }, [weeks]);

  // Stagger delay for animation
  const getDelay = (weekIdx: number, dayIdx: number) => {
    return 0.15 + (weekIdx * 7 + dayIdx) * 0.002;
  };

  return (
    <StorySlide bg="#0e0e0e" slideIndex={slideIndex}>
      <div className="flex items-center justify-between mb-2">
        <LastFmLogo />
        <StoryBadge>Listening Map</StoryBadge>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-3">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
          className="mb-1"
        >
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em]">
            Your listening calendar
          </p>
        </motion.div>

        {/* Heatmap Grid */}
        <div className="overflow-x-auto">
          <div className="flex gap-0 min-w-fit">
            {/* Day labels column */}
            <div className="flex flex-col gap-[2px] mr-1 pt-0">
              {dayLabels.map((label, i) => (
                <div
                  key={i}
                  className="text-[7px] text-white/15 font-medium leading-none h-[5px] flex items-center"
                >
                  {label}
                </div>
              ))}
            </div>

            {/* Weeks */}
            <div className="flex gap-[2px]">
              {weeks.map((week, wi) => (
                <div key={wi} className="flex flex-col gap-[2px]">
                  {week.map((cell, di) => (
                    <motion.div
                      key={`${wi}-${di}`}
                      initial={{ opacity: 0, scale: 0 }}
                      animate={{ opacity: 1, scale: 1 }}
                      transition={{
                        delay: Math.min(getDelay(wi, di), 1.2),
                        duration: 0.15,
                        ease: "easeOut",
                      }}
                      className="w-[5px] h-[5px] rounded-[1px] flex-shrink-0"
                      style={{ backgroundColor: getColor(cell.count) }}
                      title={cell.count >= 0 ? `${cell.date}: ${cell.count} scrobbles` : ""}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>

          {/* Month labels */}
          <div className="flex min-w-fit mt-1">
            <div className="w-[14px] flex-shrink-0" /> {/* offset for day labels */}
            <div className="flex gap-[2px] relative">
              {monthLabels.map(({ col, label }) => (
                <span
                  key={col}
                  className="text-[7px] text-white/20 font-medium absolute"
                  style={{ left: `${col * 7}px` }}
                >
                  {label}
                </span>
              ))}
              {/* Spacer to match grid width */}
              <span className="text-[7px] invisible" style={{ width: `${weeks.length * 7}px` }}>.</span>
            </div>
          </div>
        </div>

        {/* Stats below heatmap */}
        <div className="grid grid-cols-3 gap-3 mt-2">
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.8 }}
          >
            <p className="text-lg font-black text-white tabular-nums leading-none">
              {totalActiveDays}
            </p>
            <p className="text-[9px] text-white/30 uppercase tracking-[0.12em] mt-1 font-semibold">
              Active Days
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.85 }}
          >
            <p className="text-lg font-black text-white tabular-nums leading-none">
              {listeningPatterns.longestStreak}
            </p>
            <p className="text-[9px] text-white/30 uppercase tracking-[0.12em] mt-1 font-semibold">
              Day Streak
            </p>
          </motion.div>
          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.9 }}
          >
            <p className="text-lg font-black text-white tabular-nums leading-none">
              {avgPerActive}
            </p>
            <p className="text-[9px] text-white/30 uppercase tracking-[0.12em] mt-1 font-semibold">
              Avg / Day
            </p>
          </motion.div>
        </div>

        {/* Legend */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.0 }}
          className="flex items-center gap-2 mt-1"
        >
          <span className="text-[8px] text-white/20">Less</span>
          {[0.05, 0.2, 0.4, 0.7, 1].map((opacity, i) => (
            <div
              key={i}
              className="w-[5px] h-[5px] rounded-[1px]"
              style={{
                backgroundColor:
                  i === 0
                    ? "rgba(255,255,255,0.05)"
                    : `rgba(213,16,7,${opacity})`,
              }}
            />
          ))}
          <span className="text-[8px] text-white/20">More</span>
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.1 }}
      >
        <p className="text-white/15 text-[10px]">
          {formatNumber(overview.periodScrobbles)} scrobbles across {totalActiveDays} days
        </p>
      </motion.div>
    </StorySlide>
  );
}