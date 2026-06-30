"use client";

import { StorySlide, StoryBadge, LastFmLogo, formatNumber } from "./StorySlide";
import type { WrappedData } from "@/store/wrapped";
import { motion } from "framer-motion";
import { useMemo } from "react";

/* Compute a music personality/mood profile from the data */
interface Trait {
  name: string;
  value: number; // 0-100
  icon: string;
  description: string;
}

function computeTraits(data: WrappedData): Trait[] {
  const { overview, topArtists, topTags, listeningPatterns, diversity, funFacts } = data;
  const traits: Trait[] = [];

  // 1. Devotion — based on top artist concentration
  const top1Pct = topArtists[0]?.percentage || 0;
  traits.push({
    name: "Devotion",
    value: Math.min(100, Math.round(top1Pct * 3.5)),
    icon: "♥",
    description: top1Pct > 15 ? "You stick with your favorites" : "You spread the love around",
  });

  // 2. Night Owl — based on midnight listening
  const nightHours = listeningPatterns.hourlyDistribution.slice(0, 6);
  const totalH = listeningPatterns.hourlyDistribution.reduce((s, v) => s + v, 0) || 1;
  const nightPct = (nightHours.reduce((s, v) => s + v, 0) / totalH) * 100;
  traits.push({
    name: "Night Owl",
    value: Math.min(100, Math.round(nightPct * 4)),
    icon: "☾",
    description: nightPct > 20 ? "The night is when you truly listen" : "Mostly a daytime listener",
  });

  // 3. Explorer — based on unique artists vs total scrobbles
  const explorerRatio = (diversity.uniqueArtists / Math.max(overview.periodScrobbles, 1)) * 100;
  traits.push({
    name: "Explorer",
    value: Math.min(100, Math.round(explorerRatio * 2.5)),
    icon: "◇",
    description: diversity.uniqueArtists > 200 ? "Always discovering something new" : "You know what you like",
  });

  // 4. Obsession — based on average per day
  const avgDay = overview.averagePerDay;
  traits.push({
    name: "Intensity",
    value: Math.min(100, Math.round(avgDay * 1.5)),
    icon: "⚡",
    description: avgDay > 40 ? "Music runs through your veins" : "A healthy relationship with music",
  });

  // 5. Consistency — based on longest streak vs days in period
  const periodDays = overview.daysActive || 1;
  const streakRatio = (listeningPatterns.longestStreak / periodDays) * 100;
  traits.push({
    name: "Consistency",
    value: Math.min(100, Math.round(streakRatio * 1.8)),
    icon: "◎",
    description: streakRatio > 60 ? "You never skip a beat" : "Listening in bursts",
  });

  // 6. Eclectic — based on genre count
  const genreScore = Math.min(100, diversity.genreCount * 2.5);
  traits.push({
    name: "Eclectic",
    value: Math.round(genreScore),
    icon: "◈",
    description: diversity.genreCount > 20 ? "Your taste spans every corner" : "Focused genre preferences",
  });

  return traits;
}

function getPersonalityType(traits: Trait[]): { type: string; sub: string } {
  const top = [...traits].sort((a, b) => b.value - a.value);
  const primary = top[0]?.name || "Listener";
  const secondary = top[1]?.name || "";

  const combos: Record<string, { type: string; sub: string }> = {
    "Devotion-Explorer": { type: "The Passionate Wanderer", sub: "Deeply loyal yet always curious" },
    "Devotion-Night Owl": { type: "The Midnight Devotee", sub: "Late-night sessions with your favorites" },
    "Devotion-Intensity": { type: "The Sonic Addict", sub: "Can't stop, won't stop" },
    "Devotion-Consistency": { type: "The Faithful Listener", sub: "Day in, day out, same favorites" },
    "Devotion-Eclectic": { type: "The Open-Minded Fan", sub: "Deep cuts across many genres" },
    "Night Owl-Explorer": { type: "The Nocturnal Discoverer", sub: "Exploring new sounds after dark" },
    "Night Owl-Intensity": { type: "The Night Rider", sub: "Burning the midnight oil with music" },
    "Night Owl-Consistency": { type: "The Night Shift", sub: "Your playlist doesn't have a bedtime" },
    "Night Owl-Eclectic": { type: "The Dream Surfer", sub: "Genre-hopping through the night" },
    "Explorer-Intensity": { type: "The Music Hunter", sub: "Relentlessly chasing new sounds" },
    "Explorer-Consistency": { type: "The Curious Habit", sub: "A daily ritual of discovery" },
    "Explorer-Eclectic": { type: "The Sonic Nomad", sub: "No genre is off-limits" },
    "Intensity-Consistency": { type: "The Machine", sub: "Relentless, day after day" },
    "Intensity-Eclectic": { type: "The Creative Force", sub: "High volume, maximum variety" },
    "Consistency-Eclectic": { type: "The Steady Explorer", sub: "Broad tastes, reliable habits" },
  };

  const key = `${primary}-${secondary}`;
  if (combos[key]) return combos[key];

  const soloTypes: Record<string, { type: string; sub: string }> = {
    Devotion: { type: "The Loyalist", sub: "Your favorites are forever" },
    "Night Owl": { type: "The Night Prowler", sub: "Music sounds better after dark" },
    Explorer: { type: "The Pioneer", sub: "Always looking for the next great track" },
    Intensity: { type: "The Power Listener", sub: "Volume up, world out" },
    Consistency: { type: "The Anchor", sub: "Music is part of your daily rhythm" },
    Eclectic: { type: "The Kaleidoscope", sub: "Every color of sound" },
  };

  return soloTypes[primary] || { type: "The Listener", sub: "Music is your companion" };
}

export function MusicPersonalitySlide({ data, slideIndex = 0 }: { data: WrappedData; slideIndex?: number }) {
  const traits = useMemo(() => computeTraits(data), [data]);
  const personality = useMemo(() => getPersonalityType(traits), [traits]);

  const maxTrait = Math.max(...traits.map((t) => t.value));

  return (
    <StorySlide bg="#100e0e" slideIndex={slideIndex}>
      <div className="flex items-center justify-between mb-2">
        <LastFmLogo />
        <StoryBadge>Music Personality</StoryBadge>
      </div>

      <div className="flex-1 flex flex-col justify-center gap-4">
        {/* Personality type */}
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="text-center mb-2"
        >
          <p className="text-[10px] text-white/30 font-semibold uppercase tracking-[0.15em] mb-2">
            Your listening profile
          </p>
          <h2
            className="text-2xl sm:text-3xl font-black tracking-tight leading-tight"
            style={{ color: "#d51007" }}
          >
            {personality.type}
          </h2>
          <p className="text-xs text-white/40 mt-1.5 italic">{personality.sub}</p>
        </motion.div>

        {/* Trait bars */}
        <div className="flex flex-col gap-2.5">
          {traits.map((trait, i) => {
            const pct = (trait.value / 100) * 100;
            const barPct = (trait.value / Math.max(maxTrait, 1)) * 100;
            return (
              <motion.div
                key={trait.name}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.2 + i * 0.06 }}
              >
                <div className="flex items-center gap-2 mb-1">
                  <span className="text-sm w-5 text-center opacity-50">{trait.icon}</span>
                  <span className="text-[11px] font-bold text-white/70 flex-1">
                    {trait.name}
                  </span>
                  <span className="text-[10px] font-bold tabular-nums text-white/40">
                    {trait.value}
                  </span>
                </div>
                <div className="ml-7 h-[3px] bg-white/[0.06] rounded-sm overflow-hidden">
                  <motion.div
                    initial={{ width: 0 }}
                    animate={{ width: `${barPct}%` }}
                    transition={{ delay: 0.3 + i * 0.06, duration: 0.5, ease: "easeOut" }}
                    className="h-full rounded-sm"
                    style={{
                      backgroundColor:
                        i === 0
                          ? "#d51007"
                          : `rgba(213,16,7,${Math.max(0.2, 1 - i * 0.15)})`,
                    }}
                  />
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Description chips for top 2 traits */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.7 }}
          className="flex flex-col gap-1.5 mt-1"
        >
          {[...traits].sort((a, b) => b.value - a.value).slice(0, 2).map((trait) => (
            <div
              key={trait.name}
              className="border-l-2 border-[#d51007] pl-2.5 py-0.5"
            >
              <p className="text-[10px] text-white/30 leading-relaxed">
                {trait.description}
              </p>
            </div>
          ))}
        </motion.div>
      </div>

      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.9 }}
      >
        <p className="text-white/15 text-[10px]">
          Based on {formatNumber(data.diversity.uniqueArtists)} artists and {data.diversity.genreCount} genres
        </p>
      </motion.div>
    </StorySlide>
  );
}