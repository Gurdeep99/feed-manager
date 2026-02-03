import { connectDB } from "@/lib/db";
import Provider from "@/models/Provider";
import jwt from "jsonwebtoken";
import axios from "axios";

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
  try {
    const userId = getUserId(req);
    if (!userId) {
      return Response.json({ error: "Unauthorized" }, { status: 401 });
    }

    await connectDB();

    const { providerId } = await req.json();

    const provider = await Provider.findOne({ _id: providerId, userId });
    if (!provider) {
      return Response.json({ error: "Provider not found" }, { status: 404 });
    }

    // Test the API call like Postman
    const startTime = Date.now();

    // Log request details
    const requestConfig = {
      method: provider.method,
      url: provider.url,
      headers: provider.headers || {},
      params: provider.method === "GET" ? (provider.params || {}) : {},
      body: provider.method === "POST" ? (provider.body || {}) : undefined,
    };
    console.log("=== Test API Request ===");
    console.log("Method:", requestConfig.method);
    console.log("URL:", requestConfig.url);
    console.log("Headers:", JSON.stringify(requestConfig.headers, null, 2));
    console.log("Params:", JSON.stringify(requestConfig.params, null, 2));
    if (requestConfig.body) {
      console.log("Body:", JSON.stringify(requestConfig.body, null, 2));
    }
    console.log("========================");

    try {
      const response = await axios({
        method: provider.method,
        url: provider.url,
        headers: provider.headers || {},
        params: provider.method === "GET" ? (provider.params || {}) : {},
        data: provider.method === "POST" ? (provider.body || {}) : {},
        timeout: 30000,
        validateStatus: () => true, // Don't throw on any status code
      });

      const duration = Date.now() - startTime;

      console.log("=== Test API Response ===");
      console.log("Status:", response.status, response.statusText);
      console.log("Duration:", duration, "ms");
      console.log("=========================");

      return Response.json({
        success: response.status >= 200 && response.status < 300,
        status: response.status,
        statusText: response.statusText,
        duration,
        request: requestConfig,
        dataPreview: typeof response.data === "object"
          ? JSON.stringify(response.data, null, 2).substring(0, 500)
          : String(response.data).substring(0, 500),
      });
    } catch (axiosError) {
      const duration = Date.now() - startTime;

      return Response.json({
        success: false,
        status: axiosError.response?.status || 0,
        statusText: axiosError.message,
        duration,
        error: axiosError.message,
      });
    }
  } catch (error) {
    console.error("Test provider error:", error);
    return Response.json({ error: error.message }, { status: 500 });
  }
}
