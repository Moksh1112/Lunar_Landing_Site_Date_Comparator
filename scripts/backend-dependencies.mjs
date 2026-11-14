import { existsSync, mkdirSync } from 'node:fs';
import { resolve } from 'node:path';
// Only one dependency authority is selected; partial owner handoffs fail closed.
export function backendRequirements(root, python, hasUv, run) {
  const project = resolve(root, 'backend/pyproject.toml');
  const lock = resolve(root, 'backend/uv.lock');
  if (existsSync(project) !== existsSync(lock)) {
    throw new Error('Backend handoff requires BOTH pyproject.toml and uv.lock. No requirements fallback is allowed for a partial handoff.');
  }
  if (existsSync(project)) {
    if (!hasUv) throw new Error('uv is required for the canonical backend project.');
    mkdirSync(resolve(root, 'work'), {recursive:true});
    const exported = resolve(root, 'work/backend-requirements.txt');
    run('uv', ['export', '--project', resolve(root, 'backend'), '--python', python,
      '--locked', '--no-emit-project', '--format', 'requirements.txt', '--output-file', exported]);
    console.log('Backend authority: backend/pyproject.toml + backend/uv.lock (locked export, including default dev dependencies).');
    return exported;
  }
  console.log('Backend authority: TEMPORARY scaffold requirements-lock.txt; pyproject/uv.lock handoff not present.');
  return resolve(root, 'backend/requirements-lock.txt');
}
