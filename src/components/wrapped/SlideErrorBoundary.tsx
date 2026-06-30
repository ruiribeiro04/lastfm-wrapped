"use client";

import { Component, type ReactNode, type ErrorInfo } from "react";

interface Props {
  children: ReactNode;
  slideName: string;
  slideIndex: number;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

export class SlideErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(`[SlideErrorBoundary] "${this.props.slideName}" crashed:`, error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div
          className="relative w-full flex-shrink-0"
          style={{ aspectRatio: "9/16" }}
        >
          <div
            className="absolute inset-0 rounded-3xl overflow-hidden flex flex-col items-center justify-center p-8"
            style={{ backgroundColor: "#111" }}
          >
            {/* Paper grain texture */}
            <div
              className="absolute inset-0 rounded-3xl pointer-events-none"
              style={{
                opacity: 0.045,
                backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 512 512' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
                mixBlendMode: "overlay",
              }}
            />
            <div className="relative z-10 flex flex-col items-center gap-4 text-center">
              <div className="w-12 h-12 rounded-full bg-white/5 flex items-center justify-center">
                <svg viewBox="0 0 24 24" className="w-6 h-6 text-white/20" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M12 9v4m0 4h.01M5.07 19h13.86c1.54 0 2.5-1.67 1.73-3L13.73 4c-.77-1.33-2.69-1.33-3.46 0L3.34 16c-.77 1.33.19 3 1.73 3z" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-bold text-white/40">Something went wrong</p>
                <p className="text-xs text-white/20 mt-1">
                  {this.props.slideName} slide encountered an error
                </p>
              </div>
              <p className="text-[9px] text-white/15 font-mono max-w-[240px] break-all leading-relaxed">
                {this.state.error?.message || "Unknown error"}
              </p>
              <div className="flex items-center gap-1">
                {Array.from({ length: 11 }).map((_, i) => (
                  <div
                    key={i}
                    className="w-1.5 h-1.5 rounded-full"
                    style={{
                      backgroundColor:
                        i === this.props.slideIndex
                          ? "rgba(213,16,7,0.6)"
                          : "rgba(255,255,255,0.1)",
                    }}
                  />
                ))}
              </div>
              <p className="text-[8px] text-white/10 tabular-nums">
                {String(this.props.slideIndex + 1).padStart(2, "0")}/11
              </p>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}