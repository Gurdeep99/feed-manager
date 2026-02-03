import crypto from "crypto";

export async function callExternalApi(provider) {
  try {
    // Extract host from URL
    const urlObj = new URL(provider.url);
    const host = urlObj.host;

    // Generate Postman-like token
    const postmanToken = crypto.randomUUID();

    // Build URL with params for GET requests
    let finalUrl = provider.url;
    if (provider.method === "GET" && provider.params && Object.keys(provider.params).length > 0) {
      const searchParams = new URLSearchParams(provider.params);
      finalUrl = `${provider.url}${provider.url.includes("?") ? "&" : "?"}${searchParams.toString()}`;
    }

    // Postman-like headers
    const headers = {
      "Host": host,
      "User-Agent": "PostmanRuntime/7.51.1",
      "Accept": "*/*",
      "Accept-Encoding": "gzip, deflate, br",
      "Connection": "keep-alive",
      "Postman-Token": postmanToken,
      ...provider.headers,
    };

    // Build fetch options
    const fetchOptions = {
      method: provider.method,
      headers,
    };

    // Add body for POST requests
    if (provider.method === "POST" && provider.body) {
      fetchOptions.body = JSON.stringify(provider.body);
      headers["Content-Type"] = "application/json";
    }

    console.log("=== Calling External API ===");
    console.log("URL:", finalUrl);
    console.log("Method:", provider.method);
    console.log("Headers:", JSON.stringify(headers, null, 2));
    console.log("============================");

    const response = await fetch(finalUrl, fetchOptions);

    if (!response.ok) {
      const errorText = await response.text();
      console.error("External API error response:", response.status, errorText.substring(0, 200));
      throw new Error(`HTTP ${response.status}: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error("External API error:", error.message);
    throw new Error(`External API failed: ${error.message}`);
  }
}
