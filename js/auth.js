import { api, clearSession, getToken } from "./api.js";
let cached = null; // in-memory cache so /api/auth/me is not called repeatedly
export const saveSession = (token, user) => { localStorage.setItem("token", token); if (user) localStorage.setItem("user", JSON.stringify(user)); cached = user || null; };
export async function getCurrentUser(force = false) {
  if (!getToken()) return null;
  if (cached && !force) return cached;
  const r = await api("/api/auth/me");
  cached = r.data; localStorage.setItem("user", JSON.stringify(cached));
  return cached;
}
export const dashboardFor = role => role === "OWNER" ? "/owner-dashboard.html" : role === "DRIVER" ? "/driver-dashboard.html" : "/parking.html";
export function logout() { cached = null; clearSession(); location.href = "/login.html"; }
export async function requireAuth() { const u = await getCurrentUser().catch(() => null); if (!u) { location.href = "/login.html"; throw new Error("auth"); } return u; }
export async function requireRole(...roles) {
  const u = await requireAuth();
  if (!roles.includes(u.role)) { location.href = dashboardFor(u.role); throw new Error("role"); }
  return u; // UX only; the backend is the real authority
}
