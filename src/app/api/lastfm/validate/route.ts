import { NextRequest, NextResponse } from "next/server";
import { getUserInfo } from "@/lib/lastfm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username || username.length < 2) {
      return NextResponse.json({ valid: false, error: "Username too short" }, { status: 400 });
    }

    const user = await getUserInfo(username);

    return NextResponse.json({
      valid: true,
      username: user.username,
      realname: user.realname || user.username,
      playcount: user.playcount,
      avatar: user.image[user.image.length - 1] || "",
    });
  } catch {
    return NextResponse.json({ valid: false, error: "User not found" });
  }
}