import { NextRequest, NextResponse } from "next/server";
import { getUserInfo } from "@/lib/lastfm";

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const username = searchParams.get("username");

    if (!username) {
      return NextResponse.json(
        { error: "Username is required" },
        { status: 400 }
      );
    }

    const userInfo = await getUserInfo(username);

    return NextResponse.json({
      found: true,
      username: userInfo.username,
      realname: userInfo.realname,
      playcount: userInfo.playcount,
      avatar: userInfo.image[userInfo.image.length - 1] || "",
      country: userInfo.country,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unknown error occurred";

    if (message.includes("User not found") || message.includes("error 6")) {
      return NextResponse.json({ found: false, error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ error: message }, { status: 500 });
  }
}