"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import Link from "next/link";

export default function Dashboard() {
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    apiFetch("/api/manage/analytics")
      .then(setAnalytics)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Dashboard Overview</h1>
          <Link
            href="/dashboard/apis/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Create API
          </Link>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading analytics...</div>
        ) : analytics ? (
          <>
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Total APIs</p>
                <p className="text-3xl font-bold text-white mt-1">{analytics.totalApis}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Total Hits</p>
                <p className="text-3xl font-bold text-white mt-1">{analytics.totalHits}</p>
              </div>
              <div className="bg-gray-800 rounded-lg p-6 border border-gray-700">
                <p className="text-gray-400 text-sm">Hits (24h)</p>
                <p className="text-3xl font-bold text-white mt-1">{analytics.recentHits}</p>
              </div>
            </div>

            {/* Top APIs */}
            <div className="bg-gray-800 rounded-lg border border-gray-700">
              <div className="p-4 border-b border-gray-700">
                <h2 className="text-lg font-semibold text-white">Top APIs by Hits</h2>
              </div>
              <div className="divide-y divide-gray-700">
                {analytics.hitsByApi.length === 0 ? (
                  <div className="p-4 text-gray-400">No APIs created yet</div>
                ) : (
                  analytics.hitsByApi.slice(0, 5).map((api) => (
                    <div key={api.id} className="p-4 flex justify-between items-center">
                      <div>
                        <span className="text-xs bg-blue-600 text-white px-2 py-0.5 rounded mr-2">
                          {api.method}
                        </span>
                        <span className="text-white">
                          /api/{api.property}/{api.route}
                        </span>
                      </div>
                      <span className="text-gray-400">{api.hits} hits</span>
                    </div>
                  ))
                )}
              </div>
            </div>

            {/* Recent Activity */}
            {analytics.hitsOverTime.length > 0 && (
              <div className="bg-gray-800 rounded-lg border border-gray-700 p-4">
                <h2 className="text-lg font-semibold text-white mb-4">Hits (Last 7 Days)</h2>
                <div className="flex items-end gap-2 h-32">
                  {analytics.hitsOverTime.map((day) => {
                    const maxHits = Math.max(...analytics.hitsOverTime.map((d) => d.count));
                    const height = maxHits > 0 ? (day.count / maxHits) * 100 : 0;
                    return (
                      <div key={day._id} className="flex-1 flex flex-col items-center">
                        <div
                          className="w-full bg-blue-600 rounded-t"
                          style={{ height: `${height}%`, minHeight: day.count > 0 ? "4px" : "0" }}
                        />
                        <span className="text-xs text-gray-500 mt-1">
                          {day._id.slice(5)}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </>
        ) : (
          <div className="text-gray-400">Failed to load analytics</div>
        )}
      </div>
    </DashboardLayout>
  );
}
