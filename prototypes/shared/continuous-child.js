(() => {
  "use strict";

  if (window.parent === window) return;

  const pageMap = [
    ["homepage-v9-particle-spectrum-concept", "home"],
    ["work-v2-reference-orbit-concept", "work"],
    ["ip-v5-particle-boundary-fall-concept", "ip"],
    ["archive-v1-version-strata-concept", "archive"],
    ["about-v1-identity-spectrum-concept", "about"],
  ];
  const pageName = pageMap.find(([needle]) => location.pathname.includes(needle))?.[1] || "unknown";
  let measureTimer = 0;
  let lastHeight = 0;
  let lastLoading = null;
  let lastSurface = "";
  let touchY = null;
  let touchOwnedLocally = false;
  let gestureAudioContext = null;

  document.documentElement.classList.add("zk-continuous-child");
  document.documentElement.dataset.zkPage = pageName;

  function resumeRememberedSound() {
    try {
      if (localStorage.getItem("zk-ambient-sound") !== "on") return;
      const audio = window.parent?.ZKAudio;
      if (!audio?.enableFromGesture || audio.state?.().enabled) return;
      const AudioEngine = window.AudioContext || window.webkitAudioContext;
      if (AudioEngine) {
        gestureAudioContext = gestureAudioContext || new AudioEngine();
        if (gestureAudioContext.state === "suspended") void gestureAudioContext.resume();
      }
      audio.enableFromGesture(gestureAudioContext);
    } catch (_) { /* storage, audio or cross-origin access unavailable */ }
  }

  window.addEventListener("pointerdown", resumeRememberedSound, { capture: true });
  window.addEventListener("keydown", resumeRememberedSound, { capture: true });

  function isLoading() {
    return document.body?.classList.contains("is-loading") || false;
  }

  function measure() {
    clearTimeout(measureTimer);
    measureTimer = window.setTimeout(() => {
      const height = Math.max(
        document.documentElement.scrollHeight,
        document.body?.scrollHeight || 0,
        window.innerHeight
      );
      const loading = isLoading();
      if (lastHeight && Math.abs(lastHeight - height) <= 2 && lastLoading === loading) return;
      lastHeight = height;
      lastLoading = loading;
      window.parent.postMessage({ type: "zk:height", height, loading }, "*");
    }, 30);
  }

  function routeForUrl(url) {
    const path = url.pathname.toLowerCase();
    return pageMap.find(([needle]) => path.includes(needle))?.[1] || null;
  }

  document.addEventListener(
    "click",
    (event) => {
      const sectionButton = event.target.closest("[data-section]");
      if (sectionButton) {
        const chapter = sectionButton.dataset.section;
        if (["home", "work", "ip", "archive", "about"].includes(chapter)) {
          event.preventDefault();
          event.stopImmediatePropagation();
          window.parent.postMessage({ type: "zk:navigate", chapter }, "*");
          return;
        }
      }

      const link = event.target.closest("a[href]");
      if (!link || link.target === "_blank" || link.hasAttribute("download")) return;
      const rawHref = link.getAttribute("href");
      if (!rawHref) return;

      if (rawHref.startsWith("#")) {
        const target = document.querySelector(rawHref);
        if (!target) return;
        event.preventDefault();
        event.stopImmediatePropagation();
        const y = target.getBoundingClientRect().top + window.scrollY;
        window.parent.postMessage({ type: "zk:navigate-local", y }, "*");
        return;
      }

      let url;
      try {
        url = new URL(link.href, location.href);
      } catch (_) {
        return;
      }
      const chapter = routeForUrl(url);
      if (chapter) {
        event.preventDefault();
        event.stopImmediatePropagation();
        window.parent.postMessage({ type: "zk:navigate", chapter }, "*");
      }
    },
    true
  );

  function normalizeWheelDelta(event) {
    if (event.deltaMode === 1) return event.deltaY * 18;
    if (event.deltaMode === 2) return event.deltaY * window.innerHeight;
    return event.deltaY;
  }

  function reportSurface() {
    const sampleY = Math.min(Math.max(78, window.innerHeight * 0.1), window.innerHeight - 1);
    const sample = document.elementFromPoint(window.innerWidth * 0.5, sampleY);
    const owner = sample?.closest?.("[data-zk-surface]");
    let surface = owner?.dataset.zkSurface || document.body?.dataset.zkSurface || document.documentElement.dataset.zkSurface;
    if (surface !== "light" && surface !== "dark") {
      surface = location.pathname.includes("homepage-v9-particle-spectrum-concept") ? "light" : "dark";
    }
    if (surface === lastSurface) return;
    lastSurface = surface;
    window.parent.postMessage({ type: "zk:surface", surface }, "*");
  }

  window.addEventListener(
    "wheel",
    (event) => {
      if (Math.abs(event.deltaY) <= Math.abs(event.deltaX)) return;
      // Some embedded chapters own the wheel temporarily (for example the
      // Archive film rail). Those regions hand control back to the shell at
      // their first/last item, avoiding the old rail-vs-page tug of war.
      if (event.target instanceof Element && event.target.closest("[data-zk-local-wheel]")) return;
      event.preventDefault();
      window.parent.postMessage({ type: "zk:wheel", deltaY: normalizeWheelDelta(event) }, "*");
    },
    { capture: true, passive: false }
  );

  window.addEventListener("touchstart", (event) => {
    touchY = event.touches[0]?.clientY ?? null;
    touchOwnedLocally = event.target instanceof Element && Boolean(event.target.closest("[data-zk-local-wheel]"));
  }, { capture: true, passive: true });

  window.addEventListener("touchmove", (event) => {
    if (touchOwnedLocally) return;
    const nextY = event.touches[0]?.clientY;
    if (touchY === null || typeof nextY !== "number") return;
    const deltaY = touchY - nextY;
    touchY = nextY;
    if (Math.abs(deltaY) < 1) return;
    event.preventDefault();
    window.parent.postMessage({ type: "zk:wheel", deltaY }, "*");
  }, { capture: true, passive: false });

  window.addEventListener("touchend", () => { touchY = null; touchOwnedLocally = false; }, { capture: true, passive: true });
  window.addEventListener("touchcancel", () => { touchY = null; touchOwnedLocally = false; }, { capture: true, passive: true });

  window.addEventListener("message", (event) => {
    if (!event.data || typeof event.data !== "object") return;
    if (event.data.type === "zk:set-scroll") {
      const y = Math.max(0, Number(event.data.y) || 0);
      window.scrollTo(0, y);
      window.dispatchEvent(new CustomEvent("zk:continuous-scroll", {
        detail: { y, progress: Number(event.data.progress) || 0 },
      }));
      reportSurface();
    } else if (event.data.type === "zk:measure") {
      measure();
    }
  });

  window.addEventListener("load", measure, { once: true });
  window.addEventListener("resize", measure, { passive: true });
  document.fonts?.ready.then(measure).catch(() => {});

  const observer = new ResizeObserver(measure);
  if (document.body) observer.observe(document.body);

  if (document.body) {
    const classObserver = new MutationObserver(measure);
    classObserver.observe(document.body, { attributes: true, attributeFilter: ["class"] });
  }

  document.querySelectorAll("img").forEach((image) => {
    if (!image.complete) image.addEventListener("load", measure, { once: true });
  });

  measure();
  reportSurface();
})();
