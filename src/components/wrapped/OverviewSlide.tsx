"use client";

import { StorySlide, StoryBadge, LastFmLogo, formatNumber, formatHours } from "./StorySlide";
import type { WrappedData } from "@/store/wrapped";
import { motion, useMotionValue, useTransform, animate } from "framer-motion";
import { useEffect, useRef } from "react";

/* Animated counter that counts up from 0 to target */
function AnimatedNumber({ value, format, delay = 0 }: { value: number; format: (n: number) => string; delay?: number }) {
  const motionVal = useMotionValue(0);
  const display = useTransform(motionVal, (v) => format(Math.round(v)));
  const ref = useRef<HTMLSpanElement>(null);
  const hasAnimated = useRef(false);

  useEffect(() => {
    if (hasAnimated.current) return;
    hasAnimated.current = true;
    const timer = setTimeout(() => {
      const controls = animate(motionVal, value, {
        duration: 1.2,
        ease: [0.16, 1, 0.3, 1],
      });
      return () => controls.stop();
    }, delay * 1000 + 350);
    return () => clearTimeout(timer);
  }, [value, motionVal, delay]);

  // Keep in sync with display value
  useEffect(() => {
    const unsubscribe = display.on("change", (v) => {
      if (ref.current) ref.current.textContent = v;
    });
    return unsubscribe;
  }, [display]);

  return (
    <span ref={ref} className="tabular-nums">
      {format(0)}
    </span>
  );
}

export function OverviewSlide({ data, slideIndex = 0 }: { data: WrappedData; slideIndex?: number }) {
  const { overview, diversity, listeningPatterns } = data;

  // Derive a listening personality label
  const personality = (() => {
    const hrs = overview.estimatedHoursListened;
    const avg = overview.averagePerDay;
    const top3Pct = data.topArtists.length >= 3
      ? data.topArtists.slice(0, 3).reduce((s, a) => s + a.percentage, 0) : 100;
    if (hrs > 500 && avg > 50) return "Obsessive Listener";
    if (top3Pct > 50) return "Loyal Fan";
    if (diversity.uniqueArtists > 300) return "Musical Explorer";
    if (listeningPatterns.midnightListener) return "Night Owl";
    if (listeningPatterns.weekendWarrior) return "Weekend Warrior";
    if (avg > 30) return "Dedicated Listener";
    if (diversity.uniqueArtists > 150) return "Curious Ear";
    return "Casual Listener";
  })();

  return (
    <StorySlide bg="#111" slideIndex={slideIndex}>
      {/* Header: logo left, badge right */}
      <div className="flex items-center justify-between mb-4">
        <LastFmLogo />
        <StoryBadge>{overview.periodLabel}</StoryBadge>
      </div>

      {/* Main content: left-aligned, asymmetric */}
      <div className="flex-1 flex flex-col justify-center">
        {/* Avatar + username, left-aligned */}
        <div className="flex items-center gap-4 mb-6">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 0.15, type: "spring", stiffness: 200 }}
          >
            {overview.avatar ? (
              <img
                src={overview.avatar}
                alt={overview.username}
                className="w-16 h-16 rounded-full border-2 border-white/15 object-cover"
              />
            ) : (
              <div className="w-16 h-16 rounded-full border-2 border-white/15 flex items-center justify-center text-xl font-black text-white/50 bg-white/5">
                {overview.username[0]?.toUpperCase()}
              </div>
            )}
          </motion.div>
          <motion.div
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
          >
            <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em]">Your half-year in music</p>
            <h1 className="text-2xl sm:text-3xl font-black text-white leading-tight mt-0.5">
              {overview.realname || overview.username}
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.3 }}
              className="text-[10px] font-bold uppercase tracking-[0.12em] mt-1"
              style={{ color: "#d51007" }}
            >
              {personality}
            </motion.p>
          </motion.div>
        </div>

        {/* 2x2 stat grid — with counting animation */}
        <div className="grid grid-cols-2 gap-x-6 gap-y-5 mb-6">
          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.35 }}
          >
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none">
              <AnimatedNumber value={overview.periodScrobbles} format={formatNumber} delay={0.35} />
            </div>
            <div className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em] mt-1.5">
              Scrobbles
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none">
              <AnimatedNumber value={overview.estimatedHoursListened} format={formatHours} delay={0.4} />
            </div>
            <div className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em] mt-1.5">
              Listened
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.45 }}
          >
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none">
              <AnimatedNumber value={overview.daysActive} format={(n) => n.toLocaleString()} delay={0.45} />
            </div>
            <div className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em] mt-1.5">
              Days Active
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 }}
          >
            <div className="text-4xl sm:text-5xl font-black text-white tracking-tighter leading-none">
              <AnimatedNumber value={overview.averagePerDay} format={(n) => n.toFixed(1)} delay={0.5} />
            </div>
            <div className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em] mt-1.5">
              Avg / Day
            </div>
          </motion.div>
        </div>
      </div>

      {/* Footer */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.65 }}
      >
        <p className="text-white/20 text-[10px] tabular-nums">
          {formatNumber(overview.totalScrobbles)} total scrobbles all time
        </p>
      </motion.div>
    </StorySlide>
  );
}