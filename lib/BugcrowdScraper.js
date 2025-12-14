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
  return /(play\.google\.com|apps\.apple\.com)/i.test(v);
}

function cleanValue(v) {
  return v
    .replace(/\s+/g, " ")
    .replace(/[()]/g, "")
    .trim();
}



export async function scrapeBugcrowdScope(url) {
  const slug = url.split("/engagements/")[1]?.split("#")[0];
  if (!slug) throw new Error("Invalid Bugcrowd URL");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(`https://bugcrowd.com/engagements/${slug}`, {
    waitUntil: "networkidle"
  });

  await page.waitForSelector("text=In scope", { timeout: 20000 });

  const inScopeAssets = await page.evaluate(() => {
    const section = [...document.querySelectorAll("section")]
      .find(s => s.innerText.toLowerCase().includes("in scope"));
    if (!section) return [];

    return [...section.querySelectorAll("a, code, li")]
      .map(e => e.innerText.trim())
      .filter(Boolean);
  });

  await browser.close();
 
  const roots = new Set();
  const urls = new Set();
  const ips = new Set();
  const apps = new Set();

  for (const raw of inScopeAssets) {
    const v = cleanValue(raw);

    if (isWildcardDomain(v)) roots.add(v);
    else if (isIP(v)) ips.add(v);
    else if (isApp(v)) apps.add(v);
    else if (isDomainOrUrl(v)) urls.add(v);
  }
 
  const programDir = path.join(OUTPUT_DIR, slug);
  fs.mkdirSync(programDir, { recursive: true });

  fs.writeFileSync(
    path.join(programDir, "wildcards.txt"),
    [...roots].sort().join("\n")
  );

  fs.writeFileSync(
    path.join(programDir, "urls.txt"),
    [...urls].sort().join("\n")
  );

  fs.writeFileSync(
    path.join(programDir, "ips.txt"),
    [...ips].sort().join("\n")
  );

  fs.writeFileSync(
    path.join(programDir, "apps.txt"),
    [...apps].sort().join("\n")
  );

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
