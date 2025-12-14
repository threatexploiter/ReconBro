import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req) {
  try {
    const { targets } = await req.json();

    if (!Array.isArray(targets) || targets.length === 0) {
      return NextResponse.json(
        { error: "targets must be a non-empty array" },
        { status: 400 }
      );
    }

    const script = path.resolve(process.cwd(), "scripts", "scrape.js");

    for (const url of targets) {
      console.log(`[+] Starting scrape for: ${url}`);

      const child = spawn("node", [script, url], {
        stdio: ["ignore", "pipe", "pipe"],
        windowsHide: true,   
        shell: false         
      });

      child.stdout.on("data", (data) => {
        console.log(`[SCRAPE ${url}] ${data.toString().trim()}`);
      });

      child.stderr.on("data", (data) => {
        console.error(`[SCRAPE ERROR ${url}] ${data.toString().trim()}`);
      });

      child.on("close", (code) => {
        console.log(`[✓] Scrape finished for ${url} (exit code ${code})`);
      });
    }

    return NextResponse.json({
      success: true,
      message: `Scraping started for ${targets.length} target(s)`
    });

  } catch (err) {
    console.error(err);
    return NextResponse.json(
      { error: String(err) },
      { status: 500 }
    );
  }
}
