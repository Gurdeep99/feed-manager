"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";
import Link from "next/link";

export default function ApisPage() {
  const { user } = useAuth();
  const [apis, setApis] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("");
  const [selectedProperty, setSelectedProperty] = useState("");
  const [properties, setProperties] = useState([]);
  const [copiedId, setCopiedId] = useState(null);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/manage/api"),
      apiFetch("/api/manage/properties"),
    ])
      .then(([apisData, propertiesData]) => {
        setApis(apisData);
        setProperties(propertiesData);
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const deleteApi = async (id) => {
    if (!confirm("Are you sure you want to delete this API?")) return;
    try {
      await apiFetch(`/api/manage/api?id=${id}`, { method: "DELETE" });
      setApis(apis.filter((a) => a._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const generateCurl = (api) => {
    const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
    const url = `${baseUrl}/api/${api.property}/${api.route}`;
    if (api.method === "POST") {
      return `curl -X POST "${url}" -H "Content-Type: application/json" -d '{}'`;
    }
    return `curl "${url}"`;
  };

  const copyToClipboard = (text, id) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const filteredApis = apis.filter((api) => {
    const matchesSearch =
      !filter ||
      api.property.toLowerCase().includes(filter.toLowerCase()) ||
      api.route.toLowerCase().includes(filter.toLowerCase());
    const matchesProperty = !selectedProperty || api.property === selectedProperty;
    return matchesSearch && matchesProperty;
  });

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">APIs</h1>
          <Link
            href="/dashboard/apis/create"
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium"
          >
            + Create API
          </Link>
        </div>

        {/* Filters */}
        <div className="flex gap-4">
          <input
            type="text"
            placeholder="Search APIs..."
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="flex-1 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          />
          <select
            value={selectedProperty}
            onChange={(e) => setSelectedProperty(e.target.value)}
            className="px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500"
          >
            <option value="">All Properties</option>
            {properties.map((prop) => (
              <option key={prop} value={prop}>
                {prop}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <div className="text-gray-400">Loading APIs...</div>
        ) : filteredApis.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <p className="text-gray-400">No APIs found</p>
            <Link href="/dashboard/apis/create" className="text-blue-400 hover:underline mt-2 inline-block">
              Create your first API
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApis.map((api) => (
              <div
                key={api._id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <span
                        className={`text-xs px-2 py-0.5 rounded font-medium ${
                          api.method === "POST"
                            ? "bg-green-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {api.method}
                      </span>
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          api.apiType === "STATIC"
                            ? "bg-purple-600 text-white"
                            : "bg-orange-600 text-white"
                        }`}
                      >
                        {api.apiType}
                      </span>
                      {api.rotation > 1 && (
                        <span className="text-xs px-2 py-0.5 rounded bg-gray-600 text-white">
                          x{api.rotation}
                        </span>
                      )}
                      {api.label && (
                        <span className="text-xs px-2 py-0.5 rounded bg-cyan-600 text-white">
                          {api.label}
                        </span>
                      )}
                    </div>
                    <p className="text-white font-mono text-lg">
                      /api/{api.property}/{api.route}
                    </p>
                    <div className="flex items-center gap-4 mt-1">
                      <span className="text-gray-500 text-sm">
                        {api.hitCount || 0} hits
                      </span>
                      <span className="text-gray-500 text-sm">
                        By: {api.userId?.name || "Unknown"}
                      </span>
                      <span className="text-gray-600 text-xs">
                        Updated: {new Date(api.updatedAt).toLocaleDateString("en-US", {
                          month: "short",
                          day: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => copyToClipboard(generateCurl(api), api._id)}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
                    >
                      {copiedId === api._id ? "Copied!" : "cURL"}
                    </button>
                    {api.userId?._id === user?.id && (
                      <>
                        <Link
                          href={`/dashboard/apis/${api._id}/edit`}
                          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => deleteApi(api._id)}
                          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                          Delete
                        </button>
                      </>
                    )}
                  </div>
                </div>

                {/* cURL Preview */}
                <div className="mt-3 p-2 bg-gray-900 rounded font-mono text-sm text-gray-400 overflow-x-auto">
                  {generateCurl(api)}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
