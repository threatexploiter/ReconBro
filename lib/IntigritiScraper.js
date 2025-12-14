import { chromium } from "playwright";
import fs from "fs";
import path from "path";

const OUTPUT_DIR = path.join(process.cwd(), "output");

function isWildcardDomain(v) {
  return /^\*\.[a-z0-9.-]+\.[a-z]{2,}$/i.test(v);
}

function isDomainOrUrl(v) {
  return (
    /^https?:\/\/[^\s]+$/i.test(v) ||
    /^([a-z0-9-]+\.)+[a-z]{2,}(\/.*)?$/i.test(v)
  );
}

function isIP(v) {
  return /^\d{1,3}(\.\d{1,3}){3}(\/\d{1,2})?$/.test(v);
}

function isApp(v) {
  return /(play\.google\.com|apps\.apple\.com|itunes\.apple\.com)/i.test(v);
}

function cleanValue(v) {
  return v.replace(/\s+/g, " ").trim();
}

export async function scrapeIntigritiScope(url) {
  const parts = url.split("/programs/");
  if (!parts[1]) throw new Error("Invalid Intigriti URL");

  const slug = parts[1].split("/detail")[0].replace(/\//g, "-");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(url, { waitUntil: "networkidle" });

  // Scroll to force lazy-loaded assets
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
  });

  // Wait for ANY domain-like asset to appear
  await page.waitForFunction(() => {
    return [...document.querySelectorAll("a, div, span")]
      .some(e =>
        e.innerText &&
        e.innerText.match(/([a-z0-9-]+\.)+[a-z]{2,}/i)
      );
  }, { timeout: 20000 });

  const assetValues = await page.evaluate(() => {
    const values = new Set();

    document.querySelectorAll("a, div, span").forEach(el => {
      const text = el.innerText?.trim();
      if (!text) return;

      // Ignore obvious UI noise
      if (
        text.length > 200 ||
        text.includes("cookie") ||
        text.includes("Skill") ||
        text.includes("Tier") ||
        text.includes("Expand") ||
        text.includes("Filter") ||
        text.includes("Android") ||
        text === "URL" ||
        text === "Other" ||
        text === "iOS"
      ) {
        return;
      }

      if (
        text.match(/^\*\./) ||
        text.match(/^https?:\/\//) ||
        text.match(/^([a-z0-9-]+\.)+[a-z]{2,}$/i) ||
        text.match(/^\d{1,3}(\.\d{1,3}){3}/)
      ) {
        values.add(text);
      }
    });

    return [...values];
  });

  await browser.close();


  const roots = new Set();
  const urls = new Set();
  const ips = new Set();
  const apps = new Set();

  for (const raw of assetValues) {
    const v = cleanValue(raw);

    if (isWildcardDomain(v)) roots.add(v);
    else if (isIP(v)) ips.add(v);
    else if (isApp(v)) apps.add(v);
    else if (isDomainOrUrl(v)) urls.add(v);
  }

  const programDir = path.join(OUTPUT_DIR, slug);
  fs.mkdirSync(programDir, { recursive: true });

  fs.writeFileSync(path.join(programDir, "roots.txt"), [...roots].sort().join("\n"));
  fs.writeFileSync(path.join(programDir, "urls.txt"), [...urls].sort().join("\n"));
  fs.writeFileSync(path.join(programDir, "ips.txt"), [...ips].sort().join("\n"));
  fs.writeFileSync(path.join(programDir, "apps.txt"), [...apps].sort().join("\n"));

  return {
    program: slug,
    counts: {
      roots: roots.size,
      urls: urls.size,
      ips: ips.size,
      apps: apps.size
    }
  };
}
