"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";

export default function ProvidersPage() {
  const [providers, setProviders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    method: "GET",
    url: "",
    headers: "{}",
    params: "{}",
    body: "{}",
  });
  const [error, setError] = useState("");
  const [testResults, setTestResults] = useState({});
  const [testingId, setTestingId] = useState(null);

  useEffect(() => {
    loadProviders();
  }, []);

  const loadProviders = async () => {
    try {
      const data = await apiFetch("/api/manage/provider");
      setProviders(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", method: "GET", url: "", headers: "{}", params: "{}", body: "{}" });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    try {
      const payload = {
        ...form,
        headers: JSON.parse(form.headers),
        params: JSON.parse(form.params),
        body: JSON.parse(form.body),
      };

      if (editingId) {
        const updated = await apiFetch("/api/manage/provider", {
          method: "PUT",
          body: JSON.stringify({ id: editingId, ...payload }),
        });
        setProviders(providers.map((p) => (p._id === editingId ? updated : p)));
      } else {
        const created = await apiFetch("/api/manage/provider", {
          method: "POST",
          body: JSON.stringify(payload),
        });
        setProviders([created, ...providers]);
      }
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (provider) => {
    setForm({
      name: provider.name,
      method: provider.method,
      url: provider.url,
      headers: JSON.stringify(provider.headers || {}, null, 2),
      params: JSON.stringify(provider.params || {}, null, 2),
      body: JSON.stringify(provider.body || {}, null, 2),
    });
    setEditingId(provider._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this provider?")) return;
    try {
      await apiFetch(`/api/manage/provider?id=${id}`, { method: "DELETE" });
      setProviders(providers.filter((p) => p._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  const handleTest = async (providerId) => {
    setTestingId(providerId);
    setTestResults((prev) => ({ ...prev, [providerId]: null }));

    try {
      const result = await apiFetch("/api/manage/provider/test", {
        method: "POST",
        body: JSON.stringify({ providerId }),
      });
      setTestResults((prev) => ({ ...prev, [providerId]: result }));
    } catch (err) {
      setTestResults((prev) => ({
        ...prev,
        [providerId]: { success: false, status: 0, error: err.message },
      }));
    } finally {
      setTestingId(null);
    }
  };

  const getStatusColor = (status) => {
    if (status >= 200 && status < 300) return "bg-green-500";
    if (status >= 300 && status < 400) return "bg-yellow-500";
    if (status >= 400 && status < 500) return "bg-orange-500";
    if (status >= 500) return "bg-red-500";
    return "bg-gray-500";
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">API Providers</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + Add Provider
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg max-h-[90vh] overflow-y-auto">
              <h2 className="text-xl font-semibold text-white mb-4">
                {editingId ? "Edit Provider" : "New Provider"}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="block text-gray-300 mb-1 text-sm">Name</label>
                  <input
                    type="text"
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="My API Provider"
                  />
                </div>

                <div className="flex gap-2">
                  <div className="w-24">
                    <label className="block text-gray-300 mb-1 text-sm">Method</label>
                    <select
                      value={form.method}
                      onChange={(e) => setForm({ ...form, method: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    >
                      <option>GET</option>
                      <option>POST</option>
                    </select>
                  </div>
                  <div className="flex-1">
                    <label className="block text-gray-300 mb-1 text-sm">URL</label>
                    <input
                      type="text"
                      value={form.url}
                      onChange={(e) => setForm({ ...form, url: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      placeholder="https://api.example.com/data"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 text-sm">Headers (JSON)</label>
                  <textarea
                    value={form.headers}
                    onChange={(e) => setForm({ ...form, headers: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                    rows={3}
                    placeholder='{"Authorization": "Bearer ..."}'
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 text-sm">Query Params (JSON)</label>
                  <textarea
                    value={form.params}
                    onChange={(e) => setForm({ ...form, params: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                    rows={3}
                    placeholder='{"page": 1, "limit": 10}'
                  />
                </div>

                {form.method === "POST" && (
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Body (JSON)</label>
                    <textarea
                      value={form.body}
                      onChange={(e) => setForm({ ...form, body: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                      rows={4}
                      placeholder='{"query": "search term"}'
                    />
                  </div>
                )}

                <div className="flex gap-2 pt-2">
                  <button
                    onClick={resetForm}
                    className="flex-1 px-4 py-2 bg-gray-700 text-white rounded hover:bg-gray-600"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={handleSubmit}
                    className="flex-1 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingId ? "Update" : "Create"}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Providers List */}
        {loading ? (
          <div className="text-gray-400">Loading providers...</div>
        ) : providers.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <p className="text-gray-400">No providers configured</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-400 hover:underline mt-2"
            >
              Add your first provider
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {providers.map((provider) => (
              <div
                key={provider._id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-4"
              >
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-white font-medium">{provider.name}</h3>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          provider.method === "POST"
                            ? "bg-green-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {provider.method}
                      </span>
                      <span className="text-gray-400 text-sm font-mono truncate max-w-md">
                        {provider.url}
                      </span>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleTest(provider._id)}
                      disabled={testingId === provider._id}
                      className={`px-3 py-1 text-sm rounded ${
                        testingId === provider._id
                          ? "bg-yellow-600 text-white cursor-wait"
                          : "bg-purple-600 hover:bg-purple-700 text-white"
                      }`}
                    >
                      {testingId === provider._id ? "Testing..." : "Test"}
                    </button>
                    <button
                      onClick={() => handleEdit(provider)}
                      className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(provider._id)}
                      className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                    >
                      Delete
                    </button>
                  </div>
                </div>

                {/* Test Result */}
                {testResults[provider._id] && (
                  <div className="mt-3 p-3 bg-gray-900 rounded border border-gray-700">
                    <div className="flex items-center gap-3 mb-2">
                      <span
                        className={`px-2 py-1 rounded text-white font-bold text-sm ${getStatusColor(
                          testResults[provider._id].status
                        )}`}
                      >
                        {testResults[provider._id].status || "ERR"}
                      </span>
                      <span className="text-gray-300 text-sm">
                        {testResults[provider._id].statusText}
                      </span>
                      {testResults[provider._id].duration && (
                        <span className="text-gray-500 text-sm">
                          {testResults[provider._id].duration}ms
                        </span>
                      )}
                      <span
                        className={`ml-auto text-sm font-medium ${
                          testResults[provider._id].success
                            ? "text-green-400"
                            : "text-red-400"
                        }`}
                      >
                        {testResults[provider._id].success ? "SUCCESS" : "FAILED"}
                      </span>
                    </div>

                    {testResults[provider._id].error && (
                      <div className="text-red-400 text-sm mb-2">
                        Error: {testResults[provider._id].error}
                      </div>
                    )}

                    {/* Request Details */}
                    {testResults[provider._id].request && (
                      <div className="mt-2 mb-2">
                        <div className="text-gray-400 text-xs mb-1">Request Details:</div>
                        <div className="text-xs bg-gray-950 p-2 rounded space-y-1">
                          <div>
                            <span className="text-gray-500">URL:</span>{" "}
                            <span className="text-blue-400">{testResults[provider._id].request.url}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Method:</span>{" "}
                            <span className="text-yellow-400">{testResults[provider._id].request.method}</span>
                          </div>
                          {Object.keys(testResults[provider._id].request.headers || {}).length > 0 && (
                            <div>
                              <span className="text-gray-500">Headers:</span>
                              <pre className="text-green-400 ml-2">
                                {JSON.stringify(testResults[provider._id].request.headers, null, 2)}
                              </pre>
                            </div>
                          )}
                          {Object.keys(testResults[provider._id].request.params || {}).length > 0 && (
                            <div>
                              <span className="text-gray-500">Params:</span>
                              <pre className="text-purple-400 ml-2">
                                {JSON.stringify(testResults[provider._id].request.params, null, 2)}
                              </pre>
                            </div>
                          )}
                          {testResults[provider._id].request.body && (
                            <div>
                              <span className="text-gray-500">Body:</span>
                              <pre className="text-orange-400 ml-2">
                                {JSON.stringify(testResults[provider._id].request.body, null, 2)}
                              </pre>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {testResults[provider._id].dataPreview && (
                      <div className="mt-2">
                        <div className="text-gray-400 text-xs mb-1">Response Preview:</div>
                        <pre className="text-xs text-gray-300 bg-gray-950 p-2 rounded overflow-x-auto max-h-32 overflow-y-auto">
                          {testResults[provider._id].dataPreview}
                        </pre>
                      </div>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </DashboardLayout>
  );
}
