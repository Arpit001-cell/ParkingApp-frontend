import { renderNav, el } from "./ui.js";
renderNav();
document.getElementById("viz").append(...Array.from({ length: 24 }, (_, i) => { const s = el("span", { class: i % 5 === 2 ? "t" : "" }); s.style.animationDelay = (i % 7) * .3 + "s"; return s; }));
