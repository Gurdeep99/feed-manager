import { connectDB } from "@/lib/db";
import Feed from "@/models/Feed";
import jwt from "jsonwebtoken";

function getUserId(req) {
  const auth = req.headers.get("authorization");
  if (!auth?.startsWith("Bearer ")) return null;
  try {
    const decoded = jwt.verify(auth.slice(7), process.env.JWT_SECRET);
    return decoded.id;
  } catch {
    return null;
  }
}

// GET - List all feeds (visible to all users)
export async function GET(req) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const feeds = await Feed.find({})
      .populate("userId", "name email")
      .populate("providerId", "name method url")
      .sort({ createdAt: -1 });

    return Response.json(feeds);
  } catch (error) {
    console.error("Get feeds error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// POST - Create new feed
export async function POST(req) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();

    const feed = await Feed.create({
      userId,
      label: body.label || "",
      name: body.name,
      property: body.property,
      route: body.route,
      providerId: body.providerId || null,
      responseKeyPath: body.responseKeyPath || "",
      feedMeta: body.feedMeta || {},
      itemTemplate: body.itemTemplate || {},
      adConfig: body.adConfig || { enabled: false, positions: [] },
      interstitialAds: body.interstitialAds || null,
      stickyAds: body.stickyAds || null,
      gaEvents: body.gaEvents || null,
      pagination: body.pagination || {},
    });

    return Response.json(feed, { status: 201 });
  } catch (error) {
    console.error("Create feed error:", error);
    if (error.code === 11000) {
      return Response.json(
        { error: "Feed with this property/route already exists" },
        { status: 400 }
      );
    }
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// PUT - Update feed
export async function PUT(req) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const body = await req.json();
    const { id, ...updates } = body;

    const feed = await Feed.findOneAndUpdate(
      { _id: id, userId },
      updates,
      { new: true }
    );

    if (!feed) {
      return Response.json({ error: "Feed not found" }, { status: 404 });
    }

    return Response.json(feed);
  } catch (error) {
    console.error("Update feed error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}

// DELETE - Delete feed
export async function DELETE(req) {
  try {
    const userId = getUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    const feed = await Feed.findOneAndDelete({ _id: id, userId });

    if (!feed) {
      return Response.json({ error: "Feed not found" }, { status: 404 });
    }

    return Response.json({ success: true });
  } catch (error) {
    console.error("Delete feed error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
