import { api, BASE } from "./api.js";
import { saveSession, dashboardFor } from "./auth.js";
import { showToast, withBusy } from "./ui.js";
if (new URLSearchParams(location.search).has("expired")) showToast("Your session has expired. Please log in again.", "info");
document.getElementById("g").onclick = () => { location.href = BASE + "/oauth2/authorization/google"; };
document.getElementById("f").onsubmit = async e => {
  e.preventDefault();
  const fd = Object.fromEntries(new FormData(e.target));
  await withBusy(e.submitter, async () => {
    try { const r = await api("/api/auth/login", { method: "POST", body: fd, auth: false }); saveSession(r.token, r.user); location.href = dashboardFor(r.user.role); }
    catch (err) { showToast(err.message, "error"); }
  });
};
