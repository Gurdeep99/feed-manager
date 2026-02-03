"use client";

import { useState, useEffect, use } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";

export default function EditApi({ params }) {
  const { id } = use(params);
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [api, setApi] = useState(null);
  const [property, setProperty] = useState("");
  const [route, setRoute] = useState("");
  const [method, setMethod] = useState("GET");
  const [apiType, setApiType] = useState("STATIC");
  const [rotation, setRotation] = useState(1);
  const [staticJson, setStaticJson] = useState("{}");
  const [params_, setParams] = useState([]);
  const [bodyKeys, setBodyKeys] = useState([]);

  // Dynamic fields
  const [dynamicType, setDynamicType] = useState("");
  const [selectedProvider, setSelectedProvider] = useState("");
  const [responseKeyPath, setResponseKeyPath] = useState("");
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [collection, setCollection] = useState("");
  const [query, setQuery] = useState("{}");

  const [providers, setProviders] = useState([]);
  const [databases, setDatabases] = useState([]);

  useEffect(() => {
    Promise.all([
      apiFetch("/api/manage/provider").catch(() => []),
      apiFetch("/api/manage/database").catch(() => []),
    ]).then(([provs, dbs]) => {
      setProviders(provs || []);
      setDatabases(dbs || []);
    });

    const fetchApi = async () => {
      try {
        const apis = await apiFetch("/api/manage/api");
        const found = apis.find((a) => a._id === id);
        if (!found) {
          router.push("/dashboard/apis");
          return;
        }

        setApi(found);
        setProperty(found.property);
        setRoute(found.route);
        setMethod(found.method || "GET");
        setApiType(found.apiType);
        setRotation(found.rotation || 1);
        setParams(found.params || []);
        setBodyKeys(found.bodyKeys || []);

        if (found.apiType === "STATIC" && found.staticResponse) {
          setStaticJson(JSON.stringify(found.staticResponse, null, 2));
        }

        if (found.dynamicConfig) {
          setDynamicType(found.dynamicConfig.type || "");
          setSelectedProvider(found.dynamicConfig.providerId || "");
          setResponseKeyPath(found.dynamicConfig.responseKeyPath || "");
          setSelectedDatabase(found.dynamicConfig.databaseConfigId || "");
          setCollection(found.dynamicConfig.collection || "");
          setQuery(JSON.stringify(found.dynamicConfig.query || {}, null, 2));
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchApi();
  }, [id, router]);

  const loadApi = async () => {
    try {
      const apis = await apiFetch("/api/manage/api");
      const found = apis.find((a) => a._id === id);
      if (!found) {
        router.push("/dashboard/apis");
        return;
      }

      setApi(found);
      setProperty(found.property);
      setRoute(found.route);
      setMethod(found.method || "GET");
      setApiType(found.apiType);
      setRotation(found.rotation || 1);
      setParams(found.params || []);
      setBodyKeys(found.bodyKeys || []);

      if (found.apiType === "STATIC" && found.staticResponse) {
        setStaticJson(JSON.stringify(found.staticResponse, null, 2));
      }

      if (found.dynamicConfig) {
        setDynamicType(found.dynamicConfig.type || "");
        setSelectedProvider(found.dynamicConfig.providerId || "");
        setResponseKeyPath(found.dynamicConfig.responseKeyPath || "");
        setSelectedDatabase(found.dynamicConfig.databaseConfigId || "");
        setCollection(found.dynamicConfig.collection || "");
        setQuery(JSON.stringify(found.dynamicConfig.query || {}, null, 2));
      }
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const addParam = () => setParams([...params_, { key: "", description: "" }]);
  const removeParam = (index) => setParams(params_.filter((_, i) => i !== index));
  const updateParam = (index, field, value) => {
    const updated = [...params_];
    updated[index][field] = value;
    setParams(updated);
  };

  const addBodyKey = () => setBodyKeys([...bodyKeys, { key: "", description: "" }]);
  const removeBodyKey = (index) => setBodyKeys(bodyKeys.filter((_, i) => i !== index));
  const updateBodyKey = (index, field, value) => {
    const updated = [...bodyKeys];
    updated[index][field] = value;
    setBodyKeys(updated);
  };

  const handleSubmit = async () => {
    setSaving(true);
    setError("");

    try {
      const payload = {
        id,
        property,
        route,
        apiType,
        method,
        rotation: parseInt(rotation) || 1,
        params: params_.filter((p) => p.key),
        bodyKeys: method === "POST" ? bodyKeys.filter((b) => b.key) : [],
      };

      if (apiType === "STATIC") {
        payload.staticResponse = JSON.parse(staticJson);
      } else if (apiType === "DYNAMIC") {
        payload.dynamicConfig = {
          type: dynamicType,
        };
        if (dynamicType === "API") {
          payload.dynamicConfig.providerId = selectedProvider;
          payload.dynamicConfig.responseKeyPath = responseKeyPath;
        } else if (dynamicType === "DATABASE") {
          payload.dynamicConfig.databaseConfigId = selectedDatabase;
          payload.dynamicConfig.collection = collection;
          payload.dynamicConfig.query = JSON.parse(query);
        }
      }

      await apiFetch("/api/manage/api", {
        method: "PUT",
        body: JSON.stringify(payload),
      });

      router.push("/dashboard/apis");
    } catch (err) {
      setError(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="text-gray-400">Loading...</div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Edit API</h1>
          <button
            onClick={() => router.push("/dashboard/apis")}
            className="text-gray-400 hover:text-white"
          >
            Cancel
          </button>
        </div>

        {error && (
          <div className="p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        <div className="bg-gray-800 rounded-lg border border-gray-700 p-6 space-y-4">
          {/* Property & Route */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-gray-300 mb-1 text-sm">Property</label>
              <input
                type="text"
                value={property}
                onChange={(e) => setProperty(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
            <div>
              <label className="block text-gray-300 mb-1 text-sm">Route</label>
              <input
                type="text"
                value={route}
                onChange={(e) => setRoute(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
              />
            </div>
          </div>

          {/* Method */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm">HTTP Method</label>
            <div className="flex gap-2">
              {["GET", "POST"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-4 py-2 rounded ${
                    method === m
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* API Type */}
          <div>
            <label className="block text-gray-300 mb-2 text-sm">API Type</label>
            <div className="flex gap-2">
              {["STATIC", "DYNAMIC"].map((t) => (
                <button
                  key={t}
                  onClick={() => setApiType(t)}
                  className={`px-4 py-2 rounded ${
                    apiType === t
                      ? "bg-blue-600 text-white"
                      : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                  }`}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          {/* Static Config */}
          {apiType === "STATIC" && (
            <div>
              <label className="block text-gray-300 mb-1 text-sm">JSON Response</label>
              <textarea
                rows={10}
                value={staticJson}
                onChange={(e) => setStaticJson(e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
              />
            </div>
          )}

          {/* Dynamic Config */}
          {apiType === "DYNAMIC" && (
            <>
              <div>
                <label className="block text-gray-300 mb-2 text-sm">Dynamic Type</label>
                <div className="flex gap-2">
                  {["API", "DATABASE"].map((t) => (
                    <button
                      key={t}
                      onClick={() => setDynamicType(t)}
                      className={`px-4 py-2 rounded ${
                        dynamicType === t
                          ? "bg-blue-600 text-white"
                          : "bg-gray-700 text-gray-400 hover:bg-gray-600"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {dynamicType === "API" && (
                <>
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Provider</label>
                    <select
                      value={selectedProvider}
                      onChange={(e) => setSelectedProvider(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="">Select provider...</option>
                      {providers.map((p) => (
                        <option key={p._id} value={p._id}>
                          {p.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Response Key Path</label>
                    <input
                      type="text"
                      value={responseKeyPath}
                      onChange={(e) => setResponseKeyPath(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      placeholder="data.items"
                    />
                  </div>
                </>
              )}

              {dynamicType === "DATABASE" && (
                <>
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Database</label>
                    <select
                      value={selectedDatabase}
                      onChange={(e) => setSelectedDatabase(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option value="">Select database...</option>
                      {databases.map((d) => (
                        <option key={d._id} value={d._id}>
                          {d.name} ({d.type})
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Collection/Table</label>
                    <input
                      type="text"
                      value={collection}
                      onChange={(e) => setCollection(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Query</label>
                    <textarea
                      rows={4}
                      value={query}
                      onChange={(e) => setQuery(e.target.value)}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                    />
                  </div>
                </>
              )}
            </>
          )}

          {/* Rotation */}
          <div>
            <label className="block text-gray-300 mb-1 text-sm">Rotation</label>
            <input
              type="number"
              min="1"
              value={rotation}
              onChange={(e) => setRotation(e.target.value)}
              className="w-32 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
            />
          </div>

          {/* Params */}
          <div>
            <div className="flex justify-between items-center mb-2">
              <label className="text-gray-300 text-sm">Query Parameters</label>
              <button onClick={addParam} className="text-blue-400 text-sm hover:underline">
                + Add
              </button>
            </div>
            {params_.map((param, i) => (
              <div key={i} className="flex gap-2 mb-2">
                <input
                  placeholder="Key"
                  value={param.key}
                  onChange={(e) => updateParam(i, "key", e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                <input
                  placeholder="Description"
                  value={param.description}
                  onChange={(e) => updateParam(i, "description", e.target.value)}
                  className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                />
                <button onClick={() => removeParam(i)} className="text-red-400 px-2">
                  x
                </button>
              </div>
            ))}
          </div>

          {/* Body Keys */}
          {method === "POST" && (
            <div>
              <div className="flex justify-between items-center mb-2">
                <label className="text-gray-300 text-sm">Body Keys</label>
                <button onClick={addBodyKey} className="text-blue-400 text-sm hover:underline">
                  + Add
                </button>
              </div>
              {bodyKeys.map((key, i) => (
                <div key={i} className="flex gap-2 mb-2">
                  <input
                    placeholder="Key"
                    value={key.key}
                    onChange={(e) => updateBodyKey(i, "key", e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  <input
                    placeholder="Description"
                    value={key.description}
                    onChange={(e) => updateBodyKey(i, "description", e.target.value)}
                    className="flex-1 px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white text-sm"
                  />
                  <button onClick={() => removeBodyKey(i)} className="text-red-400 px-2">
                    x
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push("/dashboard/apis")}
            className="px-6 py-2 bg-gray-700 text-white rounded-lg hover:bg-gray-600"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={saving}
            className="flex-1 px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
          >
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>
    </DashboardLayout>
  );
}
