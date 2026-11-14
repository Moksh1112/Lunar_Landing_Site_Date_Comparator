import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
const win = process.platform === 'win32';
const python = win ? '.venv/Scripts/python.exe' : '.venv/bin/python';
if (!existsSync(python)) { console.error('Run npm run setup first.'); process.exit(1); }
const children = [
  spawn(python, ['-m', 'uvicorn', 'app.main:app', '--app-dir', 'backend', '--host', '127.0.0.1', '--port', '8000'], {stdio:'inherit'}),
  spawn('npm', ['--prefix', 'frontend', 'run', 'dev', '--', '--port', '5173', '--strictPort'], {stdio:'inherit', shell:win})
];
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  for (const child of children) {
    if (win && child.pid) spawn('taskkill', ['/pid', String(child.pid), '/T', '/F']);
    else child.kill('SIGTERM');
  }
  process.exitCode = code;
}
for (const child of children) {
  child.on('error', e => { console.error(e.message); stop(1); });
  child.on('exit', code => stop(code ?? 1));
}
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
