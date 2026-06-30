"use client";

import { useState, useCallback, useEffect, useRef } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ChevronLeft, ChevronRight, Download, Play, Pause, Images, Keyboard, X } from "lucide-react";
import { type WrappedData } from "@/store/wrapped";
import { OverviewSlide } from "./OverviewSlide";
import { TopArtistsSlide } from "./TopArtistsSlide";
import { TopAlbumsSlide } from "./TopAlbumsSlide";
import { TopTagsSlide } from "./TopTagsSlide";
import { TopTracksSlide } from "./TopTracksSlide";
import { ListeningClockSlide } from "./ListeningClockSlide";
import { ListeningPatternsSlide } from "./ListeningPatternsSlide";
import { DiversitySlide } from "./DiversitySlide";
import { FunFactsSlide } from "./FunFactsSlide";
import { MonthlySlide } from "./MonthlySlide";
import { ListeningHeatmapSlide } from "./ListeningHeatmapSlide";
import { MusicPersonalitySlide } from "./MusicPersonalitySlide";
import { SlideErrorBoundary } from "./SlideErrorBoundary";

const SLIDE_NAMES = [
  "Overview",
  "Top Artists",
  "Top Albums",
  "Genres & Tags",
  "Top Tracks",
  "Listening Clock",
  "Listening Patterns",
  "Monthly Timeline",
  "Listening Map",
  "Music Personality",
  "Diversity",
  "Fun Facts",
];

const TOTAL_SLIDES = SLIDE_NAMES.length;
const AUTO_PLAY_INTERVAL = 4000;

export function StoryCarousel({ data }: { data: WrappedData }) {
  const [current, setCurrent] = useState(0);
  const [direction, setDirection] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef(0);

  const [downloading, setDownloading] = useState(false);
  const [downloadingAll, setDownloadingAll] = useState(false);
  const [autoPlay, setAutoPlay] = useState(false);
  const [autoPlayProgress, setAutoPlayProgress] = useState(0);
  const [showShortcuts, setShowShortcuts] = useState(false);
  const isPausedRef = useRef(false);
  const autoPlayTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const progressTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const slides = [
    <SlideErrorBoundary key="overview" slideName="Overview" slideIndex={0}>
      <OverviewSlide key="overview" data={data} slideIndex={0} />
    </SlideErrorBoundary>,
    <SlideErrorBoundary key="artists" slideName="Top Artists" slideIndex={1}>
      <TopArtistsSlide key="artists" data={data} slideIndex={1} />
    </SlideErrorBoundary>,
    <SlideErrorBoundary key="albums" slideName="Top Albums" slideIndex={2}>
      <TopAlbumsSlide key="albums" data={data} slideIndex={2} />
    </SlideErrorBoundary>,
    <SlideErrorBoundary key="tags" slideName="Genres & Tags" slideIndex={3}>
      <TopTagsSlide key="tags" data={data} slideIndex={3} />
    </SlideErrorBoundary>,
    <SlideErrorBoundary key="tracks" slideName="Top Tracks" slideIndex={4}>
      <TopTracksSlide key="tracks" data={data} slideIndex={4} />
    </SlideErrorBoundary>,
    <SlideErrorBoundary key="clock" slideName="Listening Clock" slideIndex={5}>
      <ListeningClockSlide key="clock" data={data} slideIndex={5} />
    </SlideErrorBoundary>,
    <SlideErrorBoundary key="patterns" slideName="Listening Patterns" slideIndex={6}>
      <ListeningPatternsSlide key="patterns" data={data} slideIndex={6} />
    </SlideErrorBoundary>,
    <SlideErrorBoundary key="monthly" slideName="Monthly Timeline" slideIndex={7}>
      <MonthlySlide key="monthly" data={data} slideIndex={7} />
    </SlideErrorBoundary>,
    <SlideErrorBoundary key="heatmap" slideName="Listening Map" slideIndex={8}>
      <ListeningHeatmapSlide key="heatmap" data={data} slideIndex={8} />
    </SlideErrorBoundary>,
    <SlideErrorBoundary key="personality" slideName="Music Personality" slideIndex={9}>
      <MusicPersonalitySlide key="personality" data={data} slideIndex={9} />
    </SlideErrorBoundary>,
    <SlideErrorBoundary key="diversity" slideName="Diversity" slideIndex={10}>
      <DiversitySlide key="diversity" data={data} slideIndex={10} />
    </SlideErrorBoundary>,
    <SlideErrorBoundary key="facts" slideName="Fun Facts" slideIndex={11}>
      <FunFactsSlide key="facts" data={data} slideIndex={11} />
    </SlideErrorBoundary>,
  ];

  const goTo = useCallback(
    (index: number) => {
      if (index < 0 || index >= TOTAL_SLIDES) return;
      setDirection(index > current ? 1 : -1);
      setCurrent(index);
      setAutoPlayProgress(0);
    },
    [current]
  );

  const goNext = useCallback(() => goTo(current + 1), [current, goTo]);
  const goPrev = useCallback(() => goTo(current - 1), [current, goTo]);

  // Auto-play logic
  useEffect(() => {
    if (autoPlay && !isPausedRef.current) {
      setAutoPlayProgress(0);
      const step = 50;
      progressTimerRef.current = setInterval(() => {
        setAutoPlayProgress((p) => {
          const next = p + step;
          if (next >= AUTO_PLAY_INTERVAL) return AUTO_PLAY_INTERVAL;
          return next;
        });
      }, step);

      autoPlayTimerRef.current = setTimeout(() => {
        if (current < TOTAL_SLIDES - 1) {
          goNext();
        } else {
          setAutoPlay(false);
        }
      }, AUTO_PLAY_INTERVAL);
    }

    return () => {
      if (autoPlayTimerRef.current) clearTimeout(autoPlayTimerRef.current);
      if (progressTimerRef.current) clearInterval(progressTimerRef.current);
    };
  }, [autoPlay, current, goNext]);

  const handleMouseEnter = useCallback(() => { isPausedRef.current = true; }, []);
  const handleMouseLeave = useCallback(() => { isPausedRef.current = false; }, []);

  const toggleAutoPlay = useCallback(() => {
    setAutoPlay((prev) => !prev);
    setAutoPlayProgress(0);
  }, []);

  const handleDownloadSlide = useCallback(async () => {
    if (!containerRef.current) return;
    setDownloading(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(containerRef.current, {
        pixelRatio: 3,
        backgroundColor: "#111111",
      });
      const link = document.createElement("a");
      link.download = `playback-${SLIDE_NAMES[current].toLowerCase().replace(/\s+/g, "-")}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Slide export failed", err);
    } finally {
      setDownloading(false);
    }
  }, [current]);

  // Export all slides as individual PNGs
  const handleDownloadAll = useCallback(async () => {
    setDownloadingAll(true);
    setAutoPlay(false);
    try {
      const { toPng } = await import("html-to-image");

      for (let i = 0; i < TOTAL_SLIDES; i++) {
        // Navigate to each slide and wait for render
        goTo(i);
        await new Promise((r) => setTimeout(r, 800));

        const el = containerRef.current?.querySelector("[style*='aspect-ratio'], .absolute.inset-0 > div") as HTMLElement
          || containerRef.current?.firstElementChild as HTMLElement;
        if (!el) continue;

        try {
          const dataUrl = await toPng(el, {
            pixelRatio: 3,
            backgroundColor: "#111111",
          });
          const link = document.createElement("a");
          link.download = `playback-${String(i + 1).padStart(2, "0")}-${SLIDE_NAMES[i].toLowerCase().replace(/\s+/g, "-")}.png`;
          link.href = dataUrl;
          link.click();
          // Small delay between downloads
          await new Promise((r) => setTimeout(r, 300));
        } catch {
          console.warn(`Failed to export slide ${i + 1}: ${SLIDE_NAMES[i]}`);
        }
      }
    } finally {
      setDownloadingAll(false);
    }
  }, [goTo]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") {
        setAutoPlay(false);
        goNext();
      }
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") {
        setAutoPlay(false);
        goPrev();
      }
      if (e.key === " ") {
        e.preventDefault();
        toggleAutoPlay();
      }
      if (e.key === "?" || (e.key === "/" && e.shiftKey)) {
        e.preventDefault();
        setShowShortcuts((prev) => !prev);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [goNext, goPrev, toggleAutoPlay]);

  // Touch handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    const diff = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(diff) > 50) {
      setAutoPlay(false);
      if (diff > 0) goNext();
      else goPrev();
    }
  };

  const variants = {
    enter: (dir: number) => ({
      x: dir > 0 ? 300 : -300,
      opacity: 0,
    }),
    center: {
      x: 0,
      opacity: 1,
    },
    exit: (dir: number) => ({
      x: dir > 0 ? -300 : 300,
      opacity: 0,
    }),
  };

  const autoPlayPct = (autoPlayProgress / AUTO_PLAY_INTERVAL) * 100;

  return (
    <div className="flex flex-col items-center gap-4 w-full max-w-md mx-auto">
      {/* Progress Indicators */}
      <div className="flex gap-1 w-full max-w-xs justify-center">
        {SLIDE_NAMES.map((name, i) => (
          <button
            key={i}
            onClick={() => {
              setAutoPlay(false);
              goTo(i);
            }}
            className={`h-1 rounded-full transition-all duration-300 ${
              i === current
                ? "w-8 bg-white shadow-[0_0_6px_rgba(255,255,255,0.3)]"
                : i < current
                ? "w-2 bg-white/40"
                : "w-2 bg-white/15"
            }`}
            aria-label={`Go to slide ${i + 1}: ${name}`}
            title={name}
          />
        ))}
      </div>

      {/* Overall progress bar */}
      <div className="w-full max-w-[calc(min(85vh,780px)*9/16)] h-[2px] bg-white/5 rounded-full overflow-hidden">
        <motion.div
          className="h-full rounded-full"
          style={{ backgroundColor: "#d51007" }}
          animate={{ width: `${((current + 1) / TOTAL_SLIDES) * 100}%` }}
          transition={{ duration: 0.4, ease: "easeOut" }}
        />
      </div>

      {/* Story Container */}
      <div
        ref={containerRef}
        className="relative w-full overflow-hidden rounded-3xl"
        style={{ aspectRatio: "9/16", maxHeight: "min(85vh, 780px)" }}
        onTouchStart={handleTouchStart}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
      >
        {/* Auto-play progress bar at top of slide */}
        {autoPlay && (
          <div className="absolute top-0 left-0 right-0 z-30 h-[2px] bg-white/10">
            <motion.div
              className="h-full rounded-full"
              style={{ backgroundColor: "#d51007" }}
              animate={{ width: `${autoPlayPct}%` }}
              transition={{ duration: 0.05, ease: "linear" }}
            />
          </div>
        )}

        <AnimatePresence initial={false} custom={direction} mode="popLayout">
          <motion.div
            key={current}
            custom={direction}
            variants={variants}
            initial="enter"
            animate="center"
            exit="exit"
            transition={{
              type: "spring",
              stiffness: 300,
              damping: 30,
            }}
            className="absolute inset-0"
          >
            {slides[current]}
          </motion.div>
        </AnimatePresence>

        {/* Navigation Arrows */}
        {current > 0 && (
          <button
            onClick={() => {
              setAutoPlay(false);
              goPrev();
            }}
            className="absolute left-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Previous slide"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        )}
        {current < TOTAL_SLIDES - 1 && (
          <button
            onClick={() => {
              setAutoPlay(false);
              goNext();
            }}
            className="absolute right-2 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-black/30 backdrop-blur-sm flex items-center justify-center text-white/70 hover:text-white hover:bg-black/50 transition-all duration-200 hover:scale-105 active:scale-95"
            aria-label="Next slide"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        )}
      </div>

      {/* Slide Name + Controls */}
      <div className="flex items-center justify-between w-full max-w-xs">
        <span className="text-xs text-white/40">
          {current + 1}/{TOTAL_SLIDES} — {SLIDE_NAMES[current]}
        </span>
        <div className="flex items-center gap-1.5">
          <button
            onClick={() => setShowShortcuts((prev) => !prev)}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-white/20 hover:text-white/50 hover:bg-white/5 transition-all duration-200"
            aria-label="Keyboard shortcuts"
          >
            <Keyboard className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={toggleAutoPlay}
            className={`flex items-center gap-1 px-2 py-1 rounded-md transition-all duration-200 ${
              autoPlay
                ? "text-[#d51007] bg-[#d51007]/10"
                : "text-white/30 hover:text-white/60 hover:bg-white/5"
            }`}
            aria-label={autoPlay ? "Pause auto-play" : "Start auto-play"}
          >
            {autoPlay ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <button
            onClick={handleDownloadSlide}
            disabled={downloading}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-200 disabled:opacity-40"
            aria-label="Download current slide"
          >
            <Download className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={handleDownloadAll}
            disabled={downloadingAll}
            className="flex items-center gap-1 px-2 py-1 rounded-md text-white/30 hover:text-white/60 hover:bg-white/5 transition-all duration-200 disabled:opacity-40"
            aria-label="Download all slides"
            title="Download all slides"
          >
            <Images className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Download all progress indicator */}
      {downloadingAll && (
        <motion.div
          initial={{ opacity: 0, y: 4 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 4 }}
          className="flex items-center gap-2 text-[10px] text-white/40"
        >
          <div className="w-3 h-3 border-2 border-white/20 border-t-[#d51007] rounded-full animate-spin" />
          Exporting slides...
        </motion.div>
      )}

      {/* Keyboard Shortcuts Overlay */}
      <AnimatePresence>
        {showShortcuts && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm"
            onClick={() => setShowShortcuts(false)}
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="bg-[#141414] border border-white/10 rounded-2xl p-6 max-w-xs w-full mx-4 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-sm font-bold text-white">Keyboard Shortcuts</h3>
                <button
                  onClick={() => setShowShortcuts(false)}
                  className="text-white/30 hover:text-white/60 transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="flex flex-col gap-2.5">
                {[
                  { keys: ["←", "→"], desc: "Previous / Next slide" },
                  { keys: ["↑", "↓"], desc: "Previous / Next slide" },
                  { keys: ["Space"], desc: "Toggle auto-play" },
                  { keys: ["?"], desc: "Show shortcuts" },
                  { keys: ["Swipe"], desc: "Navigate (touch devices)" },
                ].map((item) => (
                  <div key={item.desc} className="flex items-center justify-between">
                    <span className="text-xs text-white/50">{item.desc}</span>
                    <div className="flex gap-1">
                      {item.keys.map((key) => (
                        <kbd
                          key={key}
                          className="px-2 py-0.5 rounded bg-white/5 border border-white/10 text-[10px] text-white/60 font-mono"
                        >
                          {key}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
              <p className="text-[9px] text-white/20 mt-4 text-center">
                Auto-play pauses on hover
              </p>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}