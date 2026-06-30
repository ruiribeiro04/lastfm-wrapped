# Last.fm Wrapped

Generate a Spotify Wrapped-style music statistics visualization for any Last.fm user. Enter a username, pick a time range, and get a shareable infographic card plus an Instagram Stories-style carousel of your listening data.

## Features

- **Share Card** — Dense infographic showing top artists, albums, tracks, genres, listening stats, and period-over-period comparison. Export as PNG.
- **Stories** — 12 animated slides in an Instagram Story format: Overview, Top Artists, Top Albums, Top Tracks, Top Tags, Listening Clock, Listening Patterns, Monthly Breakdown, Listening Heatmap, Music Personality, Diversity, and Fun Facts.
- **Customize** — Drag-and-drop editor to customize the share card layout, colors, and element visibility. Export as PNG.
- **Demo mode** — Try the app with pre-loaded demo data without needing a Last.fm account.

## Tech Stack

- **Framework:** Next.js 16 (App Router)
- **Language:** TypeScript
- **Styling:** Tailwind CSS 4 + shadcn/ui
- **State:** Zustand
- **Animations:** Framer Motion
- **Charts:** Recharts
- **Runtime:** Bun
- **API:** Last.fm API

## Getting Started

### Prerequisites

- [Bun](https://bun.sh) (recommended) or Node.js 22+
- A [Last.fm API key](https://www.last.fm/api/account/create) (free)

### Setup

```bash
# Install dependencies
bun install

# Set up your API key
cp .env.example .env
# Edit .env and add your LASTFM_API_KEY

# Start the dev server
bun dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Using your own API key

The app works without an API key — it uses a built-in demo proxy. For production or heavy use, paste your own Last.fm API key into the UI (it's stored in your browser's localStorage only, never sent to any server).

## Usage

1. Enter a Last.fm username
2. Select a time period (7 days to overall)
3. Click "Generate Playback"
4. Browse the Share Card, Stories, or Customize views
5. Export any view as PNG or copy a shareable link

## API Routes

| Route | Description |
|-------|-------------|
| `GET /api/lastfm/wrapped?username=&period=` | Fetch full wrapped data for a user |
| `GET /api/lastfm/validate?username=` | Check if a Last.fm username exists |
| `GET /api/lastfm/search?q=` | Search for Last.fm users |
| `POST /api/lastfm/proxy` | Proxy requests with a custom API key |
| `GET /api/lastfm/demo` | Return pre-loaded demo data |

## Project Structure

```
src/
├── app/
│   ├── api/lastfm/          # API routes for Last.fm data
│   ├── globals.css          # Tailwind + theme variables
│   ├── layout.tsx           # Root layout
│   └── page.tsx             # Main page (search + results)
├── components/
│   ├── ui/                  # shadcn/ui base components
│   └── wrapped/             # Story slides and share card
├── hooks/
│   ├── use-mobile.ts
│   └── use-toast.ts
├── lib/
│   ├── lastfm.ts            # Last.fm API client
│   └── utils.ts             # cn() utility
└── store/
    └── wrapped.ts           # Zustand state store
```

## License

MIT
