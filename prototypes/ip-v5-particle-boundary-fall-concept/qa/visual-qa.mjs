import { createRequire } from "node:module";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const require = createRequire(import.meta.url);
const { chromium } = require("C:/Users/ASUS/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/node_modules/playwright");
const here = dirname(fileURLToPath(import.meta.url));
const pageUrl = pathToFileURL(join(here, "..", "index.html")).href;

const browser = await chromium.launch({
  headless: true,
  executablePath: "C:/Program Files/Google/Chrome/Application/chrome.exe",
  args: ["--allow-file-access-from-files"],
});

const results = [];

async function waitForImages(page) {
  await page.waitForFunction(() => [...document.images].every((image) => image.complete), null, { timeout: 20000 });
  await page.waitForTimeout(700);
}

async function captureDesktop() {
  const page = await browser.newPage({ viewport: { width: 1440, height: 900 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(pageUrl, { waitUntil: "load" });
  await waitForImages(page);

  const baseAudit = await page.evaluate(() => {
    const brokenImages = [...document.images]
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute("src"));
    const figures2d = document.querySelectorAll(".study-2d figure").length;
    const figures3d = document.querySelectorAll(".study-3d figure").length;
    const left = document.querySelector(".study-2d").getBoundingClientRect();
    const right = document.querySelector(".study-3d").getBoundingClientRect();
    const heroStage = document.querySelector("#hero-character").getBoundingClientRect();
    const seamAudit = [...document.querySelectorAll(".flow-seam")].map((seam) => ({
      baseFilter: getComputedStyle(seam).filter,
      panelFilter: getComputedStyle(seam, "::before").filter,
      height: Math.round(seam.getBoundingClientRect().height),
    }));
    return {
      brokenImages,
      figures2d,
      figures3d,
      groupWidthDelta: Math.abs(left.width - right.width),
      heroStageInsets: {
        right: Math.round(window.innerWidth - heroStage.right),
        bottom: Math.round(window.innerHeight - heroStage.bottom),
      },
      seamAudit,
      horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
    };
  });

  await page.screenshot({ path: join(here, "desktop-01-hero.png") });

  for (const [index, seam] of (await page.locator(".flow-seam").all()).entries()) {
    await seam.scrollIntoViewIfNeeded();
    await page.waitForTimeout(360);
    await page.screenshot({ path: join(here, `desktop-seam-${index + 1}.png`) });
  }

  const characterStage = await page.locator("#hero-character").boundingBox();
  const heroInteractions = {};
  if (characterStage) {
    await page.mouse.move(characterStage.x + characterStage.width * 0.14, characterStage.y + characterStage.height * 0.46);
    await page.waitForTimeout(180);
    heroInteractions.leftHover = await page.evaluate(() => ({
      label: document.querySelector("#pose-name")?.textContent,
      sideVisible: document.querySelector(".pose-side")?.classList.contains("is-visible"),
    }));

    await page.mouse.move(characterStage.x + characterStage.width * 0.86, characterStage.y + characterStage.height * 0.46);
    await page.waitForTimeout(180);
    heroInteractions.rightHover = await page.evaluate(() => ({
      label: document.querySelector("#pose-name")?.textContent,
      backVisible: document.querySelector(".pose-back")?.classList.contains("is-visible"),
    }));
    await page.mouse.move(16, 180);
    await page.waitForTimeout(180);
  }

  for (const [name, selector, progress] of [
    ["desktop-02-evolution", "#evolution", 0.38],
    ["desktop-03-story", "#story", 0.46],
    ["desktop-04-ayao-expressions", "#ayao", 0.08],
    ["desktop-05-ayao-scenes", "#ayao", 0.86],
  ]) {
    await page.evaluate(({ selector, progress }) => {
      const section = document.querySelector(selector);
      const top = window.scrollY + section.getBoundingClientRect().top;
      const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
      window.scrollTo(0, top + travel * progress);
    }, { selector, progress });
    await page.waitForTimeout(950);
    await page.screenshot({ path: join(here, `${name}.png`) });
  }

  await page.locator('[data-mode="outfits"]').click();
  await page.waitForTimeout(620);
  await waitForImages(page);
  const ayaoInteraction = await page.evaluate(() => ({
    selected: document.querySelector('[data-mode="outfits"]')?.getAttribute("aria-selected"),
    readout: document.querySelector("#ayao-mode-readout")?.textContent,
    loadedOutfitTiles: [...document.querySelectorAll(".media-tile img")]
      .filter((image) => image.getAttribute("src")?.includes("ayao-outfit-")).length,
  }));

  await page.evaluate(() => {
    const section = document.querySelector("#story");
    const top = window.scrollY + section.getBoundingClientRect().top;
    const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
    window.scrollTo(0, top + travel * 0.24);
  });
  await page.waitForTimeout(240);
  await page.locator(".story-dots button").nth(4).click();
  await page.waitForTimeout(1200);
  const storyInteraction = await page.evaluate(() => ({
    readout: document.querySelector("#story-index")?.textContent,
    activeDot: [...document.querySelectorAll(".story-dots button")]
      .findIndex((button) => button.classList.contains("is-active")) + 1,
  }));

  results.push({
    viewport: "1440x900",
    ...baseAudit,
    interactions: { hero: heroInteractions, ayao: ayaoInteraction, story: storyInteraction },
    consoleErrors: errors,
  });
  await page.close();
}

async function captureMobile() {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1 });
  const errors = [];
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto(pageUrl, { waitUntil: "load" });
  await waitForImages(page);
  await page.screenshot({ path: join(here, "mobile-01-hero.png") });

  await page.evaluate(() => {
    const section = document.querySelector("#ayao");
    const top = window.scrollY + section.getBoundingClientRect().top;
    const travel = Math.max(section.offsetHeight - window.innerHeight, 1);
    window.scrollTo(0, top + travel * 0.56);
  });
  await page.waitForTimeout(900);
  await page.screenshot({ path: join(here, "mobile-02-ayao.png") });

  const audit = await page.evaluate(() => ({
    brokenImages: [...document.images]
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute("src")),
    horizontalOverflow: document.documentElement.scrollWidth - window.innerWidth,
  }));
  results.push({ viewport: "390x844", ...audit, consoleErrors: errors });
  await page.close();
}

await captureDesktop();
await captureMobile();
await browser.close();
process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
