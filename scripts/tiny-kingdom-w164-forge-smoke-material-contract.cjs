'use strict';
// W164: production-source, RED-first regression for genuine forge plume GPU
// materials. Does not generate a fake scene, worker, receipt or benchmark.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('function validMaterialTag(material){');
const end=html.indexOf('\nfunction inspectMeshGeometry(',begin);
assert(begin>0&&end>begin,'must execute the actual production geometry auditor');
const palette=html.match(/const MATERIAL=Object\.freeze\(\{[^}]+\}\);/);
assert(palette,'must use actual production shader-material palette');
const valid=vm.runInNewContext(palette[0]+'\n'+html.slice(begin,end)+'\nvalidMaterialTag',
  Object.create(null),{timeout:1000});
assert.equal(typeof valid,'function');
assert.match(html,/data\[v\+9\]=19\+\(k\+\.5\)\/16;/,'authentic forge puff tags');
assert.match(html,/if\(materialId>19\.0&&materialId<20\.0\)/,'WebGL animates these exact tags');
for(let k=0;k<3;k++)assert.equal(valid(19+(k+.5)/16),true,
  'real forge chimney puff '+k+' must not fail geometry integrity');
for(let k=0;k<4;k++){
  assert.equal(valid(17+(k+.5)/16),true,'preserve household chimney '+k);
  assert.equal(valid(18+(k+.5)/16),true,'preserve civic flag '+k);
}
for(let leaf=1;leaf<=8;leaf++)
  assert.equal(valid(14+leaf/32),true,'preserve original rotating market shutter '+leaf);
for(const malformed of [19,19+(3.5)/16,19+(4.5)/16,19.5,20,14.45,-1,NaN,Infinity])
  assert.equal(valid(malformed),false,'reject malformed or unowned shader tag '+malformed);
for(let k=0;k<=13;k++)assert.equal(valid(k),true,'preserve base material '+k);
assert.match(html,/if\(!validMaterialTag\(material\)\)invalidComponents\+\+/,
  'geometryAudit must still evaluate every submitted material field');
assert.equal(3*8*6*3,432,'three 48-triangle forge ellipsoids explain 432 RED vertices');
console.log('W164 PASS: actual shader forge IDs and source integrity contract, 3 real puffs, 432 formerly rejected vertices; browser/physical GPU pending');
