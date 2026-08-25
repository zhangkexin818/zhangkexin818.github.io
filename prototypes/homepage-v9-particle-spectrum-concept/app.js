(() => {
  "use strict";

  const ROUTES = {
    work: {
      label: "查看代表项目",
      preview: "从内容生产到真实产品体验",
      href: "../work-v2-reference-orbit-concept/index.html",
    },
    ip: {
      label: "进入原创 IP",
      preview: "原创角色与世界观实验",
      href: "../ip-v5-particle-boundary-fall-concept/index.html",
    },
    archive: {
      label: "查看版本档案",
      preview: "查看设计如何在取舍中形成",
      href: "../archive-v1-version-strata-concept/index.html",
    },
    about: {
      label: "了解我的方法",
      preview: "从经历、方法到协作方式",
      href: "../about-v1-identity-spectrum-concept/index.html",
    },
  };

  const liveRegion = document.querySelector("[data-live-region]");
  const progressBar = document.querySelector("[data-page-progress]");
  const opening = document.querySelector(".opening");
  const pointerCanvas = document.querySelector("[data-pointer-field]");
  const pointerContext = pointerCanvas?.getContext("2d");
  const warpLetters = [...document.querySelectorAll("[data-warp-line] span")];
  const routeConsole = document.querySelector("[data-route-console]");
  const routeTabs = document.querySelector("[data-route-tabs]");
  const routeIndicator = document.querySelector("[data-route-indicator]");
  const routeChoices = [...document.querySelectorAll("[data-route-choice]")];
  const routePreview = document.querySelector("[data-route-preview]");
  const routeAction = document.querySelector("[data-route-action]");
  const routeOpen = document.querySelector("[data-route-open]");
  const sectionControls = [...document.querySelectorAll("[data-section]")];
  const identityField = document.querySelector(".identity-field");
  const avatarControl = document.querySelector("[data-avatar-control]");
  const capabilities = [...document.querySelectorAll("[data-capability]")];
  const story = document.querySelector("[data-system-story]");
  const storySticky = document.querySelector("[data-system-sticky]");
  const storyFrame = document.querySelector("[data-system-frame]");
  const runtime = document.querySelector("[data-runtime]");
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let selectedRoute = "work";
  let trailFrame = 0;
  let resizeFrame = 0;
  let scrollFrame = 0;
  let capabilityIndex = 0;
  let capabilityTimer = 0;
  let canvasWidth = 0;
  let canvasHeight = 0;
  let canvasDpr = 1;
  const trail = [];

  const clamp = (value, minimum = 0, maximum = 1) => Math.max(minimum, Math.min(maximum, value));
  const mix = (from, to, amount) => Math.round(from + (to - from) * amount);

  function announce(message) {
    if (liveRegion) liveRegion.textContent = message;
  }

  function navigateTo(section, source) {
    if (section === "home") {
      window.scrollTo({ top: 0, behavior: reduceMotion.matches ? "auto" : "smooth" });
      return;
    }
    const route = ROUTES[section];
    if (!route) return;
    if (window.parent !== window) {
      window.parent.postMessage({ type: "zk:navigate", chapter: section }, "*");
      return;
    }
    if (window.ZKRoute?.navigate) {
      window.ZKRoute.navigate(route.href, { source, label: route.label });
    } else {
      window.location.href = route.href;
    }
  }

  function measureText(button) {
    const range = document.createRange();
    range.selectNodeContents(button);
    const rect = range.getBoundingClientRect();
    range.detach?.();
    return rect;
  }

  function positionRouteIndicator(activeButton = routeChoices.find((button) => button.classList.contains("is-active"))) {
    if (!activeButton || !routeTabs || !routeIndicator) return;
    const tabsRect = routeTabs.getBoundingClientRect();
    const textRect = measureText(activeButton);
    const left = textRect.left - tabsRect.left;
    routeIndicator.style.width = `${Math.max(30, textRect.width)}px`;
    routeIndicator.style.transform = `translate3d(${left}px, 0, 0)`;
  }

  function selectRoute(section, options = {}) {
    const route = ROUTES[section];
    const activeButton = routeChoices.find((button) => button.dataset.routeChoice === section);
    if (!route || !activeButton) return;
    selectedRoute = section;
    routeChoices.forEach((button) => {
      const active = button === activeButton;
      button.classList.toggle("is-active", active);
      button.setAttribute("aria-selected", String(active));
      button.tabIndex = active ? 0 : -1;
    });
    positionRouteIndicator(activeButton);
    if (routeAction) routeAction.textContent = route.label;
    if (routePreview) {
      routePreview.classList.remove("is-visible");
      routePreview.textContent = route.preview;
      window.requestAnimationFrame(() => routePreview.classList.add("is-visible"));
    }
    if (options.announce !== false) announce(`已选择${activeButton.textContent.trim()}：${route.preview}`);
  }

  function setupRoutes() {
    routeChoices.forEach((button, index) => {
      button.addEventListener("click", () => selectRoute(button.dataset.routeChoice));
      button.addEventListener("keydown", (event) => {
        if (!["ArrowLeft", "ArrowRight", "Home", "End"].includes(event.key)) return;
        event.preventDefault();
        let nextIndex = index;
        if (event.key === "ArrowLeft") nextIndex = (index - 1 + routeChoices.length) % routeChoices.length;
        if (event.key === "ArrowRight") nextIndex = (index + 1) % routeChoices.length;
        if (event.key === "Home") nextIndex = 0;
        if (event.key === "End") nextIndex = routeChoices.length - 1;
        const next = routeChoices[nextIndex];
        selectRoute(next.dataset.routeChoice);
        next.focus();
      });
    });

    routeOpen?.addEventListener("click", () => navigateTo(selectedRoute, routeOpen));
    sectionControls.forEach((control) => {
      control.addEventListener("click", () => navigateTo(control.dataset.section, control));
    });

    routeConsole?.addEventListener("pointermove", (event) => {
      const rect = routeConsole.getBoundingClientRect();
      const ratio = clamp((event.clientX - rect.left) / Math.max(1, rect.width));
      routeConsole.style.setProperty("--glow-x", `${ratio * 100}%`);
    });
    routeConsole?.addEventListener("pointerleave", () => routeConsole.style.setProperty("--glow-x", "0%"));
    selectRoute("work", { announce: false });
  }

  function fitPointerCanvas() {
    if (!pointerCanvas || !pointerContext || !opening) return;
    const rect = opening.getBoundingClientRect();
    canvasWidth = Math.max(320, Math.round(rect.width));
    canvasHeight = Math.max(480, Math.round(opening.offsetHeight));
    canvasDpr = Math.min(window.devicePixelRatio || 1, 1.5);
    pointerCanvas.width = Math.round(canvasWidth * canvasDpr);
    pointerCanvas.height = Math.round(canvasHeight * canvasDpr);
    pointerCanvas.style.width = `${canvasWidth}px`;
    pointerCanvas.style.height = `${canvasHeight}px`;
    pointerContext.setTransform(canvasDpr, 0, 0, canvasDpr, 0, 0);
  }

  function drawTrail() {
    if (!pointerContext) return;
    pointerContext.clearRect(0, 0, canvasWidth, canvasHeight);
    const now = performance.now();
    while (trail.length && now - trail[0].time > 920) trail.shift();
    if (trail.length > 1) {
      pointerContext.save();
      pointerContext.lineCap = "round";
      pointerContext.lineJoin = "round";
      for (let index = 1; index < trail.length; index += 1) {
        const current = trail[index];
        const previous = trail[index - 1];
        const life = clamp(1 - (now - current.time) / 920);
        pointerContext.beginPath();
        pointerContext.moveTo(previous.x, previous.y);
        pointerContext.lineTo(current.x, current.y);
        pointerContext.strokeStyle = `rgba(100, 21, 154, ${life * 0.24})`;
        pointerContext.lineWidth = 0.7 + life * 0.55;
        pointerContext.stroke();
      }
      const head = trail[trail.length - 1];
      const headLife = clamp(1 - (now - head.time) / 920);
      pointerContext.beginPath();
        pointerContext.fillStyle = `rgba(139, 44, 194, ${headLife * 0.76})`;
      pointerContext.arc(head.x, head.y, 1.5, 0, Math.PI * 2);
      pointerContext.fill();
      pointerContext.restore();
    }
    if (trail.length) trailFrame = window.requestAnimationFrame(drawTrail);
    else trailFrame = 0;
  }

  function warpHeadline(clientX, clientY) {
    warpLetters.forEach((letter, index) => {
      const rect = letter.getBoundingClientRect();
      const centerX = rect.left + rect.width / 2;
      const centerY = rect.top + rect.height / 2;
      const distance = Math.hypot(clientX - centerX, clientY - centerY);
      const influence = clamp(1 - distance / 150);
      const direction = clientX < centerX ? 1 : -1;
      const scaleX = 1 + influence * (index % 2 === 0 ? 0.075 : -0.04);
      const shiftY = direction * influence * (index - 1.5) * 2.2;
      letter.style.transform = `translate3d(0, ${shiftY}px, 0) scaleX(${scaleX})`;
    });
  }

  function resetWarp() {
    warpLetters.forEach((letter) => { letter.style.transform = ""; });
  }

  function activateClosestCapability(clientX, clientY) {
    let closest = 0;
    let closestDistance = Infinity;
    capabilities.forEach((capability, index) => {
      const rect = capability.getBoundingClientRect();
      const distance = Math.hypot(clientX - (rect.left + rect.width / 2), clientY - (rect.top + rect.height / 2));
      if (distance < closestDistance) {
        closestDistance = distance;
        closest = index;
      }
    });
    setActiveCapability(closest);
  }

  function setActiveCapability(index) {
    capabilityIndex = index;
    capabilities.forEach((capability, capabilityPosition) => {
      capability.classList.toggle("is-active", capabilityPosition === index);
    });
  }

  function setupPointerField() {
    if (reduceMotion.matches) return;
    opening?.addEventListener("pointermove", (event) => {
      const rect = opening.getBoundingClientRect();
      trail.push({ x: event.clientX - rect.left, y: event.clientY - rect.top, time: performance.now() });
      if (trail.length > 42) trail.splice(0, trail.length - 42);
      if (!trailFrame) trailFrame = window.requestAnimationFrame(drawTrail);
      warpHeadline(event.clientX, event.clientY);
    }, { passive: true });
    opening?.addEventListener("pointerleave", resetWarp, { passive: true });

    identityField?.addEventListener("pointermove", (event) => {
      const rect = identityField.getBoundingClientRect();
      const x = clamp((event.clientX - rect.left) / Math.max(1, rect.width), 0, 1) - 0.5;
      const y = clamp((event.clientY - rect.top) / Math.max(1, rect.height), 0, 1) - 0.5;
      avatarControl?.style.setProperty("--avatar-x", `${x * 9}px`);
      avatarControl?.style.setProperty("--avatar-y", `${y * 7}px`);
      activateClosestCapability(event.clientX, event.clientY);
    }, { passive: true });
    identityField?.addEventListener("pointerleave", () => {
      avatarControl?.style.setProperty("--avatar-x", "0px");
      avatarControl?.style.setProperty("--avatar-y", "0px");
    }, { passive: true });

    capabilities.forEach((capability, index) => {
      capability.addEventListener("mouseenter", () => setActiveCapability(index));
    });

    setActiveCapability(0);
    capabilityTimer = window.setInterval(() => {
      if (document.hidden || identityField?.matches(":hover")) return;
      setActiveCapability((capabilityIndex + 1) % capabilities.length);
    }, 2200);
  }

  function setupAvatar() {
    avatarControl?.addEventListener("click", () => {
      const maker = avatarControl.classList.toggle("is-maker");
      announce(maker ? "像素分身切换到创作者状态" : "像素分身恢复观察状态");
    });
  }

  function updateRuntime() {
    if (!runtime) return;
    const start = new Date("2026-08-10T00:00:00+08:00");
    const days = Math.max(0, Math.floor((Date.now() - start.getTime()) / 86400000));
    runtime.textContent = String(days).padStart(3, "0");
  }

  function updateScrollState() {
    scrollFrame = 0;
    const documentHeight = Math.max(document.documentElement.scrollHeight, document.body.scrollHeight);
    const maximumScroll = Math.max(1, documentHeight - window.innerHeight);
    const pageProgress = clamp(window.scrollY / maximumScroll);
    if (progressBar) progressBar.style.transform = `scaleX(${pageProgress})`;

    if (!story || !storySticky || !storyFrame) return;
    const start = story.offsetTop;
    const distance = Math.max(1, story.offsetHeight - window.innerHeight);
    const raw = clamp((window.scrollY - start) / distance);
    const progress = reduceMotion.matches ? (raw > 0 ? 1 : 0) : clamp(raw * 1.35);
    const width = 96 + progress * 4;
    const height = 42 + progress * 58;
    const backgroundAmount = clamp((progress - 0.46) / 0.42);
    const background = `rgb(${mix(255, 11, backgroundAmount)} ${mix(255, 12, backgroundAmount)} ${mix(255, 14, backgroundAmount)})`;
    const metaOpacity = clamp(1 - progress * 1.2);

    storyFrame.style.setProperty("--frame-width", `${width}vw`);
    storyFrame.style.setProperty("--frame-height", `${height}svh`);
    storyFrame.style.setProperty("--meta-opacity", String(metaOpacity));
    storyFrame.style.setProperty("--meta-y", `${progress * -34}px`);
    storyFrame.classList.toggle("is-open", progress > 0.18);
    storySticky.style.backgroundColor = background;
  }

  function requestScrollUpdate() {
    if (!scrollFrame) scrollFrame = window.requestAnimationFrame(updateScrollState);
  }

  function handleResize() {
    window.cancelAnimationFrame(resizeFrame);
    resizeFrame = window.requestAnimationFrame(() => {
      fitPointerCanvas();
      positionRouteIndicator();
      updateScrollState();
    });
  }

  setupRoutes();
  setupPointerField();
  setupAvatar();
  updateRuntime();
  fitPointerCanvas();
  updateScrollState();
  window.addEventListener("resize", handleResize, { passive: true });
  window.addEventListener("scroll", requestScrollUpdate, { passive: true });
  window.addEventListener("zk:continuous-scroll", requestScrollUpdate);
  window.addEventListener("pagehide", () => window.clearInterval(capabilityTimer), { once: true });
  document.fonts?.ready.then(handleResize).catch(() => {});
})();
