import { spawnSync } from 'node:child_process';
const win = process.platform === 'win32';
function run(cmd, args) {
  const p = spawnSync(cmd, args, { stdio: 'inherit', shell: win && cmd === 'npm' });
  if (p.status !== 0) process.exit(p.status ?? 1);
}
run('python', ['-m', 'venv', '.venv']);
run(win ? '.venv/Scripts/python.exe' : '.venv/bin/python', ['-m', 'pip', 'install', '-r', 'backend/requirements.txt']);
run('npm', ['ci', '--prefix', 'frontend']);
