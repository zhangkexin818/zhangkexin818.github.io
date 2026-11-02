(() => {
  "use strict";
  const $ = (s, r = document) => r.querySelector(s);
  const $$ = (s, r = document) => [...r.querySelectorAll(s)];
  const reduce = matchMedia("(prefers-reduced-motion: reduce)").matches;
  const css = getComputedStyle(document.documentElement);
  const SP = css.getPropertyValue("--sp").trim() || "cubic-bezier(.3,1.35,.5,1)";
  const BO = css.getPropertyValue("--bo").trim() || "cubic-bezier(.34,1.7,.5,1)";
  const springIn = (el, { delay = 0, y = 18, s = 0.96, d = 820, ease = BO } = {}) => {
    if (reduce || !el.animate) return;
    try {
      el.animate([{ opacity: 0, transform: `translateY(${y}px) scale(${s})` }, { opacity: 1, transform: "none" }], { duration: d, delay, easing: ease, fill: "backwards" });
    } catch (_) {
      el.animate([{ opacity: 0, transform: `translateY(${y}px) scale(${s})` }, { opacity: 1, transform: "none" }], { duration: d, delay, easing: "cubic-bezier(.34,1.56,.64,1)", fill: "backwards" });
    }
  };
  const retrigger = (el, cls) => { el.classList.remove(cls); void el.offsetWidth; el.classList.add(cls); };
  const toast = (t) => { const el = $("#toast"); el.textContent = t; el.classList.add("on"); clearTimeout(toast.t); toast.t = setTimeout(() => el.classList.remove("on"), 1500); };
  async function copyText(text, btn) {
    try { await navigator.clipboard.writeText(text); }
    catch (_) {
      const ta = document.createElement("textarea"); ta.value = text; ta.style.cssText = "position:fixed;opacity:0"; document.body.appendChild(ta); ta.select();
      let ok = false; try { ok = document.execCommand("copy"); } catch (_) { ok = false; } ta.remove();
      if (!ok) { toast("复制失败，请手动选中文字"); return; }
    }
    if (btn) { btn.classList.add("done"); clearTimeout(btn._t); btn._t = setTimeout(() => btn.classList.remove("done"), 1400); }
    toast("已复制");
  }
  const save = (blob, name) => { const u = URL.createObjectURL(blob); const a = document.createElement("a"); a.href = u; a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(u), 4000); };

  /* ---------- sliders: fill + value pop ---------- */
  function fill(r) { const p = (r.value - r.min) / (r.max - r.min) * 100; r.style.setProperty("--p", p + "%"); }
  $$(".range input").forEach((r) => { fill(r); r.addEventListener("input", () => { fill(r); const o = r.parentElement.querySelector("output"); if (o) retrigger(o, "tick"); }); });

  /* ---------- hero: letters drop in, cards spring up ---------- */
  const h1 = $(".hero h1");
  h1.innerHTML = [...h1.textContent].map((c) => `<span class="ch">${c}</span>`).join("");
  $$(".hero h1 .ch").forEach((c, i) => springIn(c, { delay: 120 + i * 70, y: 40, s: 0.6 }));
  springIn($(".hero .k"), { delay: 60, y: 10, s: 1 });
  springIn($(".hero .sub"), { delay: 520, y: 12, s: 1, d: 700, ease: SP });
  const cards = $$(".tc");
  const io = new IntersectionObserver((es) => {
    es.forEach((e) => { if (!e.isIntersecting) return; io.unobserve(e.target); springIn(e.target, { delay: cards.indexOf(e.target) * 70, y: 46, s: 0.9 }); });
  }, { threshold: 0.15 });
  cards.forEach((c) => io.observe(c));

  /* ---------- cards: spring-physics tilt that follows the pointer ---------- */
  cards.forEach((card) => {
    const st = { x: 0, y: 0, vx: 0, vy: 0, tx: 0, ty: 0, z: 0, vz: 0, tz: 0, raf: 0 };
    const step = () => {
      const k = 0.09, damp = 0.78;
      st.vx = (st.vx + (st.tx - st.x) * k) * damp; st.x += st.vx;
      st.vy = (st.vy + (st.ty - st.y) * k) * damp; st.y += st.vy;
      st.vz = (st.vz + (st.tz - st.z) * k) * damp; st.z += st.vz;
      card.style.transform = `translateY(${-st.z * 8}px) rotateX(${st.y}deg) rotateY(${st.x}deg) scale(${1 + st.z * 0.025})`;
      if (Math.abs(st.vx) + Math.abs(st.vy) + Math.abs(st.vz) + Math.abs(st.tx - st.x) + Math.abs(st.ty - st.y) + Math.abs(st.tz - st.z) > 0.002) st.raf = requestAnimationFrame(step);
      else { st.raf = 0; if (!st.tz) card.style.transform = ""; }
    };
    const kick = () => { if (!st.raf && !reduce) st.raf = requestAnimationFrame(step); };
    card.addEventListener("pointermove", (e) => {
      if (e.pointerType !== "mouse") return;
      const r = card.getBoundingClientRect(); const px = (e.clientX - r.left) / r.width, py = (e.clientY - r.top) / r.height;
      card.style.setProperty("--mx", px * 100 + "%"); card.style.setProperty("--my", py * 100 + "%");
      st.tx = (px - 0.5) * 14; st.ty = (0.5 - py) * 12; st.tz = 1; kick();
    });
    card.addEventListener("pointerleave", () => { st.tx = 0; st.ty = 0; st.tz = 0; kick(); });
    card.addEventListener("pointerdown", () => { st.vz -= 0.5; kick(); });
    card.addEventListener("click", () => { select(+card.dataset.t, { focus: false }); scrollToBench(); });
  });
  function scrollToBench() {
    const b = $("#bench"); const y = b.getBoundingClientRect().top + scrollY - 24;
    if (window.parent !== window) window.parent.postMessage({ type: "zk:navigate-local", y }, "*");
    else scrollTo({ top: y - 56, behavior: reduce ? "auto" : "smooth" });
  }

  /* ---------- tabs + panels ---------- */
  const tabs = $$("#tabs [role=tab]"), panels = $$(".panel"), ind = $(".tab-ind");
  let cur = 0;
  function placeInd() { const t = tabs[cur]; ind.style.width = t.offsetWidth + "px"; ind.style.transform = `translateX(${t.offsetLeft}px)`; }
  function select(i, { focus = true } = {}) {
    if (i === cur) { placeInd(); return; }
    const prev = panels[cur]; cur = i;
    tabs.forEach((t, j) => { t.setAttribute("aria-selected", String(j === i)); t.tabIndex = j === i ? 0 : -1; });
    cards.forEach((c, j) => c.classList.toggle("is-cur", j === i));
    placeInd();
    if (!reduce && prev.animate) prev.animate([{ opacity: 1, transform: "none" }, { opacity: 0, transform: "translateY(-10px) scale(.985)" }], { duration: 180, easing: "ease-in" });
    prev.classList.remove("is-on"); prev.setAttribute("aria-hidden", "true"); prev.inert = true;
    const p = panels[i]; p.classList.add("is-on"); p.removeAttribute("aria-hidden"); p.inert = false;
    $$("[data-st]", p).forEach((el, k) => springIn(el, { delay: 90 + k * 55, y: 22, s: 0.97 }));
    if (focus) tabs[i].focus({ preventScroll: true });
    if (i === 2) requestAnimationFrame(applyFocus);
  }
  tabs.forEach((t, i) => {
    t.tabIndex = i === 0 ? 0 : -1;
    t.addEventListener("click", () => select(i));
    t.addEventListener("keydown", (e) => {
      const d = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
      if (d) { e.preventDefault(); select((cur + d + tabs.length) % tabs.length); }
    });
  });
  panels.forEach((p, i) => { if (i) { p.setAttribute("aria-hidden", "true"); p.inert = true; } });
  cards[0].classList.add("is-cur");
  ind.style.transition = "none"; placeInd(); requestAnimationFrame(() => requestAnimationFrame(() => (ind.style.transition = "")));
  addEventListener("resize", placeInd);
  if (document.fonts) document.fonts.ready.then(placeInd);

  /* ---------- shared samples / drops ---------- */
  const samples = [["img/zhu.jpg", "《竹》"], ["img/cha.jpg", "《帧茶馆》"], ["img/fsx.jpg", "《分水线》"], ["img/fruit.jpg", "果信世界"], ["img/zg.jpg", "志怪角色"], ["img/knit.jpg", "毛绒苹果园"]];
  function thumbs(box, onPick, start = 0) {
    samples.forEach(([src, name], i) => {
      const b = document.createElement("button");
      b.type = "button"; b.setAttribute("aria-label", name); b.setAttribute("aria-pressed", String(i === start));
      b.innerHTML = `<img src="${src}" alt="">`;
      b.addEventListener("click", () => { box.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", String(x === b))); onPick(src, name); });
      box.appendChild(b);
    });
  }
  function dropzone(kind, box, onFile) {
    const drop = $(`[data-drop="${kind}"]`), input = drop.querySelector("input");
    const use = (f) => { if (!f || !f.type.startsWith("image/")) { if (f) toast("请放入图片文件"); return; } box.querySelectorAll("button").forEach((x) => x.setAttribute("aria-pressed", "false")); retrigger(drop, "jelly"); onFile(f); };
    input.addEventListener("change", () => { use(input.files[0]); input.value = ""; });
    ["dragenter", "dragover"].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.add("over"); }));
    ["dragleave", "drop"].forEach((e) => drop.addEventListener(e, (ev) => { ev.preventDefault(); drop.classList.remove("over"); if (e === "drop") use(ev.dataTransfer.files[0]); }));
  }

  /* ---------- 01 prompt mixer ---------- */
  const G = {
    size: [["大远景", "extreme wide shot", "大远景"], ["全景", "wide shot", "全景"], ["中景", "medium shot", "中景"], ["近景", "medium close-up", "近景"], ["特写", "close-up", "特写"], ["大特写", "extreme close-up", "大特写"]],
    move: [["固定", "static camera", "固定机位"], ["缓推", "slow push-in", "镜头缓慢推近"], ["拉远", "slow pull-back", "镜头缓慢拉远"], ["横移", "lateral tracking", "镜头横向平移"], ["手持", "handheld, subtle shake", "手持轻微晃动"], ["环绕", "slow orbit", "镜头缓慢环绕"]],
    light: [["窗边侧光", "soft window side light", "窗边柔和侧光"], ["逆光", "backlit, rim light", "逆光勾边"], ["烛光", "warm candlelight, practical lights", "暖色烛光与实景灯"], ["黄昏", "golden hour dusk light", "黄昏金色光"], ["阴天柔光", "overcast diffused light", "阴天漫射柔光"], ["顶光", "hard top light", "硬质顶光"]],
    film: [["Kodak 500T", "shot on 35mm Kodak Vision3 500T, fine grain, observational documentary", "35mm Kodak Vision3 500T 胶片质感，细颗粒，纪实观察"], ["Fuji Eterna", "Fujifilm Eterna, muted greens, soft contrast", "富士 Eterna 色调，低饱和绿色，柔和反差"], ["16mm", "16mm film, heavy grain, gate weave", "16mm 胶片，粗颗粒，轻微片门抖动"], ["数字干净", "clean digital cinema, ARRI Alexa", "干净的数字电影质感"]],
    ar: [["16:9", "16:9"], ["2.39:1", "239:100"], ["9:16", "9:16"], ["3:4", "3:4"]],
  };
  const pick = { size: 4, move: 1, light: 2, film: 0, ar: 0 };
  const chipBoxes = {};
  $$("[data-g]").forEach((box) => {
    const g = box.dataset.g; chipBoxes[g] = box;
    G[g].forEach((opt, i) => {
      const b = document.createElement("button");
      b.type = "button"; b.className = "chip"; b.textContent = opt[0];
      b.setAttribute("aria-pressed", String(i === pick[g]));
      b.addEventListener("click", () => { pick[g] = i; syncChips(g); renderPrompt([g]); });
      box.appendChild(b);
    });
  });
  const syncChips = (g) => chipBoxes[g].querySelectorAll(".chip").forEach((c, j) => c.setAttribute("aria-pressed", String(j === pick[g])));
  const subj = $("#subject"), sty = $("#stylize");
  const esc = (c) => String(c).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  function renderPrompt(hot = []) {
    $("#stylizeOut").textContent = sty.value;
    const h = (g, t) => `<span class="${hot.includes(g) ? "hot" : ""}">${esc(t)}</span>`;
    const s = G.size[pick.size], m = G.move[pick.move], l = G.light[pick.light], f = G.film[pick.film], a = G.ar[pick.ar];
    const sub = subj.value.trim();
    $("#mjOut").innerHTML = `${h("size", s[1])}, ${h("subj", sub || "subject")}, ${h("light", l[1])}, ${h("film", f[1])} --ar ${h("ar", a[1])} --raw --stylize ${h("sty", sty.value)}`;
    $("#sdOut").innerHTML = `${h("size", s[2])}，${h("subj", sub || "主体")}。${h("move", m[2])}，${h("light", l[2])}，${h("film", f[2])}。画面安静克制，动作幅度小。声音：只保留环境音效，无背景音乐，无字幕。`;
    if (hot.length && !hot.includes("subj")) { if (!hot.every((g) => g === "move")) retrigger($("#mjCard"), "bump"); if (!hot.every((g) => g === "ar" || g === "sty")) retrigger($("#sdCard"), "bump"); }
  }
  subj.addEventListener("input", () => renderPrompt()); sty.addEventListener("input", () => renderPrompt(["sty"]));
  renderPrompt();
  $$("[data-copy]").forEach((b) => b.addEventListener("click", () => copyText($("#" + b.dataset.copy).textContent, b)));
  $("#dice").addEventListener("click", (e) => {
    const d = e.currentTarget; retrigger(d, "roll");
    const changed = [];
    Object.keys(pick).forEach((g) => { let n; do { n = Math.floor(Math.random() * G[g].length); } while (n === pick[g] && G[g].length > 1 && Math.random() < 0.8); if (n !== pick[g]) changed.push(g); pick[g] = n; syncChips(g); });
    Object.keys(pick).forEach((g, gi) => chipBoxes[g].querySelectorAll('.chip[aria-pressed="true"]').forEach((c) => springIn(c, { delay: gi * 60, y: 0, s: 0.6, d: 700 })));
    renderPrompt(changed);
  });

  /* ---------- 02 palette ---------- */
  const pImg = $("#pImg"), pSw = $("#pSw"); let pal = [], palImg = null, palName = "";
  function kmeans(px, k = 5) {
    let c = []; for (let i = 0; i < k; i++) c.push(px[Math.floor((i + 0.5) * px.length / k)].slice());
    const lab = new Array(px.length).fill(0);
    for (let it = 0; it < 10; it++) {
      for (let i = 0; i < px.length; i++) { let best = 0, bd = 1e9; for (let j = 0; j < k; j++) { const d = (px[i][0] - c[j][0]) ** 2 + (px[i][1] - c[j][1]) ** 2 + (px[i][2] - c[j][2]) ** 2; if (d < bd) { bd = d; best = j; } } lab[i] = best; }
      const s = c.map(() => [0, 0, 0, 0]); px.forEach((p, i) => { const t = s[lab[i]]; t[0] += p[0]; t[1] += p[1]; t[2] += p[2]; t[3]++; });
      c = s.map((t, j) => (t[3] ? [t[0] / t[3], t[1] / t[3], t[2] / t[3]] : c[j]));
    }
    const n = c.map(() => 0); lab.forEach((l) => n[l]++);
    const L = (x) => 0.3 * x[0] + 0.59 * x[1] + 0.11 * x[2];
    return c.map((col, j) => ({ col, w: n[j] / px.length })).filter((x) => x.w > 0.01).sort((a, b) => L(a.col) - L(b.col));
  }
  const hex = (c) => "#" + c.map((v) => Math.round(v).toString(16).padStart(2, "0")).join("").toUpperCase();
  function analyse(src, name) {
    const im = new Image();
    pImg.classList.add("swap");
    im.onload = () => {
      palImg = im; palName = name;
      pImg.src = src; pImg.classList.remove("swap"); $("#pName").textContent = name;
      const cv = document.createElement("canvas"), W = 80, H = Math.max(1, Math.round(80 * im.naturalHeight / im.naturalWidth));
      cv.width = W; cv.height = H; const x = cv.getContext("2d", { willReadFrequently: true }); x.drawImage(im, 0, 0, W, H);
      const d = x.getImageData(0, 0, W, H).data, px = [];
      for (let i = 0; i < d.length; i += 4) px.push([d[i], d[i + 1], d[i + 2]]);
      pal = kmeans(px);
      pSw.innerHTML = "";
      pal.forEach(({ col, w }, i) => {
        const b = document.createElement("button"); const h = hex(col);
        const light = 0.3 * col[0] + 0.59 * col[1] + 0.11 * col[2] > 140;
        b.type = "button"; b.style.background = h; b.style.setProperty("--w", Math.max(0.6, w * 10).toFixed(2)); b.style.color = light ? "#0b0a0e" : "#fff";
        b.innerHTML = `${h}<br>${Math.round(w * 100)}%`; b.setAttribute("aria-label", `复制色值 ${h}`);
        b.addEventListener("click", () => { retrigger(b, "jelly"); copyText(h); });
        pSw.appendChild(b);
        if (!reduce && b.animate) { try { b.animate([{ transform: "scaleY(0)" }, { transform: "none" }], { duration: 820, delay: i * 70, easing: BO, fill: "backwards" }); } catch (_) { /* easing unsupported */ } }
      });
    };
    im.src = src;
  }
  thumbs($("#pThumbs"), analyse); analyse(samples[0][0], samples[0][1]);
  dropzone("palette", $("#pThumbs"), (f) => analyse(URL.createObjectURL(f), f.name.replace(/\.[^.]+$/, "")));
  $("#pSave").addEventListener("click", () => {
    if (!palImg || !pal.length) return;
    const W = 1600, IH = 900, SH = 240, FH = 70, c = document.createElement("canvas"); c.width = W; c.height = IH + SH + FH;
    const x = c.getContext("2d"); x.fillStyle = "#0b0a0e"; x.fillRect(0, 0, W, c.height);
    const r = Math.max(W / palImg.naturalWidth, IH / palImg.naturalHeight), iw = palImg.naturalWidth * r, ih = palImg.naturalHeight * r;
    x.drawImage(palImg, (W - iw) / 2, (IH - ih) / 2, iw, ih);
    const tot = pal.reduce((s, p) => s + Math.max(0.6, p.w * 10), 0); let px = 0;
    pal.forEach(({ col, w }) => {
      const ww = W * Math.max(0.6, w * 10) / tot; x.fillStyle = hex(col); x.fillRect(px, IH, ww + 1, SH);
      x.fillStyle = 0.3 * col[0] + 0.59 * col[1] + 0.11 * col[2] > 140 ? "#0b0a0e" : "#ffffff"; x.font = "500 26px Menlo, monospace";
      x.fillText(hex(col), px + 20, IH + SH - 52); x.fillText(Math.round(w * 100) + "%", px + 20, IH + SH - 18); px += ww;
    });
    x.fillStyle = "rgba(243,241,247,.6)"; x.font = "500 22px Menlo, monospace"; x.fillText(palName, 24, IH + SH + 44);
    x.textAlign = "right"; x.fillText("PALETTE · 5", W - 24, IH + SH + 44);
    c.toBlob((b) => { if (b) { save(b, `palette-${palName.replace(/[《》\s]/g, "") || "card"}.png`); toast("色板卡已下载"); } }, "image/png");
  });

  /* ---------- 03 frames ---------- */
  const P = [["视频号", "9:16", 9 / 16], ["抖音", "9:16", 9 / 16], ["小红书", "3:4", 3 / 4], ["B 站", "16:9", 16 / 9], ["公众号封面", "2.35:1", 2.35], ["宽银幕", "2.39:1", 2.39]];
  const stage = $("#fStage"), fSrc = $("#fSrc"), fBench = $("#fBench"); let focus = [50, 45];
  P.forEach(([n, r, v]) => {
    const f = document.createElement("figure"); f.className = "frame";
    f.innerHTML = `<div class="box" style="aspect-ratio:${v}"><img alt="" draggable="false"><div class="safe"></div>${v < 1 ? '<div class="ui"><i></i><i></i><i></i></div>' : ""}</div><figcaption>${n}<br>${r}</figcaption>`;
    stage.appendChild(f);
  });
  function setFrames(src) {
    $("#fImg").src = src; stage.querySelectorAll("img").forEach((i) => (i.src = src)); applyFocus();
    $$(".frame", stage).forEach((f, i) => springIn(f, { delay: i * 45, y: 16, s: 0.92, d: 760 }));
  }
  function applyFocus() { $("#fDot").style.left = focus[0] + "%"; $("#fDot").style.top = focus[1] + "%"; stage.querySelectorAll("img").forEach((i) => (i.style.objectPosition = `${focus[0]}% ${focus[1]}%`)); }
  const setFromEvent = (e) => { const r = fSrc.getBoundingClientRect(); focus = [Math.min(100, Math.max(0, (e.clientX - r.left) / r.width * 100)), Math.min(100, Math.max(0, (e.clientY - r.top) / r.height * 100))]; applyFocus(); };
  let dragging = false, moved = false;
  fSrc.addEventListener("pointerdown", (e) => { dragging = true; moved = false; fSrc.setPointerCapture(e.pointerId); setFromEvent(e); });
  fSrc.addEventListener("pointermove", (e) => { if (!dragging) return; if (!moved) { moved = true; fSrc.classList.add("drag"); fBench.classList.add("focus-drag"); } setFromEvent(e); });
  const endDrag = () => { dragging = false; fSrc.classList.remove("drag"); fBench.classList.remove("focus-drag"); };
  fSrc.addEventListener("pointerup", endDrag); fSrc.addEventListener("pointercancel", endDrag);
  const safe = $("#fSafe"); const setSafe = () => fBench.classList.toggle("show-safe", safe.checked); safe.addEventListener("change", setSafe); setSafe();
  thumbs($("#fThumbs"), (src) => { focus = [50, 45]; setFrames(src); }, 4); setFrames(samples[4][0]);
  dropzone("frames", $("#fThumbs"), (f) => { focus = [50, 45]; setFrames(URL.createObjectURL(f)); });

  /* ---------- 04 typeset ---------- */
  const TS = [["space", "中英文之间加空格"], ["punct", "中文里用全角标点"], ["dup", "合并重复标点"], ["blank", "压缩多余空行"], ["arrow", "-> 换成 →"]];
  const tsOn = new Set(TS.map((x) => x[0]));
  TS.forEach(([k, label]) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = label; b.setAttribute("aria-pressed", "true");
    b.addEventListener("click", () => { tsOn.has(k) ? tsOn.delete(k) : tsOn.add(k); b.setAttribute("aria-pressed", String(tsOn.has(k))); typeset(); });
    $("#tsOpts").appendChild(b);
  });
  const CJK = "一-龥㐀-䶿";
  function clean(t) {
    let s = t;
    if (tsOn.has("dup")) s = s.replace(/([！？。，!?,])\1+/g, "$1");
    if (tsOn.has("arrow")) s = s.replace(/[ \t]*->[ \t]*/g, " → ");
    if (tsOn.has("punct")) {
      const m = { ",": "，", ":": "：", ";": "；", "!": "！", "?": "？" };
      s = s.replace(new RegExp("([" + CJK + "])[ \\t]*([,:;!?])", "g"), (_, a, p) => a + m[p]);
      s = s.replace(new RegExp("([,:;!?])[ \\t]*([" + CJK + "])", "g"), (_, p, b) => m[p] + b);
      s = s.replace(new RegExp("([" + CJK + "])[ \\t]*\\.(\\s|$)", "g"), "$1。$2");
      s = s.replace(/([！？，。])[!?,.]+/g, "$1");
      s = s.replace(/[ \t]*([，。：；！？、])[ \t]*/g, "$1");
    }
    if (tsOn.has("space")) {
      s = s.replace(new RegExp("([" + CJK + "])([A-Za-z0-9@#$%&+\\-\\[(→])", "g"), "$1 $2");
      s = s.replace(new RegExp("([A-Za-z0-9%)\\]!?→])([" + CJK + "])", "g"), "$1 $2");
    }
    if (tsOn.has("blank")) s = s.replace(/[ \t]+\n/g, "\n").replace(/\n{3,}/g, "\n\n");
    return s.trim();
  }
  function diffHTML(a, b) {
    const n = a.length, m = b.length; if (n * m > 600000) return esc(b);
    const dp = Array.from({ length: n + 1 }, () => new Uint16Array(m + 1));
    for (let i = n - 1; i >= 0; i--) for (let j = m - 1; j >= 0; j--) dp[i][j] = a[i] === b[j] ? dp[i + 1][j + 1] + 1 : Math.max(dp[i + 1][j], dp[i][j + 1]);
    let i = 0, j = 0, out = "", k = 0;
    while (j < m) {
      if (i < n && a[i] === b[j]) { out += esc(b[j]); i++; j++; }
      else if (i < n && dp[i + 1][j] >= dp[i][j + 1]) i++;
      else { out += `<mark style="--i:${Math.min(k++, 30)}">${b[j] === " " ? "&nbsp;" : esc(b[j])}</mark>`; j++; }
    }
    return out;
  }
  let tsTimer = 0;
  function typeset() {
    const src = $("#tsIn").value, out = clean(src);
    $("#tsOut").innerHTML = diffHTML(src, out);
    const zh = (out.match(new RegExp("[" + CJK + "]", "g")) || []).length, en = (out.match(/[A-Za-z]+/g) || []).length;
    $("#tsStat").textContent = `${zh} 字 · ${en} 词 · 约 ${Math.max(1, Math.round((zh / 400 + en / 220) * 60))} 秒读完`;
  }
  $("#tsIn").addEventListener("input", () => { clearTimeout(tsTimer); tsTimer = setTimeout(typeset, 180); }); typeset();
  $("#tsCopy").addEventListener("click", (e) => copyText(clean($("#tsIn").value), e.currentTarget));

  /* ---------- 05 timezone ---------- */
  const NY = "America/New_York", SH = "Asia/Shanghai";
  $("#tzDate").value = new Intl.DateTimeFormat("en-CA", { timeZone: NY }).format(new Date());
  function nyToUTC(dateStr, mins) {
    const [y, mo, d] = dateStr.split("-").map(Number);
    const want = Date.UTC(y, mo - 1, d, Math.floor(mins / 60), mins % 60); let guess = want;
    for (let k = 0; k < 3; k++) {
      const p = Object.fromEntries(new Intl.DateTimeFormat("en-US", { timeZone: NY, hourCycle: "h23", year: "numeric", month: "2-digit", day: "2-digit", hour: "2-digit", minute: "2-digit" }).formatToParts(new Date(guess)).map((x) => [x.type, x.value]));
      guess += want - Date.UTC(+p.year, +p.month - 1, +p.day, +p.hour, +p.minute);
    }
    return new Date(guess);
  }
  const fmt = (dt, tz, o) => new Intl.DateTimeFormat("zh-CN", { timeZone: tz, ...o }).format(dt);
  const hm = (dt, tz) => fmt(dt, tz, { hour: "2-digit", minute: "2-digit", hourCycle: "h23" });
  const wake = (h) => h >= 8 && h < 23;
  const tracks = [];
  let lastMins = null;
  function buildBars(off) {
    const bars = $("#tzBars"); bars.innerHTML = ""; tracks.length = 0;
    [["纽约", 0], ["上海", off]].forEach(([name, o]) => {
      const row = document.createElement("div"); row.className = "tz-row"; row.innerHTML = `<span>${name}</span>`;
      const track = document.createElement("div"); track.className = "tz-track";
      for (let h = 0; h < 24; h++) { const lh = ((h + o) % 24 + 24) % 24; const c = document.createElement("i"); const both = wake(h) && wake(((h + off) % 24 + 24) % 24); c.className = both ? "both" : wake(lh) ? "awake" : ""; c.title = `${String(lh).padStart(2, "0")}:00`; if (h % 6 === 0) c.dataset.l = String(lh).padStart(2, "0"); track.appendChild(c); }
      const sel = document.createElement("b"); track.appendChild(sel); tracks.push(sel);
      row.appendChild(track); bars.appendChild(row);
    });
    bars.dataset.off = off;
  }
  function setClock(el, text, dir) { if (el.textContent === text) return; el.textContent = text; el.style.setProperty("--dir", dir > 0 ? "40%" : "-40%"); retrigger(el, "roll"); }
  function tz() {
    const mins = +$("#tzTime").value, dur = +$("#tzDur").value;
    if (!$("#tzDate").value) return;
    const st = nyToUTC($("#tzDate").value, mins), en = new Date(st.getTime() + dur * 60000);
    const dir = lastMins === null || mins >= lastMins ? 1 : -1; lastMins = mins;
    $("#tzTimeOut").textContent = hm(st, NY); $("#tzDurOut").textContent = dur;
    setClock($("#tzNY"), `${hm(st, NY)}–${hm(en, NY)}`, dir); setClock($("#tzSH"), `${hm(st, SH)}–${hm(en, SH)}`, dir);
    $("#tzNYd").textContent = fmt(st, NY, { month: "long", day: "numeric", weekday: "short" }); $("#tzSHd").textContent = fmt(st, SH, { month: "long", day: "numeric", weekday: "short" });
    const off = (new Date(st.toLocaleString("en-US", { timeZone: SH })) - new Date(st.toLocaleString("en-US", { timeZone: NY }))) / 3600000;
    if ($("#tzBars").dataset.off !== String(off)) buildBars(off);
    tracks.forEach((sel) => { sel.style.left = (mins / 1440 * 100) + "%"; sel.style.width = (Math.min(dur, 1440 - mins) / 1440 * 100) + "%"; });
    $("#tzMsg").textContent = `时间定在 北京时间 ${fmt(st, SH, { month: "long", day: "numeric", weekday: "short" })} ${hm(st, SH)}–${hm(en, SH)}（纽约 ${fmt(st, NY, { month: "long", day: "numeric" })} ${hm(st, NY)}），可以吗？\nHow about ${new Intl.DateTimeFormat("en-US", { timeZone: NY, weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" }).format(st)} New York time (${new Intl.DateTimeFormat("en-US", { timeZone: SH, weekday: "short", hour: "numeric", minute: "2-digit" }).format(st)} in Shanghai)?`;
  }
  ["#tzDate", "#tzTime", "#tzDur"].forEach((s) => $(s).addEventListener("input", tz)); tz();
  $("#tzCopy").addEventListener("click", (e) => copyText($("#tzMsg").textContent, e.currentTarget));

  /* ---------- 06 image slimmer ---------- */
  let imSrc = null, imBytes = 0, imName = "", fmtSel = "image/webp", slimTimer = 0, outUrl = "";
  [["WebP", "image/webp"], ["JPEG", "image/jpeg"]].forEach(([l, v], i) => {
    const b = document.createElement("button"); b.type = "button"; b.className = "chip"; b.textContent = l; b.setAttribute("aria-pressed", String(i === 0));
    b.addEventListener("click", () => { fmtSel = v; $("#imFmt").querySelectorAll(".chip").forEach((c) => c.setAttribute("aria-pressed", String(c === b))); slim(); });
    $("#imFmt").appendChild(b);
  });
  const kb = (n) => (n > 1048576 ? (n / 1048576).toFixed(2) + " MB" : Math.round(n / 1024) + " KB");
  const nums = {}; $$("#imSum [data-n]").forEach((b) => (nums[b.dataset.n] = { el: b, v: 0 }));
  function tween(key, to, f) {
    const o = nums[key]; const from = o.v; o.v = to; cancelAnimationFrame(o.raf);
    if (reduce || !isFinite(from)) { o.el.textContent = f(to); return; }
    const t0 = performance.now(), D = 700;
    const step = (t) => { const p = Math.min(1, (t - t0) / D); const e = 1 - Math.pow(1 - p, 4); o.el.textContent = f(from + (to - from) * e); if (p < 1) o.raf = requestAnimationFrame(step); };
    o.raf = requestAnimationFrame(step);
  }
  async function loadIm(src, name, bytes) {
    imName = name; imSrc = src;
    imBytes = bytes || (await fetch(src).then((r) => r.blob()).then((b) => b.size).catch(() => 0));
    $("#imA").src = src; slim();
  }
  function slim() {
    $("#imMaxOut").textContent = $("#imMax").value; $("#imQOut").textContent = $("#imQ").value;
    clearTimeout(slimTimer); slimTimer = setTimeout(run, 60);
  }
  function run() {
    if (!imSrc) return; const im = new Image();
    im.onload = () => {
      const max = +$("#imMax").value, s = Math.min(1, max / Math.max(im.naturalWidth, im.naturalHeight));
      const c = document.createElement("canvas"); c.width = Math.round(im.naturalWidth * s); c.height = Math.round(im.naturalHeight * s);
      c.getContext("2d").drawImage(im, 0, 0, c.width, c.height);
      c.toBlob((b) => {
        if (!b) return; const u = URL.createObjectURL(b); $("#imB").src = u; if (outUrl) URL.revokeObjectURL(outUrl); outUrl = u;
        const ext = b.type === "image/webp" ? "webp" : "jpg";
        const a = $("#imSave"); a.href = u; a.download = `${imName.replace(/\.[^.]+$/, "").replace(/[《》\s]/g, "") || "image"}-${c.width}.${ext}`;
        const pct = imBytes ? Math.round((1 - b.size / imBytes) * 100) : 0;
        tween("orig", imBytes, (v) => (imBytes ? kb(v) : "—")); tween("out", b.size, kb); tween("pct", pct, (v) => Math.round(v) + "%");
        $("#imS0").textContent = `原图 · ${im.naturalWidth}×${im.naturalHeight}`; $("#imS1").textContent = `压缩后 · ${c.width}×${c.height} · ${ext.toUpperCase()}`;
        nums.pct.el.parentElement.classList.toggle("bad", pct < 0);
      }, fmtSel, +$("#imQ").value / 100);
    };
    im.src = imSrc;
  }
  ["#imMax", "#imQ"].forEach((s) => $(s).addEventListener("input", slim));
  const cmp = $("#imCmp"), split = $("#imSplit");
  split.addEventListener("pointerdown", () => { cmp.classList.add("ease", "drag"); });
  split.addEventListener("pointermove", (e) => { if (e.buttons) cmp.classList.remove("ease"); });
  ["pointerup", "pointercancel", "blur"].forEach((ev) => split.addEventListener(ev, () => cmp.classList.remove("drag")));
  split.addEventListener("input", () => cmp.style.setProperty("--x", split.value + "%"));
  split.addEventListener("keydown", () => cmp.classList.add("ease"));
  $("#imSave").addEventListener("click", (e) => { if (!outUrl) { e.preventDefault(); return; } toast("已下载压缩图"); });
  thumbs($("#imThumbs"), (src, name) => loadIm(src, name), 5); loadIm(samples[5][0], samples[5][1]);
  dropzone("slim", $("#imThumbs"), (f) => loadIm(URL.createObjectURL(f), f.name, f.size));
})();
