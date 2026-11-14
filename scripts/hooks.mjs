import { chmodSync } from 'node:fs';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../', import.meta.url));
if (process.platform !== 'win32') {
  chmodSync(new URL('./hooks/commit-msg', import.meta.url), 0o755);
  chmodSync(new URL('./check_attribution.sh', import.meta.url), 0o755);
}
const p = spawnSync('git', ['config', 'core.hooksPath', 'scripts/hooks'], {cwd:root, stdio:'inherit'});
if (p.error) console.error(p.error.message);
process.exit(p.status ?? 1);
