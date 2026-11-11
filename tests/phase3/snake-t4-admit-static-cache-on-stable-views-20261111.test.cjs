'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const root = path.resolve(__dirname, '../..');
const renderer = fs.readFileSync(path.join(root,'public/snake-stream/renderer.mjs'),'utf8');
const strict = fs.readFileSync(path.join(root,'tests/browser/snake-stream.spec.cjs'),'utf8');
function admission() {
  const match = renderer.match(/export function createStaticCacheAdmission\([^]*?\n}\n/);
  assert.ok(match, 'Renderer needs a bounded cache admission gate for changing cinematic camera and resize keys');
  const context = vm.createContext({});
  vm.runInContext(match[0].replace('export ', '') + '\nthis.makeAdmission=createStaticCacheAdmission', context);
  return context.makeAdmission();
}
test('rapidly changing full-scene cinematic camera must not allocate three-pass HDR cache on transient keys',()=>{
  const gate = admission();
  for(let i=0;i<30;i++) assert.equal(gate.allow(`orbit-${i}`), false);
  assert.equal(gate.builds(),0);
  assert.equal(gate.stats().transientFullSceneDraws,30);
  assert.equal(gate.allow('overview'),false);
  assert.equal(gate.allow('overview'),false);
  assert.equal(gate.allow('overview'),true,'a genuinely steady third complete view may build');
  gate.built('overview');
  for(let i=0;i<60;i++) assert.equal(gate.allow('overview'),true,'a resolved static target must be reused on stable frames');
  assert.equal(gate.builds(),1);
  assert.equal(gate.stats().rebuildsAdmitted,1);
  assert.equal(gate.allow('portal-cut'),false,'never reuse a cached camera pose after teleport');
  assert.equal(gate.allow('overview'),true,'restore known stable frame after transient cut only when key matches the retained cache');
  gate.reset();
  assert.equal(gate.allow('overview'),false,'resizing or changing public board invalidates cached pose and stability');
});
test('a changed property revision must wait for actual view stability, retaining full live 3D direct rendering',()=>{
  const gate = admission();
  for(const key of ['stable','stable','stable']) gate.allow(key);
  gate.built('stable');
  assert.equal(gate.allow('stable|props:1'),false);
  assert.equal(gate.allow('stable|props:1'),false);
  assert.equal(gate.allow('stable|props:1'),true);
  assert.equal(gate.allow('stable|props:2'),false);
});
test('source integrates cache admission without weakening complete renderer submissions',()=>{
  admission();
  assert.match(renderer,/staticCacheAdmission\.allow\(key\)/);
  assert.match(renderer,/staticCacheAdmission\.built\(key\)/);
  assert.match(renderer,/staticCacheAdmission\.reset\(\)/);
  assert.match(renderer,/renderer\.render\(scene, camera\);\s*return;/);
  assert.match(renderer,/liveCacheQuad\.visible = true/);
  assert.match(renderer,/cacheBakeMaterial/);
  assert.match(renderer,/admission: staticCacheAdmission\.stats\(\)/);
  assert.match(strict,/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
});
