(() => {
  "use strict";

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const finePointer = window.matchMedia("(pointer: fine)").matches;

  const capabilityCopy = [
    "把选题、脚本、分镜与资产规范组织成可复用的生产路径。",
    "让创意、设计、运营与研发在同一套流程里协作。",
    "从一次性提示词，沉淀为可迁移、可维护的方法系统。",
    "把角色设定、视觉语言与应用场景组成完整 IP 体验。",
  ];

  const experiences = [
    {
      company: "赫里文化科技（四川）有限公司 · 国际品牌部",
      title: "让 AIGC 进入国际项目传播",
      points: [
        "参与 EAST2046、米兰设计周等国际项目",
        "运营社群矩阵，支持品牌内容传播",
      ],
      point: [110, 168],
    },
    {
      company: "沈阳盛京故里文旅发展有限公司 · 庭澜美术馆",
      title: "将生成式内容引入视觉运营",
      points: [
        "100+ 位艺术家作品风格分类与初筛评审",
        "持续支持美术馆 AIGC 视觉内容运营",
      ],
      point: [370, 181],
    },
    {
      company: "鲸海拾贝科技（厦门）有限公司 · AI 商业创新部",
      title: "把 AI 设计方法转成可教学流程",
      points: [
        "为 600+ 学员提供 AI 设计答疑与创作指导",
        "统筹 AI 漫剧全链路生产并沉淀 SOP",
      ],
      point: [710, 170],
    },
    {
      company: "北京字跳网络技术有限公司 · Gauth 产品设计部",
      title: "从 0 到 1 搭建 AI 内容生产体系",
      points: [
        "40+ 完整设计产出，单条视频返工率降低 50%",
        "直接负责豆包爱学与 Gauth 海外课程设计",
        "推动生产能力产品化与团队协作规范沉淀",
      ],
      point: [1030, 150],
    },
  ];

  const methodStages = [
    {
      kicker: "DEFINE",
      title: "需求分层",
      detail: "先确定目标、受众与最终交付物，让后续生成围绕同一个问题工作。",
      evidence: "目标 / 受众 / 内容层级 / 交付标准",
      point: [30, 236],
    },
    {
      kicker: "ANCHOR",
      title: "信息锚定",
      detail: "把人物、品牌、情节与视觉限制写成不可漂移的信息锚点，避免生成只剩表面风格。",
      evidence: "核心信息 / 角色设定 / 叙事关系 / 视觉边界",
      point: [230, 74],
    },
    {
      kicker: "ADAPT",
      title: "工具适配",
      detail: "按任务选择模型与流程：脚本、图像、视频和排版各自使用最合适的工具组合。",
      evidence: "工具判断 / 流程拆解 / 提示词结构 / 资产规范",
      point: [424, 182],
    },
    {
      kicker: "VERIFY",
      title: "生成验证",
      detail: "在每个节点检查一致性、可读性和用户体验，用小步验证减少后期返工。",
      evidence: "一致性 / 可读性 / 用户体验 / 迭代记录",
      point: [620, 265],
    },
    {
      kicker: "SYSTEMIZE",
      title: "落地沉淀",
      detail: "把有效做法沉淀成提示词库、模板、数据规范与审核工具，使一次创作成为可复用能力。",
      evidence: "提示词库 / 模板 / 数据契约 / 审核标准",
      point: [870, 78],
    },
  ];

  const q = (selector, scope = document) => scope.querySelector(selector);
  const qa = (selector, scope = document) => [...scope.querySelectorAll(selector)];
  const liveRegion = q("[data-live-region]");

  const announce = (message) => {
    if (!liveRegion) return;
    liveRegion.textContent = "";
    window.setTimeout(() => {
      liveRegion.textContent = message;
    }, 20);
  };

  function setupCursor() {
    if (!finePointer) return;
    const core = q(".cursor-core");
    const ring = q(".cursor-ring");
    if (!core || !ring) return;

    let pointerX = window.innerWidth / 2;
    let pointerY = window.innerHeight / 2;
    let ringX = pointerX;
    let ringY = pointerY;

    window.addEventListener("pointermove", (event) => {
      pointerX = event.clientX;
      pointerY = event.clientY;
      core.style.transform = `translate(${pointerX}px, ${pointerY}px) translate(-50%, -50%)`;
    }, { passive: true });

    const interactive = qa("a, button, .timeline-node, .method-stage, .profile-facts article");
    interactive.forEach((element) => {
      element.addEventListener("pointerenter", () => document.body.classList.add("is-hovering"));
      element.addEventListener("pointerleave", () => document.body.classList.remove("is-hovering"));
    });

    const follow = () => {
      ringX += (pointerX - ringX) * .14;
      ringY += (pointerY - ringY) * .14;
      ring.style.transform = `translate(${ringX}px, ${ringY}px) translate(-50%, -50%)`;
      window.requestAnimationFrame(follow);
    };
    follow();
  }

  function setupParticleField() {
    const canvas = q("[data-particle-field]");
    if (!canvas) return;
    const context = canvas.getContext("2d", { alpha: true });
    if (!context) return;

    const state = {
      width: 0,
      height: 0,
      dpr: 1,
      pointerX: -1000,
      pointerY: -1000,
      targetX: -1000,
      targetY: -1000,
      particles: [],
    };

    const palette = [
      [243, 241, 247],
      [100, 21, 154],
      [139, 44, 194],
      [199, 168, 220],
      [154, 140, 168],
    ];

    const resize = () => {
      state.dpr = Math.min(window.devicePixelRatio || 1, 1.5);
      state.width = window.innerWidth;
      state.height = window.innerHeight;
      canvas.width = Math.round(state.width * state.dpr);
      canvas.height = Math.round(state.height * state.dpr);
      canvas.style.width = `${state.width}px`;
      canvas.style.height = `${state.height}px`;
      context.setTransform(state.dpr, 0, 0, state.dpr, 0, 0);

      const count = reducedMotion ? 42 : Math.min(120, Math.round((state.width * state.height) / 13000));
      state.particles = Array.from({ length: count }, (_, index) => ({
        x: Math.random() * state.width,
        y: Math.random() * state.height,
        vx: (Math.random() - .5) * .17,
        vy: (Math.random() - .5) * .12,
        size: .45 + Math.random() * 1.2,
        alpha: .08 + Math.random() * .26,
        tint: index % 9 === 0 ? 1 + (index % 4) : 0,
        phase: Math.random() * Math.PI * 2,
      }));
    };

    window.addEventListener("resize", resize, { passive: true });
    window.addEventListener("pointermove", (event) => {
      state.targetX = event.clientX;
      state.targetY = event.clientY;
    }, { passive: true });
    window.addEventListener("pointerleave", () => {
      state.targetX = -1000;
      state.targetY = -1000;
    });

    const render = (time = 0) => {
      context.clearRect(0, 0, state.width, state.height);
      state.pointerX += (state.targetX - state.pointerX) * .09;
      state.pointerY += (state.targetY - state.pointerY) * .09;

      for (const particle of state.particles) {
        if (!reducedMotion) {
          particle.x += particle.vx;
          particle.y += particle.vy;
        }

        if (particle.x < -12) particle.x = state.width + 12;
        if (particle.x > state.width + 12) particle.x = -12;
        if (particle.y < -12) particle.y = state.height + 12;
        if (particle.y > state.height + 12) particle.y = -12;

        const dx = particle.x - state.pointerX;
        const dy = particle.y - state.pointerY;
        const distance = Math.hypot(dx, dy);
        const influence = Math.max(0, 1 - distance / 170);
        const hueIndex = influence > .02 ? Math.min(4, 1 + Math.floor((Math.atan2(dy, dx) + Math.PI) / (Math.PI * 2) * 4)) : particle.tint;
        const [red, green, blue] = palette[hueIndex] || palette[0];
        const shimmer = .75 + Math.sin(time * .0006 + particle.phase) * .25;

        context.beginPath();
        context.fillStyle = `rgba(${red}, ${green}, ${blue}, ${Math.min(.8, particle.alpha * shimmer + influence * .55)})`;
        context.arc(particle.x, particle.y, particle.size + influence * 1.9, 0, Math.PI * 2);
        context.fill();

        if (influence > .34) {
          context.beginPath();
          context.strokeStyle = `rgba(${red}, ${green}, ${blue}, ${influence * .17})`;
          context.lineWidth = .5;
          context.moveTo(particle.x, particle.y);
          context.lineTo(state.pointerX, state.pointerY);
          context.stroke();
        }
      }

      window.requestAnimationFrame(render);
    };

    resize();
    render();
  }

  function setupCapabilities() {
    const nodes = qa("[data-capability]");
    const detail = q("[data-capability-detail]");
    if (!nodes.length || !detail) return;

    nodes.forEach((node) => {
      const activate = () => {
        const index = Number(node.dataset.capability);
        nodes.forEach((item) => item.classList.toggle("is-active", item === node));
        detail.animate([
          { opacity: 0, transform: "translateY(6px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 380, easing: "cubic-bezier(.2,.75,.2,1)" });
        detail.textContent = capabilityCopy[index];
      };
      node.addEventListener("pointerenter", activate);
      node.addEventListener("focus", activate);
      node.addEventListener("click", activate);
    });
  }

  function setupAvatar() {
    const avatar = q("[data-avatar-control]");
    if (!avatar) return;
    avatar.addEventListener("click", () => {
      const makerMode = avatar.classList.toggle("is-maker");
      avatar.setAttribute("aria-pressed", String(makerMode));
      announce(makerMode ? "阿瑶进入黑龙角创作状态。" : "阿瑶回到观察状态。");
    });
  }

  function setupExperience() {
    const nodes = qa("[data-experience]");
    if (!nodes.length) return;

    const indexLabel = q("[data-experience-index]");
    const company = q("[data-experience-company]");
    const title = q("[data-experience-title]");
    const points = q("[data-experience-points]");
    const pulse = q("[data-timeline-pulse]");

    const activate = (node) => {
      const index = Number(node.dataset.experience);
      const item = experiences[index];
      if (!item) return;

      nodes.forEach((entry) => entry.classList.toggle("is-active", entry === node));
      indexLabel.textContent = `${String(index + 1).padStart(2, "0")} / 04`;
      company.textContent = item.company;
      title.textContent = item.title;
      points.replaceChildren(...item.points.map((copy) => {
        const li = document.createElement("li");
        li.textContent = copy;
        return li;
      }));

      if (pulse) {
        pulse.setAttribute("cx", item.point[0]);
        pulse.setAttribute("cy", item.point[1]);
      }

      const readout = q(".experience-readout");
      if (readout) {
        readout.animate([
          { opacity: .42, transform: "translateY(7px)" },
          { opacity: 1, transform: "translateY(0)" },
        ], { duration: 420, easing: "cubic-bezier(.2,.75,.2,1)" });
      }
    };

    nodes.forEach((node) => {
      node.addEventListener("pointerenter", () => activate(node));
      node.addEventListener("focus", () => activate(node));
      node.addEventListener("click", () => activate(node));
    });

    let scrollIndex = 3;
    activate(nodes[3]);

    const syncExperienceToScroll = () => {
      const section = q(".experience");
      if (!section) return;
      const bounds = section.getBoundingClientRect();
      const travel = Math.max(window.innerHeight, bounds.height - window.innerHeight * .5);
      const progress = Math.max(0, Math.min(.999, (window.innerHeight * .58 - bounds.top) / travel));
      const nextIndex = Math.min(nodes.length - 1, Math.floor(progress * nodes.length));
      if (bounds.top < window.innerHeight * .7 && bounds.bottom > window.innerHeight * .25 && nextIndex !== scrollIndex) {
        scrollIndex = nextIndex;
        activate(nodes[nextIndex]);
      }
    };

    window.addEventListener("scroll", syncExperienceToScroll, { passive: true });
    window.addEventListener("zk:continuous-scroll", syncExperienceToScroll);
  }

  function setupCountups() {
    const values = qa("[data-countup]");
    if (!values.length) return;

    const run = (element) => {
      if (element.dataset.counted === "true") return;
      element.dataset.counted = "true";
      const target = Math.max(0, Number(element.dataset.countup) || 0);
      const duration = reducedMotion ? 1 : 1100;
      const start = performance.now();

      const tick = (now) => {
        const progress = Math.max(0, Math.min(1, (now - start) / duration));
        const eased = 1 - Math.pow(1 - progress, 3);
        element.textContent = Math.round(target * eased).toLocaleString("zh-CN");
        if (progress < 1) window.requestAnimationFrame(tick);
        else element.textContent = target.toLocaleString("zh-CN");
      };
      window.requestAnimationFrame(tick);
    };

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (!entry.isIntersecting) return;
        values.forEach(run);
        observer.disconnect();
      });
    }, { threshold: .32 });

    const rail = q(".evidence-rail");
    if (!rail) return;

    observer.observe(rail);

    // The portfolio shell drives an embedded document with a virtual scroll
    // position, so IntersectionObserver alone is not guaranteed to fire.
    // Keep the native-page path and mirror the same threshold for the shell.
    const maybeRun = () => {
      const railTop = rail.getBoundingClientRect().top + window.scrollY;
      if (window.scrollY + window.innerHeight * .88 < railTop) return;
      values.forEach(run);
      observer.disconnect();
    };

    window.addEventListener("scroll", maybeRun, { passive: true });
    window.addEventListener("zk:continuous-scroll", maybeRun);
    maybeRun();
  }

  function setupChapterReadout() {
    const chapters = qa(".chapter[data-chapter]");
    const name = q("[data-chapter-name]");
    const count = q("[data-chapter-count]");
    if (!chapters.length || !name || !count) return;

    const observer = new IntersectionObserver((entries) => {
      const visible = entries
        .filter((entry) => entry.isIntersecting)
        .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
      if (!visible) return;
      name.textContent = visible.target.dataset.chapter;
      count.textContent = visible.target.dataset.count;
    }, { threshold: [.18, .38, .62], rootMargin: "-20% 0px -30%" });

    chapters.forEach((chapter) => observer.observe(chapter));
  }

  function setupMethod() {
    const buttons = qa("[data-method-step]");
    const stage = q("[data-method-stage]");
    if (!buttons.length || !stage) return;

    const indexLabel = q("[data-method-index]", stage);
    const kicker = q("[data-method-kicker]", stage);
    const title = q("[data-method-title]", stage);
    const detail = q("[data-method-detail]", stage);
    const evidence = q("[data-method-evidence]", stage);
    const pulse = q("[data-method-pulse]", stage);

    const activate = (button) => {
      const index = Number(button.dataset.methodStep);
      const item = methodStages[index];
      if (!item) return;

      buttons.forEach((entry) => {
        const active = entry === button;
        entry.classList.toggle("is-active", active);
        entry.setAttribute("aria-pressed", String(active));
      });

      indexLabel.textContent = `${String(index + 1).padStart(2, "0")} / 05`;
      kicker.textContent = item.kicker;
      title.textContent = item.title;
      detail.textContent = item.detail;
      evidence.textContent = item.evidence;

      if (pulse) {
        pulse.setAttribute("cx", item.point[0]);
        pulse.setAttribute("cy", item.point[1]);
      }

      if (!reducedMotion) {
        [kicker, title, detail, evidence].forEach((element, order) => {
          element.animate([
            { opacity: 0, transform: "translateY(10px)" },
            { opacity: 1, transform: "translateY(0)" },
          ], {
            duration: 380 + order * 55,
            easing: "cubic-bezier(.2,.75,.2,1)",
          });
        });
      }

      announce(`AI 创作链第 ${index + 1} 步：${item.title}`);
    };

    buttons.forEach((button) => {
      button.setAttribute("aria-pressed", "false");
      button.addEventListener("pointerenter", () => activate(button));
      button.addEventListener("focus", () => activate(button));
      button.addEventListener("click", () => activate(button));
    });

    let scrollIndex = 0;
    activate(buttons[0]);

    const syncMethodToScroll = () => {
      const section = q(".method");
      if (!section) return;
      const bounds = section.getBoundingClientRect();
      const travel = Math.max(window.innerHeight, bounds.height - window.innerHeight * .48);
      const progress = Math.max(0, Math.min(.999, (window.innerHeight * .6 - bounds.top) / travel));
      const nextIndex = Math.min(buttons.length - 1, Math.floor(progress * buttons.length));
      if (bounds.top < window.innerHeight * .72 && bounds.bottom > window.innerHeight * .24 && nextIndex !== scrollIndex) {
        scrollIndex = nextIndex;
        activate(buttons[nextIndex]);
      }
    };

    window.addEventListener("scroll", syncMethodToScroll, { passive: true });
    window.addEventListener("zk:continuous-scroll", syncMethodToScroll);
  }

  function setupChapterMotion() {
    const chapters = qa(".chapter");
    if (!chapters.length) return;

    document.documentElement.classList.add("motion-ready");
    chapters[0].classList.add("is-present");

    if (reducedMotion || !("IntersectionObserver" in window)) {
      chapters.forEach((chapter) => chapter.classList.add("is-present"));
      return;
    }

    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        if (entry.isIntersecting) entry.target.classList.add("is-present");
      });
    }, { threshold: .01, rootMargin: "45% 0px 60% 0px" });

    chapters.forEach((chapter) => observer.observe(chapter));
  }

  function setupBridgeMotion() {
    const bridges = qa(".chapter-bridge");
    const sourceRows = qa(".source-link");
    if (!bridges.length && !sourceRows.length) return;

    let frame = 0;
    const sync = () => {
      frame = 0;
      bridges.forEach((bridge) => {
        const bounds = bridge.getBoundingClientRect();
        const progress = Math.max(0, Math.min(1, (window.innerHeight - bounds.top) / (window.innerHeight + bounds.height)));
        bridge.style.setProperty("--bridge-progress", progress.toFixed(3));
        bridge.style.setProperty("--bridge-shift", `${((.5 - progress) * 28).toFixed(1)}px`);
        bridge.classList.toggle("is-bridge-visible", bounds.top < window.innerHeight * .92 && bounds.bottom > window.innerHeight * .08);

        const depths = bridge.classList.contains("bridge-archive") ? [70, -48, 38] : [62, -42, 32];
        qa(".bridge-media figure", bridge).forEach((figure, index) => {
          const depth = depths[index] || 36;
          figure.style.setProperty("--bridge-y", `${((.5 - progress) * depth).toFixed(1)}px`);
        });
      });

      sourceRows.forEach((row) => {
        const bounds = row.getBoundingClientRect();
        row.classList.toggle("is-in-view", bounds.top < window.innerHeight * .88 && bounds.bottom > 0);
      });
    };

    const requestSync = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(sync);
    };

    window.addEventListener("scroll", requestSync, { passive: true });
    window.addEventListener("zk:continuous-scroll", requestSync);
    window.addEventListener("resize", requestSync, { passive: true });
    sync();
  }

  function setupAigcLab() {
    const section = q(".aigc-exploration");
    if (!section) return;

    const posters = qa(".aigc-film img[data-stage-poster]", section);
    const warmPoster = (image) => {
      if (image.dataset.src) {
        image.src = image.dataset.src;
        image.removeAttribute("data-src");
      }
      image.loading = "eager";
      image.fetchPriority = "low";
      image.decode?.().catch(() => {});
    };

    posters.slice(0, 4).forEach(warmPoster);
    let stagedPosterCount = Math.min(4, posters.length);
    let posterFrame = 0;
    const stagePosters = () => {
      posterFrame = 0;
      const bounds = section.getBoundingClientRect();
      if (bounds.top > window.innerHeight * 2.8 || bounds.bottom < 0) return;
      const leadDistance = Math.max(1, window.innerHeight * 1.8);
      const progress = Math.max(0, Math.min(1, (window.innerHeight * 2.65 - bounds.top) / leadDistance));
      const desired = Math.min(posters.length, 4 + Math.ceil(progress * Math.max(0, posters.length - 4)));
      while (stagedPosterCount < desired) {
        warmPoster(posters[stagedPosterCount]);
        stagedPosterCount += 1;
      }
    };
    const requestPosterStage = () => {
      if (posterFrame) return;
      posterFrame = window.requestAnimationFrame(stagePosters);
    };
    window.addEventListener("scroll", requestPosterStage, { passive: true });
    window.addEventListener("zk:continuous-scroll", requestPosterStage);
    window.addEventListener("resize", requestPosterStage, { passive: true });
    stagePosters();

    if (!reducedMotion) {
      document.documentElement.classList.add("aigc-motion-ready");
      const reveal = () => {
        const bounds = section.getBoundingClientRect();
        if (bounds.top < window.innerHeight * 1.65 && bounds.bottom > 0) {
          section.classList.add("is-present");
        }
      };
      window.addEventListener("scroll", reveal, { passive: true });
      window.addEventListener("zk:continuous-scroll", reveal);
      window.addEventListener("resize", reveal, { passive: true });
      reveal();
    } else {
      section.classList.add("is-present");
    }

    const dialog = q("[data-aigc-lightbox]");
    const video = q("[data-aigc-lightbox-video]", dialog);
    const caption = q("[data-aigc-lightbox-caption]", dialog);
    const closeButton = q("[data-aigc-close]", dialog);
    const triggers = qa("[data-aigc-video]", section);
    if (!dialog || !video || !caption || !closeButton || !triggers.length) return;

    let activeTrigger = null;
    const reset = () => {
      video.pause();
      video.removeAttribute("src");
      video.removeAttribute("poster");
      video.load();
      document.body.classList.remove("is-aigc-lightbox-open");
      if (activeTrigger) activeTrigger.focus({ preventScroll: true });
      activeTrigger = null;
    };

    const close = () => {
      if (dialog.open && typeof dialog.close === "function") dialog.close();
      else {
        dialog.removeAttribute("open");
        reset();
      }
    };

    triggers.forEach((trigger) => {
      trigger.addEventListener("click", () => {
        activeTrigger = trigger;
        video.src = trigger.dataset.aigcVideo;
        video.poster = trigger.dataset.aigcPoster || "";
        caption.textContent = trigger.dataset.aigcCaption || "AIGC 风格化探索";
        document.body.classList.add("is-aigc-lightbox-open");
        if (typeof dialog.showModal === "function") dialog.showModal();
        else dialog.setAttribute("open", "");
        video.play().catch(() => {});
      });
    });

    closeButton.addEventListener("click", close);
    dialog.addEventListener("click", (event) => {
      if (event.target === dialog) close();
    });
    dialog.addEventListener("close", reset);
    dialog.addEventListener("cancel", (event) => {
      event.preventDefault();
      close();
    });
  }

  function setupPageTransitions() {
    if (window.ZKRoute?.navigate) return;
    const localLinks = qa("a[href]").filter((link) => {
      const href = link.getAttribute("href");
      if (!href || href.startsWith("#") || link.target === "_blank" || link.hasAttribute("download")) return false;
      try {
        const target = new URL(link.href, window.location.href);
        return target.origin === window.location.origin && target.pathname !== window.location.pathname;
      } catch (_) {
        return false;
      }
    });

    localLinks.forEach((link) => {
      link.addEventListener("click", (event) => {
        if (event.defaultPrevented || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (reducedMotion) return;
        event.preventDefault();
        document.body.classList.add("is-leaving");
        window.setTimeout(() => {
          window.location.href = link.href;
        }, 660);
      });
    });

    qa('a[href^="#"]').forEach((link) => {
      link.addEventListener("click", () => {
        const target = q(link.getAttribute("href"));
        if (!target || reducedMotion) return;
        target.animate([
          { filter: "brightness(1)" },
          { filter: "brightness(1.1)" },
          { filter: "brightness(1)" },
        ], { duration: 900, easing: "ease-out" });
      });
    });

    window.addEventListener("pageshow", () => document.body.classList.remove("is-leaving"));
  }

  function setupRuntime() {
    const dayElement = q("[data-runtime-days]");
    const hourElement = q("[data-runtime-hours]");
    const minuteElement = q("[data-runtime-minutes]");
    if (!dayElement || !hourElement || !minuteElement) return;

    const start = new Date("2026-08-10T00:00:00+08:00").getTime();
    const update = () => {
      const difference = Math.max(0, Date.now() - start);
      const days = Math.floor(difference / 86400000);
      const hours = Math.floor(difference / 3600000) % 24;
      const minutes = Math.floor(difference / 60000) % 60;
      dayElement.textContent = String(days).padStart(3, "0");
      hourElement.textContent = String(hours).padStart(2, "0");
      minuteElement.textContent = String(minutes).padStart(2, "0");
    };
    update();
    window.setInterval(update, 30000);
  }

  function setupSound() {
    const button = q("[data-sound-toggle]");
    const stateLabel = q("[data-sound-state]");
    if (!button || !stateLabel) return;

    let audioContext;
    let master;
    let oscillators = [];

    const stop = () => {
      oscillators.forEach((oscillator) => {
        try { oscillator.stop(); } catch (_) { /* already stopped */ }
      });
      oscillators = [];
      if (master && audioContext) {
        master.gain.cancelScheduledValues(audioContext.currentTime);
        master.gain.setTargetAtTime(0.0001, audioContext.currentTime, .08);
      }
      button.setAttribute("aria-pressed", "false");
      stateLabel.textContent = "OFF";
    };

    const start = async () => {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) {
        announce("当前浏览器不支持声音合成。");
        return;
      }

      audioContext = audioContext || new AudioContext();
      if (audioContext.state === "suspended") await audioContext.resume();

      master = audioContext.createGain();
      master.gain.setValueAtTime(.0001, audioContext.currentTime);
      master.gain.exponentialRampToValueAtTime(.035, audioContext.currentTime + 1.2);
      master.connect(audioContext.destination);

      const frequencies = [110, 164.81, 220, 293.66];
      oscillators = frequencies.map((frequency, index) => {
        const oscillator = audioContext.createOscillator();
        const gain = audioContext.createGain();
        const filter = audioContext.createBiquadFilter();
        oscillator.type = index % 2 ? "sine" : "triangle";
        oscillator.frequency.value = frequency;
        oscillator.detune.value = (index - 1.5) * 3;
        gain.gain.value = .14 / frequencies.length;
        filter.type = "lowpass";
        filter.frequency.value = 460 + index * 90;
        oscillator.connect(filter).connect(gain).connect(master);
        oscillator.start();
        return oscillator;
      });

      button.setAttribute("aria-pressed", "true");
      stateLabel.textContent = "ON";
      announce("《未知星系》环境声已开启。再次点击可关闭。");
    };

    button.addEventListener("click", () => {
      if (button.getAttribute("aria-pressed") === "true") stop();
      else start();
    });
  }

  setupCursor();
  setupParticleField();
  setupCapabilities();
  setupAvatar();
  setupExperience();
  setupCountups();
  setupChapterReadout();
  setupMethod();
  setupChapterMotion();
  setupBridgeMotion();
  setupAigcLab();
  setupPageTransitions();
  setupRuntime();
  setupSound();
})();
