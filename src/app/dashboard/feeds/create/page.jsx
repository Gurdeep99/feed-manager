"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";

// Helper to fix curly quotes
function fixQuotes(str) {
  if (!str) return str;
  return str
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'");
}

function validateJson(str) {
  if (!str || !str.trim()) return null;
  try {
    JSON.parse(fixQuotes(str));
    return null;
  } catch (e) {
    return e.message;
  }
}

export default function CreateFeedPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [providers, setProviders] = useState([]);
  const [properties, setProperties] = useState([]);

  // Basic info
  const [name, setName] = useState("");
  const [label, setLabel] = useState("");
  const [property, setProperty] = useState("");
  const [newProperty, setNewProperty] = useState("");
  const [route, setRoute] = useState("");
  const [providerId, setProviderId] = useState("");
  const [responseKeyPath, setResponseKeyPath] = useState("");

  // Feed meta
  const [feedMeta, setFeedMeta] = useState(
    JSON.stringify(
      {
        feedId: 2350,
        feedVersionId: 2351,
        userId: "test0000112",
        sessionId: "51b526c5-8b4d-482b-8a98-1315831dac75",
        pageId: "e1c70798-4d18-4692-8a25-6cff8b8f3208",
        pageNo: 1,
        feedTitle: null,
      },
      null,
      2
    )
  );

  // Item template
  const [itemTemplate, setItemTemplate] = useState(
    JSON.stringify(
      {
        componentId: 108,
        contentProvider: 1,
        contentType: "video",
        dataMapTemplate: {
          image: "{{thumb_image}}",
          video_duration: null,
          title_hn: "{{title_hn}}",
          mute: false,
          is_native_player: true,
          synopsis: "{{title_hn}}",
          youtube_id: null,
          autoplay: false,
          video_type: "{{type_v}}",
          thumbnail_image: "{{thumb_image}}",
          full_slug: "{{share_url}}",
          is_premium: false,
          video_url: "{{url}}",
          author_name: "",
          author_slug: "",
        },
      },
      null,
      2
    )
  );

  // Ad config
  const [adEnabled, setAdEnabled] = useState(true);
  const [adPositions, setAdPositions] = useState("4, 8, 12, 16, 20");
  const [adConfig, setAdConfig] = useState(
    JSON.stringify(
      {
        componentId: 12,
        contentProvider: 4,
        adContent: {
          ad_id: "/188001951/AUW_App_HP_Header_300x250",
          target_url: "",
          title: "Homepage Header Ad",
          click_action: "",
        },
      },
      null,
      2
    )
  );

  // Interstitial ads
  const [interstitialAds, setInterstitialAds] = useState(
    JSON.stringify(
      {
        id: "interstitial_ad_unit_content",
        propertyId: null,
        type: "interstitial_ad_unit_content",
        dateModified: null,
        categories: null,
        categoryLabel: null,
        categorySlug: null,
        tags: null,
        dataMap: {
          ad_id: "/188001951/AUW_App_Ros_1x1",
          target_url: "",
          title: "Interstitial Ad",
          click_action: "",
        },
        bookmarked: false,
      },
      null,
      2
    )
  );

  // GA Events
  const [gaEvents, setGaEvents] = useState(
    JSON.stringify(
      {
        parent_category: "other",
        child_category: "other",
        location_state: "other",
        location_city: "other",
        unit_name: "other",
      },
      null,
      2
    )
  );

  // Pagination
  const [skipParam, setSkipParam] = useState("skip");
  const [limitParam, setLimitParam] = useState("limit");
  const [defaultLimit, setDefaultLimit] = useState(20);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/manage/provider").catch(() => []),
      apiFetch("/api/manage/properties").catch(() => []),
    ]).then(([provs, props]) => {
      setProviders(provs || []);
      setProperties(props || []);
    });
  }, []);

  const handleSubmit = async () => {
    setLoading(true);
    setError("");

    try {
      // Validate all JSON fields
      const jsonFields = [
        { name: "Feed Meta", value: feedMeta },
        { name: "Item Template", value: itemTemplate },
        { name: "Ad Config", value: adConfig },
        { name: "Interstitial Ads", value: interstitialAds },
        { name: "GA Events", value: gaEvents },
      ];

      for (const field of jsonFields) {
        const err = validateJson(field.value);
        if (err) {
          throw new Error(`Invalid JSON in ${field.name}: ${err}`);
        }
      }

      const parsedFeedMeta = JSON.parse(fixQuotes(feedMeta));
      const parsedItemTemplate = JSON.parse(fixQuotes(itemTemplate));
      const parsedAdConfig = JSON.parse(fixQuotes(adConfig));
      const parsedInterstitialAds = JSON.parse(fixQuotes(interstitialAds));
      const parsedGaEvents = JSON.parse(fixQuotes(gaEvents));

      const payload = {
        name,
        label,
        property: newProperty || property,
        route,
        providerId: providerId || null,
        responseKeyPath,
        feedMeta: parsedFeedMeta,
        itemTemplate: parsedItemTemplate,
        adConfig: {
          enabled: adEnabled,
          positions: adPositions
            .split(",")
            .map((p) => parseInt(p.trim()))
            .filter((p) => !isNaN(p)),
          ...parsedAdConfig,
        },
        interstitialAds: parsedInterstitialAds,
        gaEvents: parsedGaEvents,
        pagination: {
          skipParam,
          limitParam,
          defaultLimit: parseInt(defaultLimit) || 20,
        },
      };

      await apiFetch("/api/manage/feed", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      router.push("/dashboard/feeds");
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto space-y-6">
        <h1 className="text-2xl font-bold text-white">Create Feed Controller</h1>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {/* Basic Info */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4">
          <h2 className="text-lg font-semibold text-white">Basic Info</h2>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1 text-sm">Feed Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="Video Shorts Feed"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1 text-sm">Label (optional)</label>
              <input
                type="text"
                value={label}
                onChange={(e) => setLabel(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="My Feed, Test Config"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1 text-sm">Property</label>
              <select
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              >
                <option value="">Select or type new...</option>
                {properties.map((p) => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
              <input
                type="text"
                value={newProperty}
                onChange={(e) => setNewProperty(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white mt-2"
                placeholder="Or enter new property..."
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1 text-sm">Route</label>
              <input
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                placeholder="video-shots"
              />
            </div>
          </div>

          <div>
            <label className="block text-gray-300 mb-1 text-sm">Data Provider</label>
            <select
              value={providerId}
              onChange={(e) => setProviderId(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            >
              <option value="">Select provider...</option>
              {providers.map((p) => (
                <option key={p._id} value={p._id}>
                  {p.name} ({p.method} {p.url})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-gray-300 mb-1 text-sm">
              Response Key Path (e.g., shorts_list, data.items)
            </label>
            <input
              type="text"
              value={responseKeyPath}
              onChange={(e) => setResponseKeyPath(e.target.value)}
              className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              placeholder="shorts_list"
            />
          </div>
        </div>

        {/* Feed Meta */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4">
          <h2 className="text-lg font-semibold text-white">Feed Metadata</h2>
          <textarea
            value={feedMeta}
            onChange={(e) => setFeedMeta(e.target.value)}
            className={`w-full px-3 py-2 bg-gray-700 border rounded text-white font-mono text-sm ${
              validateJson(feedMeta) ? "border-red-500" : "border-gray-600"
            }`}
            rows={8}
          />
          {validateJson(feedMeta) && (
            <p className="text-red-400 text-sm">{validateJson(feedMeta)}</p>
          )}
        </div>

        {/* Item Template */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4">
          <h2 className="text-lg font-semibold text-white">Item Template</h2>
          <p className="text-gray-400 text-sm">
            Use {"{{field}}"} to map fields from provider response. E.g., {"{{thumb_image}}"}, {"{{title_hn}}"}
          </p>
          <textarea
            value={itemTemplate}
            onChange={(e) => setItemTemplate(e.target.value)}
            className={`w-full px-3 py-2 bg-gray-700 border rounded text-white font-mono text-sm ${
              validateJson(itemTemplate) ? "border-red-500" : "border-gray-600"
            }`}
            rows={20}
          />
          {validateJson(itemTemplate) && (
            <p className="text-red-400 text-sm">{validateJson(itemTemplate)}</p>
          )}
        </div>

        {/* Ad Configuration */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">Ad Configuration</h2>
            <label className="flex items-center gap-2">
              <input
                type="checkbox"
                checked={adEnabled}
                onChange={(e) => setAdEnabled(e.target.checked)}
                className="w-4 h-4"
              />
              <span className="text-gray-300 text-sm">Enable Ads</span>
            </label>
          </div>

          {adEnabled && (
            <>
              <div>
                <label className="block text-gray-300 mb-1 text-sm">
                  Ad Positions (comma-separated)
                </label>
                <input
                  type="text"
                  value={adPositions}
                  onChange={(e) => setAdPositions(e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  placeholder="4, 8, 12, 16, 20"
                />
              </div>
              <textarea
                value={adConfig}
                onChange={(e) => setAdConfig(e.target.value)}
                className={`w-full px-3 py-2 bg-gray-700 border rounded text-white font-mono text-sm ${
                  validateJson(adConfig) ? "border-red-500" : "border-gray-600"
                }`}
                rows={10}
              />
              {validateJson(adConfig) && (
                <p className="text-red-400 text-sm">{validateJson(adConfig)}</p>
              )}
            </>
          )}
        </div>

        {/* Interstitial Ads */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4">
          <h2 className="text-lg font-semibold text-white">Interstitial Ads</h2>
          <textarea
            value={interstitialAds}
            onChange={(e) => setInterstitialAds(e.target.value)}
            className={`w-full px-3 py-2 bg-gray-700 border rounded text-white font-mono text-sm ${
              validateJson(interstitialAds) ? "border-red-500" : "border-gray-600"
            }`}
            rows={12}
          />
          {validateJson(interstitialAds) && (
            <p className="text-red-400 text-sm">{validateJson(interstitialAds)}</p>
          )}
        </div>

        {/* GA Events */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4">
          <h2 className="text-lg font-semibold text-white">GA Events</h2>
          <textarea
            value={gaEvents}
            onChange={(e) => setGaEvents(e.target.value)}
            className={`w-full px-3 py-2 bg-gray-700 border rounded text-white font-mono text-sm ${
              validateJson(gaEvents) ? "border-red-500" : "border-gray-600"
            }`}
            rows={8}
          />
          {validateJson(gaEvents) && (
            <p className="text-red-400 text-sm">{validateJson(gaEvents)}</p>
          )}
        </div>

        {/* Pagination */}
        <div className="bg-gray-800 rounded-lg border border-gray-700 p-4 space-y-4">
          <h2 className="text-lg font-semibold text-white">Pagination</h2>
          <div className="grid grid-cols-3 gap-4">
            <div>
              <label className="block text-gray-300 mb-1 text-sm">Skip Param</label>
              <input
                type="text"
                value={skipParam}
                onChange={(e) => setSkipParam(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1 text-sm">Limit Param</label>
              <input
                type="text"
                value={limitParam}
                onChange={(e) => setLimitParam(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1 text-sm">Default Limit</label>
              <input
                type="number"
                value={defaultLimit}
                onChange={(e) => setDefaultLimit(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>
        </div>

        {/* Submit */}
        <div className="flex gap-4">
          <button
            onClick={() => router.push("/dashboard/feeds")}
            className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={loading || !name || (!property && !newProperty) || !route}
            className="flex-1 px-6 py-2 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white rounded-lg"
          >
            {loading ? "Creating..." : "Create Feed"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
