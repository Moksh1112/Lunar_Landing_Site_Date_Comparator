import { execFile } from 'node:child_process';
import { existsSync } from 'node:fs';
import { resolve } from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { promisify } from 'node:util';
import { setTimeout as delay } from 'node:timers/promises';

export const BRANCH = 'feat/p1-s0-integration';
const root = fileURLToPath(new URL('../', import.meta.url));
const execute = promisify(execFile);

/** Fetch only the shared branch; advance the worktree only when no integration is needed. */
export async function checkForUpdates(cwd = root, signal) {
  const git = async (...args) => (await execute('git', ['-C', cwd, ...args], {
    encoding: 'utf8', windowsHide: true, timeout: 30000, signal,
    env: { ...process.env, GIT_TERMINAL_PROMPT: '0', GCM_INTERACTIVE: 'Never' },
  })).stdout.trim();
  const remoteRef = `refs/remotes/origin/${BRANCH}`;
  // Leave FETCH_HEAD alone: a person may be preparing their own pull/merge.
  await git('fetch', '--no-write-fetch-head', '--no-tags', 'origin', `refs/heads/${BRANCH}:${remoteRef}`);
  const incoming = await git('rev-parse', remoteRef);
  const branch = await git('branch', '--show-current');
  if (branch !== BRANCH) return `Fetched ${incoming.slice(0, 7)}; checkout is ${branch || 'detached HEAD'}. Waiting for ${BRANCH}.`;
  const gitDir = await git('rev-parse', '--absolute-git-dir');
  if (['MERGE_HEAD', 'CHERRY_PICK_HEAD', 'REVERT_HEAD', 'rebase-merge', 'rebase-apply', 'sequencer', 'BISECT_LOG']
    .some(name => existsSync(resolve(gitDir, name)))) {
    return `Fetched ${incoming.slice(0, 7)}; Git operation in progress. Finish it manually.`;
  }
  if (await git('status', '--porcelain=v1')) return `Fetched ${incoming.slice(0, 7)}; local changes present. Waiting for a clean worktree.`;
  const [ahead, behind] = (await git('rev-list', '--left-right', '--count', `HEAD...${incoming}`)).split(/\s+/).map(Number);
  if (ahead && behind) return `Manual integration needed: ${ahead} local, ${behind} incoming commits (remote ${incoming.slice(0, 7)}). Updates fetched; worktree unchanged.`;
  if (!behind) return ahead ? `No incoming commits; ${ahead} local commits remain unpushed (remote ${incoming.slice(0, 7)}).` : `Up to date at ${incoming.slice(0, 7)}.`;
  await git('merge', '--ff-only', '--no-autostash', incoming);
  return `Pulled ${behind} commits by fast-forward to ${incoming.slice(0, 7)}. Ask for integration review/tests before treating them as verified.`;
}

async function main() {
  const args = process.argv.slice(2);
  let interval = 60, once = false;
  for (let i = 0; i < args.length; i++) {
    if (args[i] === '--once') once = true;
    else if (args[i] === '--interval') {
      interval = Number(args[++i]);
      if (!Number.isInteger(interval) || interval < 10 || interval > 3600) throw Error('--interval must be an integer from 10 to 3600 seconds.');
    } else throw Error(`Unknown argument: ${args[i]}. Use --once or --interval SECONDS.`);
  }
  const controller = new AbortController();
  const stop = () => controller.abort();
  process.once('SIGINT', stop);
  process.once('SIGTERM', stop);
  console.log(`Watching origin/${BRANCH} every ${interval}s. Fast-forward only; no commits or pushes. Ctrl+C stops.`);
  let previous = '';
  while (!controller.signal.aborted) {
    let message;
    try { message = await checkForUpdates(root, controller.signal); }
    catch (error) {
      if (controller.signal.aborted) break;
      message = `Check failed; will retry: ${error.stderr?.trim() || error.message}`;
      if (once) process.exitCode = 1;
    }
    if (message !== previous) { console.log(`[${new Date().toISOString()}] ${message}`); previous = message; }
    if (once) break;
    try { await delay(interval * 1000, undefined, { signal: controller.signal }); } catch { break; }
  }
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  main().catch(error => { console.error(error.message); process.exitCode = 1; });
}
