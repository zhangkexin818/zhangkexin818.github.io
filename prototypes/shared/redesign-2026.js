/* 2026-10 redesign layer: headline reveal, film cards, showreel, player, honors. */
(() => {
  "use strict";
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const root = document.documentElement;

  /* ---------- masked headline reveal ---------- */
  const SKIP = "[aria-label], #version-title, #film-title, .hero h1, dialog *, .rd-player *";
  function splitNode(node, counter) {
    [...node.childNodes].forEach((child) => {
      if (child.nodeType === 3) {
        const frag = document.createDocumentFragment();
        const text = child.textContent;
        // Latin words stay together, CJK splits per character.
        const raw = text.match(/[A-Za-z0-9'’\-.]+|\s+|[^\sA-Za-z0-9'’\-.]/g) || [];
        // Keep CJK punctuation glued to its neighbour so it never starts a line.
        const CLOSE = /^[，。、；：！？）」』》〉”’…·,.;:!?)\]]$/;
        const OPEN = /^[（「『《〈“‘(\[]$/;
        const parts = [];
        raw.forEach((t) => {
          const last = parts[parts.length - 1];
          if (CLOSE.test(t) && last && !/^\s+$/.test(last)) parts[parts.length - 1] = last + t;
          else if (last && OPEN.test(last) && !/^\s+$/.test(t)) parts[parts.length - 1] = last + t;
          else parts.push(t);
        });
        parts.forEach((part) => {
          if (/^\s+$/.test(part)) { frag.appendChild(document.createTextNode(part)); return; }
          const w = document.createElement("span");
          w.className = "rd-w";
          const c = document.createElement("span");
          c.className = "rd-c";
          c.style.setProperty("--i", counter.n++);
          c.textContent = part;
          w.appendChild(c);
          frag.appendChild(w);
        });
        child.replaceWith(frag);
      } else if (child.nodeType === 1 && child.tagName !== "BR" && !child.classList.contains("rd-w")) {
        splitNode(child, counter);
      }
    });
  }
  function setupReveal() {
    if (reduce || !("IntersectionObserver" in window)) return;
    const heads = [...document.querySelectorAll("main h1, main h2, .rd-showreel h2, .rd-fxl h2")]
      .filter((el) => !el.matches(SKIP) && !el.closest(SKIP) && el.textContent.trim().length > 1 && el.textContent.trim().length < 60);
    heads.forEach((el) => {
      splitNode(el, { n: 0 });
      el.classList.add("rd-split");
      // Never leave one glyph alone on the last line: bind the last two units.
      const units = [...el.querySelectorAll(".rd-w")];
      if (units.length > 3) {
        const a = units[units.length - 2], b = units[units.length - 1];
        if (a.nextSibling === b) {
          const keep = document.createElement("span");
          keep.className = "rd-nobr";
          a.before(keep);
          keep.append(a, b);
        }
      }
    });
    const ledgers = [...document.querySelectorAll(".rd-ledger")];
    ledgers.forEach((l) => [...l.children].forEach((li, i) => li.style.setProperty("--i", i)));
    const io = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("rd-in");
        else if (entry.boundingClientRect.top > (entry.rootBounds?.bottom || innerHeight)) entry.target.classList.remove("rd-in");
      });
    }, { threshold: 0.15, rootMargin: "0px 0px -6% 0px" });
    [...heads, ...ledgers].forEach((el) => io.observe(el));
    // Arm only after observers exist, so nothing is ever left hidden if script fails.
    requestAnimationFrame(() => root.classList.add("rd-armed"));
  }

  /* ---------- honors counter ---------- */
  function setupCounter() {
    const big = document.querySelector("[data-rd-count]");
    if (!big || !("IntersectionObserver" in window)) return;
    const target = Number(big.dataset.rdCount) || 0;
    const pad = (n) => String(n).padStart(2, "0");
    if (reduce) { big.textContent = pad(target); return; }
    const io = new IntersectionObserver(([entry]) => {
      if (!entry.isIntersecting) return;
      io.disconnect();
      const t0 = performance.now();
      const tick = (now) => {
        const p = Math.min(1, (now - t0) / 1100);
        const e = 1 - Math.pow(2, -10 * p);
        big.textContent = pad(Math.round(target * e));
        if (p < 1) requestAnimationFrame(tick);
      };
      big.textContent = "00";
      requestAnimationFrame(tick);
    }, { threshold: 0.4 });
    io.observe(big);
  }

  /* ---------- card → player (FLIP) ---------- */
  let player = null;
  function buildPlayer() {
    player = document.createElement("div");
    player.className = "rd-player";
    player.hidden = true;
    player.setAttribute("role", "dialog");
    player.setAttribute("aria-modal", "true");
    player.setAttribute("aria-label", "作品播放");
    player.dataset.zkLocalWheel = "";
    player.innerHTML = '<button class="rd-player-close" type="button">关闭 ×</button><div class="rd-player-frame"></div><div class="rd-player-bar"><strong></strong><span></span></div>';
    document.body.appendChild(player);
    player.querySelector(".rd-player-close").addEventListener("click", closePlayer);
    player.addEventListener("click", (e) => { if (e.target === player) closePlayer(); });
    document.addEventListener("keydown", (e) => { if (e.key === "Escape" && !player.hidden) closePlayer(); });
  }
  let origin = null;
  let returnFocus = null;
  function rectOf(el) { const r = el.getBoundingClientRect(); return { left: r.left, top: r.top, width: r.width, height: r.height }; }
  function fitRect(ratio) {
    const pad = Math.max(16, innerWidth * 0.04);
    const maxW = innerWidth - pad * 2, maxH = innerHeight - pad * 2 - 64;
    let w = maxW, h = w / ratio;
    if (h > maxH) { h = maxH; w = h * ratio; }
    return { left: (innerWidth - w) / 2, top: (innerHeight - h) / 2 - 20, width: w, height: h };
  }
  function place(frame, r, radius) {
    Object.assign(frame.style, { left: r.left + "px", top: r.top + "px", width: r.width + "px", height: r.height + "px", borderRadius: radius });
  }
  function openPlayer(sourceEl, { video, image, poster, title, meta, ratio }) {
    if (!player) buildPlayer();
    returnFocus = document.activeElement;
    origin = sourceEl;
    const frame = player.querySelector(".rd-player-frame");
    frame.innerHTML = "";
    let media;
    if (video) {
      media = document.createElement("video");
      Object.assign(media, { src: video, controls: true, playsInline: true, preload: "auto" });
      if (poster) media.poster = poster;
    } else {
      media = document.createElement("img");
      media.src = image;
      media.alt = title || "";
    }
    frame.appendChild(media);
    player.querySelector(".rd-player-bar strong").textContent = title || "";
    player.querySelector(".rd-player-bar span").textContent = meta || "";
    player.hidden = false;
    frame.style.transition = "none";
    place(frame, rectOf(sourceEl), "6px");
    void frame.offsetWidth;
    frame.style.transition = "";
    requestAnimationFrame(() => {
      player.classList.add("is-open");
      place(frame, fitRect(ratio || 16 / 9), "10px");
      if (video) media.play().catch(() => {});
      player.querySelector(".rd-player-close").focus({ preventScroll: true });
    });
    window.parent?.ZKAudio?.duck?.(true);
  }
  function closePlayer() {
    if (!player || player.hidden) return;
    const frame = player.querySelector(".rd-player-frame");
    frame.querySelector("video")?.pause();
    player.classList.remove("is-open");
    if (origin && !reduce) place(frame, rectOf(origin), "6px");
    setTimeout(() => { player.hidden = true; frame.innerHTML = ""; returnFocus?.focus?.({ preventScroll: true }); }, reduce ? 0 : 620);
    window.parent?.ZKAudio?.duck?.(false);
  }

  /* ---------- film cards: hover preview + open ---------- */
  function setupFilms() {
    document.querySelectorAll(".rd-film").forEach((card) => {
      const btn = card.querySelector("button");
      const src = card.dataset.video;
      let preview = null;
      const start = () => {
        if (reduce || !src || matchMedia("(hover: none)").matches) return;
        if (!preview) {
          preview = document.createElement("video");
          Object.assign(preview, { src, muted: true, loop: true, playsInline: true, preload: "auto" });
          preview.setAttribute("aria-hidden", "true");
          card.insertBefore(preview, btn);
        }
        preview.currentTime = Number(card.dataset.previewAt || 0);
        preview.play().then(() => card.classList.add("is-previewing")).catch(() => {});
      };
      const stop = () => { card.classList.remove("is-previewing"); preview?.pause(); };
      card.addEventListener("pointerenter", start);
      card.addEventListener("pointerleave", stop);
      btn?.addEventListener("click", () => {
        stop();
        const vertical = card.classList.contains("is-vertical");
        openPlayer(card, { video: src, poster: card.querySelector("img")?.src, title: card.dataset.title, meta: card.dataset.meta, ratio: vertical ? 9 / 16 : 16 / 9 });
      });
    });
    document.querySelectorAll(".rd-shot").forEach((shot) => {
      shot.tabIndex = 0;
      shot.setAttribute("role", "button");
      const img = shot.querySelector("img");
      shot.setAttribute("aria-label", "放大查看：" + (img?.alt || ""));
      const open = () => openPlayer(shot, { image: shot.dataset.full || img.currentSrc || img.src, title: img.alt, meta: shot.dataset.meta || "福小灵 · IP SYSTEM", ratio: (img.naturalWidth / img.naturalHeight) || 16 / 9 });
      shot.addEventListener("click", open);
      shot.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
    });
  }

  /* ---------- showreel ---------- */
  function setupShowreel() {
    const reel = document.querySelector(".rd-reel");
    if (!reel) return;
    const loop = reel.querySelector("video");
    const bar = reel.querySelector(".rd-reel-prog i");
    const tc = reel.querySelector("[data-rd-tc]");
    if (loop && "IntersectionObserver" in window) {
      new IntersectionObserver(([e]) => {
        if (e.isIntersecting && !reduce) {
          if (loop.preload === "none") { loop.preload = "auto"; loop.load(); }
          loop.play().catch(() => {});
        } else loop.pause();
      }, { threshold: 0.25 }).observe(reel);
      loop.addEventListener("timeupdate", () => {
        const p = loop.duration ? loop.currentTime / loop.duration : 0;
        if (bar) bar.style.transform = `scaleX(${p})`;
        if (tc) { const s = Math.floor(15 + loop.currentTime); tc.textContent = `00:${String(s).padStart(2, "0")}`; }
      });
    }
    const open = () => openPlayer(reel, { video: reel.dataset.video, poster: reel.dataset.poster, title: "阿瑶 AIGC Showreel 2026", meta: "1′44″ · 11 WORKS", ratio: 16 / 9 });
    reel.addEventListener("click", open);
    reel.addEventListener("keydown", (e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); open(); } });
  }

  /* ---------- scroll-linked scale (showreel, 福小灵 hero) ---------- */
  function setupParallax() {
    if (reduce) return;
    const items = [[document.querySelector(".rd-reel"), "--rd-reel-scale"], [document.querySelector(".rd-fxl-hero"), "--rd-fxl-scale"]].filter(([el]) => el);
    if (!items.length) return;
    const update = () => {
      items.forEach(([el, prop]) => {
        const r = el.getBoundingClientRect();
        const p = Math.min(1, Math.max(0, (innerHeight - r.top) / (innerHeight + r.height)));
        el.style.setProperty(prop, (1.1 - p * 0.1).toFixed(4));
      });
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("zk:continuous-scroll", update);
    update();
  }

  /* ---------- autoplay muted loops only while visible ---------- */
  function setupAutoplay() {
    const vids = [...document.querySelectorAll("video[data-rd-autoplay]")];
    if (!vids.length || !("IntersectionObserver" in window)) return;
    const io = new IntersectionObserver((entries) => entries.forEach(({ target: v, isIntersecting }) => {
      if (isIntersecting && !reduce) {
        if (v.preload === "none") { v.preload = "auto"; v.load(); }
        v.muted = true;
        v.play().catch(() => {});
      } else v.pause();
    }), { threshold: 0.2 });
    vids.forEach((v) => io.observe(v));
  }

  /* ---------- method film: step rail follows the film's timecode ---------- */
  function setupMethodFilm() {
    const film = document.querySelector(".rd-method-film video");
    const steps = [...document.querySelectorAll(".rd-method-steps li")];
    if (!film || !steps.length) return;
    const S = [2.4, 6.6, 10.8, 15.0, 19.2, 23.4];
    const sync = () => {
      const t = film.currentTime;
      steps.forEach((li, i) => {
        const p = Math.min(1, Math.max(0, (t - S[i]) / (S[i + 1] - S[i])));
        li.style.setProperty("--p", p.toFixed(3));
        li.classList.toggle("is-on", t >= S[i] && t < S[i + 1]);
        li.classList.toggle("is-done", t >= S[i + 1]);
      });
    };
    film.addEventListener("timeupdate", sync);
    const loop = () => { if (!film.paused) sync(); requestAnimationFrame(loop); };
    requestAnimationFrame(loop);
  }

  /* ---------- scroll-driven progress (ending wordmark, 福小灵 curtain, read-along headlines) ---------- */
  function setupScrollFx() {
    const end = document.querySelector("[data-rd-end]");
    const fxl = document.querySelector(".rd-fxl-hero");
    const reads = [...document.querySelectorAll(".rd-method-head h2, .rd-showreel h2, #profile > header h2, .profile h2, #aigc-exploration-title, .rd-fxl h2")]
      .filter((h) => h.classList.contains("rd-split"));
    reads.forEach((h) => h.classList.add("rd-read"));
    if (reduce || (!end && !fxl && !reads.length)) return;
    const prog = (el, a, b) => { const r = el.getBoundingClientRect(); return Math.min(1, Math.max(0, (innerHeight * a - r.top) / (innerHeight * (a - b)))); };
    const update = () => {
      if (end) end.style.setProperty("--end-p", prog(end, 1, 0.25).toFixed(4));
      if (fxl) fxl.style.setProperty("--rd-fxl-curtain", (1 - prog(fxl, 1, 0.35)).toFixed(4));
      reads.forEach((h) => {
        const chars = h.querySelectorAll(".rd-w");
        const p = prog(h, 0.86, 0.42) * (chars.length + 4);
        chars.forEach((c, i) => c.style.setProperty("--o", Math.min(1, Math.max(0.18, p - i)).toFixed(2)));
      });
    };
    addEventListener("scroll", update, { passive: true });
    addEventListener("zk:continuous-scroll", update);
    addEventListener("resize", update);
    update();
  }

  /* ---------- tactile tilt with glare ---------- */
  function setupTilt() {
    if (reduce || !matchMedia("(hover: hover) and (pointer: fine)").matches) return;
    document.querySelectorAll("[data-rd-tilt], .rd-film").forEach((el) => {
      const max = el.matches("[data-rd-tilt]") ? 3 : 6;
      el.addEventListener("pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const x = (e.clientX - r.left) / r.width, y = (e.clientY - r.top) / r.height;
        el.classList.add("is-tilting");
        el.style.setProperty("--ry", ((x - 0.5) * max).toFixed(2) + "deg");
        el.style.setProperty("--rx", ((0.5 - y) * max).toFixed(2) + "deg");
        el.style.setProperty("--gx", (x * 100).toFixed(1) + "%");
        el.style.setProperty("--gy", (y * 100).toFixed(1) + "%");
      });
      el.addEventListener("pointerleave", () => {
        el.classList.remove("is-tilting");
        el.style.setProperty("--rx", "0deg");
        el.style.setProperty("--ry", "0deg");
      });
    });
  }

  const init = () => { setupReveal(); setupCounter(); setupFilms(); setupShowreel(); setupParallax(); setupAutoplay(); setupMethodFilm(); setupScrollFx(); setupTilt(); };
  if (document.readyState === "loading") document.addEventListener("DOMContentLoaded", init);
  else init();
})();
