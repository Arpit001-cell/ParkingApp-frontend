import { api } from "./api.js";
import { requireRole } from "./auth.js";
import { el, renderNav, showToast, skeletons, empty, badge, slotBar, confirmDialog, withBusy, formatCurrency } from "./ui.js";
const user = await requireRole("OWNER");
await renderNav();
const $ = id => document.getElementById(id), f = $("f");
async function load() {
  $("st").replaceChildren(...skeletons(4)); $("list").replaceChildren(...skeletons());
  try {
    const [ps, bs] = await Promise.all([api(`/api/parkings/my-parkings/${user.ownerId}`), api(`/api/bookings/owner/${user.ownerId}`)]);
    const stat = (n, l) => el("div", { class: "card stat" }, el("b", {}, n), el("span", { class: "mu" }, l));
    const sum = k => ps.reduce((a, p) => a + (p[k] || 0), 0);
    $("st").replaceChildren(stat(ps.length, "Parking locations"), stat(sum("totalSlots"), "Total slots"), stat(sum("availableSlots"), "Available"),
      stat(bs.filter(b => b.status === "ACTIVE").length, "Active bookings"), stat(formatCurrency(bs.filter(b => b.status !== "CANCELLED").reduce((a, b) => a + (b.totalCost || 0), 0)), "Booked revenue"));
    $("list").replaceChildren(...(ps.length ? ps.map(p => el("div", { class: "card" },
      el("div", { class: "row", style: "justify-content:space-between" }, el("b", {}, p.parkingName || `Parking #${p.parkingId}`), badge(p.status)),
      el("p", { class: "mu" }, p.location), slotBar(p.availableSlots, p.totalSlots), el("p", {}, `${p.availableSlots}/${p.totalSlots} free · ${formatCurrency(p.pricePerHour)}/hr`),
      el("div", { class: "row" },
        el("button", { class: "btn ghost sm", onclick: async () => { try { await api(`/api/parkings/${p.parkingId}`, { method: "PUT", body: { status: p.status === "OPEN" ? "CLOSED" : "OPEN" } }); showToast("Status updated", "success"); load(); } catch (e) { showToast(e.message, "error"); } } }, p.status === "OPEN" ? "Close" : "Open"),
        el("button", { class: "btn bad sm", onclick: async () => { if (!(await confirmDialog("Delete this parking?", "Delete"))) return; try { await api(`/api/parkings/delete/${p.parkingId}`, { method: "DELETE" }); showToast("Parking deleted", "success"); load(); } catch (e) { showToast(e.message, "error"); } } }, "Delete")))) : [empty("You have not added any parking locations yet.")]));
    const cell = (l, v) => el("td", { "data-l": l }, v);
    $("bk").replaceChildren(...bs.map(b => el("tr", {}, cell("ID", b.bookingId), cell("Driver", b.driverName), cell("Vehicle", b.vehicleNumber), cell("Parking", b.parkingLocation), cell("Date", b.bookingDate),
      cell("Time", `${b.startTime}–${b.endTime}`), cell("Hrs", b.durationHours), cell("Amount", formatCurrency(b.totalCost)), cell("Status", badge(b.status)))));
    if (!bs.length) $("bk").replaceChildren(el("tr", {}, el("td", { colspan: 9 }, "No bookings yet.")));
  } catch (e) { showToast(e.message, "error"); }
}
$("gps").onclick = () => navigator.geolocation?.getCurrentPosition(p => { f.latitude.value = p.coords.latitude.toFixed(6); f.longitude.value = p.coords.longitude.toFixed(6); }, () => showToast("Location access denied", "warning"));
f.onsubmit = async e => {
  e.preventDefault();
  const v = Object.fromEntries(new FormData(f)), lat = v.latitude, lng = v.longitude;
  if ((lat === "") !== (lng === "")) return showToast("Enter both latitude and longitude, or neither", "error");
  const body = { parkingName: v.parkingName, location: v.location, totalSlots: +v.totalSlots, pricePerHour: +v.pricePerHour }; // no ownerId: backend reads it from the JWT
  if (lat !== "") { if (Math.abs(+lat) > 90 || Math.abs(+lng) > 180) return showToast("Invalid coordinates", "error"); body.latitude = +lat; body.longitude = +lng; }
  await withBusy($("sv"), async () => { try { await api("/api/parkings", { method: "POST", body }); showToast("Parking created successfully", "success"); f.reset(); load(); } catch (err) { showToast(err.message, "error"); } });
};
load();
