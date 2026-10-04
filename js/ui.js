import { getCurrentUser, logout, dashboardFor } from "./auth.js";
// Safe DOM builder: strings become text nodes, never HTML.
export function el(tag, attrs = {}, ...kids) {
  const n = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (k === "class") n.className = v; else if (k.startsWith("on")) n.addEventListener(k.slice(2), v);
    else if (v !== false && v != null) n.setAttribute(k, v);
  }
  for (const c of kids.flat()) if (c != null) n.append(c.nodeType ? c : document.createTextNode(String(c)));
  return n;
}
export const formatCurrency = n => `₹${Number(n ?? 0).toLocaleString("en-IN")}`;
export const formatDistance = k => k == null ? "—" : k < 1 ? `${Math.round(k * 1000)} m` : `${k.toFixed(1)} km`;
export function showToast(msg, type = "info") {
  let box = document.getElementById("toasts");
  if (!box) { box = el("div", { id: "toasts" }); document.body.append(box); }
  const icon = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" }[type];
  const t = el("div", { class: `toast ${type}` }, `${icon} ${msg}`);
  box.append(t); setTimeout(() => t.remove(), 4000);
}
export async function withBusy(btn, fn) {
  btn.disabled = true; btn.classList.add("busy");
  try { return await fn(); } finally { btn.disabled = false; btn.classList.remove("busy"); }
}
export const skeletons = (n = 3) => Array.from({ length: n }, () => el("div", { class: "sk" }));
export const empty = msg => el("div", { class: "empty" }, msg);
export function badge(status) {
  const s = String(status).toUpperCase();
  const cls = ["ACTIVE", "OPEN", "COMPLETED"].includes(s) ? "b-ok" : ["CANCELLED", "CLOSED"].includes(s) ? "b-bad" : "b-warn";
  return el("span", { class: `badge ${cls}` }, s);
}
export function slotBar(avail, total) {
  const pct = total ? Math.round(avail / total * 100) : 0;
  const b = el("b"); b.style.background = avail === 0 ? "var(--bad)" : pct < 25 ? "var(--warn)" : "var(--ok)";
  requestAnimationFrame(() => requestAnimationFrame(() => { b.style.width = pct + "%"; }));
  return el("div", { class: "bar" }, b);
}
export function modal(content) {
  const m = el("div", { class: "modal", onclick: e => e.target === m && m.remove() }, el("div", { class: "card" }, content));
  document.body.append(m); return m;
}
export function confirmDialog(message, okLabel = "Confirm") {
  return new Promise(res => {
    const m = modal([el("h2", {}, "Please confirm"), el("p", { class: "mu" }, message),
      el("div", { class: "row", style: "margin-top:18px" },
        el("button", { class: "btn bad", onclick: () => { m.remove(); res(true); } }, okLabel),
        el("button", { class: "btn ghost", onclick: () => { m.remove(); res(false); } }, "Back"))]);
  });
}
export async function renderNav() {
  const user = await getCurrentUser().catch(() => null);
  const links = user
    ? [el("a", { class: "l", href: "/parking.html" }, "Find Parking"), el("a", { class: "l", href: dashboardFor(user.role) }, "Dashboard"),
       el("span", { class: "mu" }, user.name), el("button", { class: "btn ghost sm", onclick: logout }, "Logout")]
    : [el("a", { class: "l", href: "/parking.html" }, "Find Parking"), el("a", { class: "l", href: "/login.html" }, "Login"),
       el("a", { class: "btn sm", href: "/register.html" }, "Get Started")];
  document.getElementById("nav").replaceChildren(el("nav", { class: "top" }, el("div", { class: "wrap" },
    el("a", { class: "logo", href: "/index.html" }, "PARK", el("i", {}, "NOVA")), el("span", { class: "sp" }), ...links)));
  return user;
}
