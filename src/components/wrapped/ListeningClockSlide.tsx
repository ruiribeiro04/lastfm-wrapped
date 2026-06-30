"use client";

import { motion } from "framer-motion";
import { StorySlide, StoryBadge, LastFmLogo } from "./StorySlide";
import { type WrappedData } from "@/store/wrapped";

interface ListeningClockSlideProps {
  data: WrappedData;
  slideIndex?: number;
}

function polarToCartesian(
  cx: number,
  cy: number,
  r: number,
  angleDeg: number
) {
  const rad = ((angleDeg - 90) * Math.PI) / 180;
  return {
    x: cx + r * Math.cos(rad),
    y: cy + r * Math.sin(rad),
  };
}

function describeArc(
  cx: number,
  cy: number,
  innerR: number,
  outerR: number,
  startAngle: number,
  endAngle: number
) {
  const startInner = polarToCartesian(cx, cy, innerR, startAngle);
  const endInner = polarToCartesian(cx, cy, innerR, endAngle);
  const startOuter = polarToCartesian(cx, cy, outerR, startAngle);
  const endOuter = polarToCartesian(cx, cy, outerR, endAngle);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;

  return [
    `M ${startInner.x} ${startInner.y}`,
    `L ${startOuter.x} ${startOuter.y}`,
    `A ${outerR} ${outerR} 0 ${largeArc} 1 ${endOuter.x} ${endOuter.y}`,
    `L ${endInner.x} ${endInner.y}`,
    `A ${innerR} ${innerR} 0 ${largeArc} 0 ${endInner.x} ${endInner.y}`,
    "Z",
  ].join(" ");
}

export function ListeningClockSlide({ data, slideIndex = 0 }: ListeningClockSlideProps) {
  const { hourlyDistribution, peakHour } = data.listeningPatterns;
  const periodLabel = data.overview.periodLabel;

  const maxCount = Math.max(...hourlyDistribution, 1);
  const peakHourStr = String(peakHour).padStart(2, "0") + ":00";

  const totalScrobbles = hourlyDistribution.reduce((a, b) => a + b, 0);
  const nightScrobbles = hourlyDistribution.slice(0, 6).reduce((a, b) => a + b, 0);
  const dayScrobbles = hourlyDistribution.slice(9, 18).reduce((a, b) => a + b, 0);
  const nightPct = totalScrobbles > 0 ? Math.round((nightScrobbles / totalScrobbles) * 100) : 0;
  const dayPct = totalScrobbles > 0 ? Math.round((dayScrobbles / totalScrobbles) * 100) : 0;

  // SVG dimensions
  const size = 280;
  const cx = size / 2;
  const cy = size / 2;
  const innerRadius = 40;
  const maxOuterRadius = 120;
  const minOuterRadius = 55;

  const tickHours = [0, 3, 6, 9, 12, 15, 18, 21];
  const labelHours = [0, 6, 12, 18];

  return (
    <StorySlide bg="#0e1010" slideIndex={slideIndex}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <LastFmLogo />
        <StoryBadge>Clock</StoryBadge>
      </div>

      {/* Clock Visualization */}
      <div className="flex-1 flex items-center justify-center">
        <svg
          width={size}
          height={size}
          viewBox={`0 0 ${size} ${size}`}
          className="block"
        >
          {/* Tick marks */}
          {tickHours.map((h) => {
            const angle = (h / 24) * 360;
            const p1 = polarToCartesian(cx, cy, maxOuterRadius + 6, angle);
            const p2 = polarToCartesian(cx, cy, maxOuterRadius + 14, angle);
            return (
              <line
                key={`tick-${h}`}
                x1={p1.x}
                y1={p1.y}
                x2={p2.x}
                y2={p2.y}
                stroke="rgba(255,255,255,0.25)"
                strokeWidth={1.5}
              />
            );
          })}

          {/* Hour labels */}
          {labelHours.map((h) => {
            const angle = (h / 24) * 360;
            const p = polarToCartesian(cx, cy, maxOuterRadius + 24, angle);
            return (
              <text
                key={`label-${h}`}
                x={p.x}
                y={p.y}
                textAnchor="middle"
                dominantBaseline="central"
                fill="rgba(255,255,255,0.35)"
                fontSize={8}
                fontFamily="system-ui, sans-serif"
                fontWeight={600}
              >
                {String(h).padStart(2, "0")}
              </text>
            );
          })}

          {/* Hour wedges */}
          {hourlyDistribution.map((count, i) => {
            const angle = (i / 24) * 360;
            const nextAngle = ((i + 1) / 24) * 360;
            const ratio = count / maxCount;
            const outerR = minOuterRadius + ratio * (maxOuterRadius - minOuterRadius);
            const isPeak = i === peakHour;
            const opacity = count === 0 ? 0.06 : 0.15 + ratio * 0.85;
            const color = isPeak ? "#d51007" : `rgba(255,255,255,${opacity})`;

            return (
              <motion.path
                key={`wedge-${i}`}
                d={describeArc(cx, cy, innerRadius, outerR, angle, nextAngle)}
                fill={color}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{
                  delay: i * 0.03,
                  duration: 0.4,
                  ease: "easeOut",
                }}
                style={{ transformOrigin: `${cx}px ${cy}px` }}
              />
            );
          })}

          {/* Center text */}
          <motion.g
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5, duration: 0.6 }}
          >
            <text
              x={cx}
              y={cy - 6}
              textAnchor="middle"
              dominantBaseline="central"
              fill="white"
              fontSize={26}
              fontWeight={900}
              fontFamily="system-ui, sans-serif"
              style={{ fontVariantNumeric: "tabular-nums" }}
            >
              {peakHourStr}
            </text>
            <text
              x={cx}
              y={cy + 16}
              textAnchor="middle"
              dominantBaseline="central"
              fill="rgba(255,255,255,0.35)"
              fontSize={8}
              fontWeight={700}
              fontFamily="system-ui, sans-serif"
              letterSpacing="0.15em"
              textTransform="uppercase"
            >
              PEAK
            </text>
          </motion.g>
        </svg>
      </div>

      {/* Stats Row */}
      <div className="flex items-stretch justify-between gap-3 py-4">
        <div className="flex-1">
          <div className="text-lg font-black text-white tabular-nums leading-none">
            {peakHourStr}
          </div>
          <div className="text-[10px] font-semibold text-white/35 mt-1.5 uppercase tracking-[0.15em]">
            Peak Hour
          </div>
        </div>
        <div className="w-px bg-white/10" />
        <div className="flex-1 text-right">
          <div className="text-lg font-black text-white tabular-nums leading-none">
            {nightPct}%
          </div>
          <div className="text-[10px] font-semibold text-white/35 mt-1.5 uppercase tracking-[0.15em]">
            Night Owl
          </div>
        </div>
        <div className="w-px bg-white/10" />
        <div className="flex-1 text-right">
          <div className="text-lg font-black text-white tabular-nums leading-none">
            {dayPct}%
          </div>
          <div className="text-[10px] font-semibold text-white/35 mt-1.5 uppercase tracking-[0.15em]">
            Day Listener
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="text-[15px] text-white/15 font-medium">{periodLabel}</div>
    </StorySlide>
  );
}