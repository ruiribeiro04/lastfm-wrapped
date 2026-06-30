import { NextRequest, NextResponse } from "next/server";
import {
  getUserInfo,
  getTopArtists,
  getTopAlbums,
  getTopTracks,
  getTopTags,
  getRecentTracks,
  getPeriodRange,
} from "@/lib/lastfm";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { username, period = "6month", apiKey } = body;

    if (!username) {
      return NextResponse.json({ error: "Username is required" }, { status: 400 });
    }
    if (!apiKey || apiKey.length < 10) {
      return NextResponse.json({ error: "Please enter a valid Last.fm API key" }, { status: 400 });
    }

    const validPeriods = ["7day", "1month", "3month", "6month", "12month", "overall"];
    if (!validPeriods.includes(period)) {
      return NextResponse.json({ error: "Invalid period" }, { status: 400 });
    }

    const { from, to, label } = getPeriodRange(period);

    const [userInfo, topArtists, topAlbums, topTracks, topTags, recentTracks] =
      await Promise.all([
        getUserInfo(username, apiKey).catch(() => null),
        getTopArtists(username, period, 50, apiKey),
        getTopAlbums(username, period, 50, apiKey),
        getTopTracks(username, period, 50, apiKey),
        getTopTags(username, 50, apiKey),
        period !== "overall" ? getRecentTracks(username, from, to, 50, apiKey) : getRecentTracks(username, undefined, undefined, 50, apiKey),
      ]);

    if (!userInfo) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate estimated listening hours
    let totalDurationSeconds = 0;
    const AVERAGE_TRACK_DURATION = 210;
    for (const track of recentTracks) {
      totalDurationSeconds += track.duration > 0 ? track.duration : AVERAGE_TRACK_DURATION;
    }
    const estimatedHoursListened = totalDurationSeconds / 3600;

    const hourlyDistribution = new Array(24).fill(0);
    const dayOfWeekDistribution = new Array(7).fill(0);
    const monthlyMap = new Map<string, number>();
    const uniqueDays = new Set<string>();

    for (const track of recentTracks) {
      if (track.dateUts === 0) continue;
      const date = new Date(track.dateUts * 1000);
      hourlyDistribution[date.getHours()]++;
      let dow = date.getDay() - 1;
      if (dow < 0) dow = 6;
      dayOfWeekDistribution[dow]++;
      const monthKey = date.toLocaleString("en-US", { month: "short", year: "2-digit" });
      monthlyMap.set(monthKey, (monthlyMap.get(monthKey) || 0) + 1);
      uniqueDays.add(date.toISOString().split("T")[0]);
    }

    const peakHour = hourlyDistribution.indexOf(Math.max(...hourlyDistribution));
    const dayNames = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];
    const peakDay = dayNames[dayOfWeekDistribution.indexOf(Math.max(...dayOfWeekDistribution))];

    const sortedDays = Array.from(uniqueDays).sort().map((d) => new Date(d).getTime() / (1000 * 60 * 60 * 24));
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

    const uniqueArtists = new Set(recentTracks.map((t) => t.artist.toLowerCase())).size;
    const uniqueAlbums = new Set(recentTracks.map((t) => `${t.artist.toLowerCase()}|||${t.album.toLowerCase()}`)).size;
    const uniqueTracks = new Set(recentTracks.map((t) => `${t.artist.toLowerCase()}|||${t.name.toLowerCase()}`)).size;

    const sortedByDate = [...recentTracks].sort((a, b) => a.dateUts - b.dateUts);
    const firstTrack = sortedByDate.length > 0
      ? { name: sortedByDate[0].name, artist: sortedByDate[0].artist, date: sortedByDate[0].dateText }
      : { name: "N/A", artist: "N/A", date: "N/A" };
    const lastTrack = sortedByDate.length > 0
      ? { name: sortedByDate[sortedByDate.length - 1].name, artist: sortedByDate[sortedByDate.length - 1].artist, date: sortedByDate[sortedByDate.length - 1].dateText }
      : { name: "N/A", artist: "N/A", date: "N/A" };

    const tracksWithDuration = recentTracks.filter((t) => t.duration > 0);
    let longestTrack = { name: "N/A", artist: "N/A", duration: 0 };
    let shortestTrack = { name: "N/A", artist: "N/A", duration: Infinity };
    for (const t of tracksWithDuration) {
      if (t.duration > longestTrack.duration) longestTrack = { name: t.name, artist: t.artist, duration: t.duration };
      if (t.duration < shortestTrack.duration) shortestTrack = { name: t.name, artist: t.artist, duration: t.duration };
    }
    if (shortestTrack.duration === Infinity) shortestTrack = { name: "N/A", artist: "N/A", duration: 0 };

    const averageTrackDuration = tracksWithDuration.length > 0
      ? tracksWithDuration.reduce((sum, t) => sum + t.duration, 0) / tracksWithDuration.length
      : AVERAGE_TRACK_DURATION;

    const nightScrobbles = hourlyDistribution[0] + hourlyDistribution[1] + hourlyDistribution[2] + hourlyDistribution[3] + hourlyDistribution[4] + hourlyDistribution[5];
    const midnightListener = recentTracks.length > 0 ? nightScrobbles / recentTracks.length > 0.1 : false;
    const weekendScrobbles = dayOfWeekDistribution[5] + dayOfWeekDistribution[6];
    const weekendWarrior = recentTracks.length > 0 ? weekendScrobbles / recentTracks.length > 0.6 : false;

    const totalPeriodScrobbles = topArtists.reduce((sum, a) => sum + a.playcount, 0);
    const topArtistsWithPct = topArtists.slice(0, 10).map((a) => ({
      ...a,
      percentage: totalPeriodScrobbles > 0 ? Math.round((a.playcount / totalPeriodScrobbles) * 100) : 0,
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
        averagePerDay: uniqueDays.size > 0 ? Math.round((recentTracks.length / uniqueDays.size) * 10) / 10 : 0,
        periodLabel: label,
        tracksWithoutDuration: recentTracks.filter((t) => t.duration === 0).length,
      },
      topArtists: topArtistsWithPct,
      topAlbums: topAlbums.slice(0, 10),
      topTags: topTags.slice(0, 15),
      topTracks: topTracks.slice(0, 10),
      listeningPatterns: {
        hourlyDistribution,
        dayOfWeekDistribution,
        monthlyDistribution: Array.from(monthlyMap.entries())
          .map(([month, count]) => ({ month, count }))
          .sort((a, b) => {
            const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
            return months.indexOf(a.month.split(" ")[0]) - months.indexOf(b.month.split(" ")[0]);
          }),
        peakHour,
        peakDay,
        longestStreak,
        busiestDay,
      },
      diversity: { uniqueArtists, uniqueAlbums, uniqueTracks, genreCount: topTags.length },
      funFacts: {
        firstTrack, lastTrack, longestTrack, shortestTrack,
        averageTrackDuration: Math.round(averageTrackDuration),
        mostProductiveHour: peakHour, midnightListener, weekendWarrior,
      },
    });
  } catch (error) {
    console.error("Proxy error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Unknown error" },
      { status: 500 }
    );
  }
}