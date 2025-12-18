import { scrapeBugcrowdScope } from "../lib/BugcrowdScraper.js";
import { scrapeIntigritiScope } from "../lib/IntigritiScraper.js";
import { scrapeYesWeHackScope } from "../lib/YesWeHackScraper.js";
import { fetchHackeroneAssets } from "../lib/hackerone.js";
import fs from "fs";
import path from "path";
const raw = process.argv[2];
if (!raw) {
  console.error("No input provided to scraper");
  process.exit(1);
}

const targets = raw.split("||").filter(Boolean);

for (const url of targets) {
  console.log("[*] Scraping:", url);

  if (url.includes("bugcrowd.com")) {
    await scrapeBugcrowdScope(url);
  } else if (url.includes("intigriti.com")) {
    await scrapeIntigritiScope(url);
  } else if (url.includes("yeswehack.com")) {
    await scrapeYesWeHackScope(url);
  }
  else if(url.includes("hackerone.com")){
    await fetchHackeroneAssets(url);
  } else {
    console.error("Unsupported URL:", url);
  }
}

const STATUS_DIR = path.join(process.cwd(), "job-status");

fs.mkdirSync(STATUS_DIR, { recursive: true });

const statusFile = path.join(
  STATUS_DIR,
  `scrape-${Date.now()}.json`
);

fs.writeFileSync(
  statusFile,
  JSON.stringify({
    type: "scrape",
    status: "finished",
    finishedAt: new Date().toISOString()
  }, null, 2)
);


console.log("[+] Scraping finished");
process.exit(0);
