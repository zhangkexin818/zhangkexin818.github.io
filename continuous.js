(() => {
  "use strict";

  const chapterNames = ["HOME", "WORK", "IP", "ARCHIVE", "ABOUT"];
  const shells = [...document.querySelectorAll("[data-chapter]")];
  const navButtons = [...document.querySelectorAll("[data-go]")];
  const progress = document.querySelector(".scroll-progress i");
  const readoutName = document.querySelector("[data-active-name]");
  const readoutCount = document.querySelector("[data-active-count]");
  const soundButton = document.querySelector("[data-global-sound]");
  const soundLabel = document.querySelector("[data-global-sound-label]");
  const lightPull = document.querySelector("[data-light-pull]");
  const lightLabel = document.querySelector("[data-light-label]");
  const themeColor = document.querySelector('meta[name="theme-color"]');
  const particleCanvas = document.querySelector("[data-seam-particles]");
  const particleContext = particleCanvas?.getContext("2d", { alpha: true });
  const frameMap = new Map();
  const frameRecords = [];
  const reducedMotion = matchMedia("(prefers-reduced-motion: reduce)");
  const interviewMode = new URLSearchParams(window.location.search).get("interview") === "1";

  let activeIndex = 0;
  let ticking = false;
  let resizeTimer = 0;
  let readyTimer = 0;
  let particleRatio = 1;
  let particles = [];
  let starlightStars = [];
  let boundaryEnergy = 0;
  let boundaryDirection = 1;
  let lightMode = document.documentElement.dataset.lightMode === "starlight" ? "starlight" : "night";
  let lightBurst = 0;
  let lightTimer = 0;
  let audioContext = window.__zkEarlyAudioContext || null;
  let audioMaster = null;
  let audioFilter = null;
  let audioAnalyser = null;
  let audioVoices = [];
  let audioNoise = null;
  let audioPulseTimer = 0;
  let audioPulseStep = 0;
  let audioPulseToken = 0;
  let audioStarting = false;

  shells.forEach((shell, index) => {
    const frame = shell.querySelector("iframe");
    if (!frame) return;
    let source = frame.dataset.src || frame.getAttribute("src") || "";
    if (index === 1 && interviewMode && source) {
      const interviewUrl = new URL(source, window.location.href);
      interviewUrl.searchParams.set("interview", "1");
      source = interviewUrl.href;
    }
    const record = {
      shell,
      frame,
      index,
      surface: index === 0 ? "light" : "dark",
      source,
      activated: frame.hasAttribute("src"),
      ready: false,
      warmQueued: false,
    };
    frameRecords.push(record);
    frameMap.set(frame.contentWindow, record);
    frame.addEventListener("load", () => {
      if (!record.activated) return;
      record.ready = true;
      record.shell.classList.add("is-frame-ready");
      frame.contentWindow?.postMessage({ type: "zk:light-mode", mode: lightMode }, "*");
      frame.contentWindow?.postMessage({ type: "zk:measure" }, "*");
    });
    shell.style.height = "100svh";
  });

  const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

  function activateFrame(index, { eager = false } = {}) {
    const record = frameRecords[index];
    if (!record || record.activated || !record.source) return record;
    record.activated = true;
    // A frame with an assigned src is already deliberately staged. Keep the
    // browser from postponing that request until it is inside the viewport.
    record.frame.loading = "eager";
    record.frame.fetchPriority = eager ? "high" : "low";
    record.frame.src = record.source;
    return record;
  }

  function queueFrameAhead(index) {
    const current = frameRecords[index];
    const next = frameRecords[index + 1];
    if (!current || !next || next.activated || current.warmQueued) return;
    current.warmQueued = true;

    const stageNext = () => {
      const begin = () => activateFrame(index + 1, { eager: false });
      window.setTimeout(() => {
        if ("requestIdleCallback" in window) {
          window.requestIdleCallback(begin, { timeout: 650 });
        } else {
          begin();
        }
      }, 140);
    };

    if (current.ready) stageNext();
    else current.frame.addEventListener("load", stageNext, { once: true });
  }

  function updateThemeColor() {
    if (!themeColor) return;
    const isHome = (document.body.dataset.activeChapter || "home") === "home";
    themeColor.content = lightMode === "starlight" && !isHome ? "#f7f4fa" : "#08070b";
  }

  function applyLightMode(mode, { persist = true, animate = true } = {}) {
    lightMode = mode === "starlight" ? "starlight" : "night";
    const isStarlight = lightMode === "starlight";
    document.documentElement.dataset.lightMode = lightMode;
    lightPull?.setAttribute("aria-pressed", String(isStarlight));
    lightPull?.setAttribute("aria-label", isStarlight ? "切换到黑夜模式" : "切换到星光模式");
    if (lightLabel) lightLabel.textContent = isStarlight ? "STARLIGHT" : "NIGHT";
    updateThemeColor();
    frameRecords.forEach(({ frame, activated }) => {
      if (!activated) return;
      frame.contentWindow?.postMessage({ type: "zk:light-mode", mode: lightMode }, "*");
    });
    particleCanvas?.classList.toggle("is-visible", isStarlight || boundaryEnergy > 0.02);
    if (animate && !reducedMotion.matches) {
      lightBurst = 1;
      document.documentElement.classList.remove("is-light-switching");
      void document.documentElement.offsetWidth;
      document.documentElement.classList.add("is-light-switching");
      lightPull?.classList.remove("is-yanked");
      void lightPull?.offsetWidth;
      lightPull?.classList.add("is-yanked");
      clearTimeout(lightTimer);
      lightTimer = window.setTimeout(() => {
        document.documentElement.classList.remove("is-light-switching");
        lightPull?.classList.remove("is-yanked");
      }, 980);
    }
    if (persist) {
      try { localStorage.setItem("zk-light-mode", lightMode); } catch (_) { /* storage unavailable */ }
    }
  }

  function toggleLightMode() {
    applyLightMode(lightMode === "starlight" ? "night" : "starlight");
  }

  if (lightPull) {
    let pullPointer = null;
    let pullOrigin = 0;
    let pullDistance = 0;
    let suppressClick = false;

    lightPull.addEventListener("pointerdown", (event) => {
      if (event.pointerType === "mouse" && event.button !== 0) return;
      pullPointer = event.pointerId;
      pullOrigin = event.clientY;
      pullDistance = 0;
      lightPull.classList.add("is-pulling");
      lightPull.setPointerCapture?.(event.pointerId);
    });
    lightPull.addEventListener("pointermove", (event) => {
      if (event.pointerId !== pullPointer) return;
      pullDistance = clamp(event.clientY - pullOrigin, 0, 48);
      lightPull.style.setProperty("--pull-distance", `${pullDistance}px`);
    });
    lightPull.addEventListener("pointerup", (event) => {
      if (event.pointerId !== pullPointer) return;
      lightPull.releasePointerCapture?.(event.pointerId);
      lightPull.classList.remove("is-pulling");
      lightPull.style.removeProperty("--pull-distance");
      pullPointer = null;
      if (pullDistance > 16) {
        suppressClick = true;
        toggleLightMode();
      }
    });
    lightPull.addEventListener("pointercancel", () => {
      pullPointer = null;
      pullDistance = 0;
      lightPull.classList.remove("is-pulling");
      lightPull.style.removeProperty("--pull-distance");
    });
    lightPull.addEventListener("click", () => {
      if (suppressClick) {
        suppressClick = false;
        return;
      }
      toggleLightMode();
    });
  }

  applyLightMode(lightMode, { persist: false, animate: false });

  function chapterTop(shell) {
    return shell.getBoundingClientRect().top + window.scrollY;
  }

  function setActive(index) {
    activateFrame(index, { eager: true });
    // Keep exactly one chapter prepared ahead of the reader. This removes the
    // blank-on-arrival state without downloading every iframe at startup.
    queueFrameAhead(index);
    if (index === activeIndex && !document.body.classList.contains("is-composing")) return;
    activeIndex = index;
    document.body.dataset.activeChapter = shells[index]?.dataset.chapter || "home";
    const activeRecord = frameRecords[index];
    document.body.dataset.activeSurface = activeRecord?.surface || (index === 0 ? "light" : "dark");
    updateThemeColor();
    navButtons.forEach((button) => {
      const isCurrent = button.dataset.go === shells[index]?.dataset.chapter;
      button.classList.toggle("is-active", isCurrent);
      if (button.closest(".orbit-nav")) {
        if (isCurrent) button.setAttribute("aria-current", "page");
        else button.removeAttribute("aria-current");
      }
    });
    if (readoutName) readoutName.textContent = chapterNames[index] || "HOME";
    if (readoutCount) readoutCount.textContent = `${String(index + 1).padStart(2, "0")} — 05`;
  }

  function stopAmbientSound({ remember = true } = {}) {
    audioPulseToken += 1;
    window.clearTimeout(audioPulseTimer);
    audioPulseTimer = 0;
    if (audioContext && audioMaster) {
      const now = audioContext.currentTime;
      audioMaster.gain.cancelScheduledValues(now);
      audioMaster.gain.setTargetAtTime(0.0001, now, 0.08);
    }
    window.setTimeout(() => {
      audioVoices.forEach((voice) => {
        try { voice.stop(); } catch (_) { /* voice already ended */ }
      });
      audioVoices = [];
      try { audioNoise?.stop(); } catch (_) { /* noise already ended */ }
      audioNoise = null;
      audioFilter = null;
      audioAnalyser = null;
    }, 420);
    soundButton?.setAttribute("aria-pressed", "false");
    soundButton?.setAttribute("aria-label", "开启网站环境音乐");
    if (soundLabel) soundLabel.textContent = "SOUND OFF";
    if (remember) {
      try { localStorage.setItem("zk-ambient-sound", "off"); } catch (_) { /* storage unavailable */ }
    }
  }

  function readAmbientLevel() {
    if (!audioAnalyser) return 0;
    const samples = new Float32Array(audioAnalyser.fftSize);
    audioAnalyser.getFloatTimeDomainData(samples);
    let sum = 0;
    for (const sample of samples) sum += sample * sample;
    return Math.sqrt(sum / samples.length);
  }

  function playAmbientPulse() {
    if (!audioContext || !audioFilter || audioContext.state !== "running") return;
    const notes = [220, 277.18, 329.63, 246.94, 392, 329.63];
    const frequency = notes[audioPulseStep % notes.length];
    const now = audioContext.currentTime;
    const pulseGain = audioContext.createGain();
    const fundamental = audioContext.createOscillator();
    const shimmer = audioContext.createOscillator();
    const shimmerGain = audioContext.createGain();

    fundamental.type = "sine";
    fundamental.frequency.setValueAtTime(frequency, now);
    shimmer.type = "triangle";
    shimmer.frequency.setValueAtTime(frequency * 2, now);
    shimmer.detune.setValueAtTime(audioPulseStep % 2 ? 4 : -4, now);
    shimmerGain.gain.setValueAtTime(0.22, now);
    pulseGain.gain.setValueAtTime(0.0001, now);
    pulseGain.gain.exponentialRampToValueAtTime(0.18, now + 0.09);
    pulseGain.gain.exponentialRampToValueAtTime(0.045, now + 0.72);
    pulseGain.gain.exponentialRampToValueAtTime(0.0001, now + 2.7);

    fundamental.connect(pulseGain);
    shimmer.connect(shimmerGain).connect(pulseGain);
    pulseGain.connect(audioFilter);
    fundamental.start(now);
    shimmer.start(now);
    fundamental.stop(now + 2.75);
    shimmer.stop(now + 2.75);
    audioPulseStep += 1;
  }

  function startAmbientPulseLoop() {
    audioPulseToken += 1;
    const token = audioPulseToken;
    const tick = () => {
      if (token !== audioPulseToken || !audioVoices.length) return;
      playAmbientPulse();
      const delay = 3900 + (audioPulseStep % 3) * 520;
      audioPulseTimer = window.setTimeout(tick, delay);
    };
    tick();
  }

  async function startAmbientSound({ remember = true, primedContext = null } = {}) {
    const AudioEngine = window.AudioContext || window.webkitAudioContext;
    if (!AudioEngine || !soundButton) return;
    window.__zkPendingAmbientSound = false;
    if (primedContext && !audioVoices.length) audioContext = primedContext;
    audioContext = audioContext || new AudioEngine();
    if (audioContext.state === "suspended") await audioContext.resume();
    if (audioVoices.length) return;
    if (audioStarting) return;
    audioStarting = true;

    try {
    audioMaster = audioContext.createGain();
    const lowpass = audioContext.createBiquadFilter();
    const compressor = audioContext.createDynamicsCompressor();
    const drift = audioContext.createOscillator();
    const driftDepth = audioContext.createGain();
    audioFilter = lowpass;
    audioAnalyser = audioContext.createAnalyser();
    lowpass.type = "lowpass";
    lowpass.frequency.value = 880;
    lowpass.Q.value = 0.6;
    compressor.threshold.value = -24;
    compressor.knee.value = 18;
    compressor.ratio.value = 3;
    compressor.attack.value = 0.045;
    compressor.release.value = 0.34;
    audioAnalyser.fftSize = 1024;
    audioMaster.gain.setValueAtTime(0.0001, audioContext.currentTime);
    audioMaster.gain.exponentialRampToValueAtTime(0.2, audioContext.currentTime + 1.2);
    lowpass.connect(audioMaster).connect(compressor).connect(audioAnalyser).connect(audioContext.destination);

    const frequencies = [55, 82.41, 110, 146.83, 220];
    audioVoices = frequencies.map((frequency, index) => {
      const oscillator = audioContext.createOscillator();
      const voiceGain = audioContext.createGain();
      oscillator.type = index % 2 ? "sine" : "triangle";
      oscillator.frequency.value = frequency;
      oscillator.detune.value = (index - 2) * 2.7;
      voiceGain.gain.value = (index < 2 ? 0.22 : 0.12) / frequencies.length;
      oscillator.connect(voiceGain).connect(lowpass);
      oscillator.start();
      return oscillator;
    });

    drift.type = "sine";
    drift.frequency.value = 0.055;
    driftDepth.gain.value = 92;
    drift.connect(driftDepth).connect(lowpass.frequency);
    drift.start();
    audioVoices.push(drift);

    const noiseBuffer = audioContext.createBuffer(1, audioContext.sampleRate * 2, audioContext.sampleRate);
    const channel = noiseBuffer.getChannelData(0);
    for (let index = 0; index < channel.length; index += 1) channel[index] = (Math.random() * 2 - 1) * 0.28;
    audioNoise = audioContext.createBufferSource();
    const noiseFilter = audioContext.createBiquadFilter();
    const noiseGain = audioContext.createGain();
    audioNoise.buffer = noiseBuffer;
    audioNoise.loop = true;
    noiseFilter.type = "bandpass";
    noiseFilter.frequency.value = 1240;
    noiseFilter.Q.value = 0.45;
    noiseGain.gain.value = 0.018;
    audioNoise.connect(noiseFilter).connect(noiseGain).connect(audioMaster);
    audioNoise.start();
    startAmbientPulseLoop();

    soundButton.setAttribute("aria-pressed", "true");
    soundButton.setAttribute("aria-label", "关闭网站环境音乐");
    if (soundLabel) soundLabel.textContent = "SOUND ON";
    if (remember) {
      try { localStorage.setItem("zk-ambient-sound", "on"); } catch (_) { /* storage unavailable */ }
    }
    } finally {
      audioStarting = false;
    }
  }

  soundButton?.addEventListener("click", () => {
    if (soundButton.getAttribute("aria-pressed") === "true") stopAmbientSound();
    else startAmbientSound();
  });

  window.ZKAudio = {
    enableFromGesture: (primedContext) => startAmbientSound({ primedContext }),
    disable: () => stopAmbientSound(),
    state: () => ({
      enabled: soundButton?.getAttribute("aria-pressed") === "true",
      context: audioContext?.state || "uninitialized",
      voices: audioVoices.length,
      gain: Number((audioMaster?.gain.value || 0).toFixed(4)),
      level: Number(readAmbientLevel().toFixed(5)),
      pulse: audioPulseTimer ? "active" : "idle",
    }),
  };

  if (window.__zkPendingAmbientSound) {
    void startAmbientSound({ primedContext: window.__zkEarlyAudioContext || null });
  }

  try {
    if (localStorage.getItem("zk-ambient-sound") === "on") {
      if (soundLabel) soundLabel.textContent = "SOUND READY";
      const resumeRememberedSound = (event) => {
        if (event.target instanceof Element && event.target.closest("[data-global-sound]")) return;
        startAmbientSound({ remember: false });
      };
      window.addEventListener("pointerdown", resumeRememberedSound, { once: true, capture: true });
      window.addEventListener("keydown", resumeRememberedSound, { once: true, capture: true });
    }
  } catch (_) { /* storage unavailable */ }

  function goToChapter(name, behavior = "smooth") {
    const target = shells.find((shell) => shell.dataset.chapter === name);
    if (!target) return;
    const targetIndex = Number(target.dataset.index);
    const requiredRecords = frameRecords.slice(0, targetIndex + 1);
    const navigationToken = (goToChapter.token || 0) + 1;
    goToChapter.token = navigationToken;
    let settled = false;
    const commit = () => {
      if (settled || navigationToken !== goToChapter.token) return;
      settled = true;
      const top = chapterTop(target);
      window.scrollTo({ top, behavior: reducedMotion.matches ? "auto" : behavior });

      // Child frames can report a final height shortly after their load event.
      // Re-align once the smooth scroll has settled so late layout measurements
      // cannot leave the requested chapter a few pixels above or below the view.
      window.setTimeout(() => {
        if (navigationToken !== goToChapter.token || location.hash !== `#${name}`) return;
        const settledTop = chapterTop(target);
        if (Math.abs(window.scrollY - settledTop) > 6) {
          window.scrollTo({ top: settledTop, behavior: "auto" });
        }
      }, reducedMotion.matches || behavior === "auto" ? 220 : 1100);
    };

    const waiting = requiredRecords.filter((record) => !record.ready);
    let pending = waiting.length;
    const markReady = () => {
      pending -= 1;
      if (pending <= 0) window.setTimeout(commit, 120);
    };
    waiting.forEach((record) => record.frame.addEventListener("load", markReady, { once: true }));
    requiredRecords.forEach((record) => activateFrame(record.index, { eager: record.index === targetIndex }));
    if (!pending) window.setTimeout(commit, 0);
    // Never trap navigation if a third-party asset stalls the load event.
    window.setTimeout(commit, 3200);
    history.replaceState(null, "", `#${name}`);
  }

  navButtons.forEach((button) => {
    button.addEventListener("click", () => goToChapter(button.dataset.go));
  });

  function syncScroll() {
    ticking = false;
    const y = window.scrollY;
    const viewport = window.innerHeight;
    const marker = y + viewport * 0.42;
    let nextActive = 0;
    let nearestBoundary = Infinity;
    let seamDirection = 1;

    shells.forEach((shell, index) => {
      const top = chapterTop(shell);
      const maxLocal = Math.max(0, shell.offsetHeight - viewport);
      const local = clamp(y - top, 0, maxLocal);
      const record = frameRecords[index];
      const isNearViewport = y + viewport * 1.5 >= top && y - viewport * 0.5 <= top + shell.offsetHeight;
      if (record?.activated && isNearViewport) {
        record.frame.contentWindow?.postMessage({
          type: "zk:set-scroll",
          y: local,
          progress: maxLocal > 0 ? local / maxLocal : 0,
        }, "*");
      }

      if (record?.activated && index < shells.length - 1) {
        const chapterProgress = maxLocal > 0
          ? local / maxLocal
          : clamp((y + viewport - top) / Math.max(viewport, shell.offsetHeight), 0, 1);
        if (chapterProgress >= 0.28) activateFrame(index + 1, { eager: false });
      }
      if (marker >= top) nextActive = index;

      if (index < shells.length - 1) {
        const distance = Math.abs(y + viewport - (top + shell.offsetHeight));
        if (distance < nearestBoundary) {
          nearestBoundary = distance;
          seamDirection = y + viewport < top + shell.offsetHeight ? 1 : -1;
        }
        const seam = shell.querySelector(".chapter-seam");
        if (seam) {
          const energy = clamp(1 - distance / Math.max(180, viewport * 0.22), 0, 1);
          seam.style.setProperty("--seam-energy", energy.toFixed(3));
        }
      }
    });

    boundaryEnergy = clamp(1 - nearestBoundary / Math.max(190, viewport * 0.24), 0, 1);
    boundaryDirection = seamDirection;
    particleCanvas?.classList.toggle("is-visible", (lightMode === "starlight" || boundaryEnergy > 0.02) && !reducedMotion.matches);
    setActive(clamp(nextActive, 0, shells.length - 1));

    const maxScroll = Math.max(1, document.documentElement.scrollHeight - viewport);
    if (progress) progress.style.transform = `scaleX(${clamp(y / maxScroll, 0, 1)})`;
  }

  function requestSync() {
    if (ticking) return;
    ticking = true;
    requestAnimationFrame(syncScroll);
  }

  function resizeParticles() {
    if (!particleCanvas || !particleContext) return;
    particleRatio = Math.min(devicePixelRatio || 1, 1.5);
    particleCanvas.width = Math.round(innerWidth * particleRatio);
    particleCanvas.height = Math.round(innerHeight * particleRatio);
    particleContext.setTransform(particleRatio, 0, 0, particleRatio, 0, 0);
    particles = Array.from({ length: innerWidth < 700 ? 26 : 48 }, (_, index) => ({
      phase: (index / 48) * Math.PI * 2 + Math.random() * 0.4,
      speed: 0.0015 + Math.random() * 0.0024,
      radius: 0.6 + Math.random() * 1.5,
      drift: (Math.random() - 0.5) * 34,
      alpha: 0.22 + Math.random() * 0.62,
    }));
    starlightStars = Array.from({ length: innerWidth < 700 ? 48 : 92 }, (_, index) => ({
      x: Math.random(),
      y: Math.random(),
      radius: index % 13 === 0 ? 1.45 + Math.random() * 0.8 : 0.38 + Math.random() * 0.92,
      phase: Math.random() * Math.PI * 2,
      speed: 0.00045 + Math.random() * 0.0011,
      alpha: 0.16 + Math.random() * 0.58,
      violet: index % 5 === 0,
      cross: index % 17 === 0,
    }));
  }

  function drawParticles(time) {
    if (particleContext && particleCanvas) {
      particleContext.clearRect(0, 0, innerWidth, innerHeight);
      if (lightMode === "starlight" && !reducedMotion.matches) {
        starlightStars.forEach((star) => {
          const twinkle = 0.48 + Math.sin(time * star.speed + star.phase) * 0.34;
          const alpha = star.alpha * clamp(twinkle + lightBurst * 0.34, 0.12, 1);
          const x = star.x * innerWidth;
          const y = star.y * innerHeight;
          particleContext.beginPath();
          const lightSurface = document.body.dataset.activeSurface === "light";
          particleContext.fillStyle = star.violet
            ? `rgba(139, 44, 194, ${alpha})`
            : lightSurface
              ? `rgba(48, 0, 72, ${alpha * 0.72})`
              : `rgba(243, 241, 247, ${alpha})`;
          particleContext.shadowColor = star.violet
            ? "rgba(139, 44, 194, .72)"
            : lightSurface ? "rgba(100, 21, 154, .42)" : "rgba(243, 241, 247, .72)";
          particleContext.shadowBlur = star.radius * 5 + lightBurst * 8;
          particleContext.arc(x, y, star.radius + lightBurst * 0.22, 0, Math.PI * 2);
          particleContext.fill();
          if (star.cross && twinkle > 0.54) {
            particleContext.strokeStyle = `rgba(243, 241, 247, ${alpha * 0.46})`;
            particleContext.lineWidth = 0.5;
            particleContext.beginPath();
            particleContext.moveTo(x - 5, y);
            particleContext.lineTo(x + 5, y);
            particleContext.moveTo(x, y - 7);
            particleContext.lineTo(x, y + 7);
            particleContext.stroke();
          }
        });
        particleContext.shadowBlur = 0;
      }
      if (boundaryEnergy > 0.015 && !reducedMotion.matches) {
        const centerY = innerHeight * (boundaryDirection > 0 ? 0.54 : 0.46);
        particles.forEach((particle, index) => {
          const phase = particle.phase + time * particle.speed;
          const x = innerWidth * 0.5 + Math.cos(phase) * innerWidth * (0.22 + index % 5 * 0.045);
          const y = centerY + Math.sin(phase * 1.55) * (34 + index % 7 * 7) + particle.drift;
          const warm = index % 4 !== 0;
          particleContext.beginPath();
          particleContext.fillStyle = warm
          ? `rgba(139, 44, 194, ${particle.alpha * boundaryEnergy})`
            : `rgba(243, 241, 236, ${particle.alpha * boundaryEnergy * 0.56})`;
          particleContext.arc(x, y, particle.radius * (0.8 + boundaryEnergy), 0, Math.PI * 2);
          particleContext.fill();
        });
      }
      lightBurst *= 0.965;
    }
    requestAnimationFrame(drawParticles);
  }

  window.addEventListener("message", (event) => {
    const record = frameMap.get(event.source);
    if (!record || !event.data || typeof event.data !== "object") return;

    if (event.data.type === "zk:height") {
      const height = Math.max(window.innerHeight, Math.ceil(Number(event.data.height) || 0));
      if (height && Math.abs(record.shell.offsetHeight - height) > 2) {
        record.shell.style.height = `${height}px`;
        requestSync();
      }
      if (record.index === 0 && !event.data.loading) {
        clearTimeout(readyTimer);
        document.body.classList.remove("is-composing");
      }
      return;
    }

    if (event.data.type === "zk:surface") {
      record.surface = event.data.surface === "light" ? "light" : "dark";
      if (record.index === activeIndex) document.body.dataset.activeSurface = record.surface;
      return;
    }

    if (event.data.type === "zk:navigate") {
      goToChapter(event.data.chapter);
      return;
    }

    if (event.data.type === "zk:navigate-local") {
      const top = chapterTop(record.shell) + clamp(Number(event.data.y) || 0, 0, record.shell.offsetHeight);
      window.scrollTo({ top, behavior: reducedMotion.matches ? "auto" : "smooth" });
      return;
    }

    if (event.data.type === "zk:sound-on") {
      startAmbientSound();
      return;
    }

    if (event.data.type === "zk:wheel") {
      const delta = clamp(Number(event.data.deltaY) || 0, -520, 520);
      if (delta) window.scrollBy({ top: delta, behavior: "auto" });
    }
  });

  window.addEventListener("scroll", requestSync, { passive: true });
  window.addEventListener("resize", () => {
    clearTimeout(resizeTimer);
    resizeTimer = window.setTimeout(() => {
      resizeParticles();
      frameRecords.forEach(({ frame, activated }) => {
        if (activated) frame.contentWindow?.postMessage({ type: "zk:measure" }, "*");
      });
      requestSync();
    }, 120);
  });

  resizeParticles();
  document.body.dataset.activeSurface = "light";
  const initialHash = location.hash.slice(1).toLowerCase();
  const initialHashIndex = chapterNames.findIndex((name) => name.toLowerCase() === initialHash);
  activateFrame(initialHashIndex >= 0 ? initialHashIndex : 0, { eager: true });
  requestAnimationFrame(drawParticles);
  requestSync();

  readyTimer = window.setTimeout(() => document.body.classList.remove("is-composing"), 12000);
  window.setTimeout(() => {
    frameRecords.forEach(({ frame, activated }) => {
      if (activated) frame.contentWindow?.postMessage({ type: "zk:measure" }, "*");
    });
    const hash = location.hash.slice(1);
    if (chapterNames.map((name) => name.toLowerCase()).includes(hash)) goToChapter(hash, "auto");
  }, 500);
})();
