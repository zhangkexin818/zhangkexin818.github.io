(() => {
  "use strict";

  const finePointer = window.matchMedia("(pointer: fine)");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const root = document.documentElement;
  let liveHalo = null;

  root.classList.add("zk-cursor-system");

  const style = document.createElement("style");
  style.dataset.zkCursorStyles = "true";
  style.textContent = `
    html.zk-cursor-system,
    html.zk-cursor-system body { cursor: auto !important; }
    html.zk-cursor-system a,
    html.zk-cursor-system button,
    html.zk-cursor-system [role="button"],
    html.zk-cursor-system [role="tab"],
    html.zk-cursor-system input,
    html.zk-cursor-system select,
    html.zk-cursor-system textarea,
    html.zk-cursor-system label[for] { cursor: pointer !important; }
    html.zk-cursor-system [data-zk-local-wheel] { cursor: grab !important; }
    html.zk-cursor-system [data-zk-local-wheel]:active { cursor: grabbing !important; }
    html.zk-cursor-system .site-cursor,
    html.zk-cursor-system body > .cursor-core,
    html.zk-cursor-system body > .cursor-orbit,
    html.zk-cursor-system body > .cursor-ring,
    html.zk-cursor-system body > .cursor-dot { display: none !important; }
    .zk-pointer-halo {
      position: fixed;
      z-index: 2147483000;
      top: 0;
      left: 0;
      width: 30px;
      height: 30px;
      border: 1px solid rgba(139, 44, 194, .82);
      border-radius: 50%;
      opacity: 0;
      pointer-events: none;
      box-shadow: inset 0 0 0 1px rgba(243, 241, 247, .3), 0 0 18px rgba(100, 21, 154, .2);
      transform: translate3d(-100px, -100px, 0) translate(-50%, -50%);
      transition: width 180ms cubic-bezier(.2,.75,.2,1), height 180ms cubic-bezier(.2,.75,.2,1), opacity 120ms ease, border-color 180ms ease, background 180ms ease;
      will-change: transform;
    }
    .zk-pointer-halo::after {
      position: absolute;
      top: 50%;
      left: 50%;
      width: 3px;
      height: 3px;
      border-radius: 50%;
      background: #f3f1f7;
      box-shadow: 0 0 0 1px rgba(48, 0, 72, .7), 0 0 8px rgba(139, 44, 194, .75);
      content: "";
      transform: translate(-50%, -50%);
    }
    .zk-pointer-halo.is-visible { opacity: .92; }
    .zk-pointer-halo.is-interactive {
      width: 42px;
      height: 42px;
      border-color: rgba(199, 168, 220, .95);
      background: rgba(100, 21, 154, .08);
    }
    .zk-pointer-halo.is-pressed {
      width: 23px;
      height: 23px;
      background: rgba(139, 44, 194, .14);
    }
    @media (pointer: coarse), (prefers-reduced-motion: reduce) {
      .zk-pointer-halo { display: none !important; }
    }
  `;
  document.head.appendChild(style);

  function hideLocalHalo() {
    liveHalo?.classList.remove("is-visible", "is-pressed", "is-interactive");
  }

  // A pointer crossing into an iframe does not reliably trigger pointerleave
  // in its parent document. Child frames explicitly retire the parent halo so
  // a stale ring cannot remain floating above the embedded page.
  window.addEventListener("message", (event) => {
    if (event.data?.type !== "zk:cursor-enter") return;
    hideLocalHalo();
    if (window.parent !== window) window.parent.postMessage({ type: "zk:cursor-enter" }, "*");
  });

  function start() {
    if (!finePointer.matches || reducedMotion.matches || document.querySelector(".zk-pointer-halo")) return;
    const halo = document.createElement("div");
    halo.className = "zk-pointer-halo";
    halo.setAttribute("aria-hidden", "true");
    document.body.appendChild(halo);
    liveHalo = halo;

    let pointerX = -100;
    let pointerY = -100;
    let frame = 0;
    let parentNotified = false;

    const paint = () => {
      frame = 0;
      halo.style.transform = `translate3d(${pointerX}px, ${pointerY}px, 0) translate(-50%, -50%)`;
    };

    const requestPaint = () => {
      if (!frame) frame = window.requestAnimationFrame(paint);
    };

    window.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      pointerX = event.clientX;
      pointerY = event.clientY;
      if (!parentNotified && window.parent !== window) {
        window.parent.postMessage({ type: "zk:cursor-enter" }, "*");
        parentNotified = true;
      }
      halo.classList.add("is-visible");
      const target = event.target instanceof Element ? event.target : null;
      halo.classList.toggle("is-interactive", Boolean(target?.closest("a, button, [role='button'], [role='tab'], input, select, textarea, [data-zk-local-wheel]")));
      requestPaint();
    }, { passive: true });

    window.addEventListener("pointerdown", (event) => {
      if (event.pointerType !== "touch") halo.classList.add("is-pressed");
    }, { passive: true });
    window.addEventListener("pointerup", () => halo.classList.remove("is-pressed"), { passive: true });
    window.addEventListener("pointercancel", () => halo.classList.remove("is-pressed"), { passive: true });
    window.addEventListener("blur", hideLocalHalo);
    window.addEventListener("pointerout", (event) => {
      if (event.relatedTarget === null) hideLocalHalo();
    }, { passive: true });
    document.addEventListener("pointerleave", () => {
      parentNotified = false;
      hideLocalHalo();
    });
  }

  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", start, { once: true });
  else start();
})();
