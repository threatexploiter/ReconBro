
import { promises as fs } from 'fs';
import path from 'path';

async function downloadToFile(url, destPath) {
  const res = await fetch(url);
  if (!res.ok) {
    const txt = await res.text().catch(() => '');
    throw new Error(`Download failed ${res.status} ${res.statusText} ${txt ? `: ${txt.slice(0,200)}` : ''}`);
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
    const parts = u.pathname.split('/').filter(Boolean);
    if (!parts.length) return null;
    if (parts[0] === 'teams' && parts[1]) return sanitizeName(parts[1]);
    return sanitizeName(parts[0]);
  } catch (err) {
    return null;
  }
}

function extractHostsFromCsvText(csvText) {
  const hostRegex = /([a-z0-9][a-z0-9\-\.]+\.[a-z]{2,})/ig;
  const set = new Set();
  for (const line of csvText.split(/\r?\n/)) {
    let m;
    while ((m = hostRegex.exec(line)) !== null) {
      const h = m[1].toLowerCase();
      if (/^\d+\.\d+\.\d+\.\d+$/.test(h)) continue;
      set.add(h);
    }
  }
  return Array.from(set).sort();
}

export async function fetchHackeroneAssets(programUrl) {
  const programName = extractProgramNameFromUrl(programUrl);
  if (!programName) throw new Error('Could not extract program name');

  const baseDir = path.resolve(process.cwd(), 'hackerone-results');
  let programDir = path.join(baseDir, programName);
  const exists = await fs.stat(programDir).then(() => true).catch(() => false);
  if (exists) programDir = path.join(baseDir, `${programName}-${Date.now()}`);
  await fs.mkdir(programDir, { recursive: true });

  // URLs
  const csvUrl = `https://hackerone.com/teams/${programName}/assets/download_csv.csv`;
  const burpJsonUrl = `https://hackerone.com/teams/${programName}/assets/download_burp_project_file.json`;
  const results = { dir: programDir, files: {}, warnings: [] };

  // CSV
  try {
    const csvPath = path.join(programDir, 'scope.csv');
    await downloadToFile(csvUrl, csvPath);
    results.files.scopeCsv = csvPath;

    const csvText = await fs.readFile(csvPath, 'utf8');
    const hosts = extractHostsFromCsvText(csvText);
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
  } catch (err) {
    results.warnings.push(`CSV: ${err.message}`);
    results.files.scopeCsv = null;
  }

  // Burp
  try {
    const burpPath = path.join(programDir, 'burp.json');
    await downloadToFile(burpJsonUrl, burpPath);
    results.files.burpJson = burpPath;
  } catch (err) {
    results.warnings.push(`Burp JSON: ${err.message}`);
    results.files.burpJson = null;
  }

  // meta
  const meta = { programUrl, createdAt: new Date().toISOString(), files: results.files, warnings: results.warnings };
  await fs.writeFile(path.join(programDir, 'meta.json'), JSON.stringify(meta, null, 2), 'utf8');

  return results;
}
