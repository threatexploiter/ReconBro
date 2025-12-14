import { promises as fs } from 'fs';
import path from 'path';



async function downloadToFile(url, destPath) {
  const res = await fetch(url, { method: 'GET' });
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Failed to download ${url} — status ${res.status} ${res.statusText} ${txt ? `: ${txt.slice(0,200)}` : ''}`);
  }
  const buf = Buffer.from(await res.arrayBuffer());
  await fs.writeFile(destPath, buf);
  return destPath;
}

function sanitizeName(name) {
  return name.replace(/[^\w\-_.]/g, '-').replace(/\s+/g, '-').toLowerCase();
}

function extractProgramNameFromUrl(inputUrl) {
  try {
    const u = new URL(inputUrl);
    // Path segments e.g. ['teams','roke_vdp'] or ['roke_vdp']
    const parts = u.pathname.split('/').filter(Boolean);
    if (parts.length === 0) return null;
   
    if (parts[0] === 'teams' && parts[1]) return sanitizeName(parts[1]);
   
    return sanitizeName(parts[0]);
  } catch (err) {
    return null;
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const programUrl = body?.programUrl;
    if (!programUrl) {
      return new Response(JSON.stringify({ ok: false, error: 'programUrl required' }), { status: 400 });
    }

    const programName = extractProgramNameFromUrl(programUrl);
    if (!programName) {
      return new Response(JSON.stringify({ ok: false, error: 'Could not extract program name from URL' }), { status: 400 });
    }

    // Create base dir (project root / hackerone-results)
    const baseDir = path.resolve(process.cwd(), 'hackerone-results');
    // if a folder with same name exists, append timestamp to avoid overwrite
    let programDir = path.join(baseDir, programName);
    const exists = await fs.stat(programDir).then(() => true).catch(() => false);
    if (exists) {
      const ts = Date.now();
      programDir = path.join(baseDir, `${programName}-${ts}`);
    }

    await fs.mkdir(programDir, { recursive: true });


    const csvUrl = `https://hackerone.com/teams/${programName}/assets/download_csv.csv`;
    const burpJsonUrl = `https://hackerone.com/teams/${programName}/assets/download_burp_project_file.json`;

    const results = { ok: true, dir: programDir, files: {} };

    // Try to download CSV
    try {
      const csvPath = path.join(programDir, 'scope.csv');
      await downloadToFile(csvUrl, csvPath);
      results.files.scopeCsv = csvPath;
    } catch (errCsv) {
  
      results.files.scopeCsv = null;
      results.warnings = results.warnings || [];
      results.warnings.push(`CSV download failed: ${String(errCsv.message).slice(0,300)}`);
    }

    // Try to download Burp JSON
    try {
      const burpPath = path.join(programDir, 'burp.json');
      await downloadToFile(burpJsonUrl, burpPath);
      results.files.burpJson = burpPath;
    } catch (errBurp) {
      results.files.burpJson = null;
      results.warnings = results.warnings || [];
      results.warnings.push(`Burp JSON download failed: ${String(errBurp.message).slice(0,300)}`);
    }

    // If CSV was downloaded, create scope.txt and roots.txt based on simple host extraction
    if (results.files.scopeCsv) {
      const csvText = await fs.readFile(results.files.scopeCsv, 'utf8');
      const hostRegex = /([a-z0-9][a-z0-9\-\.]+\.[a-z]{2,})/ig;
      const hostSet = new Set();
      for (const line of csvText.split(/\r?\n/)) {
        let m;
        while ((m = hostRegex.exec(line)) !== null) {
          let h = m[1].toLowerCase();
          // skip plain IPs
          if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) continue;
          hostSet.add(h);
        }
      }
      const hosts = Array.from(hostSet).sort();
      const scopeTxtPath = path.join(programDir, 'scope.txt');
      await fs.writeFile(scopeTxtPath, hosts.join('\n') + (hosts.length ? '\n' : ''), 'utf8');
      results.files.scopeTxt = scopeTxtPath;

    
      const roots = new Set();
      for (const h of hosts) {
        roots.add(h);
        if (!h.startsWith('*.')) roots.add(`*.${h}`);
       
        const parts = h.split('.');
        if (parts.length > 2) {
          const base = parts.slice(-2).join('.');
          roots.add(base);
          roots.add(`*.${base}`);
        }
      }
      const rootsPath = path.join(programDir, 'roots.txt');
      await fs.writeFile(rootsPath, Array.from(roots).sort().join('\n') + '\n', 'utf8');
      results.files.roots = rootsPath;
    }


    const meta = {
      programName,
      programUrl,
      createdAt: new Date().toISOString(),
      files: results.files,
      warnings: results.warnings || []
    };
    await fs.writeFile(path.join(programDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');

    return new Response(JSON.stringify(results), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (err) {
    console.error('hackerone route error', err);
    return new Response(JSON.stringify({ ok: false, error: String(err) }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
