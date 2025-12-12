// app/api/assistant/route.js
import { NextResponse } from "next/server";
import { fetchHackeroneAssets } from "../../../lib/hackerone.js";
import { spawn } from 'child_process';
import fs from 'fs';
import path from 'path';

const OPENAI_API_KEY = process.env.OPENAI_API_KEY || '';

const SYSTEM_PROMPT = `
You are a JSON-outputting assistant. 
When given a user's natural message, output ONLY a single JSON object:

{
  "action": "none | start_recon | download_assets",
  "platform": "hackerone | custom | null",
  "programUrl": "string or null",
  "programName": "string or null",
  "scopeCsvUrl": "string or null",
  "burpConfigUrl": "string or null",
  "confirm": "short confirmation message"
}

Rules:
- If user provides a HackerOne program URL, set action="start_recon", platform="hackerone", and include programUrl.
- Do NOT describe what you are doing — ONLY output JSON.
- Never write explanations. JSON only.
`;

async function callOpenAI(userMessage) {
  if (!OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not set on server.');
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Authorization": `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: "gpt-4o-mini",
      messages: [
        { role: "system", content: SYSTEM_PROMPT },
        { role: "user", content: userMessage }
      ],
      temperature: 0
    }),
  });

  if (!res.ok) {
    const txt = await res.text();
    throw new Error(`OpenAI error ${res.status}: ${txt}`);
  }

  const json = await res.json();
  const content = json?.choices?.[0]?.message?.content;
  if (!content) throw new Error('No content from OpenAI');
  return content;
}

/**
 * spawnReconScript(scriptPath, targetDir, logDir)
 * - scriptPath: absolute path to Recon.sh
 * - targetDir: absolute path to program dir (where recon should run)
 * - logDir: absolute path where logs will be written
 *
 * Returns: { pid, stdoutLog, stderrLog }
 */
function spawnReconScript(scriptPath, targetDir, logDir) {
  const resolvedScript = path.resolve(scriptPath);
  const resolvedTarget = path.resolve(targetDir);
  const resolvedLogs = path.resolve(logDir);

  // ensure script exists
  if (!fs.existsSync(resolvedScript)) {
    throw new Error(`Recon script not found at ${resolvedScript}`);
  }

  // ensure log directory exists
  try { fs.mkdirSync(resolvedLogs, { recursive: true }); } catch (e) {}

  const timestamp = new Date().toISOString().replace(/[:.]/g,'-');
  const stdoutLog = path.join(resolvedLogs, `recon-${timestamp}.out.log`);
  const stderrLog = path.join(resolvedLogs, `recon-${timestamp}.err.log`);

  // spawn bash with script and pass the target directory as argument (no shell string interpolation)
  const child = spawn('bash', [resolvedScript, resolvedTarget], {
    cwd: path.dirname(resolvedScript),
    detached: false,
    stdio: ['ignore', 'pipe', 'pipe'],
  });

  // pipe to files
  const outStream = fs.createWriteStream(stdoutLog, { flags: 'a' });
  const errStream = fs.createWriteStream(stderrLog, { flags: 'a' });
  if (child.stdout) child.stdout.pipe(outStream);
  if (child.stderr) child.stderr.pipe(errStream);

  child.on('close', (code, signal) => {
    fs.appendFileSync(stdoutLog, `\n[recon] finished code=${code} signal=${signal}\n`);
  });
  child.on('error', (err) => {
    fs.appendFileSync(stderrLog, `[recon spawn error] ${String(err)}\n`);
  });

  return {
    pid: child.pid,
    stdoutLog,
    stderrLog,
  };
}

export async function POST(req) {
  try {
    const { message } = await req.json();
    if (!message) return NextResponse.json({ ok: false, error: 'message missing' }, { status: 400 });

    // Ask OpenAI to parse user's intent
    const aiText = await callOpenAI(message);

    // strip fences just in case and parse
    const clean = aiText.replace(/```json|```/g, '').trim();
    let parsed;
    try {
      parsed = JSON.parse(clean);
    } catch (e) {
      // if assistant returned a code block or extra text, try to find first {...} block
      const first = clean.match(/\{[\s\S]*\}/);
      if (first) parsed = JSON.parse(first[0]);
      else throw new Error('Failed to parse assistant JSON: ' + e.message + ' — raw:' + clean.slice(0,200));
    }

    // handle start_recon for hackerone
    if (parsed.action === "start_recon" && parsed.platform === "hackerone" && parsed.programUrl) {
      // download assets (this writes files and returns an object)
      const result = await fetchHackeroneAssets(parsed.programUrl);

      // try to spawn Recon.sh (non-blocking) if result.dir exists
      let reconInfo = null;
      try {
        if (result && result.dir) {
          // adjust this path if your Recon.sh is elsewhere
          // I saw Recon.sh in your explorer under hackerone-results/Recon.sh — update if different
          const SCRIPT_REL_PATH = path.resolve(process.cwd(), 'hackerone-results', 'Recon.sh');
          const LOG_ROOT = path.resolve(process.cwd(), 'recon-logs');

          // spawn the script on the program dir
          reconInfo = spawnReconScript(SCRIPT_REL_PATH, result.dir, LOG_ROOT);
        }
      } catch (spawnErr) {
        // don't fail the whole request if recon spawn fails — return the result plus warning
        if (!result.warnings) result.warnings = [];
        result.warnings.push('Recon spawn failed: ' + String(spawnErr));
      }

      return NextResponse.json({
        ok: true,
        reply: parsed.confirm || `Started recon for ${parsed.programUrl}`,
        action: parsed,
        result,
        recon: reconInfo
      });
    }

    // fallback / other actions
    return NextResponse.json({
      ok: true,
      reply: parsed.confirm || "I need more details.",
      action: parsed
    });

  } catch (err) {
    console.error('assistant route error', err);
    return NextResponse.json({ ok: false, error: String(err) }, { status: 500 });
  }
}
