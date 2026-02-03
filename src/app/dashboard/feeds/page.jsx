"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";

export default function FeedsPage() {
  const router = useRouter();
  const [feeds, setFeeds] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadFeeds();
  }, []);

  const loadFeeds = async () => {
    try {
      const data = await apiFetch("/api/manage/feed");
      setFeeds(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this feed?")) return;
    try {
      await apiFetch(`/api/manage/feed?id=${id}`, { method: "DELETE" });
      setFeeds(feeds.filter((f) => f._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const copyEndpoint = (feed) => {
    const url = `${window.location.origin}/api/feed/${feed.property}/${feed.route}`;
    navigator.clipboard.writeText(url);
    alert("Endpoint copied!");
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Feed Controllers</h1>
          <button
            onClick={() => router.push("/dashboard/feeds/create")}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + Create Feed
          </button>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading feeds...</div>
        ) : feeds.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <p className="text-gray-400">No feeds configured</p>
            <button
              onClick={() => router.push("/dashboard/feeds/create")}
              className="text-blue-400 hover:underline mt-2"
            >
              Create your first feed controller
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {feeds.map((feed) => (
              <div
                key={feed._id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{feed.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs px-2 py-0.5 rounded bg-purple-600 text-white">
                        FEED
                      </span>
                      <span className="text-gray-400 text-sm font-mono">
                        /api/feed/{feed.property}/{feed.route}
                      </span>
                    </div>
                    {feed.providerId && (
                      <div className="text-gray-500 text-xs mt-1">
                        Provider: {feed.providerId.name || "Unknown"}
                      </div>
                    )}
                    {feed.adConfig?.enabled && (
                      <div className="text-yellow-500 text-xs mt-1">
                        Ads at positions: {feed.adConfig.positions?.join(", ")}
                      </div>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyEndpoint(feed)}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
                    >
                      Copy URL
                    </button>
                    <button
                      onClick={() => router.push(`/dashboard/feeds/edit/${feed._id}`)}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(feed._id)}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
