(() => {
  "use strict";

  const intro = document.querySelector("[data-intro-experience]");
  const calibration = document.querySelector("[data-intro-calibration]");
  const portal = document.querySelector("[data-intro-portal]");
  const status = document.querySelector("[data-intro-status]");
  const core = document.querySelector("[data-intro-core]");
  const orbit = document.querySelector("[data-intro-orbit]");
  const skip = document.querySelector("[data-intro-skip]");
  const enter = document.querySelector("[data-intro-enter]");
  const enterLabel = document.querySelector("[data-intro-enter-label]");
  const portalSkip = document.querySelector("[data-intro-portal-skip]");
  const signalNodes = [...document.querySelectorAll("[data-intro-signal]")];
  const signalCount = document.querySelector("[data-intro-signal-count]");
  const signalStatus = document.querySelector("[data-intro-signal-status]");
  const modeReadout = document.querySelector("[data-intro-mode]");
  const canvas = document.querySelector("[data-intro-particles]");
  const context = canvas?.getContext("2d", { alpha: true });
  const appRoot = document.querySelector("[data-app-root]");
  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const params = new URLSearchParams(window.location.search);

  if (!intro || !portal || !canvas || !context) {
    document.body.classList.remove("is-loading");
    appRoot?.setAttribute("aria-busy", "false");
    return;
  }

  let phase = "calibration";
  let frame = 0;
  let calibrationTimer = 0;
  let lockingTimer = 0;
  let portalTimer = 0;
  let morphTimer = 0;
  let autoMorphTimer = 0;
  let resizeTimer = 0;
  let signalTimers = [];
  let collectedSignals = 0;
  let width = 0;
  let height = 0;
  let dpr = 1;
  let particles = [];
  let ambientParticles = [];
  let pulse = null;
  let exitPoint = null;
  let particleMode = "word";

  const pointer = {
    x: -1000,
    y: -1000,
    active: false,
    holding: false,
    radius: 128,
    pressX: 0,
    pressY: 0,
    pressTime: 0,
  };

  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));

  function enableSiteSound() {
    try {
      // Build and resume the audio graph in the top-level document while the
      // mobile tap is still an active user gesture. An iframe-owned context is
      // not a dependable unlock token in iOS Safari.
      window.parent?.ZKAudio?.enableFromGesture?.();
    } catch (_) { /* cross-origin parent */ }
    window.parent?.postMessage({ type: "zk:sound-on" }, "*");
  }

  function parentStartsElsewhere() {
    if (window.parent === window) return false;
    try {
      const chapter = window.parent.location.hash.replace("#", "").toLowerCase();
      return Boolean(chapter && chapter !== "home");
    } catch (_) {
      return false;
    }
  }

  function revealContent() {
    phase = "content";
    intro.classList.add("is-hidden");
    portal.setAttribute("aria-hidden", "true");
    document.body.classList.remove("is-loading");
    appRoot?.setAttribute("aria-busy", "false");
    window.dispatchEvent(new CustomEvent("zk:intro-complete"));
  }

  function finishIntro({ immediate = false } = {}) {
    if (phase === "content" || phase === "entering") return;
    window.clearTimeout(calibrationTimer);
    window.clearTimeout(lockingTimer);
    window.clearTimeout(portalTimer);
    window.clearTimeout(morphTimer);
    window.clearTimeout(autoMorphTimer);
    signalTimers.forEach((timer) => window.clearTimeout(timer));
    signalTimers = [];

    if (immediate || reducedMotion.matches || phase !== "portal") {
      window.cancelAnimationFrame(frame);
      frame = 0;
      revealContent();
      return;
    }

    phase = "entering";
    pointer.active = false;
    pointer.holding = false;
    intro.classList.remove("is-holding");
    const buttonRect = enter?.getBoundingClientRect();
    exitPoint = buttonRect
      ? { x: buttonRect.left + buttonRect.width / 2, y: buttonRect.top + buttonRect.height / 2 }
      : { x: width * 0.86, y: height * 0.82 };
    intro.style.setProperty("--exit-x", `${exitPoint.x}px`);
    intro.style.setProperty("--exit-y", `${exitPoint.y}px`);
    particles.forEach((particle) => {
      const angle = Math.random() * Math.PI * 2;
      const radius = Math.random() * 20;
      particle.tx = exitPoint.x + Math.cos(angle) * radius;
      particle.ty = exitPoint.y + Math.sin(angle) * radius;
    });
    pulse = { x: exitPoint.x, y: exitPoint.y, time: performance.now() };
    intro.classList.add("is-entering");
    ensureParticleFrame();
    window.setTimeout(() => {
      window.cancelAnimationFrame(frame);
      frame = 0;
      revealContent();
    }, 930);
  }

  function createMaskTargets() {
    const mask = document.createElement("canvas");
    mask.width = width;
    mask.height = height;
    const maskContext = mask.getContext("2d", { willReadFrequently: true });
    const mobile = width < 640;
    const lines = mobile ? ["WORLD", "IN", "PROGRESS"] : ["WORLD IN", "PROGRESS"];
    const fontSize = mobile
      ? Math.min(width * 0.158, height * 0.105)
      : Math.min(width * 0.108, height * 0.19);
    const lineHeight = fontSize * (mobile ? 1.02 : 0.93);
    const centerY = height * (mobile ? 0.42 : 0.46);

    maskContext.clearRect(0, 0, width, height);
    maskContext.fillStyle = "#fff";
    maskContext.textAlign = "center";
    maskContext.textBaseline = "middle";
    maskContext.font = `500 ${fontSize}px "Noto Sans SC", "Arial Narrow", sans-serif`;
    maskContext.letterSpacing = `${fontSize * 0.018}px`;
    lines.forEach((line, index) => {
      const y = centerY + (index - (lines.length - 1) / 2) * lineHeight;
      maskContext.fillText(line, width / 2, y);
    });

    const pixels = maskContext.getImageData(0, 0, width, height).data;
    const step = mobile ? 4 : 5;
    const targets = [];
    for (let y = 0; y < height; y += step) {
      for (let x = 0; x < width; x += step) {
        if (pixels[(y * width + x) * 4 + 3] > 90) targets.push({ x, y });
      }
    }

    for (let index = targets.length - 1; index > 0; index -= 1) {
      const swap = Math.floor(Math.random() * (index + 1));
      [targets[index], targets[swap]] = [targets[swap], targets[index]];
    }
    return targets.slice(0, mobile ? 920 : 1900);
  }

  function fitParticles() {
    const rect = portal.getBoundingClientRect();
    width = Math.max(320, Math.round(rect.width || window.innerWidth));
    height = Math.max(480, Math.round(rect.height || window.innerHeight));
    dpr = Math.min(window.devicePixelRatio || 1, 1.5);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = `${width}px`;
    canvas.style.height = `${height}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    pointer.radius = width < 640 ? 82 : 128;

    const previous = particles;
    const targets = createMaskTargets();
    particles = targets.map((target, index) => {
      const old = previous[index];
      const atTarget = reducedMotion.matches;
      return {
        x: atTarget ? target.x : (old?.x ?? Math.random() * width),
        y: atTarget ? target.y : (old?.y ?? height * (0.22 + Math.random() * 0.56)),
        tx: target.x,
        ty: target.y,
        baseTx: target.x,
        baseTy: target.y,
        vx: 0,
        vy: 0,
        size: 0.72 + Math.random() * 1.18,
        alpha: 0.28 + Math.random() * 0.58,
        phase: Math.random() * Math.PI * 2,
      };
    });

    const ambientCount = reducedMotion.matches ? 0 : (width < 640 ? 26 : 54);
    ambientParticles = Array.from({ length: ambientCount }, (_, index) => ({
      x: Math.random() * width,
      y: Math.random() * height,
      vx: (Math.random() - 0.5) * 0.08,
      vy: -0.035 - Math.random() * 0.1,
      size: index % 7 === 0 ? 1.35 : 0.75,
      alpha: 0.08 + Math.random() * 0.22,
      phase: Math.random() * Math.PI * 2,
    }));

    particleMode = "word";
    if (modeReadout) modeReadout.textContent = "FIELD / WORD";
  }

  function setParticleMode(mode, origin = null, { autoReturn = true } = {}) {
    if (phase !== "portal" || reducedMotion.matches) return;
    window.clearTimeout(morphTimer);
    particleMode = mode;

    if (mode === "word") {
      particles.forEach((particle) => {
        particle.tx = particle.baseTx;
        particle.ty = particle.baseTy;
      });
      intro.classList.remove("is-morphing");
      if (modeReadout) modeReadout.textContent = "FIELD / WORD";
      return;
    }

    const centerX = clamp(origin?.x ?? width * 0.5, width * 0.22, width * 0.78);
    const centerY = clamp(origin?.y ?? height * 0.46, height * 0.24, height * 0.68);
    const maximumRadius = Math.min(width < 640 ? width * 0.34 : width * 0.2, height * 0.27);
    const ringRatios = [0.32, 0.56, 0.78, 1];

    particles.forEach((particle, index) => {
      const ringIndex = index % ringRatios.length;
      const position = Math.floor(index / ringRatios.length);
      const ringPopulation = Math.ceil(particles.length / ringRatios.length);
      const angle = (position / ringPopulation) * Math.PI * 2 + ringIndex * 0.42;
      const radius = maximumRadius * ringRatios[ringIndex];
      particle.tx = centerX + Math.cos(angle) * radius * (width < 640 ? 1 : 1.46);
      particle.ty = centerY + Math.sin(angle) * radius * 0.72;
    });

    pulse = { x: centerX, y: centerY, time: performance.now() };
    intro.classList.add("is-morphing");
    if (modeReadout) modeReadout.textContent = "FIELD / ORBIT";
    ensureParticleFrame();
    if (autoReturn) morphTimer = window.setTimeout(() => setParticleMode("word"), 1350);
  }

  function drawParticles(time = 0) {
    context.clearRect(0, 0, width, height);
    const pulseAge = pulse ? time - pulse.time : Infinity;
    const pulseRadius = pulseAge * 0.21;
    const sweepX = particleMode === "word" ? (time * 0.18) % (width + 280) - 140 : -1000;

    for (const ambient of ambientParticles) {
      ambient.x += ambient.vx;
      ambient.y += ambient.vy;
      if (ambient.y < -8) {
        ambient.y = height + 8;
        ambient.x = Math.random() * width;
      }
      if (ambient.x < -8) ambient.x = width + 8;
      if (ambient.x > width + 8) ambient.x = -8;
      const glint = 0.72 + Math.sin(time * 0.0007 + ambient.phase) * 0.28;
      const nearPointer = pointer.active
        ? clamp(1 - Math.hypot(ambient.x - pointer.x, ambient.y - pointer.y) / (pointer.radius * 1.8))
        : 0;
      context.fillStyle = nearPointer > 0.05
        ? `rgba(139, 44, 194, ${ambient.alpha * glint + nearPointer * 0.24})`
        : `rgba(243, 241, 247, ${ambient.alpha * glint})`;
      context.fillRect(ambient.x, ambient.y, ambient.size + nearPointer, ambient.size + nearPointer);
    }

    for (const particle of particles) {
      const ease = reducedMotion.matches ? 1 : phase === "entering" ? 0.072 : 0.048;
      particle.vx += (particle.tx - particle.x) * ease;
      particle.vy += (particle.ty - particle.y) * ease;
      if (!pointer.holding && particleMode === "word" && !reducedMotion.matches) {
        particle.vx += Math.cos(time * 0.0008 + particle.phase) * 0.004;
        particle.vy += Math.sin(time * 0.0009 + particle.phase) * 0.004;
      }

      let pointerInfluence = 0;
      if (!reducedMotion.matches && pointer.active) {
        const dx = particle.x - pointer.x;
        const dy = particle.y - pointer.y;
        const distance = Math.hypot(dx, dy) || 1;
        pointerInfluence = clamp(1 - distance / pointer.radius);
        if (pointerInfluence > 0) {
          if (pointer.holding) {
            const attraction = pointerInfluence * 2.6;
            const orbitForce = pointerInfluence * 0.74;
            particle.vx -= (dx / distance) * attraction;
            particle.vy -= (dy / distance) * attraction;
            particle.vx += (-dy / distance) * orbitForce;
            particle.vy += (dx / distance) * orbitForce;
          } else {
            const force = pointerInfluence * 2.35;
            particle.vx += (dx / distance) * force;
            particle.vy += (dy / distance) * force;
          }
        }
      }

      if (!reducedMotion.matches && pulse && pulseAge < 1500) {
        const dx = particle.x - pulse.x;
        const dy = particle.y - pulse.y;
        const distance = Math.hypot(dx, dy) || 1;
        const ringDistance = Math.abs(distance - pulseRadius);
        const ring = clamp(1 - ringDistance / 42) * clamp(1 - pulseAge / 1500);
        particle.vx += (dx / distance) * ring * 1.7;
        particle.vy += (dy / distance) * ring * 1.7;
        pointerInfluence = Math.max(pointerInfluence, ring * 0.8);
      }

      particle.vx *= 0.83;
      particle.vy *= 0.83;
      particle.x += particle.vx;
      particle.y += particle.vy;

      const shimmer = 0.86 + Math.sin(time * 0.001 + particle.phase) * 0.14;
      const alpha = particle.alpha * shimmer;
      const sweepInfluence = clamp(1 - Math.abs(particle.x - sweepX) / 54) * 0.7;
      const colorInfluence = Math.max(pointerInfluence, sweepInfluence, particleMode === "orbit" ? 0.34 : 0);
      context.fillStyle = phase === "entering" || colorInfluence > 0.08
        ? `rgba(139, 44, 194, ${Math.min(0.94, alpha + colorInfluence * 0.38)})`
        : `rgba(243, 241, 247, ${alpha})`;
      const size = particle.size + colorInfluence * (pointer.holding ? 1.15 : 0.8);
      context.fillRect(particle.x, particle.y, size, size);
    }

    if (pulse && pulseAge >= 1500) pulse = null;
    if ((phase === "portal" || phase === "entering") && !reducedMotion.matches && !document.hidden) {
      frame = window.requestAnimationFrame(drawParticles);
    } else {
      frame = 0;
    }
  }

  function ensureParticleFrame() {
    if (frame || (phase !== "portal" && phase !== "entering")) return;
    frame = window.requestAnimationFrame(drawParticles);
  }

  function schedulePortalExit(delay = 6800) {
    window.clearTimeout(portalTimer);
    portalTimer = window.setTimeout(() => finishIntro(), reducedMotion.matches ? 1800 : delay);
  }

  function collectSignal(node, { automatic = false } = {}) {
    if (phase !== "portal" || !node || node.classList.contains("is-collected")) return;
    const rect = node.getBoundingClientRect();
    const origin = { x: rect.left + rect.width / 2, y: rect.top + rect.height / 2 };
    node.classList.remove("is-near");
    node.classList.add("is-collected");
    node.setAttribute("aria-pressed", "true");
    collectedSignals += 1;
    if (signalCount) signalCount.textContent = `${String(collectedSignals).padStart(2, "0")} / 03`;
    if (signalStatus) signalStatus.textContent = automatic ? "轨道正在协助捕获" : "创作信号已写入轨道";
    setParticleMode("orbit", origin, { autoReturn: collectedSignals < signalNodes.length });
    pulse = { ...origin, time: performance.now() };

    if (collectedSignals < signalNodes.length) {
      if (enterLabel) enterLabel.textContent = `还差 ${signalNodes.length - collectedSignals} 枚信号`;
      schedulePortalExit(9800);
      return;
    }

    intro.classList.add("is-signal-complete");
    enter?.removeAttribute("disabled");
    if (enterLabel) enterLabel.textContent = "进入内容";
    if (signalStatus) signalStatus.textContent = "轨道开启 · WORLD IN PROGRESS";
    if (modeReadout) modeReadout.textContent = "PORTAL / OPEN";
    window.setTimeout(() => setParticleMode("word"), reducedMotion.matches ? 0 : 420);
    schedulePortalExit(5200);
  }

  function resetSignals() {
    collectedSignals = 0;
    intro.classList.remove("is-signal-complete");
    enter?.setAttribute("disabled", "");
    if (enterLabel) enterLabel.textContent = "收集 3 枚信号";
    if (signalCount) signalCount.textContent = "00 / 03";
    if (signalStatus) signalStatus.textContent = "移动指针捕获创作信号";
    signalNodes.forEach((node) => {
      node.classList.remove("is-collected", "is-near");
      node.setAttribute("aria-pressed", "false");
    });
  }

  function scheduleSignalAssist() {
    signalTimers.forEach((timer) => window.clearTimeout(timer));
    signalTimers = signalNodes.map((node, index) => window.setTimeout(() => {
      if (phase === "portal" && !node.classList.contains("is-collected")) collectSignal(node, { automatic: true });
    }, reducedMotion.matches ? 240 + index * 180 : 1900 + index * 1500));
  }

  function showPortal() {
    if (phase !== "calibration") return;
    phase = "locking";
    window.clearTimeout(calibrationTimer);
    core?.blur();
    if (status) status.textContent = "轨道已校准";
    intro.classList.add("is-locking");
    lockingTimer = window.setTimeout(() => {
      phase = "portal";
      calibration?.setAttribute("aria-hidden", "true");
      portal.setAttribute("aria-hidden", "false");
      intro.classList.add("is-portal");
      window.setTimeout(() => {
        resetSignals();
        fitParticles();
        ensureParticleFrame();
        intro.classList.remove("is-locking");
        autoMorphTimer = window.setTimeout(() => {
          setParticleMode("orbit", { x: width * 0.5, y: height * 0.46 });
        }, reducedMotion.matches ? 0 : 2350);
        scheduleSignalAssist();
      }, reducedMotion.matches ? 20 : 240);
      schedulePortalExit(10800);
    }, reducedMotion.matches ? 20 : 360);
  }

  const skipIntro = params.get("intro") === "0" || parentStartsElsewhere();

  if (skipIntro) {
    intro.classList.add("is-hidden");
    document.body.classList.remove("is-loading");
    appRoot?.setAttribute("aria-busy", "false");
    return;
  }

  window.requestAnimationFrame(() => intro.classList.add("is-calibrating"));
  window.setTimeout(() => {
    if (phase === "calibration" && status) status.textContent = "正在捕获创作信号";
  }, 480);
  window.setTimeout(() => {
    if (phase === "calibration" && status) status.textContent = "正在同步作品轨迹";
  }, 1040);

  core?.addEventListener("click", () => {
    enableSiteSound();
    showPortal();
  });
  function skipGameAndEnterContent() {
    enableSiteSound();
    finishIntro({ immediate: true });
  }

  skip?.addEventListener("click", skipGameAndEnterContent);
  portalSkip?.addEventListener("click", skipGameAndEnterContent);
  enter?.addEventListener("click", skipGameAndEnterContent);
  [core, skip, portalSkip, enter, ...signalNodes].forEach((control) => {
    control?.addEventListener("pointerdown", enableSiteSound, { passive: true });
    control?.addEventListener("touchstart", enableSiteSound, { passive: true });
  });
  signalNodes.forEach((node) => node.addEventListener("click", () => {
    enableSiteSound();
    collectSignal(node);
  }));

  calibration?.addEventListener("pointermove", (event) => {
    if (phase !== "calibration" || reducedMotion.matches || !orbit) return;
    const rect = calibration.getBoundingClientRect();
    const nx = clamp((event.clientX - rect.left) / rect.width, 0, 1) - 0.5;
    const ny = clamp((event.clientY - rect.top) / rect.height, 0, 1) - 0.5;
    intro.style.setProperty("--orbit-shift-x", `${nx * 18}px`);
    intro.style.setProperty("--orbit-shift-y", `${ny * 14}px`);
    intro.style.setProperty("--orbit-tilt-x", `${ny * -5}deg`);
    intro.style.setProperty("--orbit-tilt-y", `${nx * 6}deg`);
  }, { passive: true });

  calibration?.addEventListener("pointerleave", () => {
    intro.style.setProperty("--orbit-shift-x", "0px");
    intro.style.setProperty("--orbit-shift-y", "0px");
    intro.style.setProperty("--orbit-tilt-x", "0deg");
    intro.style.setProperty("--orbit-tilt-y", "0deg");
  }, { passive: true });

  portal.addEventListener("pointermove", (event) => {
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    intro.classList.add("has-pointer");
    intro.style.setProperty("--intro-x", `${pointer.x}px`);
    intro.style.setProperty("--intro-y", `${pointer.y}px`);
    signalNodes.forEach((node) => {
      if (node.classList.contains("is-collected")) return;
      const rect = node.getBoundingClientRect();
      const distance = Math.hypot(pointer.x - (rect.left + rect.width / 2), pointer.y - (rect.top + rect.height / 2));
      node.classList.toggle("is-near", distance < 112);
      if (distance < 58) collectSignal(node);
    });
    ensureParticleFrame();
  }, { passive: true });

  function releaseHold(event) {
    if (!pointer.holding) return;
    const elapsed = performance.now() - pointer.pressTime;
    const moved = Math.hypot(pointer.x - pointer.pressX, pointer.y - pointer.pressY);
    const isTap = event?.type === "pointerup" && elapsed < 260 && moved < 12;
    pointer.holding = false;
    pointer.radius = width < 640 ? 82 : 128;
    intro.classList.remove("is-holding");
    if (isTap) {
      setParticleMode("orbit", { x: pointer.x, y: pointer.y });
    } else {
      setParticleMode("word");
      pulse = { x: pointer.x, y: pointer.y, time: performance.now() };
    }
    if (event?.pointerId !== undefined && portal.hasPointerCapture?.(event.pointerId)) {
      portal.releasePointerCapture(event.pointerId);
    }
    ensureParticleFrame();
  }

  portal.addEventListener("pointerleave", (event) => {
    if (!pointer.holding) {
      pointer.active = false;
      intro.classList.remove("has-pointer");
    }
    if (event.pointerType === "mouse" && !event.buttons) releaseHold(event);
  }, { passive: true });
  portal.addEventListener("pointerdown", (event) => {
    if (event.target instanceof Element && event.target.closest("button")) return;
    pointer.x = event.clientX;
    pointer.y = event.clientY;
    pointer.active = true;
    pointer.holding = true;
    pointer.pressX = event.clientX;
    pointer.pressY = event.clientY;
    pointer.pressTime = performance.now();
    window.clearTimeout(autoMorphTimer);
    schedulePortalExit(5200);
    intro.classList.add("has-pointer");
    pointer.radius = width < 640 ? 148 : 230;
    intro.style.setProperty("--intro-x", `${pointer.x}px`);
    intro.style.setProperty("--intro-y", `${pointer.y}px`);
    intro.classList.add("is-holding");
    portal.setPointerCapture?.(event.pointerId);
    ensureParticleFrame();
  }, { passive: true });
  portal.addEventListener("pointerup", releaseHold, { passive: true });
  portal.addEventListener("pointercancel", releaseHold, { passive: true });

  window.addEventListener("keydown", (event) => {
    if (phase === "content") return;
    if (event.key === "Escape") finishIntro();
    if (phase === "portal" && event.key === "Enter" && document.activeElement !== enter) finishIntro();
  });

  window.addEventListener("resize", () => {
    window.clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      if (phase === "calibration" || phase === "locking" || phase === "portal") {
        fitParticles();
        ensureParticleFrame();
      }
    }, 140);
  }, { passive: true });

  document.addEventListener("visibilitychange", () => {
    if (document.hidden) {
      window.cancelAnimationFrame(frame);
      frame = 0;
    } else {
      ensureParticleFrame();
    }
  });

  calibrationTimer = window.setTimeout(showPortal, reducedMotion.matches ? 480 : 1900);
})();
