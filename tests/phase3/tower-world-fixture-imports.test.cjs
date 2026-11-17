'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const os = require('node:os');
const path = require('node:path');
const { resolveTowerWorldFixtureImports } = require('../helpers/tower-world-fixture-imports.cjs');

const ROOT = path.resolve(__dirname,'../..');
const WORLD = fs.readFileSync(path.join(ROOT,'public/infinite-tower-climb/visuals/world.mjs'),'utf8');
test('copied real-world fixture binds all new shipping relative modules, including outer guardian gate', () => {
 const scratch = fs.mkdtempSync(path.join(os.tmpdir(),'tower-coverage-'));
 try {
  const source = resolveTowerWorldFixtureImports(WORLD,{root:ROOT,fixtureDir:scratch});
  assert.match(source,/from "file:\/\/\/.*guardian-clear-sightline-frame\.mjs"/);
  assert.doesNotMatch(source,/\bfrom\s+['"]\.\/[\w-]+\.mjs['"]/);
  assert.match(source,/from '\/tower\/vendor\/three\.module\.js'/,
    'browser-only vendor should still be mapped explicitly by original fixture');
 } finally { fs.rmSync(scratch,{recursive:true,force:true}); }
});
test('intentional scratch overrides retain their own path; missing dependencies fail closed', () => {
 const scratch = fs.mkdtempSync(path.join(os.tmpdir(),'tower-override-'));
 try {
  fs.writeFileSync(path.join(scratch,'scene-hierarchy.mjs'),'export const sentinel=1;');
  const source = resolveTowerWorldFixtureImports(
   "import { x } from './scene-hierarchy.mjs';", {root:ROOT,fixtureDir:scratch});
  assert.equal(source,"import { x } from './scene-hierarchy.mjs';");
  assert.throws(()=>resolveTowerWorldFixtureImports(
   "import { x } from './missing-guardian-asset.mjs';",{root:ROOT,fixtureDir:scratch}),
   /Missing shipping Tower dependency/);
 } finally { fs.rmSync(scratch,{recursive:true,force:true}); }
});
