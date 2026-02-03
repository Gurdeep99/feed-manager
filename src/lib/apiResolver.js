import Provider from "@/models/Provider";
import { callExternalApi } from "./callExternalApi";
import { extractKey } from "./extractKey";
import { resolveDatabase } from "./dbResolver";
import { getObject } from "./s3";

// Apply template to transform each item in the array
function applyTemplate(dataArray, template) {
  if (!template || !Array.isArray(dataArray)) {
    return dataArray;
  }

  return dataArray.map((item) => {
    const result = {};
    for (const [key, value] of Object.entries(template)) {
      if (typeof value === "string" && value.startsWith("{{") && value.endsWith("}}")) {
        // Extract field name from {{fieldName}}
        const fieldPath = value.slice(2, -2).trim();
        result[key] = extractKey(item, fieldPath);
      } else if (typeof value === "object" && value !== null) {
        // Recursively handle nested templates
        result[key] = applyTemplateValue(value, item);
      } else {
        result[key] = value;
      }
    }
    return result;
  });
}

// Helper to apply template values recursively
function applyTemplateValue(template, item) {
  if (typeof template === "string" && template.startsWith("{{") && template.endsWith("}}")) {
    const fieldPath = template.slice(2, -2).trim();
    return extractKey(item, fieldPath);
  }
  if (Array.isArray(template)) {
    return template.map((t) => applyTemplateValue(t, item));
  }
  if (typeof template === "object" && template !== null) {
    const result = {};
    for (const [key, value] of Object.entries(template)) {
      result[key] = applyTemplateValue(value, item);
    }
    return result;
  }
  return template;
}

export async function resolveApi(api) {
  // STATIC - return stored response or fetch from S3
  if (api.apiType === "STATIC") {
    if (api.staticResponse) {
      return api.staticResponse;
    }
    if (api.staticS3Key) {
      try {
        const str = await getObject(process.env.R2_BUCKET, api.staticS3Key);
        return JSON.parse(str);
      } catch (err) {
        console.error("R2 fetch error:", err);
        return { error: "Failed to fetch static response" };
      }
    }
    return {};
  }

  // DYNAMIC → API
  if (api.apiType === "DYNAMIC" && api.dynamicConfig?.type === "API") {
    const provider = await Provider.findById(api.dynamicConfig.providerId);
    if (!provider) {
      return { error: "Provider not found" };
    }

    const rawData = await callExternalApi(provider);

    // Extract nested data if responseKeyPath is specified
    let dynamicData = rawData;
    if (api.dynamicConfig.responseKeyPath) {
      dynamicData = extractKey(rawData, api.dynamicConfig.responseKeyPath);
    }

    // Apply template transformation if specified
    const template = api.dynamicConfig.dynamicDataTemplate;
    if (template && Array.isArray(dynamicData)) {
      dynamicData = applyTemplate(dynamicData, template);
    }

    // Merge static data with dynamic data if configured
    const staticData = api.dynamicConfig.staticData || {};
    const dynamicDataKey = api.dynamicConfig.dynamicDataKey;

    if (dynamicDataKey) {
      // Merge: { ...staticData, [dynamicDataKey]: dynamicData }
      return {
        ...staticData,
        [dynamicDataKey]: dynamicData,
      };
    }

    // If no dynamicDataKey, just return dynamic data (or merge if staticData exists)
    if (Object.keys(staticData).length > 0) {
      return { ...staticData, data: dynamicData };
    }

    return dynamicData;
  }

  // DYNAMIC → DATABASE
  if (api.apiType === "DYNAMIC" && api.dynamicConfig?.type === "DATABASE") {
    return resolveDatabase(api);
  }

  return { error: "Unknown API type" };
}
