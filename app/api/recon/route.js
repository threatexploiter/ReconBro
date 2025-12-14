import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(req) {
  const { type } = await req.json();

  let targetDir;

  if (type === "hackerone") {
    targetDir = path.join(process.cwd(), "hackerone-results");
  } else {
    targetDir = path.join(process.cwd(), "output");
  }

  if (!fs.existsSync(targetDir)) {
    return NextResponse.json(
      { error: "Target directory not found" },
      { status: 400 }
    );
  }

  const script = path.join(process.cwd(), "Recon.sh");

  spawn("bash", [script, targetDir], {
    stdio: "inherit",
    shell: true
  });

  return NextResponse.json({
    success: true,
    message: `Recon started on ${type} targets`
  });
}
