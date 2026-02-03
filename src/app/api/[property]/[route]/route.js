import Api from "@/models/Api";
import ApiHit from "@/models/ApiHit";
import { connectDB } from "@/lib/db";
import { resolveApi } from "@/lib/apiResolver";
import { applyRotation } from "@/lib/rotation";

async function handleRequest(req, params) {
  await connectDB();

  const { property, route } = await params;

  const api = await Api.findOne({ property, route });

  if (!api) {
    return Response.json({ error: "API not found" }, { status: 404 });
  }

  // Track the hit
  await Promise.all([
    Api.updateOne({ _id: api._id }, { $inc: { hitCount: 1 } }),
    ApiHit.create({
      apiId: api._id,
      ip: req.headers.get("x-forwarded-for") || "unknown",
      userAgent: req.headers.get("user-agent") || "unknown",
    }),
  ]);

  let data = await resolveApi(api);

  // Apply rotation if specified (rotation > 1)
  // rotation = 0 means use source data as-is (no rotation)
  // rotation = 1 means no rotation
  // rotation > 1 means repeat data N times
  if (api.rotation && api.rotation > 1) {
    data = applyRotation(data, api.rotation);
  }

  return Response.json(data);
}

export async function GET(req, { params }) {
  return handleRequest(req, params);
}

export async function POST(req, { params }) {
  return handleRequest(req, params);
}
