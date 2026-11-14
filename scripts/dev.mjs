import { spawn } from 'node:child_process';
import { existsSync } from 'node:fs';
import { pythonRuntime } from './python-runtime.mjs';
import { fileURLToPath } from 'node:url';
import { resolve } from 'node:path';
const root = fileURLToPath(new URL('../', import.meta.url));
let runtime;
try { runtime = pythonRuntime(); } catch (error) { console.error(error.message); process.exit(1); }
const {python, env} = runtime;
const vite = resolve(root, 'frontend/node_modules/vite/bin/vite.js');
if (!existsSync(python) || !existsSync(vite)) {
  console.error('Run npm run setup first.'); process.exit(1);
}
// Direct executable launches: no shell wrapper or npm subprocess tree.
const children = [
  spawn(python, ['-m', 'uvicorn', 'app.main:app', '--app-dir', 'backend', '--host', '127.0.0.1', '--port', '8000'], {cwd:root, env, stdio:'inherit'}),
  spawn(process.execPath, [vite, '--host', '127.0.0.1', '--port', '5173', '--strictPort'], {cwd:resolve(root, 'frontend'), stdio:'inherit'})
];
let stopping = false;
function stop(code) {
  if (stopping) return;
  stopping = true;
  process.exitCode = code;
  if (process.connected) process.disconnect();
  for (const child of children) {
    if (child.exitCode === null && child.signalCode === null) child.kill('SIGTERM');
  }
}
for (const child of children) {
  child.on('error', e => { console.error(e.message); stop(1); });
  child.on('exit', code => stop(code ?? 1));
}
process.on('message', message => { if (message === 'stop') stop(0); });
process.on('SIGINT', () => stop(0));
process.on('SIGTERM', () => stop(0));
