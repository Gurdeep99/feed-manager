import DatabaseConfig from "@/models/DatabaseConfig";
import { connectDB } from "@/lib/db";
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

export async function POST(req) {
  await connectDB();
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const config = await DatabaseConfig.create({ ...body, userId, label: body.label || "" });
  return Response.json(config);
}

export async function GET(req) {
  await connectDB();
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const list = await DatabaseConfig.find({})
    .populate("userId", "name email")
    .sort({ createdAt: -1 });
  return Response.json(list);
}

export async function PUT(req) {
  await connectDB();
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;

  const config = await DatabaseConfig.findOneAndUpdate(
    { _id: id, userId },
    updates,
    { new: true }
  );

  if (!config) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(config);
}

export async function DELETE(req) {
  await connectDB();
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const config = await DatabaseConfig.findOneAndDelete({ _id: id, userId });
  if (!config) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ success: true });
}
