// S0 module startup only: no comparison/product journey is asserted.
import { fork, spawnSync } from 'node:child_process';
import { connect } from 'node:net';
import { setTimeout as delay } from 'node:timers/promises';
import { root } from './python-runtime.mjs';
async function assertUnused(port) {
  await new Promise((resolve, reject) => {
    const socket = connect({host:'127.0.0.1', port});
    socket.setTimeout(1000);
    socket.on('connect', () => { socket.destroy(); reject(new Error(`Port ${port} is in use; stop existing server first.`)); });
    socket.on('error', error => { socket.destroy(); error.code === 'ECONNREFUSED' ? resolve() : reject(error); });
    socket.on('timeout', () => { socket.destroy(); reject(new Error(`Port ${port} probe timed out.`)); });
  });
}
await assertUnused(8000);
await assertUnused(5173);
const child = fork(new URL('./dev.mjs', import.meta.url), ['--mock'], {cwd:root, silent:true});
let log = '';
for (const stream of [child.stdout, child.stderr]) stream.on('data', data => { log = (log + data.toString()).slice(-12000); });
const exited = new Promise(resolve => child.once('exit', code => resolve(code)));
let good = false;
try {
  const deadline = Date.now() + 20000;
  while (Date.now() < deadline) {
    if (child.exitCode !== null) throw new Error(`Launcher exited: ${log}`);
    try {
      const [api, ui] = await Promise.all([
        fetch('http://127.0.0.1:8000/health', {signal:AbortSignal.timeout(1000)}),
        fetch('http://127.0.0.1:5173/', {signal:AbortSignal.timeout(1000)})
      ]);
      if (!api.ok || !ui.ok || (await api.json()).status !== 'ok' || !(await ui.text()).includes('/src/main.tsx')) {
        throw new Error('Unexpected startup response');
      }
      good = true;
      console.log('PASS dev:all startup: backend HTTP 200/status ok; frontend HTTP 200/module shell');
      break;
    } catch { await delay(100); }
  }
  if (!good) throw new Error(`Startup timeout: ${log}`);
} finally {
  if (child.connected) child.send('stop');
  const result = await Promise.race([exited.then(code => ({code})), delay(5000).then(() => null)]);
  if (!result) {
    if (process.platform === 'win32') spawnSync('taskkill', ['/PID', String(child.pid), '/T', '/F']);
    else child.kill('SIGKILL');
    throw new Error(`Launcher did not shut down gracefully: ${log}`);
  }
  if (good && result.code !== 0) throw new Error(`Shutdown failed (${result.code}): ${log}`);
}
await assertUnused(8000);
await assertUnused(5173);
console.log('PASS graceful shutdown: both ports released');
