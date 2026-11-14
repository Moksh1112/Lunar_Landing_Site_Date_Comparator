// Run repository Python commands with the interpreter chosen by setup.
import { spawnSync } from 'node:child_process';
import { pythonRuntime, root } from './python-runtime.mjs';
try {
  const args = process.argv.slice(2);
  if (!args.length) throw new Error('Provide a Python script or -m module.');
  const {python, env} = pythonRuntime();
  const result = spawnSync(python, args, {cwd:root, env, stdio:'inherit'});
  if (result.error) console.error(result.error.message);
  process.exit(result.status ?? 1);
} catch (error) { console.error(error.message); process.exit(1); }
