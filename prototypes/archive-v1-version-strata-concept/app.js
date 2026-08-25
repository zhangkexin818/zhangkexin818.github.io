const versions = [
  { number: "01", date: "2026.08.10", title: "首页框架拆解", note: "从作品入口开始搭建内容结构，确认网站需要先有骨架。" },
  { number: "02", date: "2026.08.11", title: "身份卡入口", note: "保留像素角色与弹出式身份卡，真人头像退出首页。" },
  { number: "03", date: "2026.08.12", title: "宇宙叙事试验", note: "尝试连续场景，但暂缓会压过内容的大幅具象背景。" },
  { number: "04", date: "2026.08.13", title: "粒子光谱", note: "确立可读粒子标题、英文导航和暗调视觉基线。" },
  { number: "05", date: "2026.08.17", title: "经历轨道", note: "把实习与项目沿时间组织，统一标识形状与信息层级。" },
  { number: "06", date: "2026.08.17", title: "IP 连续世界", note: "从角色设定进入场景，开始拆出作品内容而非嵌入整页。" },
  { number: "07", date: "2026.08.18", title: "IP 叙事重排", note: "减少拼贴边界，让排版、动效和内容拥有连续呼吸。" },
  { number: "08", date: "2026.08.20", title: "粒子边界 IP", note: "线稿与三维对应、角色坠落、粒子缝合，形成当前版。" },
];

const versionCards = [...document.querySelectorAll(".stratum-card")];
const stage = document.querySelector("#strata-stage");
const versionNumber = document.querySelector("#version-number");
const versionDate = document.querySelector("#version-date");
const versionTitle = document.querySelector("#version-title");
const versionNote = document.querySelector("#version-note");
const versionProgress = document.querySelector("#version-progress");
const dialog = document.querySelector("#inspect-dialog");
const dialogImage = document.querySelector("#dialog-image");
const dialogVersion = document.querySelector("#dialog-version");
const dialogTitle = document.querySelector("#dialog-title");
const dialogNote = document.querySelector("#dialog-note");
let activeVersion = versions.length - 1;

function clamp(value, min, max) { return Math.max(min, Math.min(max, value)); }

function setVersion(index, burst = true) {
  activeVersion = (index + versions.length) % versions.length;
  versionCards.forEach((card, cardIndex) => {
    const offset = cardIndex - activeVersion;
    const distance = Math.abs(offset);
    const x = offset * 36;
    const y = offset * -29;
    const z = -distance * 36;
    const scale = Math.max(.69, 1 - distance * .045);
    const opacity = distance > 5 ? 0 : Math.max(.12, 1 - distance * .15);
    card.style.setProperty("--x", `${x}px`);
    card.style.setProperty("--y", `${y}px`);
    card.style.setProperty("--z", `${z}px`);
    card.style.setProperty("--rot", `${-8 + offset * .45}deg`);
    card.style.setProperty("--scale", scale);
    card.style.setProperty("--opacity", opacity);
    card.style.zIndex = String(30 - distance + (offset < 0 ? 1 : 0));
    card.classList.toggle("is-active", cardIndex === activeVersion);
    card.tabIndex = cardIndex === activeVersion ? 0 : -1;
  });
  const current = versions[activeVersion];
  versionNumber.textContent = `${current.number} / 08`;
  versionDate.textContent = current.date;
  versionTitle.textContent = current.title;
  versionNote.textContent = current.note;
  versionProgress.style.transform = `scaleX(${(activeVersion + 1) / versions.length})`;
  if (burst) particleSystem.burst(innerWidth * .72, innerHeight * .48, 18, "copper");
}

versionCards.forEach((card, index) => {
  card.addEventListener("click", () => {
    if (index === activeVersion) openDialog();
    else setVersion(index);
  });
  card.addEventListener("mousemove", (event) => {
    if (index !== activeVersion) return;
    const rect = card.getBoundingClientRect();
    const rx = (event.clientY - rect.top) / rect.height - .5;
    const ry = (event.clientX - rect.left) / rect.width - .5;
    card.style.filter = `brightness(${1 + Math.abs(ry) * .08})`;
    card.style.setProperty("--rot", `${-8 + ry * 2.4}deg`);
    card.style.setProperty("--x", `${ry * 14}px`);
    card.style.setProperty("--y", `${rx * -10}px`);
  });
  card.addEventListener("mouseleave", () => setVersion(activeVersion, false));
});

document.querySelector("#prev-version").addEventListener("click", () => setVersion(activeVersion - 1));
document.querySelector("#next-version").addEventListener("click", () => setVersion(activeVersion + 1));
stage.addEventListener("wheel", (event) => {
  event.preventDefault();
  const direction = event.deltaY > 0 ? 1 : -1;
  setVersion(activeVersion + direction);
}, { passive: false });
stage.addEventListener("keydown", (event) => {
  if (event.key === "ArrowRight" || event.key === "ArrowDown") setVersion(activeVersion + 1);
  if (event.key === "ArrowLeft" || event.key === "ArrowUp") setVersion(activeVersion - 1);
});

let stageTouchStart = null;
stage.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse") return;
  stageTouchStart = { x: event.clientX, y: event.clientY };
});
stage.addEventListener("pointerup", (event) => {
  if (!stageTouchStart || event.pointerType === "mouse") return;
  const dx = event.clientX - stageTouchStart.x;
  const dy = event.clientY - stageTouchStart.y;
  if (Math.abs(dx) > 42 && Math.abs(dx) > Math.abs(dy)) setVersion(activeVersion + (dx < 0 ? 1 : -1));
  stageTouchStart = null;
});

function openDialog(image = versionCards[activeVersion].querySelector("img"), data = versions[activeVersion]) {
  dialogImage.src = image.src;
  dialogImage.alt = image.alt;
  dialogVersion.textContent = `V.${data.number || "—"} · ${data.date || "ARCHIVE"}`;
  dialogTitle.textContent = data.title;
  dialogNote.textContent = data.note || data.meta || "";
  if (typeof dialog.showModal === "function") dialog.showModal();
}
document.querySelector("#inspect-current").addEventListener("click", () => openDialog());
document.querySelector(".dialog-close").addEventListener("click", () => dialog.close());
dialog.addEventListener("click", (event) => { if (event.target === dialog) dialog.close(); });

const filterButtons = [...document.querySelectorAll(".archive-switch button")];
const filmItems = [...document.querySelectorAll(".film-item")];
const filmTrack = document.querySelector("#film-track");
const filmViewport = document.querySelector("#film-viewport");
const filmIndex = document.querySelector("#film-index");
const filmTitle = document.querySelector("#film-title");
const filmMeta = document.querySelector("#film-meta");
const filmPrev = document.querySelector("#film-prev");
const filmNext = document.querySelector("#film-next");
const filmDots = document.querySelector("#film-dots");
let currentFilter = "works";
let currentFilm = 0;
let filmOffset = 0;
let filmTarget = 0;
let dragging = false;
let dragStart = 0;
let dragOrigin = 0;
let dragStartFilm = 0;
let dragDistance = 0;
let lastFilmWheel = 0;
let pressedFilmItem = null;

function visibleFilmItems() { return filmItems.filter((item) => item.dataset.kind === currentFilter); }
function filmBounds() {
  const visible = visibleFilmItems();
  if (!visible.length) return { min: 0, max: 0 };
  const first = visible[0];
  const last = visible[visible.length - 1];
  const max = filmViewport.clientWidth / 2 - (first.offsetLeft + first.offsetWidth / 2);
  const min = filmViewport.clientWidth / 2 - (last.offsetLeft + last.offsetWidth / 2);
  return { min, max };
}

function rebuildFilmDots() {
  const visible = visibleFilmItems();
  filmDots.replaceChildren(...visible.map((item, index) => {
    const dot = document.createElement("button");
    dot.type = "button";
    dot.setAttribute("aria-label", `跳到第 ${index + 1} 张：${item.dataset.title || "档案"}`);
    dot.addEventListener("click", () => goToFilm(index));
    return dot;
  }));
}

function goToFilm(index, { instant = false } = {}) {
  const visible = visibleFilmItems();
  if (!visible.length) return;
  currentFilm = clamp(index, 0, visible.length - 1);
  const item = visible[currentFilm];
  const bounds = filmBounds();
  const desired = filmViewport.clientWidth / 2 - (item.offsetLeft + item.offsetWidth / 2);
  filmTarget = clamp(desired, bounds.min, bounds.max);
  if (instant) filmOffset = filmTarget;
  updateFilmFocus(currentFilm);
}

function updateFilmFocus(forcedIndex = null) {
  const visible = visibleFilmItems();
  const center = filmViewport.getBoundingClientRect().left + filmViewport.clientWidth / 2;
  let best = forcedIndex === null ? 0 : clamp(forcedIndex, 0, visible.length - 1);
  let bestDistance = Infinity;
  if (forcedIndex === null) {
    visible.forEach((item, index) => {
      const rect = item.getBoundingClientRect();
      const distance = Math.abs(rect.left + rect.width / 2 - center);
      if (distance < bestDistance) { bestDistance = distance; best = index; }
    });
  }
  currentFilm = best;
  filmItems.forEach((item) => item.classList.remove("is-focused"));
  const item = visible[best];
  if (!item) return;
  item.classList.add("is-focused");
  filmIndex.textContent = `${String(best + 1).padStart(2, "0")} / ${String(visible.length).padStart(2, "0")}`;
  filmTitle.textContent = item.dataset.title || item.querySelector("h3")?.textContent || "取舍记录";
  filmMeta.textContent = item.dataset.meta || item.querySelector("p")?.textContent || "";
  [...filmDots.children].forEach((dot, index) => {
    dot.classList.toggle("is-active", index === best);
    dot.setAttribute("aria-current", index === best ? "true" : "false");
  });
  filmPrev.disabled = best === 0;
  filmNext.disabled = best === visible.length - 1;
}

function renderFilm() {
  if (filmViewport.scrollLeft) filmViewport.scrollLeft = 0;
  filmOffset += (filmTarget - filmOffset) * .12;
  filmTrack.style.transform = `translate3d(${filmOffset}px,0,0)`;
  if (dragging || Math.abs(filmTarget - filmOffset) < 1.2) updateFilmFocus();
  requestAnimationFrame(renderFilm);
}

function setFilter(filter) {
  currentFilter = filter;
  filterButtons.forEach((button) => {
    const active = button.dataset.filter === filter;
    button.classList.toggle("is-active", active);
    button.setAttribute("aria-selected", String(active));
  });
  filmItems.forEach((item) => item.classList.toggle("is-hidden", item.dataset.kind !== filter));
  filmOffset = filmTarget = 0;
  currentFilm = 0;
  rebuildFilmDots();
  requestAnimationFrame(() => goToFilm(0, { instant: true }));
  particleSystem.burst(innerWidth * .75, document.querySelector(".archive-switch").getBoundingClientRect().top, 14, filter === "decisions" ? "mint" : "copper");
}
filterButtons.forEach((button) => button.addEventListener("click", () => setFilter(button.dataset.filter)));
filmPrev.addEventListener("click", () => goToFilm(currentFilm - 1));
filmNext.addEventListener("click", () => goToFilm(currentFilm + 1));
filmViewport.addEventListener("wheel", (event) => {
  const horizontal = Math.abs(event.deltaX) > Math.abs(event.deltaY);
  const delta = horizontal ? event.deltaX : event.deltaY;
  if (Math.abs(delta) < 2) return;
  event.preventDefault();
  const visible = visibleFilmItems();
  const direction = delta > 0 ? 1 : -1;
  const atBoundary = direction > 0 ? currentFilm >= visible.length - 1 : currentFilm <= 0;
  if (atBoundary && !horizontal) {
    window.parent.postMessage({ type: "zk:wheel", deltaY: delta }, "*");
    return;
  }
  const now = performance.now();
  if (now - lastFilmWheel < 320) return;
  lastFilmWheel = now;
  if (horizontal && atBoundary) goToFilm(direction > 0 ? 0 : visible.length - 1);
  else goToFilm(currentFilm + direction);
}, { passive: false });
filmViewport.addEventListener("pointerdown", (event) => {
  if (event.pointerType === "mouse" && event.button !== 0) return;
  event.preventDefault();
  dragging = true; dragStart = event.clientX; dragOrigin = filmTarget;
  dragStartFilm = currentFilm;
  dragDistance = 0;
  pressedFilmItem = event.target.closest(".film-item");
  filmViewport.classList.add("is-dragging");
  filmViewport.setPointerCapture(event.pointerId);
});
filmViewport.addEventListener("pointermove", (event) => {
  if (!dragging) return;
  const bounds = filmBounds();
  dragDistance = event.clientX - dragStart;
  filmTarget = clamp(dragOrigin + dragDistance, bounds.min, bounds.max);
});
filmViewport.addEventListener("pointerup", (event) => {
  dragging = false;
  filmViewport.classList.remove("is-dragging");
  if (filmViewport.hasPointerCapture?.(event.pointerId)) filmViewport.releasePointerCapture(event.pointerId);
  if (Math.abs(dragDistance) > 42) goToFilm(dragStartFilm + (dragDistance < 0 ? 1 : -1));
  else if (Math.abs(dragDistance) > 8) goToFilm(dragStartFilm);
  else if (pressedFilmItem) activateFilmItem(pressedFilmItem);
  pressedFilmItem = null;
});
filmViewport.addEventListener("pointercancel", () => {
  dragging = false;
  pressedFilmItem = null;
  filmViewport.classList.remove("is-dragging");
  goToFilm(dragStartFilm);
});
filmViewport.addEventListener("keydown", (event) => {
  if (event.key !== "ArrowLeft" && event.key !== "ArrowRight") return;
  event.preventDefault();
  goToFilm(currentFilm + (event.key === "ArrowRight" ? 1 : -1));
});
function activateFilmItem(item) {
  if (Math.abs(dragDistance) > 18) return;
  if (item.dataset.url) {
    window.open(item.dataset.url, "_blank", "noopener,noreferrer");
    return;
  }
  const image = item.querySelector("img");
  if (!image) return;
  openDialog(image, { number: "—", date: "ARCHIVE", title: item.dataset.title, meta: item.dataset.meta });
}
filmItems.forEach((item) => {
  item.querySelector("img")?.setAttribute("draggable", "false");
  // Pointer activation is handled on pointerup so drag and click cannot fire
  // twice. Keep the native click path for keyboard users.
  item.addEventListener("click", (event) => {
    if (event.detail === 0) activateFilmItem(item);
  });
});

const canvas = document.querySelector("#particle-field");
const context = canvas.getContext("2d", { alpha: true });
const pointer = { x: innerWidth / 2, y: innerHeight / 2, px: innerWidth / 2, py: innerHeight / 2, active: false };
const particles = [];
let dpr = 1;

const particleSystem = {
  resize() {
    dpr = Math.min(devicePixelRatio || 1, 1.6);
    canvas.width = innerWidth * dpr;
    canvas.height = innerHeight * dpr;
    canvas.style.width = `${innerWidth}px`;
    canvas.style.height = `${innerHeight}px`;
    context.setTransform(dpr, 0, 0, dpr, 0, 0);
  },
  add(x, y, color = "paper", speed = 1) {
      const palette = color === "copper" ? [139,44,194] : color === "mint" ? [154,140,168] : [243,241,247];
    const angle = Math.random() * Math.PI * 2;
    particles.push({ x, y, vx: Math.cos(angle) * speed * (Math.random() + .25), vy: Math.sin(angle) * speed * (Math.random() + .25), size: Math.random() * 1.8 + .35, alpha: Math.random() * .65 + .2, life: Math.random() * 55 + 35, color: palette });
  },
  burst(x, y, count = 12, color = "paper") { for (let i = 0; i < count; i += 1) this.add(x, y, color, Math.random() * 2.2 + .4); },
  tick() {
    context.clearRect(0, 0, innerWidth, innerHeight);
    for (let index = particles.length - 1; index >= 0; index -= 1) {
      const particle = particles[index];
      particle.x += particle.vx; particle.y += particle.vy;
      particle.vx *= .985; particle.vy *= .985; particle.life -= 1; particle.alpha *= .984;
      if (particle.life <= 0 || particle.alpha < .02) { particles.splice(index, 1); continue; }
      context.beginPath();
      context.fillStyle = `rgba(${particle.color.join(",")},${particle.alpha})`;
      context.arc(particle.x, particle.y, particle.size, 0, Math.PI * 2);
      context.fill();
    }
    if (pointer.active && Math.hypot(pointer.x - pointer.px, pointer.y - pointer.py) > 2 && Math.random() > .36) this.add(pointer.x, pointer.y, "copper", .4);
    pointer.px += (pointer.x - pointer.px) * .16;
    pointer.py += (pointer.y - pointer.py) * .16;
    requestAnimationFrame(() => this.tick());
  },
};

addEventListener("pointermove", (event) => { pointer.x = event.clientX; pointer.y = event.clientY; pointer.active = true; });
addEventListener("pointerleave", () => { pointer.active = false; });
addEventListener("resize", () => { particleSystem.resize(); filmTarget = clamp(filmTarget, filmBounds().min, 0); });
document.addEventListener("click", (event) => particleSystem.burst(event.clientX, event.clientY, 12, "copper"));

const cursorCore = document.querySelector(".cursor-core");
const cursorOrbit = document.querySelector(".cursor-orbit");
if (!document.documentElement.classList.contains("zk-cursor-system") && cursorCore && cursorOrbit) {
  addEventListener("pointermove", (event) => {
    cursorCore.style.transform = `translate(${event.clientX}px,${event.clientY}px) translate(-50%,-50%)`;
    cursorOrbit.animate({ transform: `translate(${event.clientX}px,${event.clientY}px) translate(-50%,-50%)` }, { duration: 320, fill: "forwards" });
  });
  document.querySelectorAll("a,button").forEach((element) => {
    element.addEventListener("mouseenter", () => document.body.classList.add("is-hovering"));
    element.addEventListener("mouseleave", () => document.body.classList.remove("is-hovering"));
  });
}

const chapters = [...document.querySelectorAll(".chapter")];
const chapterName = document.querySelector("#chapter-name");
const chapterCount = document.querySelector("#chapter-count");
const chapterObserver = new IntersectionObserver((entries) => {
  const visible = entries.filter((entry) => entry.isIntersecting).sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
  if (!visible) return;
  chapterName.textContent = visible.target.dataset.chapter;
  chapterCount.textContent = visible.target.dataset.count;
  document.body.classList.toggle("header-light", visible.target.id === "library");
}, { threshold: [0.25, 0.5, 0.75] });
chapters.forEach((chapter) => chapterObserver.observe(chapter));

const seamRibbon = document.querySelector(".seam-film-ribbon");
const seamVideo = seamRibbon?.querySelector("video");
function syncSeamMotion() {
  if (!seamRibbon) return;
  const rect = seamRibbon.getBoundingClientRect();
  const progress = clamp(1 - rect.top / innerHeight, 0, 1);
  seamRibbon.style.setProperty("--seam-progress", progress.toFixed(3));
  const visible = rect.bottom > -80 && rect.top < innerHeight + 80;
  if (visible && !document.hidden) seamVideo?.play().catch(() => {});
  else seamVideo?.pause();
}
addEventListener("scroll", syncSeamMotion, { passive: true });
addEventListener("zk:continuous-scroll", syncSeamMotion);
document.addEventListener("visibilitychange", syncSeamMotion);
syncSeamMotion();

const counter = document.querySelector("[data-count-up]");
const counterObserver = new IntersectionObserver((entries) => {
  if (!entries[0].isIntersecting) return;
  const target = Number(counter.dataset.countUp);
  const start = performance.now();
  const animate = (now) => {
    const progress = Math.min(1, (now - start) / 900);
    counter.textContent = String(Math.round(target * (1 - Math.pow(1 - progress, 3)))).padStart(2, "0");
    if (progress < 1) requestAnimationFrame(animate);
  };
  requestAnimationFrame(animate);
  counterObserver.disconnect();
}, { threshold: .55 });
counterObserver.observe(counter);

document.querySelectorAll(".decision-ledger button").forEach((button) => button.addEventListener("mouseenter", () => {
  const rect = button.getBoundingClientRect();
  particleSystem.burst(rect.right - 60, rect.top + rect.height / 2, 16, button.dataset.state === "drop" ? "mint" : "copper");
}));

particleSystem.resize();
particleSystem.tick();
setVersion(activeVersion, false);
setFilter("works");
renderFilm();
