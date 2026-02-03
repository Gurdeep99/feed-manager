"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const token = localStorage.getItem("token");
    if (token) {
      router.push("/dashboard");
    }
  }, [router]);

  return (
    <div className="min-h-screen bg-gray-900 flex flex-col items-center justify-center px-4">
      <div className="text-center max-w-2xl">
        <h1 className="text-5xl font-bold text-white mb-4">Feed Manager</h1>
        <p className="text-xl text-gray-400 mb-8">
          Create and manage dynamic APIs without writing code. Connect to databases,
          external APIs, or serve static JSON with built-in analytics.
        </p>

        <div className="flex gap-4 justify-center">
          <Link
            href="/login"
            className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-lg transition-colors"
          >
            Login
          </Link>
        </div>

        <div className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-blue-400 text-2xl mb-3">1</div>
            <h3 className="text-white font-semibold mb-2">Create Property</h3>
            <p className="text-gray-400 text-sm">
              Group your APIs under properties like &quot;web-id&quot; or &quot;app-id&quot;
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-blue-400 text-2xl mb-3">2</div>
            <h3 className="text-white font-semibold mb-2">Define Routes</h3>
            <p className="text-gray-400 text-sm">
              Static JSON or dynamic data from APIs and databases
            </p>
          </div>
          <div className="bg-gray-800 p-6 rounded-lg border border-gray-700">
            <div className="text-blue-400 text-2xl mb-3">3</div>
            <h3 className="text-white font-semibold mb-2">Get cURL</h3>
            <p className="text-gray-400 text-sm">
              Instantly ready-to-use endpoints with analytics tracking
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
