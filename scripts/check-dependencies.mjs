// Exercise the handoff with real uv lock/export/install; no product files are edited.
import { mkdirSync, mkdtempSync, writeFileSync, readFileSync, rmSync } from 'node:fs';
import { resolve, sep } from 'node:path';
import { spawnSync } from 'node:child_process';
import assert from 'node:assert/strict';
import { backendRequirements } from './backend-dependencies.mjs';
import { pythonRuntime, root } from './python-runtime.mjs';
const {python} = pythonRuntime();
const parent = resolve(root, 'work');
mkdirSync(parent, {recursive:true});
const scratch = mkdtempSync(resolve(parent, 'dependency-check-'));
function run(command, args) {
  const p = spawnSync(command,args,{encoding:'utf8',cwd:root});
  if (p.status !== 0) throw new Error(p.stderr || p.stdout || p.error?.message);
  return p.stdout;
}
try {
  mkdirSync(resolve(scratch,'backend'));
  assert.equal(backendRequirements(scratch,python,true,run),resolve(scratch,'backend/requirements-lock.txt'));
  writeFileSync(resolve(scratch,'backend/pyproject.toml'), `[project]
name="azelux-dependency-handoff-check"
version="0.0.0"
requires-python=">=3.12"
dependencies=["six==1.17.0"]
[dependency-groups]
dev=["packaging==25.0"]
`);
  assert.throws(() => backendRequirements(scratch,python,true,run), /BOTH/);
  run('uv',['lock','--project',resolve(scratch,'backend'),'--python',python]);
  const lock=readFileSync(resolve(scratch,'backend/uv.lock'),'utf8');
  const exported=backendRequirements(scratch,python,true,run);
  run('uv',['pip','sync','--python',python,'--target',resolve(scratch,'packages'),'--require-hashes',exported]);
  const p=spawnSync(python,['-c',"import six,packaging; assert six.__version__=='1.17.0'; assert packaging.__version__=='25.0'"],
    {env:{...process.env,PYTHONPATH:resolve(scratch,'packages')},encoding:'utf8'});
  assert.equal(p.status,0,p.stderr);
  assert.equal(readFileSync(resolve(scratch,'backend/uv.lock'),'utf8'),lock);
  console.log('PASS canonical lock handoff: runtime+dev dependencies import, lock unchanged, partial handoff rejected');
} finally {
  if (!scratch.startsWith(parent+sep)) throw new Error('Unsafe scratch cleanup target');
  rmSync(scratch,{recursive:true,force:true});
}
