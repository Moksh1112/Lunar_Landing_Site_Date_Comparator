import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, unlinkSync, writeFileSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';
import assert from 'node:assert/strict';
import test from 'node:test';
import { BRANCH, checkForUpdates } from './watch-integration.mjs';

const root = fileURLToPath(new URL('../', import.meta.url));
const parent = resolve(root, 'work');
mkdirSync(parent, { recursive: true });
const git = (cwd, ...args) => execFileSync('git', ['-C', cwd, ...args], { encoding: 'utf8', windowsHide: true }).trim();

test('shared-branch watcher preserves work and only fast-forwards', async t => {
  const scratch = mkdtempSync(resolve(parent, 'watcher-test-'));
  try {
    const remote = resolve(scratch, 'remote.git'), source = resolve(scratch, 'source'), local = resolve(scratch, 'local');
    mkdirSync(source);
    git(scratch, 'init', '--bare', '-q', remote);
    git(source, 'init', '-q', '--initial-branch', BRANCH);
    const configure = cwd => {
      git(cwd, 'config', 'user.name', 'Synthetic watcher fixture');
      git(cwd, 'config', 'user.email', 'fixture@example.invalid');
      git(cwd, 'config', 'core.hooksPath', resolve(scratch, 'no-hooks'));
    };
    configure(source);
    const commit = (cwd, file, content) => {
      writeFileSync(resolve(cwd, file), content);
      git(cwd, 'add', file);
      git(cwd, 'commit', '-qm', 'Synthetic watcher test');
    };
    commit(source, 'shared.txt', 'one');
    git(source, 'remote', 'add', 'origin', remote);
    git(source, 'push', '-q', 'origin', BRANCH);
    git(scratch, 'clone', '-q', '--branch', BRANCH, remote, local);
    configure(local);
    const start = git(local, 'rev-parse', 'HEAD');
    await t.test('does nothing when current', async () => assert.match(await checkForUpdates(local), /Up to date/));
    commit(source, 'shared.txt', 'two');
    git(source, 'push', '-q', 'origin', BRANCH);
    const incoming = git(source, 'rev-parse', 'HEAD');
    writeFileSync(resolve(local, '.git/FETCH_HEAD'), 'manual fetch sentinel');
    await t.test('fetches but preserves dirty work and FETCH_HEAD', async () => {
      writeFileSync(resolve(local, 'untracked.txt'), 'keep me');
      assert.match(await checkForUpdates(local), /local changes present/);
      assert.equal(git(local, 'rev-parse', 'HEAD'), start);
      assert.equal(git(local, 'rev-parse', `origin/${BRANCH}`), incoming);
      assert.equal(readFileSync(resolve(local, '.git/FETCH_HEAD'), 'utf8'), 'manual fetch sentinel');
      assert.equal(readFileSync(resolve(local, 'untracked.txt'), 'utf8'), 'keep me');
      unlinkSync(resolve(local, 'untracked.txt'));
    });
    await t.test('does not advance another branch', async () => {
      git(local, 'switch', '-qc', 'other-fixture');
      assert.match(await checkForUpdates(local), /checkout is other-fixture/);
      assert.equal(git(local, 'rev-parse', 'HEAD'), start);
      git(local, 'switch', '-q', BRANCH);
    });
    await t.test('leaves an unfinished merge alone', async () => {
      writeFileSync(resolve(local, '.git/MERGE_HEAD'), incoming + '\n');
      assert.match(await checkForUpdates(local), /Git operation in progress/);
      assert.equal(git(local, 'rev-parse', 'HEAD'), start);
      unlinkSync(resolve(local, '.git/MERGE_HEAD'));
    });
    await t.test('pulls a fast-forward without creating a merge commit', async () => {
      assert.match(await checkForUpdates(local), /Pulled 1 commits by fast-forward/);
      assert.equal(git(local, 'rev-parse', 'HEAD'), incoming);
      assert.equal(readFileSync(resolve(local, 'shared.txt'), 'utf8'), 'two');
    });
    commit(local, 'local.txt', 'local only');
    const localHead = git(local, 'rev-parse', 'HEAD');
    await t.test('does not push ahead-only commits', async () => {
      assert.match(await checkForUpdates(local), /1 local commits remain unpushed/);
      assert.equal(git(source, 'ls-remote', 'origin', `refs/heads/${BRANCH}`).split(/\s+/)[0], incoming);
    });
    commit(source, 'shared.txt', 'three');
    git(source, 'push', '-q', 'origin', BRANCH);
    await t.test('reports divergence without merging or losing either history', async () => {
      assert.match(await checkForUpdates(local), /Manual integration needed: 1 local, 1 incoming/);
      assert.equal(git(local, 'rev-parse', 'HEAD'), localHead);
      assert.equal(git(local, 'rev-parse', `origin/${BRANCH}`), git(source, 'rev-parse', 'HEAD'));
      assert.equal(git(local, 'status', '--porcelain'), '');
    });
    await t.test('network failure leaves the local branch untouched', async () => {
      git(local, 'remote', 'set-url', 'origin', resolve(scratch, 'missing.git'));
      await assert.rejects(checkForUpdates(local));
      assert.equal(git(local, 'rev-parse', 'HEAD'), localHead);
    });
  } finally {
    const target = resolve(scratch);
    assert(target.startsWith(parent + sep), 'Scratch cleanup must stay inside work/');
    rmSync(target, { recursive: true, force: true });
  }
});
