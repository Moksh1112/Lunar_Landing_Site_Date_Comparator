import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
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
// Prefer uv/Python 3.12; AZX_SETUP_PYTHON explicitly selects an existing interpreter.
const probe = spawnSync('uv', ['--version'], {encoding:'utf8'});
if (!process.env.AZX_SETUP_PYTHON && probe.status === 0) {
  run('uv', ['venv', '--python', '3.12', '.venv']);
} else {
  const python = process.env.AZX_SETUP_PYTHON || 'python';
  run(python, ['-c', "import sys; assert sys.version_info[:2] in ((3,11),(3,12)), 'Azelux needs Python 3.11 or 3.12; install uv or set AZX_SETUP_PYTHON'"]);
  run(python, ['-m', 'venv', '.venv']);
}
const python = resolve(root, win ? '.venv/Scripts/python.exe' : '.venv/bin/python');
if (probe.status === 0) run('uv', ['pip', 'sync', '--python', python, '--require-hashes', 'backend/requirements-lock.txt']);
else run(python, ['-m', 'pip', 'install', '--require-hashes', '-r', 'backend/requirements-lock.txt']);
run(process.execPath, [npmCli, 'ci', '--prefix', 'frontend']);
