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
  if (p.status !== 0) process.exit(p.status ?? 1);
}
run('python', ['-m', 'venv', '.venv']);
run(resolve(root, win ? '.venv/Scripts/python.exe' : '.venv/bin/python'), ['-m', 'pip', 'install', '-r', 'backend/requirements.txt']);
run(process.execPath, [npmCli, 'ci', '--prefix', 'frontend']);
