import { api } from "./api.js";
import { requireRole } from "./auth.js";
import { el, renderNav, showToast, skeletons, empty, badge, confirmDialog, formatCurrency } from "./ui.js";
const user = await requireRole("DRIVER");
await renderNav();
const st = document.getElementById("st"), list = document.getElementById("list");
async function load() {
  st.replaceChildren(...skeletons(3)); list.replaceChildren(...skeletons());
  try {
    const bookings = await api(`/api/bookings/driver/${user.driverId}`);
    const stat = (n, l) => el("div", { class: "card stat" }, el("b", {}, n), el("span", { class: "mu" }, l));
    st.replaceChildren(stat(bookings.filter(b => b.status === "ACTIVE").length, "Active bookings"),
      stat(bookings.filter(b => b.status !== "ACTIVE").length, "Completed / cancelled"), stat(bookings[0]?.vehicleNumber ?? "—", "Vehicle"),
      el("a", { class: "card stat", href: "/parking.html" }, el("b", {}, "→"), el("span", { class: "mu" }, "Find parking")));
    list.replaceChildren(...(bookings.length ? bookings.map(b => el("div", { class: "card" },
      el("div", { class: "row", style: "justify-content:space-between" }, el("b", {}, `Booking #${b.bookingId}`), badge(b.status)),
      el("p", { class: "mu" }, `${b.parkingLocation} · Parking #${b.parkingId}`), el("p", {}, `${b.bookingDate} · ${b.startTime} – ${b.endTime} (${b.durationHours}h)`),
      el("p", { class: "mu" }, `${b.vehicleNumber} · ${formatCurrency(b.totalCost)}`),
      b.status === "ACTIVE" && el("button", { class: "btn bad sm", onclick: async () => {
        if (!(await confirmDialog("Cancel this booking?", "Cancel booking"))) return;
        try { await api(`/api/bookings/cancel/${b.bookingId}`, { method: "PUT" }); showToast("Booking cancelled", "success"); load(); } catch (e) { showToast(e.message, "error"); }
      } }, "Cancel Booking"))) : [empty("No active bookings.")]));
  } catch (e) { showToast(e.message, "error"); list.replaceChildren(empty(e.message)); }
}
load();
