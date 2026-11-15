import { spawnSync } from 'node:child_process';
import { backendRequirements } from './backend-dependencies.mjs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
import { mkdirSync, writeFileSync } from 'node:fs';
const root = fileURLToPath(new URL('../', import.meta.url));
const win = process.platform === 'win32';
const npmCli = process.env.npm_execpath;
if (!npmCli) { console.error('Use npm run setup.'); process.exit(1); }
function run(cmd, args) {
  const p = spawnSync(cmd, args, { cwd: root, stdio: 'inherit' });
  if (p.error) console.error(p.error.message);
  if (p.status !== 0) {
    console.error('Setup stopped. On managed Windows, Application Control may block generated Python launchers. Use an approved compatible environment; do not disable policy.');
    process.exit(p.status ?? 1);
  }
}
// Explicit target mode avoids generated venv launchers on managed Windows.
const probe = spawnSync('uv', ['--version'], {encoding:'utf8'});
const targetMode = process.env.AZX_PYTHON_MODE === 'target';
if (process.env.AZX_PYTHON_MODE && !['target', 'venv'].includes(process.env.AZX_PYTHON_MODE)) {
  console.error('AZX_PYTHON_MODE must be venv or target.'); process.exit(1);
}
let python;
if (targetMode) {
  python = process.env.AZX_SETUP_PYTHON;
  if (!python) {
    const found = spawnSync('uv', ['python', 'find', '--system', '3.12'], {cwd:root, encoding:'utf8'});
    if (found.status !== 0) { console.error(found.stderr || 'Install uv/Python 3.12 or set AZX_SETUP_PYTHON.'); process.exit(1); }
    python = found.stdout.trim();
  }
  run(python, ['-c', "import sys; assert sys.version_info[:2] in ((3,11),(3,12)), 'Python 3.11/3.12 required'"]);
  const target = resolve(root, '.venv/target');
  mkdirSync(target, {recursive:true});
  const requirements = backendRequirements(root, python, probe.status === 0, run);
  if (probe.status === 0) run('uv', ['pip', 'sync', '--python', python, '--target', target, '--require-hashes', requirements]);
  else run(python, ['-m', 'pip', 'install', '--target', target, '--require-hashes', '-r', requirements]);
} else {
  if (!process.env.AZX_SETUP_PYTHON && probe.status === 0) {
    run('uv', ['venv', '--python', '3.12', '--allow-existing', '.venv']);
  } else {
    const selected = process.env.AZX_SETUP_PYTHON || 'python';
    run(selected, ['-c', "import sys; assert sys.version_info[:2] in ((3,11),(3,12)), 'Python 3.11/3.12 required'"]);
    run(selected, ['-m', 'venv', '.venv']);
  }
  python = resolve(root, win ? '.venv/Scripts/python.exe' : '.venv/bin/python');
  const requirements = backendRequirements(root, python, probe.status === 0, run);
  if (probe.status === 0) run('uv', ['pip', 'sync', '--python', python, '--require-hashes', requirements]);
  else run(python, ['-m', 'pip', 'install', '--require-hashes', '-r', requirements]);
}
run(process.execPath, [npmCli, 'ci', '--prefix', 'frontend']);
writeFileSync(resolve(root, '.venv/runtime.json'), JSON.stringify({mode:targetMode ? 'target' : 'venv', python}, null, 2));
console.log(`Setup complete (${targetMode ? 'target' : 'venv'} mode). Run npm run dev:all.`);
