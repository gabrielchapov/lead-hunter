import type { Lead, Stage } from "./types";

// Configurable so the frontend can point at whatever port the backend
// actually ends up on (uvicorn defaults to 8000, but that port is
// commonly already taken on Windows). Override via frontend/.env:
//   VITE_API_BASE=http://localhost:8001/api/v1
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api/v1";

// Strip /api/v1 to get the base URL for non-REST endpoints
const BASE_URL = API_BASE.replace(/\/api\/v1$/, "");

const TOKEN_KEY = "lh_token";

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

function setToken(token: string) {
  localStorage.setItem(TOKEN_KEY, token);
}

export function clearToken() {
  localStorage.removeItem(TOKEN_KEY);
}

// Thrown when the backend rejects a request as unauthorized (missing,
// expired, or invalid token) — callers use this to distinguish "log in
// again" from an ordinary network/server error.
export class AuthError extends Error {}

// Surfaces the backend's actual error message (FastAPI puts it in
// `detail`) instead of just a bare status code — every failure used to
// look identical in the console with no way to tell them apart.
async function extractErrorDetail(res: Response): Promise<string> {
  try {
    const body = await res.json();
    return body.detail ?? JSON.stringify(body);
  } catch {
    return res.statusText || `HTTP ${res.status}`;
  }
}

// Every leads/kanban/etc. endpoint requires a Bearer token — this wrapper
// attaches it and turns a 401 into an AuthError so the app can drop back
// to the login screen instead of showing a raw fetch error.
async function authFetch(url: string, options: RequestInit = {}): Promise<Response> {
  const token = getToken();
  const headers = new Headers(options.headers);
  if (token) headers.set("Authorization", `Bearer ${token}`);
  const res = await fetch(url, { ...options, headers });
  if (res.status === 401) {
    clearToken();
    throw new AuthError("Sessão expirada. Faça login novamente.");
  }
  return res;
}

export async function login(username: string, password: string): Promise<void> {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ username, password }),
  });
  if (!res.ok) throw new Error(await extractErrorDetail(res));
  const { token } = await res.json();
  setToken(token);
}

export async function fetchLeads(): Promise<Lead[]> {
  const res = await authFetch(`${API_BASE}/leads`);
  if (!res.ok) throw new Error(`Failed to fetch leads: ${await extractErrorDetail(res)}`);
  return res.json();
}

export async function updateStage(id: string, stage: Stage): Promise<Lead> {
  const res = await authFetch(`${API_BASE}/leads/${id}/stage`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ stage }),
  });
  if (!res.ok) throw new Error(`Failed to update stage: ${await extractErrorDetail(res)}`);
  return res.json();
}

export async function enrichLead(id: string): Promise<Lead> {
  const res = await authFetch(`${API_BASE}/leads/${id}/enrich`, { method: "POST" });
  if (!res.ok) throw new Error(await extractErrorDetail(res));
  return res.json();
}

export async function clearAllLeads(): Promise<{ status: string; deleted_count: number }> {
  const res = await authFetch(`${API_BASE}/leads`, { method: "DELETE" });
  if (!res.ok) throw new Error(`Failed to clear leads: ${await extractErrorDetail(res)}`);
  return res.json();
}

interface OverpassImportResult {
  status: "imported" | "no_results";
  location: string;
  category: string | null;
  // Only present when status === "imported"
  new_count?: number;
  total_scraped?: number;
  duplicates_skipped?: number;
  // Only present when status === "no_results"
  message?: string;
}

export async function importFromOverpass(
  location: string,
  category: string | null,
  radius_km: number = 25
): Promise<OverpassImportResult> {
  const res = await authFetch(`${API_BASE}/leads/import-overpass`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ location, category, radius_km }),
  });
  if (!res.ok) {
    throw new Error(`Failed to import from OpenStreetMap: ${await extractErrorDetail(res)}`);
  }
  return res.json();
}
