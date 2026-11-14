import { spawnSync } from 'node:child_process';
import { pythonRuntime, root } from './python-runtime.mjs';
try {
  const {python, env} = pythonRuntime();
  const p = spawnSync(python, ['scripts/check_backend.py'], {cwd:root, env, stdio:'inherit'});
  if (p.error) console.error(p.error.message);
  process.exit(p.status ?? 1);
} catch (error) { console.error(error.message); process.exit(1); }
