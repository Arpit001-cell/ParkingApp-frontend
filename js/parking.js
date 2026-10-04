import { api } from "./api.js";
import { requireAuth } from "./auth.js";
import { el, renderNav, showToast, skeletons, empty, badge, slotBar, modal, confirmDialog, withBusy, formatCurrency, formatDistance } from "./ui.js";
const user = await requireAuth();
await renderNav();
const $ = id => document.getElementById(id), list = $("list");
const map = L.map("map").setView([23.2599, 77.4126], 12);
L.tileLayer("https://tile.openstreetmap.org/{z}/{x}/{y}.png", { attribution: "© OpenStreetMap" }).addTo(map);
let layer = L.layerGroup().addTo(map), here = null;

const getPos = () => new Promise((ok, no) => navigator.geolocation ? navigator.geolocation.getCurrentPosition(ok, no, { timeout: 10000 }) : no(new Error("Geolocation unsupported")));
const color = p => p.availableSlots === 0 ? "var(--bad)" : p.availableSlots / p.totalSlots < .25 ? "var(--warn)" : "var(--ok)";
const directions = p => `https://www.google.com/maps/dir/?api=1&destination=${p.latitude},${p.longitude}`;

function bookModal(p) {
  const t = new Date(), time = el("input", { type: "time", value: `${String(t.getHours()).padStart(2, "0")}:${String(t.getMinutes()).padStart(2, "0")}` });
  const dur = el("select", {}, [1, 2, 3, 4, 5].map(n => el("option", { value: n }, `${n} hour${n > 1 ? "s" : ""}`)));
  const cost = el("p", { class: "mu" }), upd = () => { cost.textContent = `${formatCurrency(p.pricePerHour)}/hour × ${dur.value} = ${formatCurrency(p.pricePerHour * dur.value)}`; };
  dur.onchange = upd; upd();
  const btn = el("button", { class: "btn" }, "Book now");
  const m = modal([el("h2", { style: "margin-top:0" }, p.parkingName || "Parking"), el("label", {}, "Start time"), time, el("label", {}, "Duration"), dur, cost, btn]);
  btn.onclick = async () => {
    if (!time.value) return showToast("Pick a start time", "warning");
    if (!(await confirmDialog("Confirm your parking reservation?", "Confirm"))) return;
    await withBusy(btn, async () => {
      try { // driverId is intentionally NOT sent; the backend uses the authenticated driver
        await api("/api/bookings/book", { method: "POST", body: { parkingId: p.id, startTime: time.value + ":00", durationHours: Number(dur.value) } });
        m.remove(); showToast("Parking booked!", "success"); search();
      } catch (e) { showToast(e.message, e.status === 409 ? "warning" : "error"); }
    });
  };
}
const book = p => user.role !== "DRIVER" ? showToast("Only driver accounts can book parking", "info") : p.availableSlots === 0 ? showToast("Parking is currently full", "warning") : bookModal(p);

function card(p) {
  return el("div", { class: "card" },
    el("div", { class: "row", style: "justify-content:space-between" }, el("b", {}, p.parkingName || "Parking"), badge(p.status)),
    el("p", { class: "mu" }, p.address || "—"),
    el("p", {}, `${formatDistance(p.distanceKm)} · ${formatCurrency(p.pricePerHour)}/hr`),
    slotBar(p.availableSlots, p.totalSlots), el("p", { class: "mu" }, `${p.availableSlots} / ${p.totalSlots} slots free`),
    el("div", { class: "row" }, user.role === "DRIVER" && el("button", { class: "btn sm", onclick: () => book(p) }, "Book Parking"),
      el("a", { class: "btn ghost sm", href: directions(p), target: "_blank", rel: "noopener" }, "Get Directions")));
}
async function search() {
  list.replaceChildren(...skeletons());
  let pos;
  try { pos = await getPos(); } catch { list.replaceChildren(empty("Location permission is needed to find parking near you.")); return showToast("Location access denied", "warning"); }
  const { latitude, longitude } = pos.coords; // used only for this request; never stored
  try {
    const q = new URLSearchParams({ latitude, longitude, radius: $("rad").value, availableOnly: $("av").checked });
    const r = await api("/api/parkings/nearby?" + q);
    const key = $("sort").value, data = [...r.data].sort((a, b) => (a[key] ?? 0) - (b[key] ?? 0));
    layer.clearLayers(); here?.remove();
    here = L.marker([latitude, longitude], { icon: L.divIcon({ className: "", html: "<div class=me></div>", iconSize: [16, 16] }) }).addTo(map);
    data.forEach(p => { if (p.latitude == null) return;
      const pin = L.divIcon({ className: "", html: `<div class=pin style="background:${color(p)}"></div>`, iconSize: [26, 26] });
      L.marker([p.latitude, p.longitude], { icon: pin }).addTo(layer).bindPopup(el("div", {}, el("b", {}, p.parkingName || "Parking"), el("div", {}, `${formatDistance(p.distanceKm)} · ${p.availableSlots} free · ${formatCurrency(p.pricePerHour)}/hr`), el("button", { class: "btn sm", style: "margin-top:6px", onclick: () => book(p) }, "Book Now")));
    });
    map.setView([latitude, longitude], 13);
    list.replaceChildren(...(data.length ? data.map(card) : [empty("No parking spots found nearby.")]));
  } catch (e) { list.replaceChildren(empty(e.message)); showToast(e.message, "error"); }
}
$("go").onclick = search; search();
