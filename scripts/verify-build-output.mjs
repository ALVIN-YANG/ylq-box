import { readFile, readdir } from 'node:fs/promises';
import path from 'node:path';

const outputDirectory = new URL('../dist/', import.meta.url);
const contentDirectory = new URL('../src/content/docs/', import.meta.url);
const forbiddenPwaFiles = new Set(['manifest.webmanifest', 'registerSW.js', 'sw.js']);
const problems = [];
let sourceDiagramCount = 0;
let outputDiagramCount = 0;

async function walk(directory, inspectFile) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const entryPath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await walk(entryPath, inspectFile);
    } else {
      await inspectFile(entryPath, entry.name);
    }
  }
}

await walk(contentDirectory.pathname, async (file, name) => {
  if (!/\.mdx?$/.test(name)) return;
  const source = await readFile(file, 'utf8');
  sourceDiagramCount += source.match(/```mermaid\s*\n/g)?.length ?? 0;
});

await walk(outputDirectory.pathname, async (file, name) => {
  const relativePath = path.relative(outputDirectory.pathname, file);

  if (forbiddenPwaFiles.has(name) || /^workbox-.*\.js$/.test(name)) {
    problems.push(`PWA artifact emitted: ${relativePath}`);
  }

  if (/^mermaid(?:\.core)?\..*\.js$/i.test(name)) {
    problems.push(`Mermaid client bundle emitted: ${relativePath}`);
  }

  if (!name.endsWith('.html')) return;
  const html = await readFile(file, 'utf8');
  outputDiagramCount += html.match(/<div class="mermaid-static__canvas"/g)?.length ?? 0;

  if (/class="language-mermaid"|<pre class="mermaid"|mermaid\.core\.|mermaid-static__theme/.test(html)) {
    problems.push(`Uncompiled Mermaid markup emitted: ${relativePath}`);
  }
});

if (outputDiagramCount !== sourceDiagramCount) {
  problems.push(`Static Mermaid count mismatch: source=${sourceDiagramCount}, output=${outputDiagramCount}`);
}

if (problems.length > 0) {
  console.error(`Static build verification failed:\n${problems.map((problem) => `- ${problem}`).join('\n')}`);
  process.exitCode = 1;
} else {
  console.log(`Static build verified: no PWA or Mermaid runtime; ${outputDiagramCount} diagrams are inline SVG.`);
}
