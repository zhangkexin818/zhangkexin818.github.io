(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const coarsePointer = window.matchMedia("(pointer: coarse)").matches;
  const clamp = (value, min = 0, max = 1) => Math.min(max, Math.max(min, value));
  const lerp = (a, b, amount) => a + (b - a) * amount;
  const pagePointer = { x: innerWidth * 0.5, y: innerHeight * 0.5, active: false };
  let scrollVelocity = 0;
  let lastScrollY = window.scrollY;
  let scrollTicking = false;

  function safeDpr() {
    return Math.min(window.devicePixelRatio || 1, coarsePointer ? 1.2 : 1.5);
  }

  function fitCanvas(canvas) {
    const rect = canvas.getBoundingClientRect();
    const dpr = safeDpr();
    const width = Math.max(1, Math.round(rect.width * dpr));
    const height = Math.max(1, Math.round(rect.height * dpr));
    if (canvas.width !== width || canvas.height !== height) {
      canvas.width = width;
      canvas.height = height;
    }
    const context = canvas.getContext("2d");
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
    return { context, width: rect.width, height: rect.height, rect, dpr };
  }

  function initCursor() {
    const dot = document.querySelector(".cursor-dot");
    const ring = document.querySelector(".cursor-ring");
    if (!dot || !ring || coarsePointer) return;
    let ringX = pagePointer.x;
    let ringY = pagePointer.y;

    window.addEventListener("pointermove", (event) => {
      pagePointer.x = event.clientX;
      pagePointer.y = event.clientY;
      pagePointer.active = true;
      dot.style.transform = `translate3d(${event.clientX - 2.5}px, ${event.clientY - 2.5}px, 0)`;
    }, { passive: true });

    document.querySelectorAll("a, button, [role='tab']").forEach((element) => {
      element.addEventListener("pointerenter", () => document.body.classList.add("cursor-hover"));
      element.addEventListener("pointerleave", () => document.body.classList.remove("cursor-hover"));
    });

    const animate = () => {
      ringX = lerp(ringX, pagePointer.x, 0.16);
      ringY = lerp(ringY, pagePointer.y, 0.16);
      ring.style.transform = `translate3d(${ringX - ring.offsetWidth / 2}px, ${ringY - ring.offsetHeight / 2}px, 0)`;
      requestAnimationFrame(animate);
    };
    animate();
  }

  function initGlobalParticles() {
    const canvas = document.querySelector("#particle-field");
    if (!canvas || reducedMotion) return;
    let surface = fitCanvas(canvas);
    let particles = [];

    const seed = () => {
      surface = fitCanvas(canvas);
      const count = Math.round(clamp(surface.width / 24, 32, 72));
      particles = Array.from({ length: count }, () => ({
        x: Math.random() * surface.width,
        y: Math.random() * surface.height,
        vx: (Math.random() - 0.5) * 0.12,
        vy: (Math.random() - 0.5) * 0.08,
        radius: 0.45 + Math.random() * 1.25,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    const resizeObserver = new ResizeObserver(seed);
    resizeObserver.observe(canvas);

    const animate = (time) => {
      const { context, width, height } = surface;
      context.clearRect(0, 0, width, height);
      const localX = pagePointer.x;
      const localY = pagePointer.y;
      particles.forEach((particle, index) => {
        const dx = particle.x - localX;
        const dy = particle.y - localY;
        const distance = Math.hypot(dx, dy);
        if (pagePointer.active && distance < 150 && distance > 0.1) {
          const force = (150 - distance) / 150;
          particle.x += (dx / distance) * force * 0.8;
          particle.y += (dy / distance) * force * 0.8;
        }
        particle.x += particle.vx + scrollVelocity * 0.008 * (index % 2 ? 1 : -1);
        particle.y += particle.vy;
        if (particle.x < -8) particle.x = width + 8;
        if (particle.x > width + 8) particle.x = -8;
        if (particle.y < -8) particle.y = height + 8;
        if (particle.y > height + 8) particle.y = -8;
        const glow = pagePointer.active ? clamp(1 - distance / 190) : 0;
        const pulse = 0.42 + Math.sin(time * 0.001 + particle.phase) * 0.18;
        const red = Math.round(lerp(199, 220, glow));
        const green = Math.round(lerp(155, 118, glow));
        const blue = Math.round(lerp(86, 86, glow));
        context.beginPath();
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${pulse + glow * 0.35})`;
        context.arc(particle.x, particle.y, particle.radius + glow * 1.2, 0, Math.PI * 2);
        context.fill();
      });
      scrollVelocity *= 0.92;
      requestAnimationFrame(animate);
    };
    seed();
    requestAnimationFrame(animate);
  }

  function createFlowCanvas(canvas, mode = "seam") {
    if (!canvas || reducedMotion) return;
    let surface = fitCanvas(canvas);
    let particles = [];
    let active = true;
    const colorA = mode === "hero" ? [228, 199, 149] : [199, 155, 86];
    const colorB = mode === "hero" ? [186, 86, 58] : [123, 181, 170];

    const seed = () => {
      surface = fitCanvas(canvas);
      const base = mode === "hero" ? surface.width / 7.5 : surface.width / 9;
      const count = Math.round(clamp(base, coarsePointer ? 70 : 95, coarsePointer ? 130 : 220));
      particles = Array.from({ length: count }, (_, index) => ({
        u: Math.random(),
        x: Math.random() * surface.width,
        y: mode === "hero"
          ? surface.height * (0.48 + Math.random() * 0.43)
          : surface.height * (0.22 + Math.random() * 0.58),
        vx: 0.14 + Math.random() * 0.58,
        radius: 0.35 + Math.random() * (mode === "hero" ? 1.6 : 1.15),
        phase: Math.random() * Math.PI * 2,
        amplitude: 4 + Math.random() * (mode === "hero" ? 38 : 22),
        spread: (Math.random() - 0.5) * 24,
        speed: 0.00016 + Math.random() * 0.00042,
        warm: index % 5 !== 0,
      }));
    };

    const visibility = new IntersectionObserver((entries) => {
      active = entries[0]?.isIntersecting ?? true;
    }, { rootMargin: "120px" });
    visibility.observe(canvas);
    new ResizeObserver(seed).observe(canvas);

    const animate = (time) => {
      if (active) {
        const { context, width, height, rect } = surface;
        context.clearRect(0, 0, width, height);
        const px = pagePointer.x - rect.left;
        const py = pagePointer.y - rect.top;
        const seamStyle = mode === "seam" ? getComputedStyle(canvas.parentElement) : null;
        const seamPanelTop = seamStyle
          ? Number.parseFloat(seamStyle.getPropertyValue("--panel-top")) || height * 0.18
          : 0;
        const seamCurveDepth = seamStyle
          ? Number.parseFloat(seamStyle.getPropertyValue("--curve-depth")) || height * 0.34
          : 0;
        const seamCurveLift = seamStyle
          ? Number.parseFloat(seamStyle.getPropertyValue("--curve-lift")) || 0
          : 0;

        if (mode === "hero") {
          const cx = width * 0.72;
          const cy = height * 0.67;
          [1, 0.76, 0.53].forEach((scale, index) => {
            context.beginPath();
            context.strokeStyle = index === 2 ? "rgba(123,181,170,.12)" : "rgba(199,155,86,.13)";
            context.lineWidth = 0.7;
            context.ellipse(cx, cy, width * 0.36 * scale, height * 0.12 * scale, -0.12 + index * 0.16, 0, Math.PI * 2);
            context.stroke();
          });
        }

        particles.forEach((particle, index) => {
          if (mode === "seam") {
            particle.u = (particle.u + particle.speed + scrollVelocity * 0.000006 + 1) % 1;
            particle.x = particle.u * width;
            const normalizedX = (particle.x - width * 0.5) / (width * 0.62);
            const ellipse = 1 - Math.sqrt(Math.max(0, 1 - normalizedX * normalizedX));
            const curveY = seamPanelTop + seamCurveLift + seamCurveDepth * ellipse;
            let y = curveY + particle.spread + Math.sin(time * 0.0011 + particle.phase) * 2.8;
            const dx = particle.x - px;
            const dy = y - py;
            const distance = Math.hypot(dx, dy);
            const pointerInfluence = pagePointer.active ? clamp(1 - distance / 150) : 0;
            const pulseCenter = (time * 0.000075) % 1;
            const pulseDistance = Math.min(Math.abs(particle.u - pulseCenter), 1 - Math.abs(particle.u - pulseCenter));
            const travelPulse = clamp(1 - pulseDistance / 0.11);
            y += pointerInfluence * dy * 0.13;
            const mix = particle.warm ? colorA : colorB;
            const alpha = 0.12 + travelPulse * 0.35 + pointerInfluence * 0.48;
            context.beginPath();
            context.fillStyle = `rgba(${mix[0]}, ${mix[1]}, ${mix[2]}, ${alpha})`;
            context.arc(
              particle.x,
              y,
              particle.radius + travelPulse * 0.6 + pointerInfluence * 1.15,
              0,
              Math.PI * 2,
            );
            context.fill();
            return;
          }

          particle.x += particle.vx + scrollVelocity * 0.012;
          if (particle.x > width + 12) particle.x = -12;
          const wave = Math.sin(particle.x * 0.009 + time * 0.0007 + particle.phase) * particle.amplitude;
          let y = particle.y + wave;
          const dx = particle.x - px;
          const dy = y - py;
          const distance = Math.hypot(dx, dy);
          const influence = pagePointer.active ? clamp(1 - distance / (mode === "hero" ? 210 : 135)) : 0;
          y += influence * dy * 0.24;
          const mix = particle.warm ? colorA : colorB;
          const alpha = 0.22 + (index % 7) * 0.035 + influence * 0.5;
          context.beginPath();
          context.fillStyle = `rgba(${mix[0]}, ${mix[1]}, ${mix[2]}, ${alpha})`;
          context.arc(particle.x, y, particle.radius + influence * 1.25, 0, Math.PI * 2);
          context.fill();

          if (influence > 0.55 && index % 4 === 0) {
            context.beginPath();
            context.moveTo(particle.x, y);
            context.lineTo(px, py);
            context.strokeStyle = `rgba(${mix[0]}, ${mix[1]}, ${mix[2]}, ${influence * 0.08})`;
            context.lineWidth = 0.5;
            context.stroke();
          }
        });
      }
      requestAnimationFrame(animate);
    };
    seed();
    requestAnimationFrame(animate);
  }

  function initHero() {
    createFlowCanvas(document.querySelector("#hero-particles"), "hero");
    const hero = document.querySelector(".hero");
    const character = document.querySelector("#hero-character");
    if (!hero || !character || coarsePointer || reducedMotion) return;
    hero.addEventListener("pointermove", (event) => {
      const rect = hero.getBoundingClientRect();
      const x = event.clientX / rect.width - 0.5;
      const y = event.clientY / rect.height - 0.5;
      character.style.setProperty("--ry", `${x * 4.4}deg`);
      character.style.setProperty("--rx", `${y * -3.2}deg`);
    });
    hero.addEventListener("pointerleave", () => {
      character.style.setProperty("--ry", "0deg");
      character.style.setProperty("--rx", "0deg");
    });
  }

  function initSeams() {
    document.querySelectorAll(".flow-seam canvas").forEach((canvas) => createFlowCanvas(canvas, "seam"));
  }

  function updateSeams() {
    document.querySelectorAll(".flow-seam").forEach((seam) => {
      if (reducedMotion) {
        seam.style.setProperty("--panel-top", "18px");
        seam.style.setProperty("--curve-depth", "54px");
        seam.style.setProperty("--curve-lift", "0px");
        seam.style.setProperty("--curve-scale-x", "1");
        seam.style.setProperty("--curve-scale-y", "1");
        seam.style.setProperty("--curve-shift", "0px");
        seam.style.setProperty("--curve-tilt", "0deg");
        seam.style.setProperty("--seam-glow", "0.42");
        seam.style.setProperty("--canvas-opacity", "0.42");
        return;
      }
      const rect = seam.getBoundingClientRect();
      const progress = clamp((innerHeight - rect.top) / (innerHeight + rect.height));
      const eased = 1 - Math.pow(1 - progress, 3);
      const arrival = Math.sin(progress * Math.PI);
      const pointerProximity = pagePointer.active
        ? clamp(1 - Math.abs(pagePointer.y - (rect.top + rect.height * 0.42)) / 280)
        : 0;
      const pointerBias = (pagePointer.x / innerWidth - 0.5) * pointerProximity;
      seam.style.setProperty("--panel-top", `${lerp(60, 18, eased)}px`);
      seam.style.setProperty("--curve-depth", `${lerp(92, 52, eased)}px`);
      seam.style.setProperty("--curve-lift", `${lerp(30, 0, eased)}px`);
      seam.style.setProperty("--curve-scale-x", String(lerp(0.88, 1.03, eased) - arrival * 0.015));
      seam.style.setProperty("--curve-scale-y", String(lerp(0.78, 1, eased)));
      seam.style.setProperty("--curve-shift", `${pointerBias * 24 * arrival}px`);
      seam.style.setProperty("--curve-tilt", `${pointerBias * 0.46 * arrival}deg`);
      seam.style.setProperty("--seam-glow", String(0.24 + arrival * 0.48));
      seam.style.setProperty("--canvas-opacity", String(0.34 + arrival * 0.4));
    });
  }

  function setStory(index, shouldScroll = false) {
    const story = document.querySelector(".story");
    const scenes = [...document.querySelectorAll(".story-scene")];
    const dots = [...document.querySelectorAll(".story-dots button")];
    const title = document.querySelector("#story-title");
    const readout = document.querySelector("#story-index");
    if (!story || !scenes.length) return;
    const safeIndex = clamp(index, 0, scenes.length - 1);
    scenes.forEach((scene, sceneIndex) => scene.classList.toggle("is-active", sceneIndex === safeIndex));
    dots.forEach((dot, dotIndex) => dot.classList.toggle("is-active", dotIndex === safeIndex));
    title.textContent = scenes[safeIndex].dataset.title;
    readout.textContent = `${String(safeIndex + 1).padStart(2, "0")} / ${String(scenes.length).padStart(2, "0")}`;
    if (shouldScroll) {
      const top = story.offsetTop + (story.offsetHeight - innerHeight) * (safeIndex / Math.max(1, scenes.length - 1));
      window.scrollTo({ top, behavior: reducedMotion ? "auto" : "smooth" });
    }
  }

  function initStory() {
    const dots = [...document.querySelectorAll(".story-dots button")];
    dots.forEach((dot, index) => dot.addEventListener("click", () => setStory(index, true)));
  }

  function initFoxianFilm() {
    const dialog = document.querySelector("#foxian-film-dialog");
    const video = document.querySelector("#foxian-film");
    const openButton = document.querySelector("[data-open-foxian-film]");
    const closeButton = document.querySelector("[data-close-foxian-film]");
    if (!dialog || !video || !openButton || !closeButton) return;

    const closeFilm = () => {
      video.pause();
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      else dialog.removeAttribute("open");
    };

    openButton.addEventListener("click", () => {
      if (typeof dialog.showModal === "function") dialog.showModal();
      else dialog.setAttribute("open", "");
      video.play().catch(() => {});
    });
    closeButton.addEventListener("click", closeFilm);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) closeFilm();
    });
    dialog.addEventListener("close", () => video.pause());
  }

  function easeOutBounce(value) {
    const n1 = 7.5625;
    const d1 = 2.75;
    let x = value;
    if (x < 1 / d1) return n1 * x * x;
    if (x < 2 / d1) {
      x -= 1.5 / d1;
      return n1 * x * x + 0.75;
    }
    if (x < 2.5 / d1) {
      x -= 2.25 / d1;
      return n1 * x * x + 0.9375;
    }
    x -= 2.625 / d1;
    return n1 * x * x + 0.984375;
  }

  function initDropParticles() {
    const canvas = document.querySelector("#drop-particles");
    if (!canvas || reducedMotion) return;
    let surface = fitCanvas(canvas);
    let dust = [];
    let bursts = [];

    const seed = () => {
      surface = fitCanvas(canvas);
      dust = Array.from({ length: coarsePointer ? 70 : 150 }, () => ({
        angle: Math.random() * Math.PI * 2,
        radius: Math.random(),
        speed: 0.00008 + Math.random() * 0.00018,
        size: 0.4 + Math.random() * 1.5,
        phase: Math.random() * Math.PI * 2,
      }));
    };
    new ResizeObserver(seed).observe(canvas);

    window.addEventListener("ip-impact", (event) => {
      const detail = event.detail || {};
      for (let index = 0; index < (coarsePointer ? 18 : 34); index += 1) {
        bursts.push({
          x: detail.x || surface.width * 0.5,
          y: detail.y || surface.height * 0.72,
          vx: (Math.random() - 0.5) * 4.2,
          vy: -1 - Math.random() * 3.4,
          life: 1,
          size: 0.7 + Math.random() * 1.7,
        });
      }
    });

    const animate = (time) => {
      const { context, width, height } = surface;
      context.clearRect(0, 0, width, height);
      const cx = width * 0.53 + (pagePointer.x / Math.max(1, innerWidth) - 0.5) * 40;
      const cy = height * 0.74;
      dust.forEach((item, index) => {
        const angle = item.angle + time * item.speed;
        const radiusX = width * (0.16 + item.radius * 0.36);
        const radiusY = height * (0.035 + item.radius * 0.09);
        const x = cx + Math.cos(angle) * radiusX;
        const y = cy + Math.sin(angle) * radiusY;
        const aqua = index % 9 === 0;
        context.beginPath();
        context.fillStyle = aqua ? "rgba(123,181,170,.28)" : "rgba(228,199,149,.32)";
        context.arc(x, y, item.size, 0, Math.PI * 2);
        context.fill();
      });
      bursts = bursts.filter((burst) => burst.life > 0.01);
      bursts.forEach((burst) => {
        burst.x += burst.vx;
        burst.y += burst.vy;
        burst.vy += 0.07;
        burst.life *= 0.965;
        context.beginPath();
        context.fillStyle = `rgba(228,199,149,${burst.life * 0.75})`;
        context.arc(burst.x, burst.y, burst.size, 0, Math.PI * 2);
        context.fill();
      });
      requestAnimationFrame(animate);
    };
    seed();
    requestAnimationFrame(animate);
  }

  function initDropLab() {
    const section = document.querySelector(".drop-lab");
    const sticky = document.querySelector(".drop-sticky");
    const capsules = [...document.querySelectorAll(".ip-capsule")];
    if (!section || !sticky || !capsules.length) return;
    const kicks = new WeakMap();
    const impacts = new WeakMap();
    const pointer = { x: 0, y: 0 };

    sticky.addEventListener("pointermove", (event) => {
      pointer.x = event.clientX / Math.max(1, innerWidth) - 0.5;
      pointer.y = event.clientY / Math.max(1, innerHeight) - 0.5;
    }, { passive: true });

    capsules.forEach((capsule) => {
      capsule.addEventListener("click", () => {
        kicks.set(capsule, performance.now());
        capsule.classList.remove("is-retossing");
        void capsule.offsetWidth;
        capsule.classList.add("is-retossing");
      });
    });

    const update = () => {
      const maxTravel = Math.max(1, section.offsetHeight - innerHeight);
      const progress = clamp((window.scrollY - section.offsetTop) / maxTravel);
      const now = performance.now();
      capsules.forEach((capsule, index) => {
        const start = Number(capsule.dataset.start || 0);
        const span = Number(capsule.dataset.span || 0.7);
        const local = clamp((progress - start) / span);
        const bounced = easeOutBounce(local);
        const rect = capsule.getBoundingClientRect();
        const width = capsule.offsetWidth || rect.width || 220;
        const height = capsule.offsetHeight || rect.height || 420;
        const xBase = innerWidth * Number(capsule.dataset.x || 50) / 100;
        const floor = innerHeight * Number(capsule.dataset.floor || 70) / 100;
        const startY = -height * (1.25 + index * 0.16);
        let x = xBase - width * 0.5 + pointer.x * (26 + index * 9) * local;
        let y = lerp(startY, floor - height * 0.5, bounced);
        let rotation = lerp((index - 1) * -110, (index - 1) * 5, local) + pointer.x * 8;
        const kickStart = kicks.get(capsule);
        if (kickStart) {
          const kickProgress = clamp((now - kickStart) / 900);
          if (kickProgress < 1) {
            y -= Math.sin(kickProgress * Math.PI) * (170 + index * 20);
            rotation += kickProgress * 520 * (index % 2 ? -1 : 1);
          } else {
            kicks.delete(capsule);
          }
        }
        capsule.style.transform = `translate3d(${x}px, ${y}px, 0) rotate(${rotation}deg) scale(var(--capsule-scale))`;
        capsule.style.zIndex = String(8 + Math.round(local * 4) + (index === 1 ? 2 : 0));

        const didImpact = impacts.get(capsule);
        if (local > 0.91 && !didImpact) {
          impacts.set(capsule, true);
          window.dispatchEvent(new CustomEvent("ip-impact", { detail: { x: xBase, y: floor } }));
        }
        if (local < 0.82) impacts.set(capsule, false);
      });
    };

    window.addEventListener("scroll", () => requestAnimationFrame(update), { passive: true });
    window.addEventListener("resize", update, { passive: true });
    update();
    initDropParticles();
  }

  const ayaoModes = {
    expressions: {
      label: "表情",
      images: [1, 2, 3, 4, 5].map((number) => `assets/ayao-expression-0${number}-v2.jpg`),
    },
    actions: {
      label: "动作",
      images: [1, 2, 3, 4, 5].map((number) => `assets/ayao-action-0${number}-v2.jpg`),
    },
    outfits: {
      label: "服装",
      images: [1, 2, 3, 4, 5].map((number) => `assets/ayao-outfit-0${number}-v2.png`),
    },
    scenes: {
      label: "场景",
      images: [1, 2, 3, 4, 5].map((number) => `assets/ayao-scene-0${number}.webp`),
    },
  };

  function setAyaoMode(modeName) {
    const mode = ayaoModes[modeName] || ayaoModes.scenes;
    const tiles = [...document.querySelectorAll(".media-tile")];
    const tabs = [...document.querySelectorAll(".ayao-tabs button")];
    const readout = document.querySelector("#ayao-mode-readout");
    const orbit = document.querySelector("#media-orbit");
    if (orbit) orbit.className = `media-orbit mode-${modeName}`;
    tiles.forEach((tile, index) => {
      const image = tile.querySelector("img");
      image.src = mode.images[index];
      image.alt = `阿瑶${mode.label}素材 ${index + 1}`;
      tile.animate([
        { opacity: 0.35, transform: `${getComputedStyle(tile).transform} scale(.94)` },
        { opacity: 1, transform: getComputedStyle(tile).transform },
      ], { duration: reducedMotion ? 1 : 520 + index * 70, easing: "cubic-bezier(.16,1,.3,1)" });
    });
    tabs.forEach((tab) => {
      const selected = tab.dataset.mode === modeName;
      tab.classList.toggle("is-active", selected);
      tab.setAttribute("aria-selected", String(selected));
    });
    const modeIndex = Object.keys(ayaoModes).indexOf(modeName) + 1;
    readout.textContent = `${String(modeIndex).padStart(2, "0")} / 04 · ${mode.label}`;
  }

  function initAyao() {
    const sticky = document.querySelector(".ayao-sticky");
    document.querySelectorAll(".ayao-tabs button").forEach((tab) => {
      tab.addEventListener("click", () => setAyaoMode(tab.dataset.mode));
    });
    if (sticky && !coarsePointer) {
      sticky.addEventListener("pointermove", (event) => {
        const rect = sticky.getBoundingClientRect();
        sticky.style.setProperty("--ayao-x", `${((event.clientX - rect.left) / rect.width) * 100}%`);
        sticky.style.setProperty("--ayao-y", `${((event.clientY - rect.top) / rect.height) * 100}%`);
      }, { passive: true });
    }
    setAyaoMode("scenes");
  }

  function updateScrollScenes() {
    updateSeams();
    const story = document.querySelector(".story");
    if (story) {
      const maxTravel = Math.max(1, story.offsetHeight - innerHeight);
      const progress = clamp((window.scrollY - story.offsetTop) / maxTravel);
      const sceneCount = document.querySelectorAll(".story-scene").length;
      setStory(Math.min(sceneCount - 1, Math.floor(progress * sceneCount)));
    }

    const ayao = document.querySelector(".ayao");
    const orbit = document.querySelector(".media-orbit");
    const feature = document.querySelector(".ayao-feature img");
    const copy = document.querySelector(".ayao-copy");
    if (ayao && orbit && feature && copy) {
      const maxTravel = Math.max(1, ayao.offsetHeight - innerHeight);
      const progress = clamp((window.scrollY - ayao.offsetTop) / maxTravel);
      orbit.style.transform = `translate3d(${lerp(9, -2, progress)}vw, ${lerp(9, 0, progress)}vh, 0)`;
      feature.style.transform = `translate3d(${lerp(0, -1.8, progress)}vw, 0, 0) scale(${lerp(1.035, 1.105, progress)})`;
      copy.style.transform = `translate3d(0, ${lerp(2, -1.5, progress)}vh, 0)`;
      copy.style.opacity = String(lerp(1, 0.72, progress));
    }

    const chapters = [...document.querySelectorAll(".chapter")];
    const active = chapters.find((section) => {
      const rect = section.getBoundingClientRect();
      return rect.top <= innerHeight * 0.52 && rect.bottom >= innerHeight * 0.52;
    }) || chapters[0];
    if (active) {
      document.querySelector("#chapter-name").textContent = active.dataset.chapter;
      document.querySelector("#chapter-count").textContent = active.dataset.count;
      document.querySelectorAll(".nav-line a").forEach((link) => {
        const href = link.getAttribute("href") || "";
        const selected = href.startsWith("#") && href.slice(1) === active.id;
        link.classList.toggle("is-active", selected);
      });
    }
    scrollTicking = false;
  }

  function initScrollController() {
    window.addEventListener("scroll", () => {
      const current = window.scrollY;
      scrollVelocity = clamp(current - lastScrollY, -30, 30);
      lastScrollY = current;
      if (!scrollTicking) {
        scrollTicking = true;
        requestAnimationFrame(updateScrollScenes);
      }
    }, { passive: true });
    window.addEventListener("resize", updateScrollScenes, { passive: true });
    updateScrollScenes();
  }

  initCursor();
  initGlobalParticles();
  initHero();
  initSeams();
  initStory();
  initFoxianFilm();
  initAyao();
  initScrollController();
})();
