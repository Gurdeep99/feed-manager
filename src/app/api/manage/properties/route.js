import Api from "@/models/Api";
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

export async function GET(req) {
  await connectDB();
  const userId = getUserId(req);
  if (!userId) return Response.json({ error: "Unauthorized" }, { status: 401 });

  const properties = await Api.distinct("property", { userId });
  return Response.json(properties);
}
