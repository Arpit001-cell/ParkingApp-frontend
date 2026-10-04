import { api } from "./api.js";
import { saveSession, getCurrentUser, dashboardFor } from "./auth.js";
import { el, showToast, withBusy } from "./ui.js";
const h = new URLSearchParams(location.hash.slice(1));
const token = h.get("token"), error = h.get("error");
history.replaceState({}, document.title, location.pathname); // JWT never stays in the URL
const box = document.getElementById("box");
const fail = m => { showToast(m, "error"); setTimeout(() => location.href = "/login.html", 1800); };
(async () => {
  if (error || !token) return fail("Google sign-in failed: " + (error || "no token received"));
  saveSession(token, null);
  try {
    const u = await getCurrentUser(true);
    if (u.role !== "USER") return (location.href = dashboardFor(u.role));
    // Google sign-ups start as USER: pick a profile via POST /api/auth/profile/{owner|driver}
    const phone = el("input", { placeholder: "Phone", required: true }), veh = el("input", { placeholder: "Vehicle number (drivers)" });
    const pick = kind => async ev => withBusy(ev.currentTarget, async () => {
      try {
        const body = kind === "driver" ? { phone: phone.value, vehicleNumber: veh.value } : { phone: phone.value };
        const r = await api("/api/auth/profile/" + kind, { method: "POST", body });
        saveSession(r.token, r.user); location.href = dashboardFor(r.user.role);
      } catch (e) { showToast(e.message, "error"); }
    });
    box.replaceChildren(el("h2", { style: "margin-top:0" }, "Choose your account type"), phone, veh,
      el("div", { class: "row", style: "margin-top:14px" }, el("button", { class: "btn", onclick: pick("driver") }, "I am a Driver"), el("button", { class: "btn ghost", onclick: pick("owner") }, "I own parking")));
  } catch (e) { fail(e.message); }
})();
