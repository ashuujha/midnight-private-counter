import { cp, mkdir, rm } from 'node:fs/promises';
import { resolve } from 'node:path';

const root = resolve(import.meta.dirname, '..');
const managed = resolve(root, 'managed', 'counter');
const publicDir = resolve(root, 'public');

await mkdir(publicDir, { recursive: true });

for (const directory of ['keys', 'zkir']) {
  const source = resolve(managed, directory);
  const destination = resolve(publicDir, directory);
  await rm(destination, { recursive: true, force: true });
  await cp(source, destination, { recursive: true });
}

console.log('Copied counter proving assets to public/keys and public/zkir.');
