import { NextResponse } from "next/server";
import { connectDB } from "@/lib/db";
import Feed from "@/models/Feed";
import { resolveFeed } from "@/lib/feedResolver";

export async function GET(req, { params }) {
  try {
    const { property, route } = await params;

    await connectDB();

    // Find the feed configuration (public endpoint - no userId check)
    const feed = await Feed.findOne({
      property,
      route,
      isActive: true,
    });

    if (!feed) {
      return NextResponse.json(
        { error: "Feed not found" },
        { status: 404 }
      );
    }

    // Get query params for pagination
    const { searchParams } = new URL(req.url);
    const queryParams = Object.fromEntries(searchParams.entries());

    // Resolve the feed
    const result = await resolveFeed(feed, queryParams);

    if (result.error) {
      return NextResponse.json(
        { error: result.error },
        { status: 500 }
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    console.error("Feed API error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
