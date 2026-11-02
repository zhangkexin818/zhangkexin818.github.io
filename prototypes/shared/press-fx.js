/* Click feedback for every interactive element: press-scale + ripple at the press point. */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const SEL = 'a[href], button:not([disabled]), [role="button"], [role="tab"], summary, label[for], select, input:not([type="hidden"]):not([type="text"]):not([type="email"]):not([type="search"]), .rd-shot, .rd-film, .rd-reel, .film-item, .stratum-card, [data-evidence-image], [data-evidence-video]';
  const isScroller = (el) => el.scrollWidth > el.clientWidth + 4 || el.scrollHeight > el.clientHeight + 4;
  function target(start) {
    let el = start && start.closest ? start.closest(SEL) : null;
    if (el) {
      // a card's inner overlay button should press the card, not the invisible button
      const card = el.closest(".rd-film, .rd-shot, .rd-reel");
      return card || el;
    }
    for (let n = start; n && n !== document.body; n = n.parentElement) {
      if (getComputedStyle(n).cursor === "pointer" && !isScroller(n)) return n;
    }
    return null;
  }
  function ripple(x, y, size) {
    const r = document.createElement("span");
    r.className = "zk-ripple";
    const d = Math.max(56, Math.min(220, size));
    Object.assign(r.style, { left: x + "px", top: y + "px", width: d + "px", height: d + "px" });
    document.body.appendChild(r);
    r.addEventListener("animationend", () => r.remove(), { once: true });
    setTimeout(() => r.remove(), 900);
  }
  function press(el) {
    if (reduce || !el.animate) return;
    const b = el.getBoundingClientRect();
    const s = 1 - Math.min(0.045, 9 / Math.max(b.width, b.height, 1));
    el.animate([{ scale: "1" }, { scale: String(s), offset: 0.35 }, { scale: "1" }], { duration: 420, easing: "cubic-bezier(.22,.72,.16,1)" });
  }
  document.addEventListener("pointerdown", (e) => {
    if (e.button !== 0) return;
    const el = target(e.target);
    if (!el) return;
    const b = el.getBoundingClientRect();
    ripple(e.clientX, e.clientY, Math.min(b.width, b.height) * 0.9);
    press(el);
  }, { capture: true, passive: true });
  document.addEventListener("keydown", (e) => {
    if (e.key !== "Enter" && e.key !== " ") return;
    const el = target(document.activeElement);
    if (!el || el === document.body) return;
    const b = el.getBoundingClientRect();
    ripple(b.left + b.width / 2, b.top + b.height / 2, Math.min(b.width, b.height));
    press(el);
  }, true);
})();
