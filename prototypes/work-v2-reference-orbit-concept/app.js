(() => {
  "use strict";

  const EXPERIENCE_DATA = {
    "doubao-aixue": {
      title: "北京字跳网络技术有限公司",
      period: "2026.4—2026.8",
      role: "AI 创意设计实习生｜Gauth 产品设计部",
      scope: "参与豆包爱学视频课全流程，搭建从课题输入到成片交付的自动化 AI 工作流；独立交付完整设计产出 40+，推动单条视频返工率降低 50%。",
      linkType: "豆包爱学 · 官方 App Store",
      achievements: ["40+ 完整产出", "返工率 −50%"],
      paired: ["doubao-aixue", "gauth"],
    },
    gauth: {
      title: "北京字跳网络技术有限公司",
      period: "2026.4—2026.8",
      role: "AI 创意设计实习生｜Gauth 产品设计部",
      scope: "担任豆包爱学及 Gauth 海外 AI 课程设计 Owner，统筹分镜、人物与场景资产、视频生成至上线；直接负责 8 门 Gauth 历史课。",
      linkType: "Gauth · 官方课程主页",
      achievements: ["8 门历史课", "课程设计 Owner"],
      paired: ["doubao-aixue", "gauth"],
    },
    "heli-culture": {
      title: "赫里文化科技（四川）有限公司",
      period: "2025.10—2026.7",
      role: "策展助理实习生｜国际品牌部",
      scope: "负责公众号、小红书内容宣发与视觉排版；参与 EAST2046、米兰设计周等国际项目策展与社群运营。",
      linkType: "打开参与项目 EAST2046 官网",
      achievements: ["EAST2046", "米兰设计周"],
      paired: ["heli-culture"],
    },
    "tinglan-art-museum": {
      title: "沈阳盛京故里文旅发展有限公司",
      period: "2025.10—2026.7",
      role: "内容运营｜庭澜美术馆",
      scope: "负责美术馆及文旅品牌新媒体视觉内容；完成 100+ 位艺术家作品的风格分类与初筛评审。",
      linkType: "庭澜美术馆 · 官方公众号主页",
      achievements: ["100+ 位艺术家", "风格分类・初筛"],
      paired: ["tinglan-art-museum"],
    },
    taowhale: {
      title: "鲸海拾贝科技（厦门）有限公司",
      period: "2025.12—2026.3",
      role: "课程助教｜AI 商业创新部",
      scope: "为 600+ 学员提供 AI 设计答疑与创作指导；统筹 AI 漫剧全流程并搭建标准化 SOP。",
      linkType: "打开鲸海拾贝官方网站",
      achievements: ["600+ 学员", "AI 漫剧 SOP"],
      paired: ["taowhale"],
    },
  };

  const nodes = [...document.querySelectorAll("[data-experience]")];
  const readout = document.querySelector("[data-experience-readout]");
  const title = readout.querySelector("[data-title]");
  const period = readout.querySelector("[data-period]");
  const role = readout.querySelector("[data-role]");
  const scope = readout.querySelector("[data-scope]");
  const linkType = readout.querySelector("[data-link-type]");
  const liveRegion = document.querySelector("[data-live-region]");
  const spectralCursor = document.querySelector("[data-spectral-cursor]");
  const orbitMap = document.querySelector("[data-orbit-map]");
  const timeArc = document.querySelector("[data-time-arc]");
  const timeArcMain = document.querySelector(".time-arc-main");
  const timeArcEcho = document.querySelector(".time-arc-echo");
  const timeArcFlow = document.querySelector("[data-time-arc-flow]");
  const siteCursor = document.querySelector("[data-site-cursor]");
  const cursorTrails = [...document.querySelectorAll("[data-cursor-trail]")];
  const experienceSection = document.querySelector(".experience");
  const courseToggle = document.querySelector("[data-course-toggle]");
  const courseDrawer = document.querySelector("[data-course-drawer]");
  const courseClose = document.querySelector("[data-course-close]");
  const courseLinks = [...document.querySelectorAll(".course-grid a")];
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const finePointer = window.matchMedia("(pointer: fine)");
  const cursorMode = new URLSearchParams(window.location.search).get("cursor");
  const cursorModes = new Set(["orbit", "aperture", "comet"]);
  let cursorVisible = false;
  let cursorX = -100;
  let cursorY = -100;
  const trailPositions = cursorTrails.map(() => ({ x: -100, y: -100 }));
  let arcFrame = 0;
  let arcTargetX = 600;
  let arcCurrentX = 600;
  let arcTargetPull = 0;
  let arcCurrentPull = 0;
  let lastPointerX = window.innerWidth * 0.5;
  let lastPointerY = window.innerHeight * 0.5;
  let activeArcNode = null;
  let baseArcPoints = [];

  const particleColors = [
    ["#f5f5f5", "rgba(245, 245, 245, 0.42)"],
    ["#d8d8d8", "rgba(216, 216, 216, 0.36)"],
    ["#b4b4b4", "rgba(180, 180, 180, 0.32)"],
    ["#898989", "rgba(137, 137, 137, 0.28)"],
    ["#555555", "rgba(85, 85, 85, 0.24)"],
  ];

  nodes.forEach((node, nodeIndex) => {
    const aura = node.querySelector(".node-aura");
    if (!aura) return;

    const fragment = document.createDocumentFragment();
    const particleCount = 28;
    for (let index = 0; index < particleCount; index += 1) {
      const particle = document.createElement("span");
      const [color, glow] = particleColors[(index + nodeIndex) % particleColors.length];
      particle.className = "orbit-particle";
      particle.style.setProperty("--particle-angle", `${index * (360 / particleCount) + (nodeIndex * 7 + index * 3) % 9}deg`);
      particle.style.setProperty("--particle-depth", `${-6 + ((index * 7 + nodeIndex * 3) % 17)}px`);
      particle.style.setProperty("--particle-size", `${1.8 + ((index * 3 + nodeIndex * 2) % 5) * 0.62}px`);
      particle.style.setProperty("--particle-delay", `${(index % 8) * 22}ms`);
      particle.style.setProperty("--particle-opacity", `${0.5 + ((index * 3) % 6) * 0.08}`);
      particle.style.setProperty("--particle-color", color);
      particle.style.setProperty("--particle-glow", glow);
      fragment.appendChild(particle);
    }

    const achievementAngles = [32, 206];
    const achievements = EXPERIENCE_DATA[node.dataset.experience]?.achievements ?? [];
    achievements.forEach((label, index) => {
      const angle = achievementAngles[index % achievementAngles.length];
      const particle = document.createElement("span");
      const text = document.createElement("span");
      particle.className = "achievement-particle";
      text.className = "achievement-particle-label";
      text.textContent = label;
      particle.style.setProperty("--achievement-angle", `${angle}deg`);
      particle.style.setProperty("--achievement-counter-angle", `${-angle}deg`);
      particle.style.setProperty("--achievement-delay", `${100 + index * 90}ms`);
      particle.appendChild(text);
      fragment.appendChild(particle);
    });
    aura.appendChild(fragment);
  });

  function sampleBaseArc() {
    if (!timeArcMain || typeof timeArcMain.getTotalLength !== "function") return;
    const length = timeArcMain.getTotalLength();
    baseArcPoints = Array.from({ length: 49 }, (_, index) => {
      const point = timeArcMain.getPointAtLength((length * index) / 48);
      return { x: point.x, y: point.y };
    });
  }

  function pointsToCurve(points) {
    if (points.length < 2) return "";
    const number = (value) => Number(value.toFixed(2));
    let path = `M${number(points[0].x)} ${number(points[0].y)}`;

    for (let index = 0; index < points.length - 1; index += 1) {
      const p0 = points[Math.max(0, index - 1)];
      const p1 = points[index];
      const p2 = points[index + 1];
      const p3 = points[Math.min(points.length - 1, index + 2)];
      const cp1x = p1.x + (p2.x - p0.x) / 6;
      const cp1y = p1.y + (p2.y - p0.y) / 6;
      const cp2x = p2.x - (p3.x - p1.x) / 6;
      const cp2y = p2.y - (p3.y - p1.y) / 6;
      path += ` C${number(cp1x)} ${number(cp1y)} ${number(cp2x)} ${number(cp2y)} ${number(p2.x)} ${number(p2.y)}`;
    }

    return path;
  }

  function baseYAtX(targetX) {
    if (!baseArcPoints.length) return 260;
    const nextIndex = baseArcPoints.findIndex((point) => point.x >= targetX);
    if (nextIndex <= 0) return baseArcPoints[0].y;
    if (nextIndex === -1) return baseArcPoints[baseArcPoints.length - 1].y;
    const previous = baseArcPoints[nextIndex - 1];
    const next = baseArcPoints[nextIndex];
    const progress = (targetX - previous.x) / Math.max(next.x - previous.x, 0.001);
    return previous.y + (next.y - previous.y) * progress;
  }

  function buildResponsiveArc(focusX, pull) {
    const amplitude = 18;
    const spread = 148;
    const wavelength = 34;
    const points = baseArcPoints.map((point) => {
      const distance = point.x - focusX;
      const envelope = Math.exp(-0.5 * (distance / spread) ** 2);
      const wave = Math.sin(distance / wavelength) * amplitude * envelope;
      const attraction = pull * Math.exp(-0.5 * (distance / (spread * 0.76)) ** 2);
      return { x: point.x, y: point.y + wave + attraction };
    });
    return pointsToCurve(points);
  }

  function clientPointToArc(clientX, clientY = null) {
    const bounds = orbitMap?.getBoundingClientRect();
    if (!bounds || bounds.width <= 0 || bounds.height <= 0) return { x: 600, y: null };
    return {
      x: Math.min(1200, Math.max(0, ((clientX - bounds.left) / bounds.width) * 1200)),
      y: clientY === null ? null : ((clientY - bounds.top) / bounds.height) * 520,
    };
  }

  function renderTimeArc() {
    const distance = arcTargetX - arcCurrentX;
    const pullDistance = arcTargetPull - arcCurrentPull;
    arcCurrentX += distance * 0.2;
    arcCurrentPull += pullDistance * 0.18;
    const path = buildResponsiveArc(arcCurrentX, arcCurrentPull);
    const progress = Math.min(1, Math.max(0, arcCurrentX / 1200));

    if (path) {
      timeArcEcho?.setAttribute("d", path);
      timeArcFlow?.setAttribute("d", path);
    }
    timeArc?.style.setProperty("--arc-focus", `${(progress * 100).toFixed(2)}%`);
    if (timeArcFlow) timeArcFlow.style.strokeDashoffset = `${17 - progress * 100}`;

    if (Math.abs(distance) > 0.18 || Math.abs(pullDistance) > 0.08) {
      arcFrame = window.requestAnimationFrame(renderTimeArc);
    } else {
      arcCurrentX = arcTargetX;
      arcCurrentPull = arcTargetPull;
      arcFrame = 0;
    }
  }

  function setActiveExperience(id, announce = false) {
    const data = EXPERIENCE_DATA[id];
    if (!data) return;

    nodes.forEach((node) => {
      node.classList.toggle("is-current", node.dataset.experience === id);
    });

    readout.classList.add("is-changing");
    window.requestAnimationFrame(() => {
      title.textContent = data.title;
      period.textContent = data.period;
      role.textContent = data.role;
      scope.textContent = data.scope;
      linkType.textContent = data.linkType;
      readout.classList.remove("is-changing");
    });

    if (announce) {
      liveRegion.textContent = `${data.title}，${data.period}，${data.role}`;
    }
  }

  function updateTimeArc(clientX, clientY = null) {
    if (!timeArc || !timeArcFlow || reduceMotion.matches) return;
    const point = clientPointToArc(clientX, clientY);
    arcTargetX = point.x;
    arcTargetPull = point.y === null
      ? 0
      : Math.min(18, Math.max(-18, (point.y - baseYAtX(point.x)) * 0.16));
    if (!arcFrame) arcFrame = window.requestAnimationFrame(renderTimeArc);
  }

  nodes.forEach((node) => {
    const activate = (announce = false) => setActiveExperience(node.dataset.experience, announce);
    const focusArc = () => {
      activeArcNode = node;
      const bounds = node.getBoundingClientRect();
      updateTimeArc(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    };
    const releaseArc = () => {
      if (activeArcNode === node) activeArcNode = null;
      updateTimeArc(lastPointerX, lastPointerY);
    };
    node.addEventListener("pointerenter", () => {
      activate(false);
      focusArc();
    });
    node.addEventListener("pointerleave", () => {
      node.classList.remove("is-current");
      releaseArc();
    });
    node.addEventListener("focus", () => {
      activate(true);
      focusArc();
      if (window.matchMedia("(max-width: 900px)").matches) {
        const rail = node.closest("[data-orbit-map]");
        rail.scrollTo({
          left: node.offsetLeft - (rail.clientWidth - node.offsetWidth) / 2,
          behavior: reduceMotion.matches ? "auto" : "smooth",
        });
      }
    });
    node.addEventListener("blur", releaseArc);
    node.addEventListener("pointerdown", () => activate(false));
  });

  function setCourseDrawer(open, restoreFocus = false) {
    if (!experienceSection || !courseToggle || !courseDrawer) return;
    experienceSection.classList.toggle("is-course-open", open);
    courseToggle.setAttribute("aria-expanded", String(open));
    courseDrawer.setAttribute("aria-hidden", String(!open));
    courseDrawer.toggleAttribute("inert", !open);
    liveRegion.textContent = open
      ? "已打开 8 门 Gauth 历史课程目录。每一项均可前往官方课程页面。"
      : "已关闭 Gauth 历史课程目录。";
    if (open) {
      setActiveExperience("gauth", false);
      window.setTimeout(() => courseClose?.focus(), reduceMotion.matches ? 0 : 260);
    } else if (restoreFocus) {
      courseToggle.focus();
    }
  }

  courseToggle?.addEventListener("click", () => {
    setCourseDrawer(courseToggle.getAttribute("aria-expanded") !== "true");
  });
  courseClose?.addEventListener("click", () => setCourseDrawer(false, true));

  courseLinks.forEach((courseLink) => {
    courseLink.addEventListener("pointerdown", (event) => {
      const rect = courseLink.getBoundingClientRect();
      courseLink.style.setProperty("--press-x", `${event.clientX - rect.left}px`);
      courseLink.style.setProperty("--press-y", `${event.clientY - rect.top}px`);
      courseLink.classList.remove("is-pressed");
      void courseLink.offsetWidth;
      courseLink.classList.add("is-pressed");
    });
    courseLink.addEventListener("animationend", () => courseLink.classList.remove("is-pressed"));
    courseLink.addEventListener("click", () => {
      const courseName = courseLink.querySelector("span")?.firstChild?.textContent?.trim() || "Gauth 历史课程";
      liveRegion.textContent = `正在打开官方课程：${courseName}`;
    });
  });

  const WORKFLOW_STAGES = [
    {
      label: "INPUT / BRIEF",
      title: "课题解析",
      copy: "把课程主题、学段、时长与表达目标拆成清晰的内容任务，先统一生产边界。",
      output: "结构化课题任务单",
    },
    {
      label: "PGC / STRUCTURE",
      title: "知识图谱",
      copy: "梳理概念层级、因果关系与学习顺序，让后续内容生成始终围绕同一条知识主线。",
      output: "可复用知识节点",
    },
    {
      label: "PGC / DESIGN",
      title: "教学设计",
      copy: "把知识路径翻译成引入、讲解、练习与回收节奏，建立可验证的课程叙事骨架。",
      output: "教学叙事与节奏方案",
    },
    {
      label: "PGC / ASSETS",
      title: "课件生成",
      copy: "按统一的页面结构与视觉规格组织文字、场景和重点信息，形成可继续编排的基础资产。",
      output: "模块化课件资产包",
    },
    {
      label: "PRODUCTION / VIDEO",
      title: "视频编排",
      copy: "将课件映射到分镜、旁白、字幕和画面节奏，控制从脚本到成片的交付一致性。",
      output: "分镜与音画时间线",
    },
    {
      label: "UGC / REASSEMBLE",
      title: "个性化重组",
      copy: "基于同一组内容基因，按讲解、故事或课堂互动场景重组表达，减少重复生产与返工。",
      output: "多版本课程视频",
    },
  ];

  const VARIANT_DATA = {
    standard: {
      label: "VERSION 01 · STANDARD",
      title: "标准讲解版",
      copy: "沿知识路径稳定推进，强化概念解释与视觉重点，适配常规课程交付。",
      tags: ["知识主线", "稳定节奏", "重点标注"],
    },
    story: {
      label: "VERSION 02 · STORY",
      title: "故事叙事版",
      copy: "用人物、情境与冲突承载知识节点，让抽象内容获得更强的进入感与记忆点。",
      tags: ["情境引入", "角色视角", "叙事回收"],
    },
    quiz: {
      label: "VERSION 03 · INTERACTIVE",
      title: "课堂互动版",
      copy: "在关键知识节点插入提问、停顿与反馈，重组为可参与、可检验的课堂互动节奏。",
      tags: ["课堂互动", "即时反馈", "知识测验"],
    },
  };

  const GENE_LABELS = {
    topic: "课题锚点",
    knowledge: "知识路径",
    narrative: "叙事节奏",
    visual: "视觉语言",
    interaction: "互动机制",
  };

  const workflowStages = [...document.querySelectorAll("[data-workflow-stage]")];
  const workflowConsole = document.querySelector(".workflow-console");
  const workflowStageRail = document.querySelector(".workflow-stages");
  const workflowReadout = document.querySelector("[data-workflow-readout]");
  const workflowIndex = document.querySelector("[data-workflow-index]");
  const workflowLabel = document.querySelector("[data-workflow-label]");
  const workflowTitle = document.querySelector("[data-workflow-title]");
  const workflowCopy = document.querySelector("[data-workflow-copy]");
  const workflowOutput = document.querySelector("[data-workflow-output]");
  const geneNodes = [...document.querySelectorAll("[data-gene]")];
  const assetLanes = [...document.querySelectorAll("[data-asset-genes]")];
  const geneReadout = document.querySelector("[data-gene-readout]");
  const variantButtons = [...document.querySelectorAll("[data-variant]")];
  const variantPreview = document.querySelector("[data-variant-preview]");
  const variantLabel = document.querySelector("[data-variant-label]");
  const variantTitle = document.querySelector("[data-variant-title]");
  const variantCopy = document.querySelector("[data-variant-copy]");
  const variantTags = document.querySelector("[data-variant-tags]");

  function setWorkflowStage(stageNumber, announce = true) {
    const stageIndex = Number(stageNumber) - 1;
    const data = WORKFLOW_STAGES[stageIndex];
    if (!data || !workflowReadout) return;

    workflowStages.forEach((button) => {
      const isActive = Number(button.dataset.workflowStage) === stageNumber;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    workflowStageRail?.style.setProperty("--active-stage", String(stageIndex));
    workflowReadout.classList.add("is-changing");
    window.setTimeout(() => {
      workflowIndex.textContent = String(stageNumber).padStart(2, "0");
      workflowLabel.textContent = data.label;
      workflowTitle.textContent = data.title;
      workflowCopy.textContent = data.copy;
      workflowOutput.textContent = data.output;
      workflowReadout.classList.remove("is-changing");
    }, reduceMotion.matches ? 0 : 120);

    if (announce) liveRegion.textContent = `流程第 ${stageNumber} 阶段：${data.title}。交付物：${data.output}。`;
  }

  workflowStages.forEach((button) => {
    button.addEventListener("click", () => {
      const selectedStage = Number(button.dataset.workflowStage);
      automaticStage = selectedStage;
      manualStageLockUntil = Date.now() + 5000;
      setWorkflowStage(selectedStage);
    });
  });

  workflowConsole?.addEventListener("pointermove", (event) => {
    if (reduceMotion.matches || event.pointerType === "touch") return;
    const bounds = workflowConsole.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    workflowConsole.style.setProperty("--workflow-x", `${x.toFixed(2)}%`);
    workflowConsole.style.setProperty("--workflow-y", `${y.toFixed(2)}%`);
  }, { passive: true });

  function setActiveGene(gene, announce = true) {
    const label = GENE_LABELS[gene];
    if (!label) return;
    let mappedCount = 0;

    geneNodes.forEach((button) => {
      const isActive = button.dataset.gene === gene;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    assetLanes.forEach((lane) => {
      const isMapped = lane.dataset.assetGenes.split(" ").includes(gene);
      lane.classList.toggle("is-mapped", isMapped);
      if (isMapped) mappedCount += 1;
    });
    if (geneReadout) geneReadout.textContent = `${label}正在连接 ${mappedCount} 类资产`;
    if (announce) liveRegion.textContent = `${label}已映射到 ${mappedCount} 类生产资产。`;
  }

  geneNodes.forEach((button) => {
    button.addEventListener("click", () => setActiveGene(button.dataset.gene));
  });

  function setVariant(variant, announce = true) {
    const data = VARIANT_DATA[variant];
    if (!data || !variantPreview) return;

    variantButtons.forEach((button) => {
      const isActive = button.dataset.variant === variant;
      button.classList.toggle("is-active", isActive);
      button.setAttribute("aria-pressed", String(isActive));
    });
    variantPreview.classList.add("is-changing");
    window.setTimeout(() => {
      variantPreview.dataset.mode = variant;
      variantLabel.textContent = data.label;
      variantTitle.textContent = data.title;
      variantCopy.textContent = data.copy;
      variantTags.replaceChildren(...data.tags.map((tag) => {
        const item = document.createElement("li");
        item.textContent = tag;
        return item;
      }));
      variantPreview.classList.remove("is-changing");
    }, reduceMotion.matches ? 0 : 120);

    if (announce) liveRegion.textContent = `已切换为${data.title}。${data.copy}`;
  }

  variantButtons.forEach((button) => {
    button.addEventListener("click", () => setVariant(button.dataset.variant));
  });

  const publicWorkbenchFrame = document.querySelector("[data-public-workbench]");
  window.addEventListener("message", (event) => {
    if (!publicWorkbenchFrame || event.source !== publicWorkbenchFrame.contentWindow) return;
    if (!event.data || typeof event.data !== "object") return;

    if (event.data.type === "workflow:height") {
      const nextHeight = Math.min(5200, Math.max(720, Math.ceil(Number(event.data.height) || 0)));
      if (Math.abs(publicWorkbenchFrame.offsetHeight - nextHeight) > 2) {
        publicWorkbenchFrame.style.height = `${nextHeight}px`;
      }
      return;
    }

    if (event.data.type === "workflow:wheel") {
      const deltaY = Math.min(220, Math.max(-220, Number(event.data.deltaY) || 0));
      if (!deltaY) return;
      if (window.parent !== window) {
        window.parent.postMessage({ type: "zk:wheel", deltaY }, "*");
      } else {
        window.scrollBy({ top: deltaY, behavior: "auto" });
      }
    }
  });

  const productionShell = document.querySelector(".production-shell");
  const workbenchExpansion = document.querySelector("[data-workbench-expansion]");
  let automaticStage = 1;
  let manualStageLockUntil = 0;
  let narrativeTicking = false;

  function updateProductionNarrative() {
    narrativeTicking = false;
    if (productionShell && workflowStages.length && Date.now() >= manualStageLockUntil) {
      const bounds = productionShell.getBoundingClientRect();
      const travel = Math.max(window.innerHeight, bounds.height - window.innerHeight * 0.72);
      const progress = Math.max(0, Math.min(0.999, (window.innerHeight * 0.68 - bounds.top) / travel));
      const nextStage = Math.max(1, Math.min(workflowStages.length, Math.floor(progress * workflowStages.length) + 1));
      if (bounds.top < window.innerHeight * 0.72 && bounds.bottom > window.innerHeight * 0.24 && nextStage !== automaticStage) {
        automaticStage = nextStage;
        setWorkflowStage(nextStage, false);
      }
    }

    if (workbenchExpansion) {
      const bounds = workbenchExpansion.getBoundingClientRect();
      const progress = reduceMotion.matches
        ? 1
        : Math.max(0, Math.min(1, (window.innerHeight * 0.88 - bounds.top) / (window.innerHeight * 0.62)));
      workbenchExpansion.style.setProperty("--workbench-expand", progress.toFixed(3));
    }
  }

  function requestNarrativeUpdate() {
    if (narrativeTicking) return;
    narrativeTicking = true;
    window.requestAnimationFrame(updateProductionNarrative);
  }

  window.addEventListener("scroll", requestNarrativeUpdate, { passive: true });
  window.addEventListener("zk:continuous-scroll", requestNarrativeUpdate);
  window.addEventListener("resize", requestNarrativeUpdate, { passive: true });

  workbenchExpansion?.addEventListener("pointermove", (event) => {
    const bounds = workbenchExpansion.getBoundingClientRect();
    const x = ((event.clientX - bounds.left) / bounds.width) * 100;
    const y = ((event.clientY - bounds.top) / bounds.height) * 100;
    workbenchExpansion.style.setProperty("--glow-x", `${x.toFixed(2)}%`);
    workbenchExpansion.style.setProperty("--glow-y", `${y.toFixed(2)}%`);
  }, { passive: true });

  requestNarrativeUpdate();


  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && courseToggle?.getAttribute("aria-expanded") === "true") {
      setCourseDrawer(false, true);
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (courseToggle?.getAttribute("aria-expanded") !== "true") return;
    if (courseDrawer?.contains(event.target) || courseToggle?.contains(event.target)) return;
    setCourseDrawer(false, false);
  });

  document.addEventListener("pointermove", (event) => {
    if (reduceMotion.matches || event.pointerType === "touch") return;
    lastPointerX = event.clientX;
    lastPointerY = event.clientY;
    document.body.classList.add("has-pointer");
    spectralCursor.style.setProperty("--cursor-x", `${event.clientX}px`);
    spectralCursor.style.setProperty("--cursor-y", `${event.clientY}px`);
    if (activeArcNode) {
      const bounds = activeArcNode.getBoundingClientRect();
      updateTimeArc(bounds.left + bounds.width / 2, bounds.top + bounds.height / 2);
    } else {
      updateTimeArc(event.clientX, event.clientY);
    }
  }, { passive: true });

  document.addEventListener("pointerleave", () => {
    document.body.classList.remove("has-pointer");
    activeArcNode = null;
    lastPointerX = window.innerWidth * 0.5;
    lastPointerY = window.innerHeight * 0.5;
    updateTimeArc(lastPointerX);
    if (cursorVisible) siteCursor.style.opacity = "0";
  });

  if (cursorModes.has(cursorMode) && finePointer.matches && !reduceMotion.matches) {
    cursorVisible = true;
    document.body.dataset.cursor = cursorMode;

    document.addEventListener("pointermove", (event) => {
      if (event.pointerType === "touch") return;
      cursorX = event.clientX;
      cursorY = event.clientY;
      siteCursor.style.opacity = "1";
      siteCursor.style.setProperty("--cursor-x", `${cursorX}px`);
      siteCursor.style.setProperty("--cursor-y", `${cursorY}px`);
    }, { passive: true });

    document.querySelectorAll("a, button, [tabindex]").forEach((control) => {
      control.addEventListener("pointerenter", () => siteCursor.classList.add("is-interactive"));
      control.addEventListener("pointerleave", () => siteCursor.classList.remove("is-interactive"));
    });

    if (cursorMode === "comet") {
      const animateTrails = () => {
        let targetX = cursorX;
        let targetY = cursorY;
        trailPositions.forEach((position, index) => {
          const lag = 0.26 - index * 0.035;
          position.x += (targetX - position.x) * lag;
          position.y += (targetY - position.y) * lag;
          cursorTrails[index].style.transform = `translate(${position.x - cursorX - 2.5}px, ${position.y - cursorY - 2.5}px) scale(${1 - index * 0.13})`;
          cursorTrails[index].style.opacity = `${0.72 - index * 0.12}`;
          targetX = position.x;
          targetY = position.y;
        });
        window.requestAnimationFrame(animateTrails);
      };
      window.requestAnimationFrame(animateTrails);
    }
  }

  const evidenceReel = document.querySelector("[data-evidence-reel]");
  const evidenceReelProgress = document.querySelector("[data-reel-progress]");
  let reelPointerId = null;
  let reelStartX = 0;
  let reelStartScroll = 0;
  let reelMoved = false;

  function updateEvidenceReel() {
    if (!evidenceReel || !evidenceReelProgress) return;
    const scrollable = Math.max(1, evidenceReel.scrollWidth - evidenceReel.clientWidth);
    const progress = Math.min(1, Math.max(0, evidenceReel.scrollLeft / scrollable));
    evidenceReelProgress.style.transform = `translateX(${progress * 354}%)`;
  }

  document.querySelectorAll("[data-reel-move]").forEach((button) => {
    button.addEventListener("click", () => {
      if (!evidenceReel) return;
      const direction = Number(button.dataset.reelMove) || 1;
      evidenceReel.scrollBy({ left: direction * evidenceReel.clientWidth * 0.72, behavior: reduceMotion.matches ? "auto" : "smooth" });
    });
  });

  evidenceReel?.addEventListener("scroll", updateEvidenceReel, { passive: true });
  evidenceReel?.addEventListener("pointerdown", (event) => {
    if (event.pointerType === "touch") return;
    reelPointerId = event.pointerId;
    reelStartX = event.clientX;
    reelStartScroll = evidenceReel.scrollLeft;
    reelMoved = false;
    evidenceReel.classList.add("is-dragging");
  });
  evidenceReel?.addEventListener("pointermove", (event) => {
    if (reelPointerId !== event.pointerId) return;
    const delta = event.clientX - reelStartX;
    if (Math.abs(delta) > 5) {
      reelMoved = true;
      if (!evidenceReel.hasPointerCapture(event.pointerId)) evidenceReel.setPointerCapture(event.pointerId);
    }
    evidenceReel.scrollLeft = reelStartScroll - delta;
  });
  const releaseEvidenceReel = (event) => {
    if (!evidenceReel || reelPointerId !== event.pointerId) return;
    evidenceReel.classList.remove("is-dragging");
    if (evidenceReel.hasPointerCapture(event.pointerId)) evidenceReel.releasePointerCapture(event.pointerId);
    reelPointerId = null;
  };
  evidenceReel?.addEventListener("pointerup", releaseEvidenceReel);
  evidenceReel?.addEventListener("pointercancel", releaseEvidenceReel);
  evidenceReel?.addEventListener("click", (event) => {
    if (!reelMoved) return;
    event.preventDefault();
    event.stopPropagation();
    reelMoved = false;
  }, true);

  const evidenceLightbox = document.querySelector("[data-evidence-lightbox]");
  const evidenceLightboxImage = document.querySelector("[data-evidence-lightbox-image]");
  const evidenceLightboxVideo = document.querySelector("[data-evidence-lightbox-video]");
  const evidenceLightboxCaption = document.querySelector("[data-evidence-lightbox-caption]");
  const resetEvidenceVideo = () => {
    if (evidenceLightboxVideo) {
      evidenceLightboxVideo.pause();
      evidenceLightboxVideo.removeAttribute("src");
      evidenceLightboxVideo.removeAttribute("poster");
      evidenceLightboxVideo.hidden = true;
      evidenceLightboxVideo.load();
    }
  };
  const closeEvidenceLightbox = () => {
    resetEvidenceVideo();
    if (evidenceLightbox?.open) evidenceLightbox.close();
  };

  document.querySelectorAll("[data-evidence-image]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      if (!evidenceLightbox || !evidenceLightboxImage || reelMoved) return;
      if (evidenceLightboxVideo) {
        evidenceLightboxVideo.pause();
        evidenceLightboxVideo.hidden = true;
      }
      evidenceLightboxImage.hidden = false;
      evidenceLightboxImage.src = trigger.dataset.evidenceImage || "";
      evidenceLightboxImage.alt = trigger.dataset.evidenceCaption || "作品大图";
      if (evidenceLightboxCaption) evidenceLightboxCaption.textContent = trigger.dataset.evidenceCaption || "";
      evidenceLightbox.showModal();
    });
  });

  const warmEvidencePosters = () => {
      document.querySelectorAll(".course-tile-sample img[loading='lazy']").forEach((image) => {
      image.loading = "eager";
      image.fetchPriority = "low";
      image.decode?.().catch(() => {});
    });
  };
  const evidencePosterBoundary = document.querySelector(".case-evidence");
  if (evidencePosterBoundary && "IntersectionObserver" in window) {
    const posterObserver = new IntersectionObserver((entries, observer) => {
      if (!entries.some((entry) => entry.isIntersecting)) return;
      warmEvidencePosters();
      observer.disconnect();
    }, { rootMargin: "3000px 0px" });
    posterObserver.observe(evidencePosterBoundary);
  } else {
    warmEvidencePosters();
  }

  document.querySelectorAll("[data-evidence-video]").forEach((trigger) => {
    trigger.addEventListener("click", () => {
      if (!evidenceLightbox || !evidenceLightboxVideo) return;
      if (evidenceLightboxImage) {
        evidenceLightboxImage.hidden = true;
        evidenceLightboxImage.removeAttribute("src");
      }
      evidenceLightboxVideo.hidden = false;
      evidenceLightboxVideo.src = trigger.dataset.evidenceVideo || "";
      evidenceLightboxVideo.poster = trigger.dataset.evidencePoster || "";
      if (evidenceLightboxCaption) evidenceLightboxCaption.textContent = trigger.dataset.evidenceCaption || "";
      evidenceLightbox.showModal();
      evidenceLightboxVideo.play().catch(() => {});
    });
  });
  document.querySelector("[data-evidence-close]")?.addEventListener("click", closeEvidenceLightbox);
  evidenceLightbox?.addEventListener("close", resetEvidenceVideo);
  evidenceLightbox?.addEventListener("click", (event) => {
    if (event.target === evidenceLightbox) closeEvidenceLightbox();
  });

  const ambientEvidenceVideos = [...document.querySelectorAll(".course-wall video[autoplay]")];
  if ("IntersectionObserver" in window && ambientEvidenceVideos.length) {
    const videoObserver = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        const video = entry.target;
        if (entry.isIntersecting && entry.intersectionRatio > 0.35) {
          video.play().catch(() => {});
        } else {
          video.pause();
        }
      });
    }, { threshold: [0, 0.35, 0.8] });
    ambientEvidenceVideos.forEach((video) => videoObserver.observe(video));
  }

  updateEvidenceReel();

  sampleBaseArc();
  updateTimeArc(window.innerWidth * 0.5);

  window.requestAnimationFrame(() => {
    document.body.classList.add("is-ready");
  });
})();
