import { readdir } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = new URL('../dist/', import.meta.url);
const forbiddenFiles = new Set(['manifest.webmanifest', 'registerSW.js', 'sw.js']);
const matches = [];

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);

    if (entry.isDirectory()) {
      await inspect(entryPath);
      continue;
    }

    if (forbiddenFiles.has(entry.name) || /^workbox-.*\.js$/.test(entry.name)) {
      matches.push(path.relative(outputDirectory.pathname, entryPath));
    }
  }
}

await inspect(outputDirectory.pathname);

if (matches.length > 0) {
  console.error(`PWA artifacts must not be emitted:\n${matches.map((file) => `- ${file}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log('No PWA artifacts emitted.');
}
