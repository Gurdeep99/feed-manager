import Api from "@/models/Api";
import { connectDB } from "@/lib/db";
import { saveStaticJson } from "@/lib/saveStaticJson";
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

export async function GET(req) {
  await connectDB();
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const apis = await Api.find({ userId }).sort({ createdAt: -1 });
  return Response.json(apis);
}

export async function POST(req) {
  await connectDB();
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();

  let s3Key = null;

  if (body.apiType === "STATIC" && body.staticResponse) {
    s3Key = await saveStaticJson(
      `${body.property}/${body.route}`,
      body.staticResponse
    );
  }

  const api = await Api.create({
    ...body,
    userId,
    staticS3Key: s3Key,
  });

  return Response.json(api);
}

export async function PUT(req) {
  await connectDB();
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { id, ...updates } = body;

  if (updates.apiType === "STATIC" && updates.staticResponse) {
    updates.staticS3Key = await saveStaticJson(
      `${updates.property}/${updates.route}`,
      updates.staticResponse
    );
  }

  const api = await Api.findOneAndUpdate(
    { _id: id, userId },
    updates,
    { new: true }
  );

  if (!api) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json(api);
}

export async function DELETE(req) {
  await connectDB();
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  const api = await Api.findOneAndDelete({ _id: id, userId });
  if (!api) return Response.json({ error: "Not found" }, { status: 404 });
  return Response.json({ success: true });
}
