const app = document.querySelector('#app');
const toast = document.querySelector('#toast');
const sampleDialog = document.querySelector('#sample-dialog');
const helpDialog = document.querySelector('#help-dialog');

const steps = [
  { key: 'structure', label: '内容结构' },
  { key: 'courseware', label: '课件' },
  { key: 'video', label: '视频' },
  { key: 'versions', label: '多版本' },
];

const initialGenes = {
  author: {
    label: '作者',
    value: '贺知章',
    effect: '课件会补充作者与盛唐背景；视频会保持信息克制，不让人物介绍抢走诗歌本身。',
    courseFocus: '作者与时代背景',
    videoHint: '盛唐诗人剪影与简洁落款',
    icon: 'person',
  },
  imagery: {
    label: '意象',
    value: '柳树 / 春风',
    effect: '课件会建立诗句与画面之间的对应；视频会用柳枝、春水和微风形成统一视觉线索。',
    courseFocus: '诗句与核心意象',
    videoHint: '春水边的柳树与轻柔风向',
    icon: 'leaf',
  },
  rhythm: {
    label: '节奏',
    value: '七言绝句',
    effect: '课件会标出朗读停顿；视频旁白与镜头切换会跟随诗句的四段节奏。',
    courseFocus: '朗读停顿与韵律',
    videoHint: '四句诗对应四个稳定镜头',
    icon: 'rhythm',
  },
  rhetoric: {
    label: '修辞',
    value: '比喻 / 拟人',
    effect: '课件会突出诗句中的形象化表达；视频画面将用柳枝与春风表现“拟人”关系。',
    courseFocus: '形象化表达',
    videoHint: '柳枝随春风舒展',
    icon: 'pen',
  },
  context: {
    label: '背景',
    value: '盛唐春景',
    effect: '课件会补足必要的文化语境；视频会统一建筑、服饰与园林的时代气质。',
    courseFocus: '盛唐与咏物写春',
    videoHint: '东方园林与早春薄雾',
    icon: 'mountain',
  },
};

const slides = [
  { title: '咏柳', kicker: '东方绘本课程', description: '从一棵柳树出发，读懂诗歌里的春天。', type: 'cover' },
  { title: '贺知章', kicker: '作者', description: '用最少的背景信息，帮助学生进入诗歌语境。', type: 'profile' },
  { title: '碧玉妆成一树高', kicker: '朗读', description: '万条垂下绿丝绦。', type: 'quote' },
  { title: '柳树与春风', kicker: '意象', description: '观察诗句如何把颜色、形态与季节连在一起。', type: 'chips' },
  { title: '比喻与拟人', kicker: '修辞', description: '诗人没有解释春天，而是让柳树自己说出来。', type: 'chips' },
  { title: '四句，四次停顿', kicker: '节奏', description: '跟着七言绝句的韵律完成一次朗读。', type: 'rhythm' },
  { title: '为什么写柳？', kicker: '背景', description: '从咏物诗的传统回到眼前的春景。', type: 'context' },
  { title: '看 · 读 · 想', kicker: '课堂小结', description: '把观察、朗读和想象重新连起来。', type: 'chips' },
];

const shots = [
  {
    title: '春日建立', range: '00:00—00:28', duration: 28, source: '课件 01 · 课程开场', gene: '背景 · 盛唐春景',
    purpose: '先建立安静、清新的春日空间，让学生自然进入诗歌。', narration: '一场很轻的春风，从水面来到柳树旁。',
    prompt: '东方绘本，早春园林，柳树临水，远景，柔和自然光', framing: '远景', movement: '缓慢推进', audio: '春风与水声',
  },
  {
    title: '柳叶特写', range: '00:28—00:56', duration: 28, source: '课件 04 · 柳树与春风', gene: '意象 · 柳树 / 春风',
    purpose: '把“绿丝绦”的比喻变成可以观察的形态和运动。', narration: '细长的新叶，像一条条绿色丝带。',
    prompt: '柳叶近景，浅景深，春光，水彩绘本质感', framing: '特写', movement: '轻微横移', audio: '叶片摩擦声',
  },
  {
    title: '春风入意', range: '00:56—01:26', duration: 30, source: '课件 05 · 比喻与拟人', gene: '修辞 · 比喻 / 拟人',
    purpose: '让画面从“观察柳叶”过渡到“理解诗人的想象”。', narration: '是谁裁出了这些叶子？诗人把答案交给了春风。',
    prompt: '柳枝随风，人物背影，诗意拟人表达，东方园林', framing: '中景', movement: '跟随摇移', audio: '春风渐强',
  },
  {
    title: '回到诗题', range: '01:26—01:48', duration: 22, source: '课件 08 · 课堂小结', gene: '节奏 · 七言绝句',
    purpose: '用一次完整朗读收束画面，让知识重新回到诗句。', narration: '再读一遍《咏柳》，让画面回到诗句里。',
    prompt: '湖畔凉亭与垂柳，宁静收束镜头，东方绘本', framing: '全景', movement: '缓慢拉远', audio: '音乐淡出',
  },
];

const variants = {
  standard: {
    name: '标准讲解版', note: '知识结构完整，适合常规课堂播放。', accent: '#4aaf7c', shot: 0,
    caption: '从意象、节奏和修辞，读懂《咏柳》。', duration: '01:48', fit: '常规新授课 · 教师带领观看',
    opening: '直接进入诗歌画面', pacing: '均衡推进', interaction: '连续播放', teacherPrompt: '播放后请学生找出画面中与诗句对应的意象。',
    changes: [
      { label: '开场', value: '8 秒春日远景，随后出现诗题' },
      { label: '节奏', value: '讲解与朗读各占一半' },
      { label: '互动', value: '播放结束后统一讨论' },
    ],
  },
  story: {
    name: '情境故事版', note: '用一次春日观察串联诗句与知识点。', accent: '#4c6fff', shot: 2,
    caption: '跟着春风，去看诗人眼中的柳树。', duration: '02:06', fit: '导入或复习课 · 强调观看体验',
    opening: '从春风的视角进入', pacing: '舒缓叙事', interaction: '结尾回看', teacherPrompt: '请学生说说：如果你是春风，会先看到柳树的哪里？',
    changes: [
      { label: '开场', value: '以“春风来到湖边”作为故事起点' },
      { label: '节奏', value: '增加环境停留与镜头呼吸' },
      { label: '互动', value: '结尾回看三处诗句画面' },
    ],
  },
  quiz: {
    name: '互动问答版', note: '在关键节点停顿，让学生先观察再回答。', accent: '#ef765f', shot: 1,
    caption: '你觉得“绿丝绦”写的是柳树的哪一部分？', duration: '02:24', fit: '课堂练习 · 学生先观察再表达',
    opening: '先看画面再出现诗句', pacing: '三次停顿', interaction: '3 个问题', teacherPrompt: '暂停后先给学生 8 秒观察，再邀请他们用诗句回答。',
    changes: [
      { label: '开场', value: '先隐藏诗句，只呈现柳叶特写' },
      { label: '节奏', value: '在意象、修辞、朗读处暂停' },
      { label: '互动', value: '加入 3 个观察型问题' },
    ],
  },
};

function freshState() {
  return {
    view: 'start',
    topic: '《咏柳》',
    grade: '小学三年级',
    lesson: '1 课时',
    style: '东方绘本',
    output: '课件 + 视频',
    attachedFile: '',
    selectedGene: 'rhetoric',
    genes: JSON.parse(JSON.stringify(initialGenes)),
    slide: 0,
    shot: 0,
    videoProgress: 0,
    captions: true,
    sound: true,
    variant: 'standard',
    showComparison: false,
    shots: JSON.parse(JSON.stringify(shots)),
    variants: JSON.parse(JSON.stringify(variants)),
    unlocked: 0,
  };
}

let state = freshState();
let playbackTimer = null;
let toastTimer = null;

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;');
}

function icon(name, className = '') {
  const paths = {
    arrow: '<path d="M5 12h14M14 6l6 6-6 6"/>',
    plus: '<path d="M12 5v14M5 12h14"/>',
    person: '<circle cx="12" cy="8" r="3.5"/><path d="M5 20c.8-4 3.2-6 7-6s6.2 2 7 6"/>',
    leaf: '<path d="M19 4C10 4 5 9 5 16c6 0 11-4 14-12Z"/><path d="M5 20c2-5 6-9 11-12"/>',
    rhythm: '<path d="M5 16V8m5 11V5m5 11V8m4 11V5"/>',
    pen: '<path d="m5 19 3.5-.8L19 7.7 16.3 5 5.8 15.5 5 19Z"/><path d="m14.8 6.5 2.7 2.7"/>',
    mountain: '<path d="M3 19 9 8l4 6 3-5 5 10H3Z"/>',
    play: '<path d="m9 6 9 6-9 6V6Z"/>',
    pause: '<path d="M9 7v10m6-10v10"/>',
    download: '<path d="M12 4v11m0 0 4-4m-4 4-4-4M5 20h14"/>',
    check: '<path d="m5 12 4 4L19 6"/>',
    captions: '<path d="M4 6h16v12H4z"/><path d="M7 11h3m4 0h3M7 14h5"/>',
    volume: '<path d="M5 10v4h3l4 3V7L8 10H5Z"/><path d="M15 9c1 .8 1.5 1.8 1.5 3S16 14.2 15 15m2.5-8c1.6 1.4 2.5 3 2.5 5s-.9 3.6-2.5 5"/>',
    volumeOff: '<path d="M5 10v4h3l4 3V7L8 10H5Z"/><path d="m16 10 4 4m0-4-4 4"/>',
    compare: '<path d="M8 5H4v14h4M16 5h4v14h-4M12 3v18"/>',
  };
  return `<svg class="${className}" viewBox="0 0 24 24" aria-hidden="true">${paths[name] || paths.arrow}</svg>`;
}

function renderHeader(project = false) {
  const stepIndex = Math.max(0, steps.findIndex((step) => step.key === state.view));
  return `
    <header class="product-bar">
      <div class="product-identity">
        <strong>CONTENT SYSTEM</strong>
        <span>AI 内容再创作工作台</span>
      </div>
      ${project ? `
        <nav class="step-nav" aria-label="内容生成步骤">
          ${steps.map((step, index) => `
            <span class="step-item">
              <button
                class="step-button ${index === stepIndex ? 'is-active' : ''}"
                type="button"
                data-step="${step.key}"
                ${index > state.unlocked ? 'disabled' : ''}
                ${index === stepIndex ? 'aria-current="step"' : ''}
              >${step.label}</button>
            </span>
          `).join('')}
        </nav>
        <div class="product-actions"><button class="text-button" type="button" data-action="restart">重新开始</button></div>
      ` : `
        <span></span>
        <div class="product-actions">
          <button class="text-button" type="button" data-action="show-sample">查看示例</button>
          <button class="text-button" type="button" data-action="show-help">帮助</button>
        </div>
      `}
    </header>
  `;
}

function renderStart() {
  return `
    <div class="app-shell">
      ${renderHeader(false)}
      <main class="start-view" id="app-main">
        <span class="ghost-gene g1">作者 · 知识点</span>
        <span class="ghost-gene g2">节奏 · 语言特色</span>
        <span class="ghost-gene g3">背景 · 文化知识</span>
        <span class="ghost-gene g4">意象 · 画面元素</span>
        <span class="ghost-gene g5">修辞 · 表达方式</span>
        <section class="start-content" aria-labelledby="start-title">
          <h1 id="start-title">从一个主题，开始构建内容基因。</h1>
          <p class="start-lede">输入课程主题，或添加文档与链接。系统会先整理可确认的内容结构，再生成课件与视频。</p>
          <form id="start-form">
            <div class="composer">
              <label class="sr-only" for="topic-input">课程主题或任务描述</label>
              <textarea id="topic-input" name="topic" placeholder="例如：为小学三年级制作一节《咏柳》AI 视频课">${escapeHtml(state.topic === '《咏柳》' ? '' : state.topic)}</textarea>
              <input class="sr-only" id="material-input" type="file" accept=".pdf,.doc,.docx,.txt,.md" />
              <button class="icon-button composer-add" type="button" data-action="pick-file" aria-label="添加文档">${icon('plus')}</button>
              <button class="icon-button composer-submit" type="submit" aria-label="开始构建内容基因">${icon('arrow')}</button>
            </div>
            ${state.attachedFile ? `<p class="attached-file">已添加：${escapeHtml(state.attachedFile)}</p>` : ''}
            <div class="metadata-row">
              <label>受众：
                <select name="grade" aria-label="选择受众">
                  ${['小学三年级', '小学四年级', '小学五年级', '初中一年级'].map((item) => `<option ${item === state.grade ? 'selected' : ''}>${item}</option>`).join('')}
                </select>
              </label>
              <label>课时：
                <select name="lesson" aria-label="选择课时">
                  ${['1 课时', '2 课时', '3 课时'].map((item) => `<option ${item === state.lesson ? 'selected' : ''}>${item}</option>`).join('')}
                </select>
              </label>
              <label>输出：
                <select name="output" aria-label="选择输出内容">
                  ${['课件 + 视频', '仅课件', '仅视频'].map((item) => `<option ${item === state.output ? 'selected' : ''}>${item}</option>`).join('')}
                </select>
              </label>
            </div>
          </form>
          <div class="example-actions">
            <button class="text-button" type="button" data-action="sample-topic">试试《咏柳》</button>
            <button class="text-button" type="button" data-action="pick-file">从文档开始</button>
          </div>
          <p class="trust-line">先确认内容结构，再开始生成。所有步骤都可以返回修改。</p>
        </section>
      </main>
    </div>
  `;
}

function renderProjectMeta(status) {
  return `
    <div class="project-meta">
      <h1>${escapeHtml(state.topic)}</h1>
      <span>${escapeHtml(state.grade)}</span>
      <span>${escapeHtml(state.lesson)}</span>
      <span>${escapeHtml(state.style)}</span>
      <span class="project-state">${status}</span>
    </div>
  `;
}

function geneButton(key, extraClass) {
  const gene = state.genes[key];
  return `
    <button class="gene-node ${extraClass} ${state.selectedGene === key ? 'is-selected' : ''}" type="button" data-gene="${key}">
      ${icon(gene.icon)}<span><b>${escapeHtml(gene.label)}</b> · ${escapeHtml(gene.value)}</span>
    </button>
  `;
}

function renderStructure() {
  const selected = state.genes[state.selectedGene];
  return `
    <div class="app-shell project-shell">
      ${renderHeader(true)}
      ${renderProjectMeta('结构待确认')}
      <main class="workspace-view two-pane" id="app-main">
        <section class="main-pane has-composer" aria-labelledby="gene-title">
          <header class="section-heading">
            <h2 id="gene-title">内容基因</h2>
            <p>点击任一节点，查看或修改它如何影响后续课件与视频。</p>
          </header>
          <div class="gene-stage">
            <svg class="gene-lines" viewBox="0 0 1000 540" preserveAspectRatio="none" aria-hidden="true">
              <path d="M500 258 C500 185 500 145 500 92" />
              <path d="M500 258 C365 240 260 218 144 205" />
              <path d="M500 258 C635 240 740 218 856 205" />
              <path d="M500 258 C410 348 340 385 262 430" />
              <path d="M500 258 C590 348 660 385 738 430" />
              ${state.genes.mood ? '<path d="M500 330 C500 376 500 408 500 455" />' : ''}
            </svg>
            ${geneButton('author', 'gene-author')}
            ${geneButton('imagery', 'gene-imagery')}
            ${geneButton('rhythm', 'gene-rhythm')}
            ${geneButton('rhetoric', 'gene-rhetoric')}
            ${geneButton('context', 'gene-context')}
            ${state.genes.mood ? geneButton('mood', 'gene-mood') : ''}
            <div class="topic-gene">${escapeHtml(state.topic)}</div>
            ${state.genes.mood ? '' : `<button class="text-button add-gene" type="button" data-action="add-gene">${icon('plus')} 添加内容基因</button>`}
          </div>
          <form class="revision-composer" id="revision-form">
            <button class="icon-button" type="button" data-action="pick-file" aria-label="添加参考材料">${icon('plus')}</button>
            <input name="revision" aria-label="补充修改要求" placeholder="告诉我还需要调整什么，例如：减少古诗术语，增加画面感" />
            <button class="icon-button composer-submit" type="submit" aria-label="提交修改要求">${icon('arrow')}</button>
          </form>
        </section>
        <aside class="inspector" aria-labelledby="inspector-title">
          <p class="inspector-kicker" id="inspector-title">这会如何影响生成？</p>
          <div class="selected-gene"><i>${icon(selected.icon)}</i><span>${escapeHtml(selected.label)} · ${escapeHtml(selected.value)}</span></div>
          <p class="inspector-copy">${escapeHtml(selected.effect)}</p>
          <div class="field-row"><label for="course-focus">课件重点</label><input id="course-focus" data-gene-field="courseFocus" value="${escapeHtml(selected.courseFocus)}" /></div>
          <div class="field-row"><label for="video-hint">视频提示</label><input id="video-hint" data-gene-field="videoHint" value="${escapeHtml(selected.videoHint)}" /></div>
          <button class="text-button edit-action" type="button" data-action="focus-gene-field">修改</button>
          <section class="generation-plan">
            <h3>生成计划</h3>
            <p>8 页课件 · 4 个视频镜头 · 3 个可选版本</p>
            <button class="primary-button full-button" type="button" data-action="confirm-structure">确认结构并生成</button>
            <button class="text-button back-action" type="button" data-action="restart">返回修改主题</button>
          </section>
        </aside>
      </main>
    </div>
  `;
}

function renderSlidePreview(slide) {
  const extra = slide.type === 'quote'
    ? `<blockquote>“碧玉妆成一树高，<br />万条垂下绿丝绦。”</blockquote>`
    : slide.type === 'chips'
      ? '<div class="preview-chip-row"><span>观察</span><span>朗读</span><span>想象</span></div>'
      : slide.type === 'rhythm'
        ? '<div class="preview-chip-row"><span>二 / 二 / 三</span><span>停顿</span><span>重音</span></div>'
        : '';
  return `
    <div class="slide-preview-content">
      <small>${escapeHtml(slide.kicker)}</small>
      <h3>${escapeHtml(slide.title)}</h3>
      ${extra || `<p>${escapeHtml(slide.description)}</p>`}
    </div>
  `;
}

function renderCourseware() {
  const slide = slides[state.slide];
  return `
    <div class="app-shell project-shell">
      ${renderHeader(true)}
      ${renderProjectMeta('课件可编辑')}
      <main class="workspace-view editor-layout" id="app-main">
        <section class="editor-main" aria-labelledby="course-title">
          <header class="editor-topline">
            <div><h2 id="course-title">课件</h2><p>一次只编辑一页，内容结构始终可以返回调整。</p></div>
            <span>第 ${state.slide + 1} 页 / 共 8 页</span>
          </header>
          <div class="course-editor">
            <nav class="slide-rail" aria-label="课件页面">
              ${slides.map((item, index) => `<button class="slide-index ${index === state.slide ? 'is-active' : ''}" type="button" data-slide="${index}" aria-label="第 ${index + 1} 页：${escapeHtml(item.title)}">${String(index + 1).padStart(2, '0')}</button>`).join('')}
            </nav>
            <div class="slide-preview">${renderSlidePreview(slide)}</div>
          </div>
          <div class="editor-controls">
            <div>
              <button class="secondary-button" type="button" data-action="previous-slide" ${state.slide === 0 ? 'disabled' : ''}>上一页</button>
              <button class="secondary-button" type="button" data-action="next-slide" ${state.slide === slides.length - 1 ? 'disabled' : ''}>下一页</button>
            </div>
            <button class="primary-button" type="button" data-action="to-video">生成视频分镜 ${icon('arrow')}</button>
          </div>
        </section>
        <aside class="editor-inspector" aria-labelledby="slide-inspector-title">
          <h2 id="slide-inspector-title">第 ${state.slide + 1} 页</h2>
          <p>修改这一页不会影响已经确认的其他页面。</p>
          <label class="stacked-field"><span>页面标题</span><input data-slide-field="title" value="${escapeHtml(slide.title)}" /></label>
          <label class="stacked-field"><span>页面作用</span><select><option>${escapeHtml(slide.kicker)}</option><option>知识解释</option><option>课堂互动</option></select></label>
          <label class="stacked-field"><span>讲解说明</span><textarea data-slide-field="description">${escapeHtml(slide.description)}</textarea></label>
          <button class="secondary-button full-button" type="button" data-action="save-slide">保存这一页</button>
        </aside>
      </main>
    </div>
  `;
}

function formatTime(seconds) {
  const safeSeconds = Math.max(0, Math.round(seconds));
  return `${String(Math.floor(safeSeconds / 60)).padStart(2, '0')}:${String(safeSeconds % 60).padStart(2, '0')}`;
}

function getVideoDuration() {
  return state.shots.reduce((total, shot) => total + shot.duration, 0);
}

function getShotStart(index) {
  return state.shots.slice(0, index).reduce((total, shot) => total + shot.duration, 0);
}

function renderVideo() {
  const shot = state.shots[state.shot];
  const totalDuration = getVideoDuration();
  return `
    <div class="app-shell project-shell">
      ${renderHeader(true)}
      ${renderProjectMeta('分镜可编辑')}
      <main class="workspace-view editor-layout video-workspace" id="app-main">
        <section class="editor-main" aria-labelledby="video-title">
          <header class="editor-topline">
            <div><h2 id="video-title">视频</h2><p>每个镜头都能追溯到课件页面和内容基因。</p></div>
            <span>成片 ${formatTime(totalDuration)} · 镜头 ${state.shot + 1} / ${state.shots.length}</span>
          </header>
          <div class="video-frame" style="--shot: ${state.shot}">
            <img class="video-strip" src="assets/images/poem-storyboard.png" alt="《咏柳》东方绘本风格视频分镜" />
            <span class="video-origin" data-video-source>${escapeHtml(shot.source)}</span>
            <button class="icon-button play-control" type="button" data-action="toggle-play" aria-label="播放完整视频预览">${icon(playbackTimer ? 'pause' : 'play')}</button>
            <p class="narration-caption ${state.captions ? '' : 'is-hidden'}" data-video-caption>${escapeHtml(shot.narration)}</p>
            <div class="video-caption"><strong>${escapeHtml(shot.title)}</strong><span>${escapeHtml(shot.range)}</span></div>
          </div>
          <div class="video-playback-row">
            <div class="play-progress" aria-label="视频播放进度"><i style="width:${(state.videoProgress / totalDuration) * 100}%"></i></div>
            <span class="video-time" data-video-time>${formatTime(state.videoProgress)} / ${formatTime(totalDuration)}</span>
            <button class="media-toggle ${state.captions ? 'is-active' : ''}" type="button" data-action="toggle-captions" aria-pressed="${state.captions}" aria-label="${state.captions ? '关闭字幕' : '开启字幕'}">${icon('captions')}</button>
            <button class="media-toggle ${state.sound ? 'is-active' : ''}" type="button" data-action="toggle-sound" aria-pressed="${state.sound}" aria-label="${state.sound ? '关闭声音' : '开启声音'}">${icon(state.sound ? 'volume' : 'volumeOff')}</button>
          </div>
          <nav class="shot-timeline" aria-label="视频镜头时间线">
            ${state.shots.map((item, index) => `
              <button class="timeline-shot ${index === state.shot ? 'is-active' : ''}" style="--segment:${item.duration}" type="button" data-shot="${index}">
                <span>${String(index + 1).padStart(2, '0')}</span><strong>${escapeHtml(item.title)}</strong><small>${item.duration} 秒</small>
              </button>
            `).join('')}
          </nav>
          <div class="editor-controls" style="margin-left:0">
            <div><button class="secondary-button" type="button" data-step="courseware">返回课件</button></div>
            <button class="primary-button" type="button" data-action="to-versions">生成多个版本 ${icon('arrow')}</button>
          </div>
        </section>
        <aside class="editor-inspector" aria-labelledby="shot-inspector-title">
          <h2 id="shot-inspector-title">镜头 ${state.shot + 1} · ${escapeHtml(shot.title)}</h2>
          <p class="inspector-meta">${escapeHtml(shot.source)} · ${escapeHtml(shot.gene)}</p>
          <div class="shot-intent"><span>镜头目的</span><p>${escapeHtml(shot.purpose)}</p></div>
          <label class="stacked-field"><span>旁白</span><textarea data-shot-field="narration">${escapeHtml(shot.narration)}</textarea></label>
          <label class="stacked-field"><span>画面提示</span><textarea data-shot-field="prompt">${escapeHtml(shot.prompt)}</textarea></label>
          <div class="compact-field-grid">
            <label class="stacked-field"><span>景别</span><select data-shot-field="framing">${['远景', '全景', '中景', '近景', '特写'].map((item) => `<option ${item === shot.framing ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
            <label class="stacked-field"><span>运动</span><select data-shot-field="movement">${['固定', '缓慢推进', '缓慢拉远', '轻微横移', '跟随摇移'].map((item) => `<option ${item === shot.movement ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
          </div>
          <label class="stacked-field"><span>声音线索</span><input data-shot-field="audio" value="${escapeHtml(shot.audio)}" /></label>
          <button class="secondary-button full-button" type="button" data-action="save-shot">保存这个镜头</button>
        </aside>
      </main>
    </div>
  `;
}

function renderVersionComparison() {
  return `
    <section class="comparison-view" aria-labelledby="comparison-title">
      <header><div><h3 id="comparison-title">三个版本，保留同一内容骨架</h3><p>差异只发生在开场、节奏和课堂互动，不改变已确认的知识结构。</p></div><button class="text-button" type="button" data-action="toggle-comparison">返回预览</button></header>
      <div class="comparison-grid" role="table" aria-label="版本差异比较">
        <div class="comparison-row comparison-head" role="row"><span>版本</span><span>时长</span><span>开场</span><span>课堂节奏</span><span>互动</span></div>
        ${Object.entries(state.variants).map(([key, item]) => `
          <button class="comparison-row ${key === state.variant ? 'is-active' : ''}" type="button" data-variant="${key}" role="row">
            <strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.duration)}</span><span>${escapeHtml(item.opening)}</span><span>${escapeHtml(item.pacing)}</span><span>${escapeHtml(item.interaction)}</span>
          </button>
        `).join('')}
      </div>
      <p class="comparison-note">选择任一行即可继续编辑该版本。</p>
    </section>
  `;
}

function renderVersions() {
  const selected = state.variants[state.variant];
  return `
    <div class="app-shell project-shell">
      ${renderHeader(true)}
      ${renderProjectMeta('版本已生成')}
      <main class="workspace-view editor-layout version-workspace" id="app-main">
        <section class="editor-main" aria-labelledby="version-title">
          <header class="editor-topline">
            <div><h2 id="version-title">多版本</h2><p>共享同一组内容基因，但服务不同的课堂节奏。</p></div>
            <div class="topline-actions"><span>3 个版本</span><button class="secondary-button compact-button ${state.showComparison ? 'is-active' : ''}" type="button" data-action="toggle-comparison">${icon('compare')} 比较差异</button></div>
          </header>
          ${state.showComparison ? renderVersionComparison() : `<div class="variant-layout">
            <nav class="variant-list" aria-label="选择内容版本">
              ${Object.entries(state.variants).map(([key, item]) => `
                <button class="variant-row ${key === state.variant ? 'is-active' : ''}" type="button" data-variant="${key}">
                  <strong>${escapeHtml(item.name)}</strong><span>${escapeHtml(item.note)}</span><em>${escapeHtml(item.duration)} · ${escapeHtml(item.interaction)}</em>${icon('arrow')}
                </button>
              `).join('')}
            </nav>
            <div class="variant-preview">
              <div class="video-frame" style="--shot: ${selected.shot}; --variant-accent:${selected.accent}">
                <img class="video-strip" src="assets/images/poem-storyboard.png" alt="${escapeHtml(selected.name)}预览画面" />
                <span class="version-opening">${escapeHtml(selected.opening)}</span>
                <div class="video-caption"><strong>${escapeHtml(selected.name)}</strong><span>${escapeHtml(selected.duration)}</span></div>
              </div>
              <div class="variant-preview-progress" aria-hidden="true"><i></i></div>
              <p class="variant-caption">${escapeHtml(selected.caption)}</p>
              <section class="variant-differences" aria-labelledby="difference-title"><h3 id="difference-title">这个版本改变了什么</h3>${selected.changes.map((change) => `<div><span>${escapeHtml(change.label)}</span><p>${escapeHtml(change.value)}</p></div>`).join('')}</section>
              <div class="variant-summary">
                <p>${escapeHtml(selected.fit)}</p>
                <div>
                  <button class="secondary-button" type="button" data-action="preview-version">预览</button>
                  <button class="primary-button" type="button" data-action="export-version">${icon('download')} 导出方案</button>
                </div>
              </div>
            </div>
          </div>`}
        </section>
        <aside class="editor-inspector" aria-labelledby="version-inspector-title">
          <h2 id="version-inspector-title">${escapeHtml(selected.name)}</h2>
          <p>${escapeHtml(selected.note)}<br />${escapeHtml(selected.fit)}</p>
          <label class="stacked-field"><span>开场方式</span><select data-variant-field="opening">${['直接进入诗歌画面', '从春风的视角进入', '先看画面再出现诗句', '教师提问开场'].map((item) => `<option ${item === selected.opening ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
          <label class="stacked-field"><span>课堂节奏</span><select data-variant-field="pacing">${['均衡推进', '舒缓叙事', '三次停顿', '快速复习'].map((item) => `<option ${item === selected.pacing ? 'selected' : ''}>${item}</option>`).join('')}</select></label>
          <label class="stacked-field"><span>教师提示</span><textarea data-variant-field="teacherPrompt">${escapeHtml(selected.teacherPrompt)}</textarea></label>
          <div class="export-inventory"><span>方案包含</span><p>8 页课件 · 4 个镜头 · 教师提示 · 内容溯源</p></div>
          <button class="secondary-button full-button" type="button" data-action="save-version">保存版本设置</button>
        </aside>
      </main>
    </div>
  `;
}

function render() {
  stopPlayback();
  const views = {
    start: renderStart,
    structure: renderStructure,
    courseware: renderCourseware,
    video: renderVideo,
    versions: renderVersions,
  };
  app.innerHTML = (views[state.view] || renderStart)();
  requestAnimationFrame(reportWorkbenchHeight);
}

function showToast(message, duration = 1800) {
  window.clearTimeout(toastTimer);
  toast.textContent = message;
  toast.classList.add('is-visible');
  toastTimer = window.setTimeout(() => toast.classList.remove('is-visible'), duration);
}

function runProcessing(message, nextView, unlocked) {
  const overlay = document.createElement('div');
  overlay.className = 'processing-layer';
  overlay.setAttribute('role', 'status');
  overlay.innerHTML = `<div class="processing-card"><div class="processing-orbit"></div><strong>${escapeHtml(message)}</strong><span>正在保持内容之间的可追溯关系</span></div>`;
  document.body.append(overlay);
  const delay = window.matchMedia('(prefers-reduced-motion: reduce)').matches ? 120 : 820;
  window.setTimeout(() => {
    state.view = nextView;
    state.unlocked = Math.max(state.unlocked, unlocked);
    overlay.remove();
    render();
  }, delay);
}

function resetProject() {
  state = freshState();
  render();
}

function saveInputValues(selector, target) {
  const input = app.querySelector(selector);
  if (input) target(input.value);
}

app.addEventListener('click', (event) => {
  const actionTarget = event.target.closest('[data-action]');
  const stepTarget = event.target.closest('[data-step]');
  const geneTarget = event.target.closest('[data-gene]');
  const slideTarget = event.target.closest('[data-slide]');
  const shotTarget = event.target.closest('[data-shot]');
  const variantTarget = event.target.closest('[data-variant]');

  if (stepTarget && !stepTarget.disabled) {
    const index = steps.findIndex((step) => step.key === stepTarget.dataset.step);
    if (index >= 0 && index <= state.unlocked) {
      state.view = stepTarget.dataset.step;
      render();
    }
    return;
  }
  if (geneTarget) {
    state.selectedGene = geneTarget.dataset.gene;
    render();
    return;
  }
  if (slideTarget) {
    state.slide = Number(slideTarget.dataset.slide);
    render();
    return;
  }
  if (shotTarget) {
    state.shot = Number(shotTarget.dataset.shot);
    state.videoProgress = getShotStart(state.shot);
    render();
    return;
  }
  if (variantTarget) {
    state.variant = variantTarget.dataset.variant;
    render();
    return;
  }
  if (!actionTarget) return;

  const action = actionTarget.dataset.action;
  if (action === 'show-sample') sampleDialog.showModal();
  if (action === 'show-help') helpDialog.showModal();
  if (action === 'pick-file') app.querySelector('#material-input')?.click();
  if (action === 'sample-topic') {
    const input = app.querySelector('#topic-input');
    if (input) {
      input.value = '为小学三年级制作一节《咏柳》AI 视频课';
      input.focus();
    }
  }
  if (action === 'restart') resetProject();
  if (action === 'focus-gene-field') app.querySelector('#course-focus')?.focus();
  if (action === 'add-gene') {
    state.genes.mood = {
      label: '情绪', value: '春日轻盈', effect: '课件与视频会共同保持轻盈、清新的情绪，不使用过度煽情的表达。',
      courseFocus: '轻盈、清晰', videoHint: '柔和春光与舒缓运动', icon: 'leaf',
    };
    state.selectedGene = 'mood';
    showToast('已添加“情绪”内容基因');
    render();
  }
  if (action === 'confirm-structure') runProcessing('正在生成课件结构', 'courseware', 1);
  if (action === 'previous-slide') { state.slide = Math.max(0, state.slide - 1); render(); }
  if (action === 'next-slide') { state.slide = Math.min(slides.length - 1, state.slide + 1); render(); }
  if (action === 'save-slide') showToast(`第 ${state.slide + 1} 页已保存`);
  if (action === 'to-video') runProcessing('正在把课件转换为视频分镜', 'video', 2);
  if (action === 'toggle-play') togglePlayback();
  if (action === 'toggle-captions') { state.captions = !state.captions; render(); }
  if (action === 'toggle-sound') { state.sound = !state.sound; render(); }
  if (action === 'save-shot') showToast(`镜头 ${state.shot + 1} 已保存`);
  if (action === 'to-versions') runProcessing('正在生成适配不同课堂节奏的版本', 'versions', 3);
  if (action === 'toggle-comparison') { state.showComparison = !state.showComparison; render(); }
  if (action === 'preview-version') startVersionPreview();
  if (action === 'export-version') exportVersion();
  if (action === 'save-version') showToast(`${state.variants[state.variant].name}设置已保存`);
});

app.addEventListener('submit', (event) => {
  event.preventDefault();
  if (event.target.id === 'start-form') {
    const data = new FormData(event.target);
    const rawTopic = String(data.get('topic') || '').trim();
    state.topic = rawTopic.includes('《咏柳》') || !rawTopic ? '《咏柳》' : rawTopic;
    state.grade = String(data.get('grade') || state.grade);
    state.lesson = String(data.get('lesson') || state.lesson);
    state.output = String(data.get('output') || state.output);
    runProcessing('正在整理可确认的内容结构', 'structure', 0);
  }
  if (event.target.id === 'revision-form') {
    const data = new FormData(event.target);
    const revision = String(data.get('revision') || '').trim();
    if (!revision) return;
    state.genes[state.selectedGene].effect = `${state.genes[state.selectedGene].effect} 已补充要求：${revision}`;
    showToast('修改要求已加入当前内容基因');
    event.target.reset();
  }
});

app.addEventListener('change', (event) => {
  if (event.target.id === 'material-input') {
    const file = event.target.files?.[0];
    if (file) {
      state.attachedFile = file.name;
      showToast(`已添加参考材料：${file.name}`);
      if (state.view === 'start') render();
    }
  }
  const shotField = event.target.dataset.shotField;
  if (shotField) state.shots[state.shot][shotField] = event.target.value;
  const variantField = event.target.dataset.variantField;
  if (variantField) state.variants[state.variant][variantField] = event.target.value;
});

app.addEventListener('input', (event) => {
  const geneField = event.target.dataset.geneField;
  if (geneField && state.genes[state.selectedGene]) state.genes[state.selectedGene][geneField] = event.target.value;
  const slideField = event.target.dataset.slideField;
  if (slideField) slides[state.slide][slideField] = event.target.value;
  const shotField = event.target.dataset.shotField;
  if (shotField) state.shots[state.shot][shotField] = event.target.value;
  const variantField = event.target.dataset.variantField;
  if (variantField) state.variants[state.variant][variantField] = event.target.value;
});

sampleDialog.addEventListener('click', (event) => {
  if (!event.target.closest('[data-dialog-action="use-sample"]')) return;
  sampleDialog.close();
  state.topic = '《咏柳》';
  state.grade = '小学三年级';
  state.lesson = '1 课时';
  state.output = '课件 + 视频';
  render();
  const input = app.querySelector('#topic-input');
  if (input) input.value = '为小学三年级制作一节《咏柳》AI 视频课';
});

function stopPlayback() {
  window.clearInterval(playbackTimer);
  playbackTimer = null;
}

function updateVideoDom(progress) {
  const frame = app.querySelector('.video-frame');
  const progressBar = app.querySelector('.play-progress i');
  const playButton = app.querySelector('[data-action="toggle-play"]');
  const current = state.shots[state.shot];
  if (frame) frame.style.setProperty('--shot', String(state.shot));
  if (progressBar) progressBar.style.width = `${progress}%`;
  app.querySelectorAll('[data-shot]').forEach((button, index) => button.classList.toggle('is-active', index === state.shot));
  if (playButton) {
    playButton.innerHTML = icon(playbackTimer ? 'pause' : 'play');
    playButton.setAttribute('aria-label', playbackTimer ? '暂停视频预览' : '播放完整视频预览');
  }
  const title = app.querySelector('.video-caption strong');
  const range = app.querySelector('.video-caption span');
  const caption = app.querySelector('[data-video-caption]');
  const source = app.querySelector('[data-video-source]');
  const time = app.querySelector('[data-video-time]');
  if (title) title.textContent = current.title;
  if (range) range.textContent = current.range;
  if (caption) caption.textContent = current.narration;
  if (source) source.textContent = current.source;
  if (time) time.textContent = `${formatTime(state.videoProgress)} / ${formatTime(getVideoDuration())}`;
}

function togglePlayback() {
  if (playbackTimer) {
    stopPlayback();
    updateVideoDom((state.videoProgress / getVideoDuration()) * 100);
    return;
  }
  const total = getVideoDuration();
  if (state.videoProgress >= total) state.videoProgress = 0;
  playbackTimer = window.setInterval(() => {
    state.videoProgress = Math.min(total, state.videoProgress + 2);
    let elapsed = 0;
    state.shot = state.shots.findIndex((shot) => {
      elapsed += shot.duration;
      return state.videoProgress < elapsed;
    });
    if (state.shot < 0) state.shot = state.shots.length - 1;
    updateVideoDom(Math.min(100, (state.videoProgress / total) * 100));
    if (state.videoProgress >= total) {
      stopPlayback();
      updateVideoDom(100);
    }
  }, 160);
  updateVideoDom((state.videoProgress / total) * 100);
}

function startVersionPreview() {
  const selected = state.variants[state.variant];
  showToast(`正在预览：${selected.name}`, 2200);
  const frame = app.querySelector('.variant-preview .video-frame');
  const progress = app.querySelector('.variant-preview-progress i');
  const previewButton = app.querySelector('[data-action="preview-version"]');
  if (!frame || !progress) return;
  if (previewButton) {
    previewButton.textContent = '正在预览';
    previewButton.disabled = true;
  }
  frame.animate(
    [{ filter: 'brightness(1)', transform: 'scale(1)' }, { filter: 'brightness(.92) saturate(1.08)', transform: 'scale(1.008)' }, { filter: 'brightness(1)', transform: 'scale(1)' }],
    { duration: 2200, easing: 'ease-in-out' },
  );
  const progressAnimation = progress.animate([{ width: '0%' }, { width: '100%' }], { duration: 2200, easing: 'linear' });
  progressAnimation.finished.finally(() => {
    if (previewButton?.isConnected) {
      previewButton.textContent = '再次预览';
      previewButton.disabled = false;
    }
  });
}

function exportVersion() {
  const selected = state.variants[state.variant];
  const summary = [
    'AI 内容再创作工作台',
    `主题：${state.topic}`,
    `版本：${selected.name}`,
    `说明：${selected.note}`,
    `适用课堂：${selected.fit}`,
    `视频时长：${selected.duration}`,
    `开场方式：${selected.opening}`,
    `课堂节奏：${selected.pacing}`,
    `互动方式：${selected.interaction}`,
    `教师提示：${selected.teacherPrompt}`,
    '',
    '版本差异：',
    ...selected.changes.map((change) => `- ${change.label}：${change.value}`),
    '',
    '视频镜头：',
    ...state.shots.map((shot, index) => `${index + 1}. ${shot.title}（${shot.range}）\n   来源：${shot.source}\n   内容基因：${shot.gene}\n   旁白：${shot.narration}`),
    '',
    '内容基因：',
    ...Object.values(state.genes).map((gene) => `- ${gene.label}：${gene.value}`),
  ].join('\n');
  const url = URL.createObjectURL(new Blob([summary], { type: 'text/plain;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `咏柳-${selected.name}-内容方案.txt`;
  link.click();
  URL.revokeObjectURL(url);
  showToast(`${selected.name}方案已导出`);
}

function reportWorkbenchHeight() {
  if (window.parent === window) return;
  window.parent.postMessage({
    type: 'workflow:height',
    height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight),
  }, '*');
}

window.addEventListener('wheel', (event) => {
  if (window.parent === window) return;
  event.preventDefault();
  window.parent.postMessage({ type: 'workflow:wheel', deltaY: event.deltaY }, '*');
}, { passive: false });

let bridgeTouchY = null;
window.addEventListener('touchstart', (event) => {
  bridgeTouchY = event.touches[0]?.clientY ?? null;
}, { passive: true });
window.addEventListener('touchmove', (event) => {
  if (window.parent === window) return;
  const nextY = event.touches[0]?.clientY;
  if (bridgeTouchY === null || typeof nextY !== 'number') return;
  const deltaY = bridgeTouchY - nextY;
  bridgeTouchY = nextY;
  if (Math.abs(deltaY) < 1) return;
  event.preventDefault();
  window.parent.postMessage({ type: 'workflow:wheel', deltaY }, '*');
}, { passive: false });
window.addEventListener('touchend', () => { bridgeTouchY = null; }, { passive: true });
window.addEventListener('touchcancel', () => { bridgeTouchY = null; }, { passive: true });

window.addEventListener('keydown', (event) => {
  if (event.key === 'Tab') document.body.classList.add('is-keyboard-nav');
}, { capture: true });
window.addEventListener('pointerdown', () => {
  document.body.classList.remove('is-keyboard-nav');
}, { capture: true });

window.addEventListener('load', reportWorkbenchHeight, { once: true });
window.addEventListener('resize', reportWorkbenchHeight, { passive: true });
document.fonts?.ready.then(reportWorkbenchHeight).catch(() => {});
new ResizeObserver(reportWorkbenchHeight).observe(document.documentElement);

render();
