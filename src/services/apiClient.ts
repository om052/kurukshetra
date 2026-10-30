const API_BASE = import.meta.env.VITE_API_BASE_URL || "http://localhost:4000/api/v1";

export async function apiFetch(path: string, token?: string | null, init?: RequestInit) {
  const headers = new Headers(init?.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(`${API_BASE}${path}`, { ...init, headers });
  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || `HTTP ${res.status}`);
  }
  return res.json();
}