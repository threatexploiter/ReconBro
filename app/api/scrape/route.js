import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";

export async function POST(req) {
  try {
    const { input } = await req.json();

    const urls = Array.isArray(input)
      ? input
      : [];

    if (!urls.length) {
      return NextResponse.json({ error: "No URLs provided" }, { status: 400 });
    }

    const script = path.resolve(process.cwd(), "scripts", "scrape.js");

    const joined = urls.join("||");

    const child = spawn("node", [script, joined], {
      stdio: "inherit",   
      shell: true         
    });

    return NextResponse.json({
      success: true,
      message: "Scraping started (foreground)"
    });

  } catch (err) {
    console.error("SCRAPE ROUTE ERROR:", err);
    return NextResponse.json({ error: String(err) }, { status: 500 });
  }
}
