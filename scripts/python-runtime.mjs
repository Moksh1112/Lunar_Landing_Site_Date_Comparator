import { existsSync, readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { resolve, delimiter } from 'node:path';
export const root = fileURLToPath(new URL('../', import.meta.url));
export function pythonRuntime() {
  const config = resolve(root, '.venv/runtime.json');
  if (!existsSync(config)) throw new Error('Run npm run setup successfully before starting.');
  const data = JSON.parse(readFileSync(config, 'utf8'));
  if (!['venv', 'target'].includes(data.mode) || typeof data.python !== 'string' || !existsSync(data.python)) {
    throw new Error('Python setup record is invalid; rerun npm run setup.');
  }
  const env = {...process.env};
  // Our launcher anchors explicit relative data paths to the repo; standalone
  // backend commands must implement the same rule in backend settings.
  if (env.AZX_DATA_DIR) env.AZX_DATA_DIR = resolve(root, env.AZX_DATA_DIR);
  if (data.mode === 'target') {
    env.PYTHONPATH = [resolve(root, '.venv/target'), env.PYTHONPATH].filter(Boolean).join(delimiter);
  }
  return {python:data.python, env};
}
