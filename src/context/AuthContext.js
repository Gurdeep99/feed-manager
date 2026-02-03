"use client";

import { createContext, useContext, useState, useSyncExternalStore, useCallback } from "react";
import { useRouter } from "next/navigation";

const AuthContext = createContext();

function getStoredAuth() {
  if (typeof window === "undefined") return { token: null, user: null };
  const token = localStorage.getItem("token");
  const user = localStorage.getItem("user");
  return {
    token: token || null,
    user: user ? JSON.parse(user) : null,
  };
}

function subscribe(callback) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

function getSnapshot() {
  return JSON.stringify(getStoredAuth());
}

function getServerSnapshot() {
  return JSON.stringify({ token: null, user: null });
}

export function AuthProvider({ children }) {
  const router = useRouter();
  const authSnapshot = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  const { token, user } = JSON.parse(authSnapshot);

  const [loading, setLoading] = useState(false);

  const login = useCallback(async (email, password) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage"));
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const register = useCallback(async (name, email, password) => {
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (data.error) throw new Error(data.error);

      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      window.dispatchEvent(new Event("storage"));
      router.push("/dashboard");
    } finally {
      setLoading(false);
    }
  }, [router]);

  const logout = useCallback(() => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    window.dispatchEvent(new Event("storage"));
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, token, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);
