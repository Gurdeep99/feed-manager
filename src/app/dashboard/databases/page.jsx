"use client";

import { useEffect, useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function DatabasesPage() {
  const { user } = useAuth();
  const [databases, setDatabases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState(null);
  const [form, setForm] = useState({
    name: "",
    label: "",
    type: "MONGODB",
    uri: "",
    database: "",
  });
  const [error, setError] = useState("");

  useEffect(() => {
    loadDatabases();
  }, []);

  const loadDatabases = async () => {
    try {
      const data = await apiFetch("/api/manage/database");
      setDatabases(data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ name: "", label: "", type: "MONGODB", uri: "", database: "" });
    setEditingId(null);
    setShowForm(false);
    setError("");
  };

  const handleSubmit = async () => {
    setError("");
    try {
      if (editingId) {
        const updated = await apiFetch("/api/manage/database", {
          method: "PUT",
          body: JSON.stringify({ id: editingId, ...form }),
        });
        setDatabases(databases.map((d) => (d._id === editingId ? updated : d)));
      } else {
        const created = await apiFetch("/api/manage/database", {
          method: "POST",
          body: JSON.stringify(form),
        });
        setDatabases([created, ...databases]);
      }
      resetForm();
    } catch (err) {
      setError(err.message);
    }
  };

  const handleEdit = (db) => {
    setForm({
      name: db.name,
      label: db.label || "",
      type: db.type,
      uri: db.uri,
      database: db.database || "",
    });
    setEditingId(db._id);
    setShowForm(true);
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this database connection?")) return;
    try {
      await apiFetch(`/api/manage/database?id=${id}`, { method: "DELETE" });
      setDatabases(databases.filter((d) => d._id !== id));
    } catch (err) {
      alert(err.message);
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-white">Database Connections</h1>
          <button
            onClick={() => setShowForm(true)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            + Add Database
          </button>
        </div>

        {/* Form Modal */}
        {showForm && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
            <div className="bg-gray-800 rounded-lg p-6 w-full max-w-lg">
              <h2 className="text-xl font-semibold text-white mb-4">
                {editingId ? "Edit Database" : "New Database Connection"}
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded text-red-300 text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Connection Name</label>
                    <input
                      type="text"
                      value={form.name}
                      onChange={(e) => setForm({ ...form, name: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      placeholder="Production MongoDB"
                    />
                  </div>
                  <div>
                    <label className="block text-gray-300 mb-1 text-sm">Label (optional)</label>
                    <input
                      type="text"
                      value={form.label}
                      onChange={(e) => setForm({ ...form, label: e.target.value })}
                      className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                      placeholder="My DB, Test"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 text-sm">Database Type</label>
                  <select
                    value={form.type}
                    onChange={(e) => setForm({ ...form, type: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                  >
                    <option value="MONGODB">MongoDB</option>
                    <option value="MYSQL">MySQL</option>
                  </select>
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 text-sm">Connection URI</label>
                  <input
                    type="text"
                    value={form.uri}
                    onChange={(e) => setForm({ ...form, uri: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white font-mono text-sm"
                    placeholder={
                      form.type === "MONGODB"
                        ? "mongodb://localhost:27017"
                        : "mysql://user:pass@localhost:3306"
                    }
                  />
                </div>

                <div>
                  <label className="block text-gray-300 mb-1 text-sm">Database Name</label>
                  <input
                    type="text"
                    value={form.database}
                    onChange={(e) => setForm({ ...form, database: e.target.value })}
                    className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded text-white"
                    placeholder="myapp"
                  />
                </div>

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

        {/* Databases List */}
        {loading ? (
          <div className="text-gray-400">Loading databases...</div>
        ) : databases.length === 0 ? (
          <div className="bg-gray-800 rounded-lg border border-gray-700 p-8 text-center">
            <p className="text-gray-400">No database connections configured</p>
            <button
              onClick={() => setShowForm(true)}
              className="text-blue-400 hover:underline mt-2"
            >
              Add your first database
            </button>
          </div>
        ) : (
          <div className="space-y-3">
            {databases.map((db) => (
              <div
                key={db._id}
                className="bg-gray-800 rounded-lg border border-gray-700 p-4"
              >
                <div className="flex justify-between items-start">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-white font-medium">{db.name}</h3>
                      {db.label && (
                        <span className="text-xs px-2 py-0.5 rounded bg-cyan-600 text-white">
                          {db.label}
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1">
                      <span
                        className={`text-xs px-2 py-0.5 rounded ${
                          db.type === "MONGODB"
                            ? "bg-green-600 text-white"
                            : "bg-blue-600 text-white"
                        }`}
                      >
                        {db.type}
                      </span>
                      {db.database && (
                        <span className="text-gray-400 text-sm">
                          Database: {db.database}
                        </span>
                      )}
                    </div>
                    <p className="text-gray-500 text-sm font-mono mt-1 truncate max-w-md">
                      {db.uri.replace(/\/\/[^:]+:[^@]+@/, "//***:***@")}
                    </p>
                    <p className="text-gray-500 text-xs mt-1">
                      By: {db.userId?.name || "Unknown"}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    {db.userId?._id === user?.id && (
                      <>
                        <button
                          onClick={() => handleEdit(db)}
                          className="px-3 py-1 text-sm bg-gray-700 hover:bg-gray-600 text-white rounded"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(db._id)}
                          className="px-3 py-1 text-sm bg-red-600 hover:bg-red-700 text-white rounded"
                        >
                          Delete
                        </button>
                      </>
                    )}
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
