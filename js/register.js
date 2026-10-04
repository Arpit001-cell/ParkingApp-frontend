import { api } from "./api.js";
import { saveSession, dashboardFor } from "./auth.js";
import { showToast, withBusy } from "./ui.js";
const f = document.getElementById("f"), p1 = document.getElementById("p1"), p2 = document.getElementById("p2"), role = document.getElementById("role");
let step = 1;
role.onchange = () => { document.getElementById("dv").hidden = role.value !== "DRIVER"; };
f.onsubmit = async e => {
  e.preventDefault();
  if (step === 1) { step = 2; p1.hidden = true; p2.hidden = false; document.getElementById("s2").className = "on"; e.submitter.textContent = "Create account"; return; }
  const b = Object.fromEntries(new FormData(f));
  if (b.role === "OWNER") { delete b.vehicleNumber; if (!/^[0-9]{10}$/.test(b.phone)) return showToast("Owner phone must be exactly 10 digits", "error"); }
  await withBusy(e.submitter, async () => {
    try { const r = await api("/api/auth/register", { method: "POST", body: b, auth: false }); saveSession(r.token, r.user); showToast("Account created", "success"); location.href = dashboardFor(r.user.role); }
    catch (err) { showToast(err.message, "error"); }
  });
};
