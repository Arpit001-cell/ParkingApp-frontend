exportconst API_BASE = "https://parkingapp-backend-production.up.railway.app";
export class ApiError extends Error { constructor(status, message) { super(message); this.status = status; } }
export const getToken = () => localStorage.getItem("token");
export const clearSession = () => { localStorage.removeItem("token"); localStorage.removeItem("user"); };

// Single fetch wrapper: JWT injection, JSON parsing, 401 handling, error normalising.
export async function api(path, { method = "GET", body, auth = true } = {}) {
  const headers = { Accept: "application/json" };
  if (body) headers["Content-Type"] = "application/json";
  const token = getToken();
  if (auth && token) headers.Authorization = `Bearer ${token}`;
  let res;
  try { res = await fetch(BASE + path, { method, headers, body: body ? JSON.stringify(body) : undefined }); }
  catch { throw new ApiError(0, "Cannot reach the server. Is the backend running on :8089?"); }
  const text = await res.text();
  let data = null;
  try { data = text ? JSON.parse(text) : null; } catch { data = text; }
  if (res.status === 401 && auth && token) {
    clearSession();
    location.href = "/login.html?expired=1";
    throw new ApiError(401, "Session expired");
  }
  if (!res.ok) {
    // Backend errors: {success,message} | {status,message} | {field: message} | plain text
    const msg = (typeof data === "string" && data) || data?.message ||
      (data && typeof data === "object" ? Object.values(data).join(", ") : "") || `Request failed (${res.status})`;
    throw new ApiError(res.status, msg);
  }
  return data;
}
