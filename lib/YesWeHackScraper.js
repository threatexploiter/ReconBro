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
 

export async function scrapeYesWeHackScope(url) {
  const slug = url.split("/programs/")[1]?.split("#")[0];
  if (!slug) throw new Error("Invalid YesWeHack URL");

  const browser = await chromium.launch({ headless: true });
  const page = await browser.newPage();

  await page.goto(
    `https://yeswehack.com/programs/${slug}`,
    { waitUntil: "networkidle" }
  );
 
  await page.waitForSelector("table", { timeout: 20000 });

  const scopeValues = await page.evaluate(() => {
    const rows = Array.from(document.querySelectorAll("table tbody tr"));

    return rows.map(row => {
      const firstCell = row.querySelector("td");
      return firstCell ? firstCell.innerText.trim() : null;
    }).filter(Boolean);
  });

  await browser.close();
 

  const roots = new Set();
  const urls = new Set();
  const ips = new Set();
  const apps = new Set();

  for (const raw of scopeValues) {
    const v = cleanValue(raw);

    if (isWildcardDomain(v)) roots.add(v);
    else if (isIP(v)) ips.add(v);
    else if (isApp(v)) apps.add(v);
    else if (isDomainOrUrl(v)) urls.add(v);
  }
 

  const programDir = path.join(OUTPUT_DIR, slug);
  fs.mkdirSync(programDir, { recursive: true });

  fs.writeFileSync(
    path.join(programDir, "roots.txt"),
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
