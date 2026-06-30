import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "@/components/ui/toaster";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Last.fm Playback — Your Half-Year in Music",
  description: "Create your own Last.fm Wrapped/Playback story. See your top artists, albums, genres, and listening patterns in beautiful Instagram Story format.",
  keywords: ["Last.fm", "Wrapped", "Playback", "Music Stats", "Scrobbles", "Instagram Story"],
  icons: {
    icon: "/favicon.svg",
  },
  openGraph: {
    title: "Last.fm Playback — Your Half-Year in Music",
    description: "Create your own Last.fm Wrapped/Playback story",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Last.fm Playback — Your Half-Year in Music",
    description: "Create your own Last.fm Wrapped/Playback story",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased bg-background text-foreground`}
      >
        {children}
        <Toaster />
      </body>
    </html>
  );
}
