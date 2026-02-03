"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import DashboardLayout from "@/components/DashboardLayout";
import { apiFetch } from "@/lib/api";

// Helper to fix curly quotes (smart quotes) to straight quotes
function fixQuotes(str) {
  if (!str) return str;
  return str
    .replace(/[\u201C\u201D\u201E\u201F\u2033\u2036]/g, '"')  // Various double curly quotes to straight
    .replace(/[\u2018\u2019\u201A\u201B\u2032\u2035]/g, "'"); // Various single curly quotes to straight
}

// Helper to validate JSON and return error message
function validateJson(str) {
  if (!str || !str.trim()) return null;
  try {
    JSON.parse(fixQuotes(str));
    return null;
  } catch (e) {
    return e.message;
  }
}

// Helper to validate template JSON (allows {{placeholder}} syntax)
function validateTemplateJson(str) {
  if (!str || !str.trim()) return null;
  try {
    // First fix curly quotes, then replace {{...}} placeholders with valid JSON strings for validation
    const fixedStr = fixQuotes(str);
    const testStr = fixedStr.replace(/\{\{[^{}]+\}\}/g, '"__placeholder__"');
    JSON.parse(testStr);
    return null;
  } catch (e) {
    return e.message;
  }
}

export default function CreateApi() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [curlCommand, setCurlCommand] = useState("");

  // Step 1: Property selection
  const [properties, setProperties] = useState([]);
  const [property, setProperty] = useState("");
  const [newProperty, setNewProperty] = useState("");
  const [showNewProperty, setShowNewProperty] = useState(false);

  // Step 2: Route
  const [route, setRoute] = useState("");
  const [label, setLabel] = useState("");

  // Step 3: API Type
  const [apiType, setApiType] = useState("");

  // Step 4a: Static options
  const [method, setMethod] = useState("GET");
  const [staticJson, setStaticJson] = useState("{}");
  const [rotation, setRotation] = useState(1);
  const [params, setParams] = useState([]);
  const [bodyKeys, setBodyKeys] = useState([]);

  // Step 4b: Dynamic options
  const [dynamicType, setDynamicType] = useState("");

  // Dynamic API options
  const [providers, setProviders] = useState([]);
  const [selectedProvider, setSelectedProvider] = useState("");
  const [responseKeyPath, setResponseKeyPath] = useState("");
  const [staticData, setStaticData] = useState("{}");
  const [dynamicDataKey, setDynamicDataKey] = useState("");
  const [dynamicDataTemplate, setDynamicDataTemplate] = useState("");
  const [showNewProvider, setShowNewProvider] = useState(false);
  const [newProvider, setNewProvider] = useState({
    name: "",
    method: "GET",
    url: "",
    headers: "{}",
    params: "{}",
    body: "{}",
  });

  // Dynamic Database options
  const [databases, setDatabases] = useState([]);
  const [selectedDatabase, setSelectedDatabase] = useState("");
  const [collection, setCollection] = useState("");
  const [query, setQuery] = useState("{}");
  const [showNewDatabase, setShowNewDatabase] = useState(false);
  const [newDatabase, setNewDatabase] = useState({
    name: "",
    type: "MONGODB",
    uri: "",
    database: "",
  });

  useEffect(() => {
    Promise.all([
      apiFetch("/api/manage/properties").catch(() => []),
      apiFetch("/api/manage/provider").catch(() => []),
      apiFetch("/api/manage/database").catch(() => []),
    ]).then(([props, provs, dbs]) => {
      setProperties(props || []);
      setProviders(provs || []);
      setDatabases(dbs || []);
    });
  }, []);

  const addParam = () => setParams([...params, { key: "", description: "" }]);
  const removeParam = (index) => setParams(params.filter((_, i) => i !== index));
  const updateParam = (index, field, value) => {
    const updated = [...params];
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

  const saveProvider = async () => {
    try {
      const provider = await apiFetch("/api/manage/provider", {
        method: "POST",
        body: JSON.stringify({
          ...newProvider,
          headers: JSON.parse(newProvider.headers),
          params: JSON.parse(newProvider.params),
          body: JSON.parse(newProvider.body),
        }),
      });
      setProviders([...providers, provider]);
      setSelectedProvider(provider._id);
      setShowNewProvider(false);
      setNewProvider({ name: "", method: "GET", url: "", headers: "{}", params: "{}", body: "{}" });
    } catch (err) {
      setError(err.message);
    }
  };

  const saveDatabase = async () => {
    try {
      const db = await apiFetch("/api/manage/database", {
        method: "POST",
        body: JSON.stringify(newDatabase),
      });
      setDatabases([...databases, db]);
      setSelectedDatabase(db._id);
      setShowNewDatabase(false);
      setNewDatabase({ name: "", type: "MONGODB", uri: "", database: "" });
    } catch (err) {
      setError(err.message);
    }
  };

  const submit = async () => {
    setLoading(true);
    setError("");

    try {
      // Validate JSON before submitting (fix curly quotes first)
      if (apiType === "STATIC") {
        try {
          JSON.parse(fixQuotes(staticJson));
        } catch {
          throw new Error("Invalid JSON in static response. Please check your JSON syntax.");
        }
      }

      if (apiType === "DYNAMIC" && dynamicType === "DATABASE") {
        try {
          JSON.parse(fixQuotes(query));
        } catch {
          throw new Error("Invalid JSON in database query. Please check your JSON syntax.");
        }
      }

      if (apiType === "DYNAMIC" && dynamicType === "API") {
        try {
          JSON.parse(fixQuotes(staticData));
        } catch {
          throw new Error("Invalid JSON in static data. Please check your JSON syntax.");
        }
        if (dynamicDataTemplate && dynamicDataTemplate.trim()) {
          // Validate template JSON (allows {{placeholder}} syntax)
          const testStr = fixQuotes(dynamicDataTemplate).replace(/\{\{[^}]+\}\}/g, '"__placeholder__"');
          try {
            JSON.parse(testStr);
          } catch {
            throw new Error("Invalid JSON in dynamic data template. Please check your JSON syntax.");
          }
        }
      }

      const payload = {
        property: showNewProperty ? newProperty : property,
        route,
        label,
        apiType,
        method,
        rotation: parseInt(rotation) || 1,
        params: params.filter((p) => p.key),
        bodyKeys: method === "POST" ? bodyKeys.filter((b) => b.key) : [],
      };

      if (apiType === "STATIC") {
        payload.staticResponse = JSON.parse(fixQuotes(staticJson));
      } else if (apiType === "DYNAMIC") {
        payload.dynamicConfig = {
          type: dynamicType,
        };
        if (dynamicType === "API") {
          payload.dynamicConfig.providerId = selectedProvider;
          payload.dynamicConfig.responseKeyPath = responseKeyPath;
          payload.dynamicConfig.staticData = JSON.parse(fixQuotes(staticData));
          payload.dynamicConfig.dynamicDataKey = dynamicDataKey;
          payload.dynamicConfig.dynamicDataTemplate = dynamicDataTemplate && dynamicDataTemplate.trim() ? JSON.parse(fixQuotes(dynamicDataTemplate)) : null;
        } else if (dynamicType === "DATABASE") {
          payload.dynamicConfig.databaseConfigId = selectedDatabase;
          payload.dynamicConfig.collection = collection;
          payload.dynamicConfig.query = JSON.parse(fixQuotes(query));
        }
      }

      const api = await apiFetch("/api/manage/api", {
        method: "POST",
        body: JSON.stringify(payload),
      });

      const baseUrl = typeof window !== "undefined" ? window.location.origin : "";
      const url = `${baseUrl}/api/${api.property}/${api.route}`;
      const curl =
        method === "POST"
          ? `curl -X POST "${url}" \\\n  -H "Content-Type: application/json" \\\n  -d '{}'`
          : `curl "${url}"`;
      setCurlCommand(curl);
      setStep(5);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const renderStep1 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Step 1: Select Property</h2>
      <p className="text-gray-400">
        Properties group your APIs (e.g., &quot;web-id&quot;, &quot;app-id&quot;, &quot;mobile&quot;)
      </p>

      {properties.length > 0 && !showNewProperty && (
        <div className="space-y-2">
          {properties.map((prop) => (
            <button
              key={prop}
              onClick={() => setProperty(prop)}
              className={`w-full p-3 rounded-lg border text-left ${
                property === prop
                  ? "border-blue-500 bg-blue-600/20 text-white"
                  : "border-gray-700 bg-gray-800 text-gray-300 hover:border-gray-600"
              }`}
            >
              {prop}
            </button>
          ))}
        </div>
      )}

      {showNewProperty ? (
        <div className="space-y-2">
          <input
            type="text"
            placeholder="Enter new property name (e.g., web-id)"
            value={newProperty}
            onChange={(e) => setNewProperty(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
            className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            autoFocus
          />
          <button
            onClick={() => {
              setShowNewProperty(false);
              setNewProperty("");
            }}
            className="text-gray-400 hover:text-white text-sm"
          >
            Cancel
          </button>
        </div>
      ) : (
        <button
          onClick={() => setShowNewProperty(true)}
          className="w-full p-3 rounded-lg border border-dashed border-gray-600 text-gray-400 hover:border-gray-500 hover:text-gray-300"
        >
          + Add New Property
        </button>
      )}

      <button
        onClick={() => setStep(2)}
        disabled={!property && !newProperty}
        className="w-full bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg mt-4"
      >
        Next: Set Route
      </button>
    </div>
  );

  const renderStep2 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Step 2: Define Route</h2>
      <p className="text-gray-400">
        This will be your API endpoint: /api/{showNewProperty ? newProperty : property}/
        <span className="text-white">{route || "[route]"}</span>
      </p>

      <input
        type="text"
        placeholder="e.g., video-shots, users, products"
        value={route}
        onChange={(e) => setRoute(e.target.value.toLowerCase().replace(/\s+/g, "-"))}
        className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        autoFocus
      />

      <div>
        <label className="block text-gray-300 mb-2">Label (optional - helps identify your API)</label>
        <input
          type="text"
          placeholder="e.g., My Video API, Test Config"
          value={label}
          onChange={(e) => setLabel(e.target.value)}
          className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        />
      </div>

      <div className="flex gap-2">
        <button onClick={() => setStep(1)} className="px-4 py-2 text-gray-400 hover:text-white">
          Back
        </button>
        <button
          onClick={() => setStep(3)}
          disabled={!route}
          className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white py-2 rounded-lg"
        >
          Next: Choose API Type
        </button>
      </div>
    </div>
  );

  const renderStep3 = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Step 3: API Type</h2>
      <p className="text-gray-400">Choose how your API will serve data</p>

      <div className="grid grid-cols-2 gap-4">
        <button
          onClick={() => {
            setApiType("STATIC");
            setStep(4);
          }}
          className={`p-6 rounded-lg border text-left ${
            apiType === "STATIC"
              ? "border-blue-500 bg-blue-600/20"
              : "border-gray-700 bg-gray-800 hover:border-gray-600"
          }`}
        >
          <h3 className="text-white font-semibold text-lg">Static</h3>
          <p className="text-gray-400 text-sm mt-1">
            Return fixed JSON data with optional rotation
          </p>
        </button>
        <button
          onClick={() => {
            setApiType("DYNAMIC");
            setStep(4);
          }}
          className={`p-6 rounded-lg border text-left ${
            apiType === "DYNAMIC"
              ? "border-blue-500 bg-blue-600/20"
              : "border-gray-700 bg-gray-800 hover:border-gray-600"
          }`}
        >
          <h3 className="text-white font-semibold text-lg">Dynamic</h3>
          <p className="text-gray-400 text-sm mt-1">
            Fetch from external API or database
          </p>
        </button>
      </div>

      <button onClick={() => setStep(2)} className="px-4 py-2 text-gray-400 hover:text-white">
        Back
      </button>
    </div>
  );

  const renderStep4Static = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Step 4: Static API Configuration</h2>

      {/* Method */}
      <div>
        <label className="block text-gray-300 mb-2">HTTP Method</label>
        <div className="flex gap-2">
          {["GET", "POST"].map((m) => (
            <button
              key={m}
              onClick={() => setMethod(m)}
              className={`px-4 py-2 rounded-lg ${
                method === m
                  ? "bg-blue-600 text-white"
                  : "bg-gray-800 text-gray-400 hover:bg-gray-700"
              }`}
            >
              {m}
            </button>
          ))}
        </div>
      </div>

      {/* Static JSON */}
      <div>
        <label className="block text-gray-300 mb-2">JSON Response</label>
        <textarea
          rows={10}
          value={staticJson}
          onChange={(e) => setStaticJson(e.target.value)}
          className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white font-mono text-sm ${
            validateJson(staticJson) ? "border-red-500" : "border-gray-700"
          }`}
          placeholder='{"items": [{"id": 1, "name": "Item 1"}]}'
        />
        {validateJson(staticJson) && (
          <p className="text-red-400 text-sm mt-1">{validateJson(staticJson)}</p>
        )}
      </div>

      {/* Rotation */}
      <div>
        <label className="block text-gray-300 mb-2">
          Rotation (repeat array items N times)
        </label>
        <input
          type="number"
          min="1"
          value={rotation}
          onChange={(e) => setRotation(e.target.value)}
          className="w-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
        />
      </div>

      {/* Params */}
      <div>
        <div className="flex justify-between items-center mb-2">
          <label className="text-gray-300">Query Parameters</label>
          <button onClick={addParam} className="text-blue-400 text-sm hover:underline">
            + Add Param
          </button>
        </div>
        {params.map((param, i) => (
          <div key={i} className="flex gap-2 mb-2">
            <input
              placeholder="Key"
              value={param.key}
              onChange={(e) => updateParam(i, "key", e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
            <input
              placeholder="Description"
              value={param.description}
              onChange={(e) => updateParam(i, "description", e.target.value)}
              className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
            />
            <button onClick={() => removeParam(i)} className="text-red-400 px-2">
              x
            </button>
          </div>
        ))}
      </div>

      {/* Body Keys (for POST) */}
      {method === "POST" && (
        <div>
          <div className="flex justify-between items-center mb-2">
            <label className="text-gray-300">Body Keys (readable)</label>
            <button onClick={addBodyKey} className="text-blue-400 text-sm hover:underline">
              + Add Key
            </button>
          </div>
          {bodyKeys.map((key, i) => (
            <div key={i} className="flex gap-2 mb-2">
              <input
                placeholder="Key path (e.g., data.userId)"
                value={key.key}
                onChange={(e) => updateBodyKey(i, "key", e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              />
              <input
                placeholder="Description"
                value={key.description}
                onChange={(e) => updateBodyKey(i, "description", e.target.value)}
                className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white text-sm"
              />
              <button onClick={() => removeBodyKey(i)} className="text-red-400 px-2">
                x
              </button>
            </div>
          ))}
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <button onClick={() => setStep(3)} className="px-4 py-2 text-gray-400 hover:text-white">
          Back
        </button>
        <button
          onClick={submit}
          disabled={loading}
          className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg"
        >
          {loading ? "Creating..." : "Create API"}
        </button>
      </div>
    </div>
  );

  const renderStep4Dynamic = () => (
    <div className="space-y-4">
      <h2 className="text-xl font-semibold text-white">Step 4: Dynamic Source</h2>
      <p className="text-gray-400">Choose your data source</p>

      {!dynamicType ? (
        <div className="grid grid-cols-2 gap-4">
          <button
            onClick={() => setDynamicType("API")}
            className="p-6 rounded-lg border border-gray-700 bg-gray-800 hover:border-gray-600 text-left"
          >
            <h3 className="text-white font-semibold text-lg">External API</h3>
            <p className="text-gray-400 text-sm mt-1">
              Fetch data from another API endpoint
            </p>
          </button>
          <button
            onClick={() => setDynamicType("DATABASE")}
            className="p-6 rounded-lg border border-gray-700 bg-gray-800 hover:border-gray-600 text-left"
          >
            <h3 className="text-white font-semibold text-lg">Database</h3>
            <p className="text-gray-400 text-sm mt-1">
              Query MongoDB or MySQL directly
            </p>
          </button>
        </div>
      ) : dynamicType === "API" ? (
        <div className="space-y-4">
          <h3 className="text-lg text-white">External API Configuration</h3>

          {/* Method */}
          <div>
            <label className="block text-gray-300 mb-2">HTTP Method</label>
            <div className="flex gap-2">
              {["GET", "POST"].map((m) => (
                <button
                  key={m}
                  onClick={() => setMethod(m)}
                  className={`px-4 py-2 rounded-lg ${
                    method === m
                      ? "bg-blue-600 text-white"
                      : "bg-gray-800 text-gray-400 hover:bg-gray-700"
                  }`}
                >
                  {m}
                </button>
              ))}
            </div>
          </div>

          {/* Provider Selection */}
          {!showNewProvider ? (
            <>
              <div>
                <label className="block text-gray-300 mb-2">Select Provider</label>
                <select
                  value={selectedProvider}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">Select a provider...</option>
                  {providers.map((p) => (
                    <option key={p._id} value={p._id}>
                      {p.name} ({p.method} {p.url})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowNewProvider(true)}
                className="text-blue-400 text-sm hover:underline"
              >
                + Create New Provider
              </button>
            </>
          ) : (
            <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h4 className="text-white font-medium">New Provider</h4>
              <input
                placeholder="Provider Name"
                value={newProvider.name}
                onChange={(e) => setNewProvider({ ...newProvider, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
              <div className="flex gap-2">
                <select
                  value={newProvider.method}
                  onChange={(e) => setNewProvider({ ...newProvider, method: e.target.value })}
                  className="px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                >
                  <option>GET</option>
                  <option>POST</option>
                </select>
                <input
                  placeholder="URL"
                  value={newProvider.url}
                  onChange={(e) => setNewProvider({ ...newProvider, url: e.target.value })}
                  className="flex-1 px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
                />
              </div>
              <textarea
                placeholder='Headers (JSON): {"Authorization": "Bearer ..."}'
                value={newProvider.headers}
                onChange={(e) => setNewProvider({ ...newProvider, headers: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono text-sm"
                rows={2}
              />
              <textarea
                placeholder='Params (JSON): {"page": 1}'
                value={newProvider.params}
                onChange={(e) => setNewProvider({ ...newProvider, params: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono text-sm"
                rows={2}
              />
              {newProvider.method === "POST" && (
                <textarea
                  placeholder='Body (JSON): {"query": "..."}'
                  value={newProvider.body}
                  onChange={(e) => setNewProvider({ ...newProvider, body: e.target.value })}
                  className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white font-mono text-sm"
                  rows={2}
                />
              )}
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewProvider(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveProvider}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Provider
                </button>
              </div>
            </div>
          )}

          {/* Response Key Path */}
          <div>
            <label className="block text-gray-300 mb-2">
              Response Key Path (e.g., data.items)
            </label>
            <input
              type="text"
              placeholder="data.results.items"
              value={responseKeyPath}
              onChange={(e) => setResponseKeyPath(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <p className="text-gray-500 text-sm mt-1">
              Extract nested data from the API response using dot notation
            </p>
          </div>

          {/* Static Data - merge with dynamic */}
          <div>
            <label className="block text-gray-300 mb-2">
              Static Data (merged with dynamic response)
            </label>
            <textarea
              rows={4}
              placeholder='{"type": "shots", "category": "trending"}'
              value={staticData}
              onChange={(e) => setStaticData(e.target.value)}
              className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white font-mono text-sm ${
                validateJson(staticData) ? "border-red-500" : "border-gray-700"
              }`}
            />
            {validateJson(staticData) ? (
              <p className="text-red-400 text-sm mt-1">{validateJson(staticData)}</p>
            ) : (
              <p className="text-gray-500 text-sm mt-1">
                Static fields to include in the final response
              </p>
            )}
          </div>

          {/* Dynamic Data Key */}
          <div>
            <label className="block text-gray-300 mb-2">
              Dynamic Data Key
            </label>
            <input
              type="text"
              placeholder="items"
              value={dynamicDataKey}
              onChange={(e) => setDynamicDataKey(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
            <p className="text-gray-500 text-sm mt-1">
              Key name for the dynamic data array (e.g., &quot;items&quot;)
            </p>
          </div>

          {/* Dynamic Data Template */}
          <div>
            <label className="block text-gray-300 mb-2">
              Dynamic Data Template (optional)
            </label>
            <textarea
              rows={5}
              placeholder={`{\n  "name": "{{name}}",\n  "phone": "{{phone}}",\n  "email": "{{email}}"\n}`}
              value={dynamicDataTemplate}
              onChange={(e) => setDynamicDataTemplate(e.target.value)}
              className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white font-mono text-sm ${
                dynamicDataTemplate.trim() && validateTemplateJson(dynamicDataTemplate) ? "border-red-500" : "border-gray-700"
              }`}
            />
            {dynamicDataTemplate.trim() && validateTemplateJson(dynamicDataTemplate) ? (
              <p className="text-red-400 text-sm mt-1">{validateTemplateJson(dynamicDataTemplate)}</p>
            ) : (
              <p className="text-gray-500 text-sm mt-1">
                Transform each item using {`{{field}}`} placeholders. Leave empty to use raw data.
              </p>
            )}
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-gray-300 mb-2">Rotation (0 = use source count)</label>
            <input
              type="number"
              min="0"
              value={rotation}
              onChange={(e) => setRotation(e.target.value)}
              className="w-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>
      ) : (
        <div className="space-y-4">
          <h3 className="text-lg text-white">Database Configuration</h3>

          {/* Database Type & Selection */}
          {!showNewDatabase ? (
            <>
              <div>
                <label className="block text-gray-300 mb-2">Select Database Connection</label>
                <select
                  value={selectedDatabase}
                  onChange={(e) => setSelectedDatabase(e.target.value)}
                  className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
                >
                  <option value="">Select a database...</option>
                  {databases.map((db) => (
                    <option key={db._id} value={db._id}>
                      {db.name} ({db.type})
                    </option>
                  ))}
                </select>
              </div>
              <button
                onClick={() => setShowNewDatabase(true)}
                className="text-blue-400 text-sm hover:underline"
              >
                + Add New Database Connection
              </button>
            </>
          ) : (
            <div className="space-y-3 p-4 bg-gray-800/50 rounded-lg border border-gray-700">
              <h4 className="text-white font-medium">New Database Connection</h4>
              <input
                placeholder="Connection Name"
                value={newDatabase.name}
                onChange={(e) => setNewDatabase({ ...newDatabase, name: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
              <select
                value={newDatabase.type}
                onChange={(e) => setNewDatabase({ ...newDatabase, type: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              >
                <option value="MONGODB">MongoDB</option>
                <option value="MYSQL">MySQL</option>
              </select>
              <input
                placeholder={
                  newDatabase.type === "MONGODB"
                    ? "mongodb://localhost:27017"
                    : "mysql://user:pass@localhost:3306"
                }
                value={newDatabase.uri}
                onChange={(e) => setNewDatabase({ ...newDatabase, uri: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
              <input
                placeholder="Database name"
                value={newDatabase.database}
                onChange={(e) => setNewDatabase({ ...newDatabase, database: e.target.value })}
                className="w-full px-3 py-2 bg-gray-800 border border-gray-700 rounded text-white"
              />
              <div className="flex gap-2">
                <button
                  onClick={() => setShowNewDatabase(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  onClick={saveDatabase}
                  className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                >
                  Save Connection
                </button>
              </div>
            </div>
          )}

          {/* Collection/Table */}
          <div>
            <label className="block text-gray-300 mb-2">
              {selectedDatabase &&
              databases.find((d) => d._id === selectedDatabase)?.type === "MYSQL"
                ? "Table Name"
                : "Collection Name"}
            </label>
            <input
              type="text"
              placeholder="users"
              value={collection}
              onChange={(e) => setCollection(e.target.value)}
              className="w-full px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
          </div>

          {/* Query */}
          <div>
            <label className="block text-gray-300 mb-2">Query (JSON for MongoDB, SQL for MySQL)</label>
            <textarea
              rows={4}
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className={`w-full px-4 py-2 bg-gray-800 border rounded-lg text-white font-mono text-sm ${
                validateJson(query) ? "border-red-500" : "border-gray-700"
              }`}
              placeholder='{"status": "active"}'
            />
            {validateJson(query) && (
              <p className="text-red-400 text-sm mt-1">{validateJson(query)}</p>
            )}
          </div>

          {/* Rotation */}
          <div>
            <label className="block text-gray-300 mb-2">Rotation</label>
            <input
              type="number"
              min="1"
              value={rotation}
              onChange={(e) => setRotation(e.target.value)}
              className="w-32 px-4 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white"
            />
          </div>
        </div>
      )}

      <div className="flex gap-2 pt-4">
        <button
          onClick={() => {
            if (dynamicType) {
              setDynamicType("");
            } else {
              setStep(3);
            }
          }}
          className="px-4 py-2 text-gray-400 hover:text-white"
        >
          Back
        </button>
        {dynamicType && (
          <button
            onClick={submit}
            disabled={
              loading ||
              (dynamicType === "API" && !selectedProvider) ||
              (dynamicType === "DATABASE" && (!selectedDatabase || !collection))
            }
            className="flex-1 bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white py-2 rounded-lg"
          >
            {loading ? "Creating..." : "Create API"}
          </button>
        )}
      </div>
    </div>
  );

  const renderStep5 = () => (
    <div className="space-y-6 text-center">
      <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center mx-auto">
        <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
        </svg>
      </div>
      <h2 className="text-2xl font-bold text-white">API Created Successfully!</h2>
      <p className="text-gray-400">Your API is now live and ready to use</p>

      <div className="bg-gray-800 rounded-lg p-4 text-left">
        <p className="text-gray-400 text-sm mb-2">cURL Command:</p>
        <pre className="text-green-400 font-mono text-sm whitespace-pre-wrap break-all">
          {curlCommand}
        </pre>
        <button
          onClick={() => navigator.clipboard.writeText(curlCommand)}
          className="mt-3 text-blue-400 text-sm hover:underline"
        >
          Copy to Clipboard
        </button>
      </div>

      <div className="flex gap-4 justify-center">
        <button
          onClick={() => {
            setStep(1);
            setProperty("");
            setRoute("");
            setLabel("");
            setApiType("");
            setStaticJson("{\n  \n}");
            setDynamicType("");
          }}
          className="px-6 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg"
        >
          Create Another
        </button>
        <button
          onClick={() => router.push("/dashboard/apis")}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg"
        >
          View All APIs
        </button>
      </div>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="max-w-2xl mx-auto">
        {/* Progress */}
        {step < 5 && (
          <div className="mb-8">
            <div className="flex justify-between text-sm text-gray-500 mb-2">
              <span className={step >= 1 ? "text-blue-400" : ""}>Property</span>
              <span className={step >= 2 ? "text-blue-400" : ""}>Route</span>
              <span className={step >= 3 ? "text-blue-400" : ""}>Type</span>
              <span className={step >= 4 ? "text-blue-400" : ""}>Configure</span>
            </div>
            <div className="h-2 bg-gray-700 rounded-full">
              <div
                className="h-2 bg-blue-600 rounded-full transition-all"
                style={{ width: `${(step / 4) * 100}%` }}
              />
            </div>
          </div>
        )}

        {error && (
          <div className="mb-4 p-3 bg-red-500/20 border border-red-500 rounded-lg text-red-300">
            {error}
          </div>
        )}

        {step === 1 && renderStep1()}
        {step === 2 && renderStep2()}
        {step === 3 && renderStep3()}
        {step === 4 && apiType === "STATIC" && renderStep4Static()}
        {step === 4 && apiType === "DYNAMIC" && renderStep4Dynamic()}
        {step === 5 && renderStep5()}
      </div>
    </DashboardLayout>
  );
}
