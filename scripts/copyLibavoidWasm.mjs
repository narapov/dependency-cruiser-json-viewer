import { copyFileSync, existsSync, mkdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const source = join(root, 'node_modules/libavoid-js/dist/libavoid.wasm');
const target = join(root, 'public/libavoid.wasm');

if (!existsSync(source)) {
  console.warn(`[copyLibavoidWasm] missing ${source}; skip`);
  process.exit(0);
}

mkdirSync(dirname(target), { recursive: true });
copyFileSync(source, target);
console.log(`[copyLibavoidWasm] copied to ${target}`);
