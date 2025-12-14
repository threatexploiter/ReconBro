import { NextResponse } from "next/server";
import { spawn } from "child_process";
import path from "path";
import fs from "fs";

export async function POST(req) {
  const { type } = await req.json();

  let targetDir;
  let scriptPath;

  if (type === "hackerone") {
    targetDir = path.join(process.cwd(), "hackerone-results");
    scriptPath = path.join(targetDir, "Recon.sh");
  } else {
    targetDir = path.join(process.cwd(), "output");
    scriptPath = path.join(targetDir, "Recon.sh");
  }

  if (!fs.existsSync(targetDir)) {
    return NextResponse.json(
      { error: "Target directory not found" },
      { status: 400 }
    );
  }

  if (!fs.existsSync(scriptPath)) {
    return NextResponse.json(
      { error: "Recon.sh not found in target directory" },
      { status: 400 }
    );
  }

  spawn("bash", [scriptPath], {
    cwd: targetDir,
    stdio: "inherit",
    shell: true
  });

  return NextResponse.json({
    success: true,
    message: `Recon started using ${scriptPath}`
  });
}
