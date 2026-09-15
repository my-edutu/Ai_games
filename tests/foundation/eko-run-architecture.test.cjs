'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const root = path.resolve(__dirname, '..', '..');
const sourceRoot = path.join(root, 'games', 'eko-street-run', 'src');
const authorityDirs = ['config', 'state', 'runtime', 'physics', 'rules'].map(name => path.join(sourceRoot, name));

function tsFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap(entry => {
    const full = path.join(dir, entry.name);
    return entry.isDirectory() ? tsFiles(full) : entry.isFile() && entry.name.endsWith('.ts') ? [full] : [];
  });
}

test('TypeScript build and CI nondeterminism scan include Eko Run authority', () => {
  const tsconfig = fs.readFileSync(path.join(root, 'tsconfig.json'), 'utf8');
  const workflow = fs.readFileSync(path.join(root, '.github', 'workflows', 'ci.yml'), 'utf8');
  assert.match(tsconfig, /games\/eko-street-run\/src\/\*\*\/\*\.ts/);
  assert.match(workflow, /games\/eko-street-run\/src\/runtime/);
  assert.match(workflow, /games\/eko-street-run\/src\/physics/);
  assert.match(workflow, /games\/eko-street-run\/src\/rules/);
  assert.match(workflow, /games\/eko-street-run\/src\/state/);
});

test('authoritative source tree exists and contains no presentation/provider imports or ambient nondeterminism', () => {
  for (const dir of authorityDirs) assert.equal(fs.existsSync(dir), true, `missing authority directory ${path.relative(root, dir)}`);
  const files = authorityDirs.flatMap(tsFiles);
  assert.ok(files.length >= 8, 'expected implemented authority files');
  const forbidden = /Math\.random|Date\.now|new Date\s*\(|setTimeout\s*\(|setInterval\s*\(|from\s+['"][^'"]*presentation|require\([^)]*presentation|three|youtube|twitch|stripe|paypal/i;
  for (const file of files) {
    const text = fs.readFileSync(file, 'utf8');
    assert.equal(forbidden.test(text), false, `forbidden authority dependency in ${path.relative(root, file)}`);
  }
});
