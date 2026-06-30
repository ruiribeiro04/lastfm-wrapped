"use client";

import { motion } from "framer-motion";
import { type ReactNode, createContext, useContext } from "react";

// Context to pass total slides count
const SlideContext = createContext({ totalSlides: 10 });
export function useSlideTotal() {
  return useContext(SlideContext);
}

interface StorySlideProps {
  children: ReactNode;
  bg?: string;
  slideIndex?: number;
  totalSlides?: number;
}

export function StorySlide({ children, bg = "#111", slideIndex = 0, totalSlides = 12 }: StorySlideProps) {
  const progressPct = ((slideIndex + 1) / totalSlides) * 100;
  const slideLabel = `${String(slideIndex + 1).padStart(2, "0")}/${totalSlides}`;

  return (
    <SlideContext.Provider value={{ totalSlides }}>
      <motion.div
        initial={{ opacity: 0, scale: 0.98 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.98 }}
        transition={{ duration: 0.3, ease: "easeOut" }}
        className="relative w-full flex-shrink-0"
        style={{ aspectRatio: "9/16" }}
      >
        <div
          className="absolute inset-0 rounded-3xl overflow-hidden"
          style={{ backgroundColor: bg }}
        />
        {/* Paper grain texture */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none z-[60]"
          style={{
            opacity: 0.045,
            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
            mixBlendMode: "overlay",
          }}
        />
        {/* Subtle vignette for depth */}
        <div
          className="absolute inset-0 rounded-3xl pointer-events-none z-[58]"
          style={{
            background: "radial-gradient(ellipse at center, transparent 50%, rgba(0,0,0,0.35) 100%)",
          }}
        />
        {/* Top progress bar */}
        <div className="absolute top-0 left-0 right-0 z-[55] h-[2px] bg-white/10 rounded-t-3xl overflow-hidden">
          <div
            className="h-full rounded-full transition-all duration-500 ease-out"
            style={{ width: `${progressPct}%`, backgroundColor: "#d51007" }}
          />
        </div>
        {/* Slide counter bottom-right */}
        <div className="absolute bottom-3 right-4 z-[55]">
          <span className="text-[9px] font-medium text-white/15 tabular-nums">{slideLabel}</span>
        </div>
        <div className="relative z-10 h-full w-full flex flex-col p-6 sm:p-8">
          {children}
        </div>
      </motion.div>
    </SlideContext.Provider>
  );
}

// Reusable text components for story slides
export function StoryTitle({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <h2 className={`text-2xl sm:text-3xl font-black text-white tracking-tight leading-tight ${className}`}>
      {children}
    </h2>
  );
}

export function StoryBigNumber({ value, label, className = "" }: { value: string | number; label: string; className?: string }) {
  return (
    <div className={className}>
      <div className="text-5xl sm:text-7xl font-black text-white tracking-tighter leading-none tabular-nums">
        {value}
      </div>
      <div className="text-[10px] sm:text-xs font-semibold text-white/40 mt-2 uppercase tracking-[0.15em]">
        {label}
      </div>
    </div>
  );
}

export function StoryBadge({ children, className = "" }: { children: ReactNode; className?: string }) {
  return (
    <span className={`inline-flex items-center px-2.5 py-1 text-[10px] font-bold text-white/50 uppercase tracking-[0.12em] ${className}`}>
      {children}
    </span>
  );
}

export function LastFmLogo() {
  return (
    <div className="flex items-center gap-1.5">
      <svg viewBox="0 0 24 24" className="w-5 h-5 text-[#d51007] fill-current">
        <path d="M12.009 0C5.376 0 0 5.376 0 12.009c0 6.632 5.376 12.008 12.009 12.008 6.632 0 12.008-5.376 12.008-12.008C24.017 5.376 18.641 0 12.009 0zm4.548 17.273c-2.238 0-3.826-1.154-5.143-3.226l-1.004-1.681-1.003 1.681c-1.317 2.072-2.905 3.226-5.143 3.226-3.366 0-6.097-2.732-6.097-6.097s2.732-6.097 6.097-6.097c1.693 0 3.247.697 4.366 1.822l.782.785.782-.785a6.078 6.078 0 0 1 4.366-1.822c3.366 0 6.097 2.732 6.097 6.097s-2.732 6.097-6.097 6.097z" />
      </svg>
      <span className="text-sm font-black text-white/70 tracking-wide">PLAYBACK</span>
    </div>
  );
}

export function formatNumber(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

export function formatDuration(seconds: number): string {
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = seconds % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return `${m}m ${s}s`;
  return `${s}s`;
}

export function formatHours(h: number): string {
  if (h >= 24) {
    const days = Math.floor(h / 24);
    const hours = Math.round(h % 24);
    return `${days}d ${hours}h`;
  }
  return `${Math.round(h)}h`;
}