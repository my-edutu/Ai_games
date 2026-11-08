'use strict';
// Validate the read-only Tower capture harness's static relative require graph
// BEFORE installing a frozen-source browser. Never fetch code or modify files.
const fs = require('node:fs');
const path = require('node:path');
const REQUIRE = /\brequire\s*\(\s*(['"])(\.{1,2}\/[^'"]+)\1\s*\)/g;
const EXTENSIONS = ['', '.cjs', '.js', '.mjs', '.json', '/index.cjs', '/index.js'];

function inspectHarnessDependencies(root, entries) {
  const base = path.resolve(root);
  const visited = new Set();
  const faults = [];
  function within(file) {
    const relative = path.relative(base, file);
    return relative && relative !== '..' && !relative.startsWith(`..${path.sep}`) && !path.isAbsolute(relative);
  }
  function resolveLocal(basePath) {
    for (const ext of EXTENSIONS) {
      const attempt = path.resolve(basePath + ext);
      if (!within(attempt)) continue;
      try { if (fs.statSync(attempt).isFile()) return attempt; } catch { /* absent */ }
    }
    return null;
  }
  function walk(request, importer = base) {
    if (typeof request !== 'string' || !request.length) return;
    const targetPath = path.resolve(importer, request);
    if (!within(targetPath)) { faults.push(`Relative import escapes checkout: ${request}`); return; }
    const file = resolveLocal(targetPath);
    if (!file) { faults.push(`Missing local module: ${path.relative(base, targetPath)}`); return; }
    if (visited.has(file)) return;
    visited.add(file);
    const source = fs.readFileSync(file, 'utf8');
    for (const match of source.matchAll(REQUIRE)) walk(match[2], path.dirname(file));
  }
  for (const entry of entries) walk(entry);
  return {ok:faults.length===0,checked:visited.size,faults,paths:[...visited].map(file=>path.relative(base,file)).sort()};
}
if (require.main === module) {
  const root=process.argv[2];
  const entries=process.argv.slice(3);
  if (!root || !entries.length) {
    console.error('Usage: node scripts/tower-harness-dependency-check.cjs <source-root> <capture-test-relative-path> [...]');
    process.exitCode=2;
  } else {
    const result=inspectHarnessDependencies(root,entries);
    console.log(JSON.stringify(result,null,2));
    if (!result.ok) process.exitCode=2;
  }
}
module.exports={inspectHarnessDependencies};
