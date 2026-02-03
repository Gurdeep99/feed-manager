import Api from "@/models/Api";
import ApiHit from "@/models/ApiHit";
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

  const apis = await Api.find({ userId });
  const apiIds = apis.map((a) => a._id);

  const totalApis = apis.length;
  const totalHits = apis.reduce((sum, api) => sum + (api.hitCount || 0), 0);

  // Get recent hits (last 24 hours)
  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentHits = await ApiHit.countDocuments({
    apiId: { $in: apiIds },
    timestamp: { $gte: oneDayAgo },
  });

  // Get hits by API
  const hitsByApi = apis.map((api) => ({
    id: api._id,
    property: api.property,
    route: api.route,
    method: api.method,
    hits: api.hitCount || 0,
  })).sort((a, b) => b.hits - a.hits);

  // Get hits over time (last 7 days)
  const sevenDaysAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
  const hitsOverTime = await ApiHit.aggregate([
    {
      $match: {
        apiId: { $in: apiIds },
        timestamp: { $gte: sevenDaysAgo },
      },
    },
    {
      $group: {
        _id: {
          $dateToString: { format: "%Y-%m-%d", date: "$timestamp" },
        },
        count: { $sum: 1 },
      },
    },
    { $sort: { _id: 1 } },
  ]);

  return Response.json({
    totalApis,
    totalHits,
    recentHits,
    hitsByApi,
    hitsOverTime,
  });
}
