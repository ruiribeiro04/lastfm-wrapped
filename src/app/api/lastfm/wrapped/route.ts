import { NextRequest, NextResponse } from "next/server";
import {
  getUserInfo,
  getTopArtists,
  getTopAlbums,
  getTopTracks,
  getTopTags,
  getRecentTracks,
  getTrackInfo,
  getPeriodRange,
  type RecentTrack,
} from "@/lib/lastfm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");
    const period = searchParams.get("period") || "6month";

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const validPeriods = [
      "7day",
      "1month",
      "3month",
      "6month",
      "12month",
      "overall",
    ];
    if (!validPeriods.includes(period)) {
      return NextResponse.json(
        { error: `Invalid period. Must be one of: ${validPeriods.join(", ")}` },
        { status: 400 }
      );
    }

    const { from, to, label } = getPeriodRange(period);

    // Fetch all data in parallel where possible
    const [userInfo, topArtists, topAlbums, topTracks, topTags, recentTracks] =
      await Promise.all([
        getUserInfo(username).catch(() => null),
        getTopArtists(username, period, 50),
        getTopAlbums(username, period, 50),
        getTopTracks(username, period, 50),
        getTopTags(username, 50),
        period !== "overall"
          ? getRecentTracks(username, from, to)
          : getRecentTracks(username),
      ]);

    if (!userInfo) {
      return NextResponse.json(
        { error: "User not found or API key is not configured" },
        { status: 404 }
      );
    }

    // Calculate estimated listening hours from recent tracks
    let totalDurationSeconds = 0;
    let tracksWithoutDuration = 0;
    const AVERAGE_TRACK_DURATION = 210; // 3.5 minutes

    for (const track of recentTracks) {
      if (track.duration > 0) {
        totalDurationSeconds += track.duration;
      } else {
        tracksWithoutDuration++;
        totalDurationSeconds += AVERAGE_TRACK_DURATION;
      }
    }

    const estimatedHoursListened = totalDurationSeconds / 3600;

    // Calculate listening patterns from recent tracks
    const hourlyDistribution = new Array(24).fill(0);
    const dayOfWeekDistribution = new Array(7).fill(0);
    const monthlyMap = new Map<string, number>();
    const uniqueDays = new Set<string>();

    for (const track of recentTracks) {
      if (track.dateUts === 0) continue;
      const date = new Date(track.dateUts * 1000);

      // Hourly
      hourlyDistribution[date.getHours()]++;

      // Day of week (0=Sun, 1=Mon... convert to 0=Mon)
      let dow = date.getDay() - 1;
      if (dow < 0) dow = 6;
      dayOfWeekDistribution[dow]++;

      // Monthly
      const monthKey = date.toLocaleString("en-US", {
        month: "short",
        year: "2-digit",
      });
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);

      // Unique days
      const dayKey = date.toISOString().split("T")[0];
      uniqueDays.add(dayKey);
    }

    // Find peak hour
    const peakHour = hourlyDistribution.indexOf(
      Math.max(...hourlyDistribution)
    );

    // Find peak day
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const peakDay = dayNames[dayOfWeekDistribution.indexOf(Math.max(...dayOfWeekDistribution))];

    // Monthly distribution
    const monthlyDistribution = Array.from(monthlyMap.entries())
      .map(([month, count]) => ({ month, count }))
      .sort((a, b) => {
        const months = [
          "Jan",
          "Feb",
          "Mar",
          "Apr",
          "May",
          "Jun",
          "Jul",
          "Aug",
          "Sep",
          "Oct",
          "Nov",
          "Dec",
        ];
        const aIdx = months.indexOf(a.month.split(" ")[0]);
        const bIdx = months.indexOf(b.month.split(" ")[0]);
        return aIdx - bIdx;
      });

    // Calculate longest streak
    const sortedDays = Array.from(uniqueDays)
      .sort()
      .map((d) => new Date(d).getTime() / (1000 * 60 * 60 * 24));

    let longestStreak = 1;
    let currentStreak = 1;
    for (let i = 1; i < sortedDays.length; i++) {
      if (sortedDays[i] - sortedDays[i - 1] === 1) {
        currentStreak++;
        longestStreak = Math.max(longestStreak, currentStreak);
      } else {
        currentStreak = 1;
      }
    }

    // Busiest day
    const dayCounts = new Map<string, number>();
    for (const track of recentTracks) {
      if (track.dateUts === 0) continue;
      const dayKey = new Date(track.dateUts * 1000).toISOString().split("T")[0];
      dayCounts.set(dayKey, (dayCounts.get(dayKey) || 0) + 1);
    }
    let busiestDay = { date: "", count: 0 };
    dayCounts.forEach((count, date) => {
      if (count > busiestDay.count) busiestDay = { date, count };
    });

    // Diversity stats
    const uniqueArtists = new Set(recentTracks.map((t) => t.artist.toLowerCase())).size;
    const uniqueAlbums = new Set(
      recentTracks.map((t) => `${t.artist.toLowerCase()}|||${t.album.toLowerCase()}`)
    ).size;
    const uniqueTracks = new Set(
      recentTracks.map((t) => `${t.artist.toLowerCase()}|||${t.name.toLowerCase()}`)
    ).size;

    // Fun facts
    const sortedByDate = [...recentTracks].sort(
      (a, b) => a.dateUts - b.dateUts
    );
    const firstTrack =
      sortedByDate.length > 0
        ? {
            name: sortedByDate[0].name,
            artist: sortedByDate[0].artist,
            date: sortedByDate[0].dateText,
          }
        : { name: "N/A", artist: "N/A", date: "N/A" };
    const lastTrack =
      sortedByDate.length > 0
        ? {
            name: sortedByDate[sortedByDate.length - 1].name,
            artist: sortedByDate[sortedByDate.length - 1].artist,
            date: sortedByDate[sortedByDate.length - 1].dateText,
          }
        : { name: "N/A", artist: "N/A", date: "N/A" };

    // Longest/shortest tracks (from those with duration)
    const tracksWithDuration = recentTracks.filter((t) => t.duration > 0);
    let longestTrack = { name: "N/A", artist: "N/A", duration: 0 };
    let shortestTrack = { name: "N/A", artist: "N/A", duration: Infinity };
    for (const t of tracksWithDuration) {
      if (t.duration > longestTrack.duration) {
        longestTrack = { name: t.name, artist: t.artist, duration: t.duration };
      }
      if (t.duration < shortestTrack.duration) {
        shortestTrack = { name: t.name, artist: t.artist, duration: t.duration };
      }
    }
    if (shortestTrack.duration === Infinity) {
      shortestTrack = { name: "N/A", artist: "N/A", duration: 0 };
    }

    const averageTrackDuration =
      tracksWithDuration.length > 0
        ? tracksWithDuration.reduce((sum, t) => sum + t.duration, 0) /
          tracksWithDuration.length
        : AVERAGE_TRACK_DURATION;

    // Midnight listener: >10% scrobbles between midnight and 6am
    const nightScrobbles =
      hourlyDistribution[0] +
      hourlyDistribution[1] +
      hourlyDistribution[2] +
      hourlyDistribution[3] +
      hourlyDistribution[4] +
      hourlyDistribution[5];
    const midnightListener =
      recentTracks.length > 0 ? nightScrobbles / recentTracks.length > 0.1 : false;

    // Weekend warrior: >60% on weekends
    const weekendScrobbles = dayOfWeekDistribution[5] + dayOfWeekDistribution[6];
    const weekendWarrior =
      recentTracks.length > 0
        ? weekendScrobbles / recentTracks.length > 0.6
        : false;

    // Total playcount from top artists
    const totalPeriodScrobbles = topArtists.reduce(
      (sum, a) => sum + a.playcount,
      0
    );

    // Top artists with percentage
    const topArtistsWithPct = topArtists.slice(0, 10).map((a) => ({
      ...a,
      percentage:
        totalPeriodScrobbles > 0
          ? Math.round((a.playcount / totalPeriodScrobbles) * 100)
          : 0,
    }));

    return NextResponse.json({
      overview: {
        username: userInfo.username,
        realname: userInfo.realname || userInfo.username,
        avatar: userInfo.image[userInfo.image.length - 1] || "",
        totalScrobbles: userInfo.playcount,
        periodScrobbles: recentTracks.length,
        estimatedHoursListened: Math.round(estimatedHoursListened * 10) / 10,
        daysActive: uniqueDays.size,
        averagePerDay:
          uniqueDays.size > 0
            ? Math.round((recentTracks.length / uniqueDays.size) * 10) / 10
            : 0,
        periodLabel: label,
        tracksWithoutDuration,
      },
      topArtists: topArtistsWithPct,
      topAlbums: topAlbums.slice(0, 10),
      topTags: topTags.slice(0, 15),
      topTracks: topTracks.slice(0, 10),
      listeningPatterns: {
        hourlyDistribution,
        dayOfWeekDistribution,
        monthlyDistribution,
        peakHour,
        peakDay,
        longestStreak,
        busiestDay,
      },
      diversity: {
        uniqueArtists,
        uniqueAlbums,
        uniqueTracks,
        genreCount: topTags.length,
      },
      funFacts: {
        firstTrack,
        lastTrack,
        longestTrack,
        shortestTrack,
        averageTrackDuration: Math.round(averageTrackDuration),
        mostProductiveHour: peakHour,
        midnightListener,
        weekendWarrior,
      },
    });
  } catch (error) {
    console.error("Wrapped API error:", error);
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}