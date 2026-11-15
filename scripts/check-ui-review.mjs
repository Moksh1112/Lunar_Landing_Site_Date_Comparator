// Requires the dev app and backend. Uses an isolated Chromium profile, never the user's profile.
// BROWSER_PATH overrides the Windows Chrome default; AZX_WEB_URL overrides localhost:5173.
import assert from 'node:assert/strict';
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const base = process.env.AZX_WEB_URL ?? 'http://127.0.0.1:5173';
const profile = mkdtempSync(join(tmpdir(), 'azelux-review-'));
const browser = spawn(process.env.BROWSER_PATH ?? 'C:/Program Files/Google/Chrome/Application/chrome.exe',
  ['--headless=new', '--remote-debugging-port=0', `--user-data-dir=${profile}`, '--no-first-run', 'about:blank'],
  { windowsHide: true, stdio: ['ignore', 'ignore', 'pipe'] });
const report = { checks: [], errors: [] };
const sleep = ms => new Promise(resolve => setTimeout(resolve, ms));
let socket;
try {
  const endpoint = await new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(Error('Browser startup timed out')), 15000);
    let output = '';
    browser.on('error', reject);
    browser.stderr.on('data', data => {
      output += data;
      const match = output.match(/DevTools listening on (ws:\/\/[^\s]+)/);
      if (match) { clearTimeout(timeout); resolve(match[1]); }
    });
  });
  socket = new WebSocket(endpoint);
  await new Promise((resolve, reject) => { socket.onopen = resolve; socket.onerror = reject; });
  let id = 0, session;
  const pending = new Map();
  const send = (method, params = {}, target = session) => new Promise((resolve, reject) => {
    const next = ++id;
    const timeout = setTimeout(() => { pending.delete(next); reject(Error(`CDP timeout: ${method}`)); }, 15000);
    pending.set(next, { resolve: value => { clearTimeout(timeout); resolve(value); }, reject });
    socket.send(JSON.stringify({ id: next, method, params, ...(target ? { sessionId: target } : {}) }));
  });
  let failChunk = false, navigations = 0, comparePosts = 0;
  socket.onmessage = event => {
    const message = JSON.parse(event.data);
    if (message.id) {
      const waiter = pending.get(message.id); pending.delete(message.id);
      if (waiter) message.error ? waiter.reject(Error(JSON.stringify(message.error))) : waiter.resolve(message.result);
    }
    if (message.method === 'Network.requestWillBeSent' && message.params.request.method === 'POST' && message.params.request.url.endsWith('/api/v1/compare')) comparePosts++;
    if (message.method === 'Page.frameNavigated' && !message.params.frame.parentId) navigations++;
    if (message.method === 'Runtime.exceptionThrown') report.errors.push(message.params.exceptionDetails.text);
    if (message.method === 'Fetch.requestPaused') {
      const requestId = message.params.requestId;
      const fail = failChunk;
      failChunk = false;
      void send(fail ? 'Fetch.failRequest' : 'Fetch.continueRequest', { requestId, ...(fail ? { errorReason: 'Failed' } : {}) });
    }
  };
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' }, null);
  session = (await send('Target.attachToTarget', { targetId, flatten: true }, null)).sessionId;
  await send('Page.enable'); await send('Runtime.enable'); await send('Network.enable');
  report.browser = await send('Browser.getVersion', {}, null);
  const evaluate = async expression => {
    const result = await send('Runtime.evaluate', { expression, returnByValue: true, awaitPromise: true });
    if (result.exceptionDetails) throw Error(JSON.stringify(result.exceptionDetails));
    return result.result.value;
  };
  const waitFor = async expression => {
    for (let i = 0; i < 200; i++) { if (await evaluate(expression)) return; await sleep(50); }
    throw Error(`Timed out: ${expression}\n${await evaluate('document.body.innerText')}`);
  };
  const navigate = async path => { await send('Page.navigate', { url: base + path }); await waitFor('!!document.querySelector("h1")'); };
  const click = text => evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()===${JSON.stringify(text)}).click()`);
  const size = width => send('Emulation.setDeviceMetricsOverride', { width, height: 1000, deviceScaleFactor: 1, mobile: false });
  const escape = async () => { for (const type of ['keyDown', 'keyUp']) await send('Input.dispatchKeyEvent', { type, key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 }); };
  const setRange = (selector, value) => evaluate(`(()=>{const el=document.querySelector(${JSON.stringify(selector)});Object.getOwnPropertyDescriptor(HTMLInputElement.prototype,'value').set.call(el,${JSON.stringify(String(value))});el.dispatchEvent(new Event('input',{bubbles:true}));})()`);
  await size(1440);
  await navigate('/terrain');
  await waitFor(`document.querySelector('[aria-label="Terrain 3D"]')?.textContent.includes('First frame:')`);
  await evaluate(`(async()=>{const resources=performance.getEntriesByType('resource').map(r=>r.name);window.store=(await import(resources.find(u=>u.includes('/src/store.ts')))).useStore;const url=resources.find(u=>u.includes('@react-three_fiber.js?v='));const {_roots}=await import(url);window.terrainState=_roots.get(document.querySelector('[aria-label="Terrain 3D"] canvas')).store.getState();})()`);
  report.sourceModes = await evaluate('store.getState().lastCompare.response.scenarios.map(s=>({label:s.meta.data_label,horizon:s.meta.horizon_mode}))');
  const camera = () => evaluate('({position:terrainState.camera.position.toArray(),rotation:terrainState.camera.quaternion.toArray()})');
  await evaluate(`document.querySelector('[aria-label="Terrain 3D"] canvas').scrollIntoView({block:'center'})`);
  const initial = await camera();
  const rect = await evaluate(`document.querySelector('[aria-label="Terrain 3D"] canvas').getBoundingClientRect().toJSON()`);
  const x = rect.x + rect.width / 2, y = rect.y + rect.height / 2;
  await send('Input.dispatchMouseEvent', { type: 'mousePressed', x, y, button: 'left', clickCount: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseMoved', x: x + 80, y: y + 30, button: 'left', buttons: 1 });
  await send('Input.dispatchMouseEvent', { type: 'mouseReleased', x: x + 80, y: y + 30, button: 'left', clickCount: 1 });
  const wide = await camera();
  assert.notDeepEqual(wide.rotation, initial.rotation);
  await size(520);
  await waitFor('terrainState.camera.position.length() > ' + Math.hypot(...wide.position) * 1.1);
  const narrow = await camera();
  assert(narrow.rotation.every((v, i) => Math.abs(v - wide.rotation[i]) < 1e-7));
  await setRange('[aria-label="Vertical exaggeration"]', 5);
  await waitFor('terrainState.camera.position.length() > ' + Math.hypot(...narrow.position));
  const relief = await camera();
  assert(relief.rotation.every((v, i) => Math.abs(v - narrow.rotation[i]) < 1e-7));
  report.framing = { wide, narrow, relief };
  report.checks.push('viewport resize and relief refit without resetting view angle');

  await evaluate('store.getState().setAlignBy("mission_day");store.getState().setScrubT(0)');
  await evaluate('[...document.querySelectorAll("button")].find(b=>b.textContent.endsWith("Play mission")).click()');
  await waitFor('store.getState().scrubT === 3600');
  await click('Timeline');
  await setRange('#terrain-timeline input[type="range"]', 7200);
  await sleep(800);
  assert.equal(await evaluate('store.getState().scrubT'), 7200);
  assert.equal(await evaluate('document.querySelector("#terrain-time").value'), '7200');
  assert((await evaluate('document.querySelector("#terrain-timeline").textContent')).includes('+2.0 h'));
  await click('3D Terrain');
  assert(await evaluate('[...document.querySelectorAll("button")].some(b=>b.textContent.endsWith("Play mission"))'));
  report.checks.push('hourly mission-day seconds and timeline selection survive leaving playback');

  await evaluate(`document.querySelector('[aria-label="Terrain 3D"] canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true}))`);
  await waitFor('!!document.querySelector("[data-viewer-error]")');
  await click('Retry terrain 3D');
  await waitFor(`document.querySelector('[aria-label="Terrain 3D"]')?.textContent.includes('First frame:')`);
  await evaluate(`document.querySelector('[aria-label="Terrain 3D"] canvas').dispatchEvent(new Event('webglcontextlost',{cancelable:true}))`);
  await waitFor('document.body.textContent.includes("Two attempts failed")');
  assert.equal(await evaluate('[...document.querySelectorAll("button")].some(b=>b.textContent==="Retry terrain 3D")'), false);
  report.checks.push('recoverable Canvas retry resets boundary, second failure stops');

  await send('Fetch.enable', { patterns: [{ urlPattern: '*features/terrain3d/TerrainCanvas.tsx*', requestStage: 'Request' }] });
  failChunk = true;
  await navigate('/terrain');
  await waitFor('document.querySelector("[data-viewer-error]")?.textContent.includes("dynamically imported module")');
  const beforeReload = navigations;
  await click('Retry terrain 3D');
  await waitFor(`!!document.querySelector('[aria-label="Terrain 3D"] canvas')`);
  assert(navigations > beforeReload);
  await send('Fetch.disable');
  report.checks.push('failed lazy chunk retry reloads document and loads fresh code');

  const idx = await evaluate('history.state.idx');
  await click('Back');
  await waitFor('location.pathname === "/compare"');
  assert.equal(await evaluate('history.state.idx'), idx);
  report.checks.push('direct-entry Back fallback replaces history');

  await evaluate(`(async()=>{const resources=performance.getEntriesByType('resource').map(r=>r.name);window.store=(await import(resources.find(u=>u.includes('/src/store.ts')))).useStore;})()`);
  const postsBefore = comparePosts;
  await evaluate(`[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Compare').click();[...document.querySelectorAll('button')].find(b=>b.textContent.trim()==='Compare').click()`);
  await waitFor('store.getState().gapFocus === "A" && document.querySelector("[aria-label=Results]")?.getAttribute("aria-busy") === "false"');
  assert.equal(comparePosts - postsBefore, 1);
  assert(await evaluate(`!![...document.querySelectorAll('svg title')].find(t=>t.textContent==='Plan A longest visibility gap')`));
  await click('Inspect B gap');
  assert.equal(await evaluate('store.getState().gapFocus'), 'B');
  await evaluate(`document.querySelector('svg[aria-label^="Sun, Earth"]').scrollIntoView({block:'center'})`);
  const timelineRect=await evaluate(`document.querySelector('svg[aria-label^="Sun, Earth"]').getBoundingClientRect().toJSON()`);
  await send('Input.dispatchMouseEvent',{type:'mouseMoved',x:timelineRect.x+timelineRect.width*.5,y:timelineRect.y+timelineRect.height*.5});
  await waitFor(`document.querySelector('[role=tooltip]')?.textContent.includes('Plan A')`);
  assert(await evaluate(`!![...document.querySelectorAll('svg title')].find(t=>t.textContent==='Plan B longest visibility gap')`));
  report.checks.push('gap focus/highlight and cursor tooltip coexist; same-frame double Compare sends one POST');
  const generated=await evaluate(`(async()=>{const resources=performance.getEntriesByType('resource').map(r=>r.name);const m=await import(resources.find(u=>u.includes('/features/briefing/briefing.ts')));const c=store.getState().lastCompare;window.offlineHtml=m.buildBriefingHtml(c.response,c.request);return {bytes:offlineHtml.length,real:offlineHtml.includes('REAL'),schema:offlineHtml.includes('azelux.briefing'),v4:offlineHtml.includes('V4')};})()`);
  assert(generated.bytes>10000 && generated.real && generated.schema && generated.v4);
  report.briefing=generated;
  report.checks.push('merged real comparison generates offline briefing with provenance and validation');


  await evaluate(`(async()=>{const resources=performance.getEntriesByType('resource').map(r=>r.name);window.store=(await import(resources.find(u=>u.includes('/src/store.ts')))).useStore;const client=await import(resources.find(u=>u.includes('/src/api/client.ts')));window.previous=store.getState().lastCompare;client.setTransport({send:()=>new Promise(resolve=>{window.finishCompare=()=>resolve(previous.response)})});})()`);
  await click('Compare');
  await waitFor('typeof window.finishCompare === "function"');
  await evaluate('store.getState().loadAsB({startUtc:"2027-03-14T00:00"});window.finishCompare()');
  await waitFor('document.querySelector("[aria-label=Results]")?.getAttribute("aria-busy") === "false"');
  assert.equal(await evaluate('store.getState().lastCompare'), null);
  report.checks.push('controlled delayed comparison cannot restore results after Load as B');

  await navigate('/learn/simulator');
  await waitFor('!!document.querySelector("[data-app-header]")');
  await click('Start mission');
  await waitFor('!!document.querySelector("#brief-h")');
  await evaluate('document.querySelector("[data-app-header] a").focus()');
  await escape();
  assert.equal(await evaluate('!!document.querySelector("dialog[open]")'), false);
  await evaluate('(()=>{const h=[...document.querySelectorAll("header")].find(h=>!h.matches("[data-app-header]"));h.tabIndex=-1;h.focus()})()');
  await escape();
  await waitFor('!!document.querySelector("dialog[open]")');
  report.checks.push('Escape ignores AppHeader focus but pauses from simulator header');
  // Deliberate chunk/context failures above are caught by the recovery boundary.
  assert.deepEqual(report.errors, []);
  console.log(JSON.stringify(report, null, 2));
} finally {
  writeFileSync(join(profile, 'review-results.json'), JSON.stringify(report, null, 2));
  console.log(`Browser evidence: ${join(profile, 'review-results.json')}`);
  socket?.close(); browser.kill();
}
