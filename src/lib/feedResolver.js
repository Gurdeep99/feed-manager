import Provider from "@/models/Provider";
import { callExternalApi } from "./callExternalApi";
import { extractKey } from "./extractKey";

// Replace {{field}} placeholders with actual values from item
function applyDataMapTemplate(template, item) {
  if (!template || typeof template !== "object") return {};

  const result = {};

  for (const [key, value] of Object.entries(template)) {
    if (typeof value === "string") {
      // Handle {{field}} or {{field.nested}} placeholders
      const match = value.match(/^\{\{(.+?)\}\}$/);
      if (match) {
        const fieldPath = match[1];
        result[key] = extractKey(item, fieldPath) ?? null;
      } else {
        // Check for mixed placeholders like "prefix_{{field}}_suffix"
        result[key] = value.replace(/\{\{(.+?)\}\}/g, (_, fieldPath) => {
          return extractKey(item, fieldPath) ?? "";
        });
      }
    } else if (typeof value === "boolean" || typeof value === "number") {
      result[key] = value;
    } else if (value === null) {
      result[key] = null;
    } else if (typeof value === "object") {
      // Recursively process nested objects
      result[key] = applyDataMapTemplate(value, item);
    } else {
      result[key] = value;
    }
  }

  return result;
}

export async function resolveFeed(feed, queryParams = {}) {
  try {
    // Get pagination params
    const skip = parseInt(queryParams[feed.pagination?.skipParam || "skip"]) || 0;
    const limit = parseInt(queryParams[feed.pagination?.limitParam || "limit"]) || feed.pagination?.defaultLimit || 20;

    // Fetch data from provider if configured
    let items = [];

    if (feed.providerId) {
      const provider = await Provider.findById(feed.providerId);
      if (!provider) {
        return { error: "Provider not found" };
      }

      // Merge pagination params into provider params
      const providerWithParams = {
        ...provider.toObject(),
        params: {
          ...provider.params,
          [feed.pagination?.skipParam || "skip"]: skip,
          [feed.pagination?.limitParam || "limit"]: limit,
        },
      };

      const response = await callExternalApi(providerWithParams);

      // Extract items from response using key path
      let rawItems = response;
      if (feed.responseKeyPath) {
        rawItems = extractKey(response, feed.responseKeyPath);
      }

      if (!Array.isArray(rawItems)) {
        console.error("Response is not an array:", rawItems);
        rawItems = [];
      }

      // Transform each item using the template
      let position = 1;
      const adPositions = feed.adConfig?.enabled ? (feed.adConfig.positions || []) : [];

      for (const item of rawItems) {
        // Check if we need to insert an ad at this position
        if (adPositions.includes(position)) {
          items.push({
            position,
            componentId: feed.adConfig.componentId || 12,
            contentProvider: feed.adConfig.contentProvider || 4,
            content: {
              id: "AD_UNIT_CONTENT",
              propertyId: null,
              type: "ad_unit_content",
              dateModified: new Date().toISOString(),
              categories: [],
              categoryLabel: null,
              categorySlug: null,
              tags: null,
              dataMap: feed.adConfig.adContent || {},
              bookmarked: false,
            },
          });
          position++;
        }

        // Build the content item
        const dataMap = applyDataMapTemplate(feed.itemTemplate?.dataMapTemplate || {}, item);

        items.push({
          position,
          componentId: feed.itemTemplate?.componentId || 108,
          contentProvider: feed.itemTemplate?.contentProvider || 1,
          content: {
            id: item.id ?? `${position}`,
            propertyId: null,
            type: feed.itemTemplate?.contentType || "video",
            dateModified: item.updated_at ?? item.dateModified ?? null,
            categories: [],
            categoryLabel: null,
            categorySlug: null,
            tags: null,
            dataMap,
            bookmarked: false,
          },
        });
        position++;
      }
    }

    // Build final feed response
    const feedResponse = {
      feedId: feed.feedMeta?.feedId || null,
      feedVersionId: feed.feedMeta?.feedVersionId || null,
      userId: feed.feedMeta?.userId || null,
      sessionId: feed.feedMeta?.sessionId || null,
      pageId: feed.feedMeta?.pageId || null,
      pageNo: feed.feedMeta?.pageNo || 1,
      items,
      feedTitle: feed.feedMeta?.feedTitle || null,
      stickyAds: feed.stickyAds || null,
      interstitialAds: feed.interstitialAds || null,
      gaEvents: feed.gaEvents || null,
    };

    return feedResponse;
  } catch (error) {
    console.error("Feed resolver error:", error);
    return { error: error.message };
  }
}
