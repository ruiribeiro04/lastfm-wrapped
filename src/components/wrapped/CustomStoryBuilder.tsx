"use client";

import { useState, useRef, useCallback, useEffect } from "react";
import {
  Download,
  RotateCcw,
  Palette,
  Eye,
  EyeOff,
  Type,
  Grid3x3,
  ZoomIn,
  ZoomOut,
  Plus,
  Trash2,
  Magnet,
  Move,
  X,
} from "lucide-react";
import type { WrappedData } from "@/store/wrapped";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";

// =============================================================================
// Helpers
// =============================================================================

function fmt(n: number): string {
  if (n >= 1000000) return (n / 1000000).toFixed(1) + "M";
  if (n >= 1000) return (n / 1000).toFixed(1) + "K";
  return n.toLocaleString();
}

function fmtH(h: number): string {
  if (h >= 24) return `${Math.floor(h / 24)}d ${Math.round(h % 24)}h`;
  return `${Math.round(h)}h`;
}

function clamp(val: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, val));
}

// =============================================================================
// Types
// =============================================================================

type ResizeHandle = "nw" | "n" | "ne" | "e" | "se" | "s" | "sw" | "w";

interface CanvasElement {
  id: string;
  type: string;
  label: string;
  x: number;
  y: number;
  width: number;
  height: number;
  visible: boolean;
  text?: string;
}

interface DragState {
  mode: "move" | "resize";
  elementId: string;
  startMouseX: number;
  startMouseY: number;
  startX: number;
  startY: number;
  startW: number;
  startH: number;
  handle?: ResizeHandle;
}

interface CustomStoryProps {
  data: WrappedData;
  username?: string;
}

// =============================================================================
// Constants
// =============================================================================

const PALETTE_OPTIONS = [
  { name: "Safety Yellow", value: "#FFD600" },
  { name: "Lipstick Red", value: "#E8364F" },
  { name: "Electric Teal", value: "#00C9A7" },
  { name: "Burnt Orange", value: "#FF6B35" },
  { name: "Hot Pink", value: "#FF2D78" },
  { name: "Acid Green", value: "#BFFF00" },
  { name: "Cyan", value: "#00E5FF" },
  { name: "Cream", value: "#FFF8E1" },
];

const BG_OPTIONS = [
  { name: "Charcoal", value: "#111111" },
  { name: "Near Black", value: "#0A0A0A" },
  { name: "Deep Navy", value: "#0D1B2A" },
  { name: "Dark Green", value: "#0D1F12" },
  { name: "Dark Brown", value: "#1A1008" },
  { name: "Off White", value: "#F5F0E8" },
  { name: "Warm Gray", value: "#2A2622" },
  { name: "Pure Black", value: "#000000" },
];

const THEME_PRESETS = [
  { name: "Zine", bg: "#111111", accent: "#FFD600", icon: "Z" },
  { name: "Vinyl", bg: "#0A0A0A", accent: "#E8364F", icon: "V" },
  { name: "Forest", bg: "#0D1F12", accent: "#00C9A7", icon: "F" },
  { name: "Sunset", bg: "#1A1008", accent: "#FF6B35", icon: "S" },
  { name: "Neon", bg: "#000000", accent: "#BFFF00", icon: "N" },
  { name: "Paper", bg: "#F5F0E8", accent: "#D51007", icon: "P" },
];

function getDefaultElements(): CanvasElement[] {
  return [
    {
      id: "header",
      type: "header",
      label: "Header",
      x: 3,
      y: 1.5,
      width: 94,
      height: 6,
      visible: true,
    },
    {
      id: "userInfo",
      type: "userInfo",
      label: "User Info",
      x: 3,
      y: 8,
      width: 94,
      height: 9,
      visible: true,
    },
    {
      id: "stats",
      type: "stats",
      label: "Stats",
      x: 3,
      y: 18,
      width: 94,
      height: 8,
      visible: true,
    },
    {
      id: "topArtists",
      type: "topArtists",
      label: "Top Artists",
      x: 3,
      y: 27,
      width: 94,
      height: 16,
      visible: true,
    },
    {
      id: "topAlbums",
      type: "topAlbums",
      label: "Top Albums",
      x: 3,
      y: 44,
      width: 94,
      height: 16,
      visible: true,
    },
    {
      id: "topTracks",
      type: "topTracks",
      label: "Top Tracks",
      x: 3,
      y: 61,
      width: 94,
      height: 9,
      visible: true,
    },
    {
      id: "tags",
      type: "tags",
      label: "Genre Tags",
      x: 3,
      y: 71,
      width: 94,
      height: 5,
      visible: true,
    },
    {
      id: "bottomStats",
      type: "bottomStats",
      label: "Bottom Stats",
      x: 3,
      y: 78,
      width: 94,
      height: 8,
      visible: true,
    },
  ];
}

const HANDLE_CURSORS: Record<ResizeHandle, string> = {
  nw: "nwse-resize",
  n: "ns-resize",
  ne: "nesw-resize",
  e: "ew-resize",
  se: "nwse-resize",
  s: "ns-resize",
  sw: "nesw-resize",
  w: "ew-resize",
};

// =============================================================================
// Grid Overlay Component
// =============================================================================

function GridOverlay() {
  const lines: React.JSX.Element[] = [];
  for (let i = 0; i <= 20; i++) {
    const pos = i * 5;
    lines.push(
      <div
        key={`h-${i}`}
        className="absolute left-0 right-0 pointer-events-none"
        style={{
          top: `${pos}%`,
          height: 1,
          background: "rgba(255,255,255,0.06)",
        }}
      />,
      <div
        key={`v-${i}`}
        className="absolute top-0 bottom-0 pointer-events-none"
        style={{
          left: `${pos}%`,
          width: 1,
          background: "rgba(255,255,255,0.06)",
        }}
      />
    );
  }
  return <div className="absolute inset-0 pointer-events-none z-[1]">{lines}</div>;
}

// =============================================================================
// Element Content Renderer
// =============================================================================

function ElementContent({
  element,
  data,
  username,
  accentColor,
  headingScale,
  bodyScale,
  isLight,
  textColor,
  subTextColor,
  updateText,
  isEditing,
}: {
  element: CanvasElement;
  data: WrappedData;
  username?: string;
  accentColor: string;
  headingScale: number;
  bodyScale: number;
  isLight: boolean;
  textColor: string;
  subTextColor: string;
  updateText?: (text: string) => void;
  isEditing?: boolean;
}) {
  const { overview, topArtists, topAlbums, topTags, topTracks, listeningPatterns, diversity } = data;
  const artists = topArtists.slice(0, 5);
  const albums = topAlbums.slice(0, 4);
  const tags = topTags.slice(0, 8);
  const tracks = topTracks.slice(0, 3);
  const tagString = tags.map((t) => `#${t.name.replace(/\s+/g, "")}`).join(" ");

  const h1 = `${Math.round(10 * headingScale)}px`;
  const h2 = `${Math.round(8 * headingScale)}px`;
  const body = `${Math.round(7 * bodyScale)}px`;
  const small = `${Math.round(6 * bodyScale)}px`;
  const tiny = `${Math.round(5.5 * bodyScale)}px`;

  switch (element.type) {
    case "header":
      return (
        <div className="flex items-end justify-between h-full w-full" style={{ padding: "2px 4px" }}>
          <div>
            <div className="flex items-center gap-1" style={{ marginBottom: 1 }}>
              <svg viewBox="0 0 24 24" className="shrink-0" style={{ width: h2, height: h2, fill: accentColor }}>
                <path d="M12.009 0C5.376 0 0 5.376 0 12.009c0 6.632 5.376 12.008 12.009 12.008 6.632 0 12.008-5.376 12.008-12.008C24.017 5.376 18.641 0 12.009 0z" />
              </svg>
              <span
                className="font-bold uppercase tracking-widest leading-none"
                style={{ color: accentColor, fontSize: h1 }}
              >
                PLAYBACK
              </span>
            </div>
            <p className="leading-tight" style={{ fontSize: small, color: subTextColor }}>
              {overview.periodLabel}
            </p>
          </div>
          <p className="text-right leading-tight" style={{ fontSize: tiny, color: subTextColor }}>
            last.fm
          </p>
        </div>
      );

    case "userInfo":
      return (
        <div
          className="flex items-center gap-2 h-full w-full"
          style={{
            padding: "2px 4px",
            borderBottom: `2px solid ${accentColor}`,
          }}
        >
          <div
            className="rounded-full bg-white/10 shrink-0 overflow-hidden"
            style={{ width: "22%", aspectRatio: "1" }}
          >
            {overview.avatar ? (
              <img
                src={overview.avatar}
                alt=""
                className="w-full h-full object-cover"
                crossOrigin="anonymous"
              />
            ) : (
              <div
                className="w-full h-full flex items-center justify-center font-black"
                style={{ fontSize: "14px", color: textColor }}
              >
                {(username || overview.username)[0]?.toUpperCase()}
              </div>
            )}
          </div>
          <div className="min-w-0 flex flex-col justify-center">
            <p
              className="font-black leading-tight truncate"
              style={{ fontSize: `${Math.round(12 * headingScale)}px`, color: textColor }}
            >
              {username || overview.realname || overview.username}
            </p>
            <p className="leading-tight" style={{ fontSize: small, color: subTextColor }}>
              @{overview.username}
            </p>
          </div>
        </div>
      );

    case "stats":
      return (
        <div
          className="grid grid-cols-2 gap-2 h-full w-full"
          style={{ padding: "2px 4px" }}
        >
          <div>
            <p
              className="font-black leading-none tracking-tight"
              style={{ fontSize: `${Math.round(20 * headingScale)}px`, color: textColor }}
            >
              {fmt(overview.periodScrobbles)}
            </p>
            <p className="uppercase tracking-wider mt-0.5" style={{ fontSize: tiny, color: subTextColor }}>
              scrobbles
            </p>
          </div>
          <div>
            <p
              className="font-black leading-none tracking-tight"
              style={{ fontSize: `${Math.round(20 * headingScale)}px`, color: textColor }}
            >
              {fmtH(overview.estimatedHoursListened)}
            </p>
            <p className="uppercase tracking-wider mt-0.5" style={{ fontSize: tiny, color: subTextColor }}>
              listened
            </p>
          </div>
        </div>
      );

    case "topArtists":
      return (
        <div className="h-full w-full flex flex-col" style={{ padding: "2px 4px" }}>
          <p className="uppercase tracking-wider font-semibold mb-1" style={{ fontSize: small, color: subTextColor }}>
            Top Artists
          </p>
          <div className="flex flex-col gap-0.5 flex-1 min-h-0">
            {artists.map((a, i) => {
              const maxPc = artists[0]?.playcount || 1;
              const pct = (a.playcount / maxPc) * 100;
              return (
                <div key={a.name} className="flex items-center gap-1.5" style={{ minHeight: "14%" }}>
                  <span
                    className="font-bold text-right shrink-0"
                    style={{ width: "8px", fontSize: small, color: accentColor, fontVariantNumeric: "tabular-nums" }}
                  >
                    {i + 1}
                  </span>
                  <span
                    className="font-semibold truncate flex-1"
                    style={{ fontSize: body, color: textColor }}
                  >
                    {a.name}
                  </span>
                  <div className="shrink-0 rounded-full overflow-hidden" style={{ width: "25%", height: "3px", background: "rgba(255,255,255,0.1)" }}>
                    <div className="h-full rounded-full" style={{ width: `${pct}%`, backgroundColor: accentColor }} />
                  </div>
                  <span
                    className="text-right shrink-0"
                    style={{ width: "28px", fontSize: tiny, color: subTextColor, fontVariantNumeric: "tabular-nums" }}
                  >
                    {fmt(a.playcount)}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      );

    case "topAlbums":
      return (
        <div className="h-full w-full flex flex-col" style={{ padding: "2px 4px" }}>
          <p className="uppercase tracking-wider font-semibold mb-1" style={{ fontSize: small, color: subTextColor }}>
            Top Albums
          </p>
          <div className="grid grid-cols-4 gap-1 flex-1 min-h-0">
            {albums.map((alb, i) => (
              <div key={`${alb.artist}-${alb.name}-${i}`} className="flex flex-col gap-0.5 min-h-0">
                <div className="rounded overflow-hidden bg-white/5" style={{ aspectRatio: "1" }}>
                  {alb.image ? (
                    <img src={alb.image} alt="" className="w-full h-full object-cover" crossOrigin="anonymous" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <svg
                        viewBox="0 0 24 24"
                        style={{ width: "14px", height: "14px" }}
                        fill="none"
                        stroke={subTextColor}
                        strokeWidth="1.5"
                      >
                        <circle cx="12" cy="12" r="10" />
                        <circle cx="12" cy="12" r="3" />
                      </svg>
                    </div>
                  )}
                </div>
                <p className="font-semibold truncate leading-tight" style={{ fontSize: tiny, color: textColor }}>
                  {alb.name}
                </p>
                <p className="truncate" style={{ fontSize: `${Math.round(5 * bodyScale)}px`, color: subTextColor }}>
                  {alb.artist}
                </p>
              </div>
            ))}
          </div>
        </div>
      );

    case "topTracks":
      return (
        <div className="h-full w-full flex flex-col" style={{ padding: "2px 4px" }}>
          <p className="uppercase tracking-wider font-semibold mb-1" style={{ fontSize: small, color: subTextColor }}>
            Top Tracks
          </p>
          <div className="flex flex-col gap-0.5">
            {tracks.map((t, i) => (
              <div key={`${t.artist}-${t.name}`} className="flex items-baseline gap-1" style={{ minHeight: "20%" }}>
                <span className="font-bold shrink-0" style={{ fontSize: small, color: accentColor, fontVariantNumeric: "tabular-nums" }}>
                  {i + 1}.
                </span>
                <span className="font-semibold truncate" style={{ fontSize: body, color: textColor }}>
                  {t.name}
                </span>
                <span className="truncate ml-auto" style={{ fontSize: small, color: subTextColor }}>
                  {t.artist}
                </span>
              </div>
            ))}
          </div>
        </div>
      );

    case "tags":
      return (
        <div className="h-full w-full flex flex-col" style={{ padding: "2px 4px" }}>
          <p className="uppercase tracking-wider font-semibold mb-0.5" style={{ fontSize: small, color: subTextColor }}>
            Your Sound
          </p>
          <p className="leading-relaxed" style={{ fontSize: body, color: `${accentColor}CC` }}>
            {tagString}
          </p>
        </div>
      );

    case "bottomStats":
      return (
        <div
          className="h-full w-full flex flex-col justify-between"
          style={{
            padding: "4px 4px 2px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
          }}
        >
          <div className="flex flex-wrap gap-x-2 gap-y-0.5">
            <span style={{ fontSize: tiny, color: subTextColor }}>
              <span className="font-bold" style={{ color: textColor }}>
                {fmt(diversity.uniqueArtists)}
              </span>{" "}
              artists
            </span>
            <span style={{ fontSize: tiny, color: subTextColor }}>
              <span className="font-bold" style={{ color: textColor }}>
                {fmt(diversity.uniqueAlbums)}
              </span>{" "}
              albums
            </span>
            <span style={{ fontSize: tiny, color: subTextColor }}>
              <span className="font-bold" style={{ color: textColor }}>
                {fmt(diversity.uniqueTracks)}
              </span>{" "}
              tracks
            </span>
            <span style={{ fontSize: tiny, color: subTextColor }}>
              <span className="font-bold" style={{ color: textColor }}>
                {listeningPatterns.longestStreak}d
              </span>{" "}
              streak
            </span>
            <span style={{ fontSize: tiny, color: subTextColor }}>
              peak{" "}
              <span className="font-bold" style={{ color: textColor }}>
                {listeningPatterns.peakHour}:00
              </span>
            </span>
          </div>
          <div className="flex items-center justify-between mt-1">
            <span style={{ fontSize: `${Math.round(5 * bodyScale)}px`, color: "rgba(255,255,255,0.15)" }}>
              unofficial playback
            </span>
            <span style={{ fontSize: `${Math.round(5 * bodyScale)}px`, color: "rgba(255,255,255,0.15)" }}>
              {fmt(overview.totalScrobbles)} all-time
            </span>
          </div>
        </div>
      );

    case "customText":
      return (
        <div
          className="h-full w-full flex items-center"
          style={{ padding: "4px 6px" }}
        >
          {isEditing ? (
            <textarea
              value={element.text || ""}
              onChange={(e) => updateText?.(e.target.value)}
              className="w-full h-full bg-transparent border-none outline-none resize-none font-semibold"
              style={{
                fontSize: `${Math.round(9 * headingScale)}px`,
                color: accentColor,
              }}
              onClick={(e) => e.stopPropagation()}
            />
          ) : (
            <p
              className="font-semibold leading-snug"
              style={{ fontSize: `${Math.round(9 * headingScale)}px`, color: accentColor }}
            >
              {element.text || "Your text here"}
            </p>
          )}
        </div>
      );

    default:
      return null;
  }
}

// =============================================================================
// Resize Handles Component
// =============================================================================

function ResizeHandles({ onResizeStart }: { onResizeStart: (handle: ResizeHandle, e: React.MouseEvent) => void }) {
  const handleStyle = (pos: string): React.CSSProperties => ({
    position: "absolute",
    width: 10,
    height: 10,
    background: "white",
    border: "1.5px solid #555",
    borderRadius: 2,
    zIndex: 40,
    ...posStyle(pos),
  });

  function posStyle(pos: string): React.CSSProperties {
    switch (pos) {
      case "nw": return { top: -5, left: -5 };
      case "n":  return { top: -5, left: "50%", transform: "translateX(-50%)" };
      case "ne": return { top: -5, right: -5 };
      case "e":  return { top: "50%", right: -5, transform: "translateY(-50%)" };
      case "se": return { bottom: -5, right: -5 };
      case "s":  return { bottom: -5, left: "50%", transform: "translateX(-50%)" };
      case "sw": return { bottom: -5, left: -5 };
      case "w":  return { top: "50%", left: -5, transform: "translateY(-50%)" };
      default: return {};
    }
  }

  const handles: ResizeHandle[] = ["nw", "n", "ne", "e", "se", "s", "sw", "w"];

  return (
    <>
      {handles.map((h) => (
        <div
          key={h}
          style={handleStyle(h)}
          onMouseDown={(e) => onResizeStart(h, e)}
          className="hover:scale-125 transition-transform"
        />
      ))}
    </>
  );
}

// =============================================================================
// Main Component
// =============================================================================

export function CustomStoryBuilder({ data, username }: CustomStoryProps) {
  // ---------------------------------------------------------------------------
  // State
  // ---------------------------------------------------------------------------
  const [elements, setElements] = useState<CanvasElement[]>(getDefaultElements);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [accentColor, setAccentColor] = useState("#FFD600");
  const [bgColor, setBgColor] = useState("#111111");
  const [showGrid, setShowGrid] = useState(false);
  const [snapEnabled, setSnapEnabled] = useState(false);
  const [headingSize, setHeadingSize] = useState(100);
  const [bodySize, setBodySize] = useState(100);
  const [zoom, setZoom] = useState(100);
  const [exporting, setExporting] = useState(false);
  const [customTextInput, setCustomTextInput] = useState("Your text here");
  const [editingTextId, setEditingTextId] = useState<string | null>(null);

  // ---------------------------------------------------------------------------
  // Refs
  // ---------------------------------------------------------------------------
  const canvasRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<DragState | null>(null);

  const isLight = bgColor === "#F5F0E8" || bgColor === "#FFF8E1";
  const textColor = isLight ? "#111" : "#fff";
  const subTextColor = isLight ? "rgba(0,0,0,0.3)" : "rgba(255,255,255,0.3)";

  // ---------------------------------------------------------------------------
  // Snap helper
  // ---------------------------------------------------------------------------
  const snap = useCallback(
    (val: number) => {
      if (!snapEnabled) return val;
      const gridSize = 2; // 2% grid
      return Math.round(val / gridSize) * gridSize;
    },
    [snapEnabled]
  );

  // ---------------------------------------------------------------------------
  // Canvas coordinate helper
  // ---------------------------------------------------------------------------
  const getCanvasCoords = useCallback((e: MouseEvent) => {
    if (!canvasRef.current) return { x: 0, y: 0 };
    const rect = canvasRef.current.getBoundingClientRect();
    return {
      x: ((e.clientX - rect.left) / rect.width) * 100,
      y: ((e.clientY - rect.top) / rect.height) * 100,
    };
  }, []);

  // ---------------------------------------------------------------------------
  // Element drag start
  // ---------------------------------------------------------------------------
  const handleElementMouseDown = useCallback(
    (elementId: string, e: React.MouseEvent) => {
      if (e.button !== 0) return;
      e.stopPropagation();
      e.preventDefault();

      const coords = getCanvasCoords(e.nativeEvent);
      const el = elements.find((el) => el.id === elementId);
      if (!el) return;

      dragRef.current = {
        mode: "move",
        elementId,
        startMouseX: coords.x,
        startMouseY: coords.y,
        startX: el.x,
        startY: el.y,
        startW: el.width,
        startH: el.height,
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = "grabbing";
      setSelectedId(elementId);
    },
    [elements, getCanvasCoords]
  );

  // ---------------------------------------------------------------------------
  // Resize start
  // ---------------------------------------------------------------------------
  const handleResizeStart = useCallback(
    (handle: ResizeHandle, e: React.MouseEvent) => {
      e.stopPropagation();
      e.preventDefault();

      const coords = getCanvasCoords(e.nativeEvent);
      const el = elements.find((el) => el.id === selectedId);
      if (!el) return;

      dragRef.current = {
        mode: "resize",
        elementId: el.id,
        startMouseX: coords.x,
        startMouseY: coords.y,
        startX: el.x,
        startY: el.y,
        startW: el.width,
        startH: el.height,
        handle,
      };

      document.body.style.userSelect = "none";
      document.body.style.cursor = HANDLE_CURSORS[handle];
    },
    [elements, selectedId, getCanvasCoords]
  );

  // ---------------------------------------------------------------------------
  // Mouse move & mouse up (global)
  // ---------------------------------------------------------------------------
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      const drag = dragRef.current;
      if (!drag || !canvasRef.current) return;

      const coords = getCanvasCoords(e);
      const dx = coords.x - drag.startMouseX;
      const dy = coords.y - drag.startMouseY;

      setElements((prev) =>
        prev.map((el) => {
          if (el.id !== drag.elementId) return el;

          if (drag.mode === "move") {
            return {
              ...el,
              x: snap(clamp(drag.startX + dx, 0, 100 - el.width)),
              y: snap(clamp(drag.startY + dy, 0, 100 - el.height)),
            };
          }

          if (drag.mode === "resize" && drag.handle) {
            const h = drag.handle;
            const hasW = h === "w" || h === "nw" || h === "sw";
            const hasE = h === "e" || h === "ne" || h === "se";
            const hasN = h === "n" || h === "nw" || h === "ne";
            const hasS = h === "s" || h === "se" || h === "sw";

            let newX = drag.startX;
            let newY = drag.startY;
            let newW = drag.startW;
            let newH = drag.startH;

            if (hasW) {
              newX = drag.startX + dx;
              newW = drag.startW - dx;
            }
            if (hasE) {
              newW = drag.startW + dx;
            }
            if (hasN) {
              newY = drag.startY + dy;
              newH = drag.startH - dy;
            }
            if (hasS) {
              newH = drag.startH + dy;
            }

            // Enforce minimum size
            const MIN_W = 8;
            const MIN_H = 3;
            if (newW < MIN_W) {
              if (hasW) newX = drag.startX + drag.startW - MIN_W;
              newW = MIN_W;
            }
            if (newH < MIN_H) {
              if (hasN) newY = drag.startY + drag.startH - MIN_H;
              newH = MIN_H;
            }

            // Clamp to canvas
            newX = clamp(newX, 0, 100 - MIN_W);
            newY = clamp(newY, 0, 100 - MIN_H);
            if (newX + newW > 100) newW = 100 - newX;
            if (newY + newH > 100) newH = 100 - newY;

            return {
              ...el,
              x: snap(newX),
              y: snap(newY),
              width: snap(newW),
              height: snap(newH),
            };
          }

          return el;
        })
      );
    };

    const handleMouseUp = () => {
      dragRef.current = null;
      document.body.style.cursor = "";
      document.body.style.userSelect = "";
    };

    document.addEventListener("mousemove", handleMouseMove);
    document.addEventListener("mouseup", handleMouseUp);

    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
    };
  }, [getCanvasCoords, snap]);

  // ---------------------------------------------------------------------------
  // Canvas background click → deselect
  // ---------------------------------------------------------------------------
  const handleCanvasMouseDown = useCallback((e: React.MouseEvent) => {
    if (e.target === e.currentTarget || (e.target as HTMLElement).dataset.canvasBg) {
      setSelectedId(null);
      setEditingTextId(null);
    }
  }, []);

  // ---------------------------------------------------------------------------
  // Toggle visibility
  // ---------------------------------------------------------------------------
  const toggleVisibility = useCallback((id: string) => {
    setElements((prev) =>
      prev.map((el) => (el.id === id ? { ...el, visible: !el.visible } : el))
    );
  }, []);

  // ---------------------------------------------------------------------------
  // Add text element
  // ---------------------------------------------------------------------------
  const handleAddText = useCallback(() => {
    const id = `text-${Date.now()}`;
    const newEl: CanvasElement = {
      id,
      type: "customText",
      label: "Custom Text",
      x: 15,
      y: 45,
      width: 70,
      height: 5,
      visible: true,
      text: customTextInput || "Your text here",
    };
    setElements((prev) => [...prev, newEl]);
    setSelectedId(id);
    setEditingTextId(id);
  }, [customTextInput]);

  // ---------------------------------------------------------------------------
  // Delete element
  // ---------------------------------------------------------------------------
  const handleDeleteElement = useCallback(() => {
    if (!selectedId) return;
    const el = elements.find((e) => e.id === selectedId);
    if (!el || el.type !== "customText") return;
    setElements((prev) => prev.filter((e) => e.id !== selectedId));
    setSelectedId(null);
    setEditingTextId(null);
  }, [selectedId, elements]);

  // ---------------------------------------------------------------------------
  // Update text for custom text element
  // ---------------------------------------------------------------------------
  const handleUpdateText = useCallback(
    (text: string) => {
      if (!selectedId) return;
      setElements((prev) =>
        prev.map((el) => (el.id === selectedId ? { ...el, text } : el))
      );
    },
    [selectedId]
  );

  // ---------------------------------------------------------------------------
  // Export
  // ---------------------------------------------------------------------------
  const handleExport = useCallback(async () => {
    const prevSelected = selectedId;
    const prevEditing = editingTextId;
    setSelectedId(null);
    setEditingTextId(null);

    // Wait for re-render
    await new Promise((r) => requestAnimationFrame(r));
    await new Promise((r) => requestAnimationFrame(r));

    if (!canvasRef.current) {
      setSelectedId(prevSelected);
      setEditingTextId(prevEditing);
      return;
    }

    setExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      const dataUrl = await toPng(canvasRef.current, {
        pixelRatio: 3,
        backgroundColor: bgColor,
      });
      const link = document.createElement("a");
      link.download = `playback-${data.overview.username}.png`;
      link.href = dataUrl;
      link.click();
    } catch (err) {
      console.error("Export failed", err);
    } finally {
      setExporting(false);
      setSelectedId(prevSelected);
      setEditingTextId(prevEditing);
    }
  }, [selectedId, editingTextId, bgColor, data.overview.username]);

  // ---------------------------------------------------------------------------
  // Reset
  // ---------------------------------------------------------------------------
  const handleReset = useCallback(() => {
    setElements(getDefaultElements());
    setSelectedId(null);
    setAccentColor("#FFD600");
    setBgColor("#111111");
    setHeadingSize(100);
    setBodySize(100);
    setShowGrid(false);
    setSnapEnabled(false);
    setZoom(100);
    setEditingTextId(null);
  }, []);

  // ---------------------------------------------------------------------------
  // Selected element info
  // ---------------------------------------------------------------------------
  const selectedElement = elements.find((el) => el.id === selectedId);
  const isCustomText = selectedElement?.type === "customText";

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------
  return (
    <div className="flex flex-col lg:flex-row gap-4 w-full max-w-6xl mx-auto">
      {/* ================================================================== */}
      {/* LEFT PANEL                                                        */}
      {/* ================================================================== */}
      <div className="w-full lg:w-72 flex-shrink-0">
        <ScrollArea className="h-[85vh]">
          <div className="space-y-5 pr-3 pb-4">
            {/* ---- Theme Presets ---- */}
            <Section title="Themes" icon={<Palette className="w-3.5 h-3.5" />}>
              <div className="grid grid-cols-3 gap-1.5">
                {THEME_PRESETS.map((t) => (
                  <button
                    key={t.name}
                    onClick={() => { setBgColor(t.bg); setAccentColor(t.accent); }}
                    className={`flex flex-col items-center gap-1 py-2 rounded-lg border transition-all ${
                      bgColor === t.bg && accentColor === t.accent
                        ? "border-white/40 bg-white/5"
                        : "border-white/5 hover:border-white/15"
                    }`}
                  >
                    <div
                      className="w-6 h-6 rounded-md flex items-center justify-center text-[9px] font-black"
                      style={{ backgroundColor: t.bg, color: t.accent, border: `1px solid ${t.accent}40` }}
                    >
                      {t.icon}
                    </div>
                    <span className="text-[9px] text-white/40 font-medium">{t.name}</span>
                  </button>
                ))}
              </div>
            </Section>

            {/* ---- Background Color ---- */}
            <Section title="Background" icon={<div className="w-3.5 h-3.5 rounded bg-white/10" />}>
              <div className="grid grid-cols-4 gap-1.5">
                {BG_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setBgColor(c.value)}
                    className={`w-full aspect-square rounded-lg transition-all border ${
                      bgColor === c.value
                        ? "border-white/50 scale-110"
                        : "border-white/5 hover:border-white/20"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="h-7 text-xs bg-white/5 border-white/10 text-white/70"
                  placeholder="#111111"
                  maxLength={7}
                />
                <input
                  type="color"
                  value={bgColor}
                  onChange={(e) => setBgColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>
            </Section>

            {/* ---- Accent Color ---- */}
            <Section title="Accent Color" icon={<Palette className="w-3.5 h-3.5" />}>
              <div className="grid grid-cols-4 gap-1.5">
                {PALETTE_OPTIONS.map((c) => (
                  <button
                    key={c.value}
                    onClick={() => setAccentColor(c.value)}
                    className={`w-full aspect-square rounded-lg transition-all ${
                      accentColor === c.value
                        ? "ring-2 ring-white/60 ring-offset-2 ring-offset-[#0a0a0a] scale-110"
                        : "hover:scale-105"
                    }`}
                    style={{ backgroundColor: c.value }}
                    title={c.name}
                  />
                ))}
              </div>
              <div className="mt-2 flex items-center gap-2">
                <Input
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="h-7 text-xs bg-white/5 border-white/10 text-white/70"
                  placeholder="#FFD600"
                  maxLength={7}
                />
                <input
                  type="color"
                  value={accentColor}
                  onChange={(e) => setAccentColor(e.target.value)}
                  className="w-7 h-7 rounded cursor-pointer border-0 p-0 bg-transparent"
                />
              </div>
            </Section>

            {/* ---- Elements Visibility ---- */}
            <Section title="Elements" icon={<Eye className="w-3.5 h-3.5" />}>
              <div className="flex flex-col gap-1">
                {elements.map((el) => (
                  <button
                    key={el.id}
                    onClick={() => {
                      setSelectedId(el.id);
                      setEditingTextId(null);
                    }}
                    onDoubleClick={() => {
                      toggleVisibility(el.id);
                    }}
                    className={`flex items-center gap-2 px-2 py-1.5 rounded-lg text-xs font-medium transition-all text-left group ${
                      selectedId === el.id
                        ? "bg-white/10 text-white"
                        : el.visible
                          ? "text-white/50 hover:text-white/70 hover:bg-white/5"
                          : "text-white/20 hover:text-white/30"
                    }`}
                  >
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(el.id);
                      }}
                      className="shrink-0 p-0.5 hover:bg-white/10 rounded"
                    >
                      {el.visible ? (
                        <Eye className="w-3 h-3" />
                      ) : (
                        <EyeOff className="w-3 h-3" />
                      )}
                    </button>
                    <span className="w-1 h-3 rounded-full shrink-0" style={{ backgroundColor: el.visible ? accentColor : "transparent" }} />
                    <span className="flex-1 truncate">{el.label}</span>
                    {el.type === "customText" && selectedId === el.id && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteElement();
                        }}
                        className="shrink-0 p-0.5 hover:bg-white/10 rounded text-red-400/60 hover:text-red-400"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    )}
                  </button>
                ))}
              </div>
            </Section>

            {/* ---- Text Options ---- */}
            <Section title="Text Options" icon={<Type className="w-3.5 h-3.5" />}>
              <div className="space-y-3">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-white/40">Heading Size</span>
                    <span className="text-[11px] text-white/30 font-mono">{headingSize}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    value={headingSize}
                    onChange={(e) => setHeadingSize(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-white cursor-pointer"
                  />
                </div>
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-white/40">Body Size</span>
                    <span className="text-[11px] text-white/30 font-mono">{bodySize}%</span>
                  </div>
                  <input
                    type="range"
                    min={50}
                    max={200}
                    value={bodySize}
                    onChange={(e) => setBodySize(Number(e.target.value))}
                    className="w-full h-1.5 rounded-full appearance-none bg-white/10 accent-white cursor-pointer"
                  />
                </div>
              </div>
            </Section>

            {/* ---- Add Custom Text ---- */}
            <Section title="Add Text" icon={<Plus className="w-3.5 h-3.5" />}>
              <div className="space-y-2">
                <Input
                  value={customTextInput}
                  onChange={(e) => setCustomTextInput(e.target.value)}
                  className="h-8 text-xs bg-white/5 border-white/10 text-white/70"
                  placeholder="Enter text..."
                  onKeyDown={(e) => {
                    if (e.key === "Enter") handleAddText();
                  }}
                />
                <button
                  onClick={handleAddText}
                  className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium bg-white/5 border border-white/10 text-white/60 hover:text-white hover:bg-white/10 transition-colors"
                >
                  <Plus className="w-3 h-3" />
                  Add to Canvas
                </button>
              </div>
              {isCustomText && selectedElement && (
                <div className="mt-2 space-y-2 pt-2 border-t border-white/5">
                  <span className="text-[10px] text-white/30 uppercase tracking-wider">Editing: {selectedElement.label}</span>
                  <textarea
                    value={selectedElement.text || ""}
                    onChange={(e) => handleUpdateText(e.target.value)}
                    className="w-full h-16 text-xs bg-white/5 border border-white/10 rounded-lg p-2 text-white/70 resize-none outline-none focus:border-white/30"
                    placeholder="Edit text..."
                  />
                </div>
              )}
            </Section>

            {/* ---- Canvas Options ---- */}
            <Section title="Canvas" icon={<Grid3x3 className="w-3.5 h-3.5" />}>
              <div className="space-y-2">
                <ToggleRow
                  label="Show Grid"
                  active={showGrid}
                  onClick={() => setShowGrid((v) => !v)}
                  icon={<Grid3x3 className="w-3.5 h-3.5" />}
                />
                <ToggleRow
                  label="Snap to Grid"
                  active={snapEnabled}
                  onClick={() => setSnapEnabled((v) => !v)}
                  icon={<Magnet className="w-3.5 h-3.5" />}
                />
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-[11px] text-white/40">Zoom</span>
                    <span className="text-[11px] text-white/30 font-mono">{zoom}%</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <ZoomOut className="w-3 h-3 text-white/30" />
                    <input
                      type="range"
                      min={50}
                      max={150}
                      value={zoom}
                      onChange={(e) => setZoom(Number(e.target.value))}
                      className="flex-1 h-1.5 rounded-full appearance-none bg-white/10 accent-white cursor-pointer"
                    />
                    <ZoomIn className="w-3 h-3 text-white/30" />
                  </div>
                </div>
              </div>
            </Section>

            {/* ---- Actions ---- */}
            <div className="space-y-2 pt-2">
              <button
                onClick={handleExport}
                disabled={exporting}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2.5 rounded-lg text-xs font-semibold transition-colors disabled:opacity-50"
                style={{
                  backgroundColor: accentColor,
                  color: isLight || bgColor === "#F5F0E8" ? "#111" : "#111",
                }}
              >
                <Download className="w-3.5 h-3.5" />
                {exporting ? "Exporting..." : "Export as PNG"}
              </button>
              <button
                onClick={handleReset}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-1.5 rounded-lg text-[11px] text-white/30 hover:text-white/50 hover:bg-white/5 transition-colors border border-white/5"
              >
                <RotateCcw className="w-3 h-3" />
                Reset All
              </button>
            </div>

            {/* ---- Selected Element Info ---- */}
            {selectedElement && (
              <div className="rounded-lg bg-white/5 border border-white/10 p-3 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-white/40 uppercase tracking-wider font-semibold">Selected</span>
                  <button
                    onClick={() => {
                      setSelectedId(null);
                      setEditingTextId(null);
                    }}
                    className="p-0.5 hover:bg-white/10 rounded text-white/30 hover:text-white/60"
                  >
                    <X className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-xs text-white/70 font-medium">{selectedElement.label}</p>
                <div className="grid grid-cols-2 gap-1.5 text-[10px]">
                  <div className="text-white/30">
                    X: <span className="text-white/50 font-mono">{selectedElement.x.toFixed(1)}%</span>
                  </div>
                  <div className="text-white/30">
                    Y: <span className="text-white/50 font-mono">{selectedElement.y.toFixed(1)}%</span>
                  </div>
                  <div className="text-white/30">
                    W: <span className="text-white/50 font-mono">{selectedElement.width.toFixed(1)}%</span>
                  </div>
                  <div className="text-white/30">
                    H: <span className="text-white/50 font-mono">{selectedElement.height.toFixed(1)}%</span>
                  </div>
                </div>
                <div className="flex items-center gap-1 text-[10px] text-white/25 pt-1 border-t border-white/5">
                  <Move className="w-3 h-3" />
                  Drag to move, handles to resize
                </div>
              </div>
            )}
          </div>
        </ScrollArea>
      </div>

      {/* ================================================================== */}
      {/* CANVAS AREA                                                       */}
      {/* ================================================================== */}
      <div className="flex-1 flex flex-col items-center justify-start py-2">
        {/* Zoom wrapper */}
        <div
          style={{
            transform: `scale(${zoom / 100})`,
            transformOrigin: "top center",
          }}
          className="transition-transform duration-150"
        >
          <div
            ref={canvasRef}
            className="relative w-[300px] sm:w-[340px] lg:w-[360px] overflow-hidden select-none rounded-xl shadow-2xl shadow-black/50"
            style={{
              aspectRatio: "9/16",
              backgroundColor: bgColor,
            }}
            onMouseDown={handleCanvasMouseDown}
          >
            {/* Background click target */}
            <div
              className="absolute inset-0 z-0"
              data-canvas-bg="true"
            />

            {/* Grid overlay */}
            {showGrid && <GridOverlay />}

            {/* Paper grain texture */}
            <div
              className="absolute inset-0 pointer-events-none z-[2]"
              style={{
                opacity: 0.04,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                mixBlendMode: "overlay",
              }}
            />

            {/* Elements */}
            {elements.map((el) => {
              if (!el.visible) return null;
              const isSelected = selectedId === el.id;
              return (
                <div
                  key={el.id}
                  className="absolute overflow-hidden"
                  style={{
                    left: `${el.x}%`,
                    top: `${el.y}%`,
                    width: `${el.width}%`,
                    height: `${el.height}%`,
                    zIndex: isSelected ? 20 : 10,
                    cursor: dragRef.current?.elementId === el.id
                      ? "grabbing"
                      : "grab",
                  }}
                  onMouseDown={(e) => handleElementMouseDown(el.id, e)}
                >
                  {/* Element content */}
                  <div className="w-full h-full overflow-hidden">
                    <ElementContent
                      element={el}
                      isEditing={isCustomText && editingTextId === el.id}
                      data={data}
                      username={username}
                      accentColor={accentColor}
                      headingScale={headingSize / 100}
                      bodyScale={bodySize / 100}
                      isLight={isLight}
                      textColor={textColor}
                      subTextColor={subTextColor}
                      updateText={handleUpdateText}
                    />
                  </div>

                  {/* Selection border & handles */}
                  {isSelected && !exporting && (
                    <>
                      <div
                        className="absolute inset-0 pointer-events-none rounded-[1px]"
                        style={{
                          border: "1.5px dashed rgba(255,255,255,0.6)",
                          zIndex: 35,
                        }}
                      />
                      <ResizeHandles onResizeStart={handleResizeStart} />
                    </>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Canvas label */}
        <p className="text-[11px] text-white/20 mt-3 flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-white/20" />
          9:16 Story Format — Click element to select, drag to move
        </p>
      </div>
    </div>
  );
}

// =============================================================================
// Helper Sub-Components
// =============================================================================

function Section({
  title,
  icon,
  children,
}: {
  title: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) {
  return (
    <div>
      <h3 className="text-xs font-bold text-white/60 uppercase tracking-wider mb-3 flex items-center gap-1.5">
        {icon}
        {title}
      </h3>
      {children}
    </div>
  );
}

function ToggleRow({
  label,
  active,
  onClick,
  icon,
}: {
  label: string;
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      className={`flex items-center gap-2 px-2.5 py-1.5 rounded-lg text-xs font-medium transition-all text-left w-full ${
        active
          ? "bg-white/10 text-white/80"
          : "text-white/30 hover:text-white/50 hover:bg-white/5"
      }`}
    >
      {icon}
      <span className="flex-1">{label}</span>
      <div
        className={`w-7 h-4 rounded-full transition-colors relative ${
          active ? "bg-white/20" : "bg-white/5"
        }`}
      >
        <div
          className={`absolute top-0.5 w-3 h-3 rounded-full transition-all ${
            active
              ? "left-3.5 bg-white"
              : "left-0.5 bg-white/30"
          }`}
        />
      </div>
    </button>
  );
}