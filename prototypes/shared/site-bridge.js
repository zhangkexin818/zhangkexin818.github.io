(() => {
  "use strict";

  const STORAGE_KEY = "zk-route-transition";
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const ROUTE_LABELS = [
    ["homepage-v9-particle-spectrum-concept", "PERSONAL ORBIT"],
    ["work-v2-reference-orbit-concept", "WORK / EXPERIENCE ORBIT"],
    ["ip-v5-particle-boundary-fall-concept", "IP / LIVING CHARACTERS"],
    ["archive-v1-version-strata-concept", "ARCHIVE / VERSION STRATA"],
    ["about-v1-identity-spectrum-concept", "ABOUT / IDENTITY SPECTRUM"],
  ];

  let bridge;
  let canvas;
  let context;
  let frame = 0;
  let navigating = false;

  function readPayload() {
    try {
      const value = JSON.parse(window.sessionStorage.getItem(STORAGE_KEY) || "null");
      if (!value || Date.now() - value.time > 6000) return null;
      return value;
    } catch (_) {
      return null;
    }
  }

  function clearPayload() {
    try {
      window.sessionStorage.removeItem(STORAGE_KEY);
    } catch (_) {
      // Storage is optional on restrictive local-file browser settings.
    }
  }

  function writePayload(payload) {
    try {
      window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(payload));
    } catch (_) {
      // Navigation still works without the arrival half of the effect.
    }
  }

  function routeLabel(url, fallback = "NEXT ORBIT") {
    const match = ROUTE_LABELS.find(([fragment]) => url.pathname.includes(fragment));
    return match ? match[1] : fallback;
  }

  function createBridge() {
    bridge = document.createElement("div");
    bridge.className = "zk-route-bridge";
    bridge.setAttribute("aria-hidden", "true");
    bridge.innerHTML = `
      <div class="zk-route-bridge__wash"></div>
      <canvas class="zk-route-bridge__particles"></canvas>
      <span class="zk-route-bridge__signal"><b>NEXT ORBIT</b><i></i></span>
    `;
    document.body.appendChild(bridge);
    canvas = bridge.querySelector("canvas");
    context = canvas.getContext("2d");
  }

  function setOrigin(xRatio, yRatio) {
    const x = Math.max(18, Math.min(window.innerWidth - 18, window.innerWidth * xRatio));
    const y = Math.max(18, Math.min(window.innerHeight - 18, window.innerHeight * yRatio));
    bridge.style.setProperty("--zk-route-x", `${x}px`);
    bridge.style.setProperty("--zk-route-y", `${y}px`);
    return { x, y };
  }

  function fitCanvas() {
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.max(1, Math.round(window.innerWidth * dpr));
    canvas.height = Math.max(1, Math.round(window.innerHeight * dpr));
    canvas.style.width = `${window.innerWidth}px`;
    canvas.style.height = `${window.innerHeight}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  }

  function animateParticles(origin, arrival = false) {
    window.cancelAnimationFrame(frame);
    fitCanvas();
    const palette = ["#f3f1f7", "#64159a", "#777a7d", "#ffffff"];
    const particles = Array.from({ length: window.innerWidth < 720 ? 42 : 72 }, (_, index) => ({
      angle: (Math.PI * 2 * index) / 72 + Math.random() * .55,
      radius: 8 + Math.random() * 34,
      drift: 55 + Math.random() * 220,
      curve: (Math.random() - .5) * 2.8,
      size: .7 + Math.random() * 2.1,
      alpha: .28 + Math.random() * .7,
      color: palette[index % palette.length],
    }));
    const startedAt = performance.now();
    const duration = arrival ? 760 : 680;

    function render(now) {
      const raw = Math.min(1, (now - startedAt) / duration);
      const progress = arrival ? 1 - raw : raw;
      context.clearRect(0, 0, window.innerWidth, window.innerHeight);
      context.save();
      context.globalCompositeOperation = "screen";
      particles.forEach((particle) => {
        const distance = particle.radius + particle.drift * progress;
        const theta = particle.angle + particle.curve * progress;
        const x = origin.x + Math.cos(theta) * distance;
        const y = origin.y + Math.sin(theta) * distance * .58;
        context.beginPath();
        context.fillStyle = particle.color;
        context.globalAlpha = particle.alpha * Math.sin(Math.PI * Math.min(.98, raw + .02));
        context.arc(x, y, particle.size * (1 - progress * .34), 0, Math.PI * 2);
        context.fill();
      });
      context.restore();
      if (raw < 1) frame = window.requestAnimationFrame(render);
      else context.clearRect(0, 0, window.innerWidth, window.innerHeight);
    }

    frame = window.requestAnimationFrame(render);
  }

  function navigate(href, options = {}) {
    if (navigating) return;
    const target = new URL(href, window.location.href);
    if (reducedMotion.matches) {
      window.location.href = target.href;
      return;
    }

    navigating = true;
    const source = options.source;
    const bounds = source?.getBoundingClientRect?.();
    const x = options.clientX ?? (bounds ? bounds.left + bounds.width / 2 : window.innerWidth / 2);
    const y = options.clientY ?? (bounds ? bounds.top + bounds.height / 2 : window.innerHeight / 2);
    const xRatio = x / Math.max(1, window.innerWidth);
    const yRatio = y / Math.max(1, window.innerHeight);
    const label = options.label || routeLabel(target);
    const origin = setOrigin(xRatio, yRatio);

    bridge.querySelector("b").textContent = label;
    bridge.classList.add("is-active");
    document.documentElement.classList.add("zk-route-leaving");
    writePayload({ xRatio, yRatio, label, time: Date.now() });
    animateParticles(origin, false);

    window.setTimeout(() => {
      window.location.href = target.href;
    }, 650);
  }

  function isInternalPageLink(link) {
    const href = link.getAttribute("href");
    if (!href || href.startsWith("#") || link.target === "_blank" || link.hasAttribute("download")) return false;
    try {
      const target = new URL(link.href, window.location.href);
      const sameDocument = target.pathname === window.location.pathname;
      const sameSite = target.protocol === "file:"
        ? window.location.protocol === "file:"
        : target.origin === window.location.origin;
      return sameSite && !sameDocument && /\.html$/i.test(target.pathname);
    } catch (_) {
      return false;
    }
  }

  function interceptLinks() {
    document.addEventListener("click", (event) => {
      if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
      const link = event.target.closest("a[href]");
      if (!link || !isInternalPageLink(link)) return;
      event.preventDefault();
      event.stopImmediatePropagation();
      navigate(link.href, { source: link, clientX: event.clientX, clientY: event.clientY });
    }, true);
  }

  function playArrival(payload) {
    if (!payload || reducedMotion.matches) {
      clearPayload();
      document.documentElement.classList.remove("zk-route-pending");
      return;
    }

    const origin = setOrigin(payload.xRatio || .5, payload.yRatio || .5);
    bridge.querySelector("b").textContent = payload.label || "ORBIT ALIGNED";
    bridge.classList.add("is-active", "is-arrival");
    document.documentElement.classList.remove("zk-route-pending");
    animateParticles(origin, true);
    window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => bridge.classList.add("is-releasing"));
    });
    window.setTimeout(() => {
      bridge.classList.remove("is-active", "is-arrival", "is-releasing");
      clearPayload();
    }, 820);
  }

  createBridge();
  window.ZKRoute = { navigate };
  interceptLinks();
  playArrival(readPayload());

  window.addEventListener("pageshow", (event) => {
    if (!event.persisted) return;
    navigating = false;
    document.documentElement.classList.remove("zk-route-leaving");
    bridge.classList.remove("is-active", "is-arrival", "is-releasing");
    clearPayload();
  });
})();
