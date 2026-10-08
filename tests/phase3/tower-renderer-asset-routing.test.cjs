'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const publicRoot=path.join(root,'public/infinite-tower-climb');
const server=fs.readFileSync(path.join(root,'scripts/serve-tower-stream.cjs'),'utf8');
test('every locally imported 3D module is available through tower HTTP routing',()=>{
  const seen=new Set(),pending=['scene3d.js'];
  while(pending.length){
    const name=pending.pop();
    if(seen.has(name))continue;
    seen.add(name);
    const source=fs.readFileSync(path.join(publicRoot,name),'utf8');
    assert.ok(server.includes("'/tower/"+name+"':'"+name+"'"),'missing route: '+name);
    assert.ok(server.includes("'"+name+"'"),'missing self-test asset: '+name);
    for(const match of source.matchAll(/from\s*['"]\/tower\/([^'"]+\.js)['"]/g)){
      if(match[1].startsWith('three.'))continue;
      pending.push(match[1]);
    }
  }
  assert.ok(seen.has('landmarks-v5.js'),'landmark module not inspected');
});
test('every linked tower stylesheet is routed and present',()=>{
  const html=fs.readFileSync(path.join(publicRoot,'index.html'),'utf8');
  for(const match of html.matchAll(/href="\/tower\/([^"]+\.css)"/g)){
    const name=match[1];
    assert.ok(fs.existsSync(path.join(publicRoot,name)),name+' missing');
    assert.ok(server.includes("'/tower/"+name+"':'"+name+"'"),name+' missing route');
  }
});

test('renderer has one effects import and wires authored geology into backdrop',()=>{
  const source=fs.readFileSync(path.join(publicRoot,'scene3d.js'),'utf8');
  const imports=[...source.matchAll(/import\s*\{\s*createTowerEffectsDirector\s*\}\s*from\s*['"]\/tower\/effects-v6\.js['"]/g)];
  assert.equal(imports.length,1,'duplicate named import breaks ES module parsing');
  assert.match(source,/import\s*\{\s*buildTowerGeology\s*\}\s*from\s*['"]\/tower\/geology-v9\.js['"]/);
  assert.match(source,/buildTowerGeology\(\{group:backdrop,snapshot:s,quality\}\)/);
  const geology=fs.readFileSync(path.join(publicRoot,'geology-v9.js'),'utf8');
  assert.match(geology,/export function buildTowerGeology\(/);
  assert.match(geology,/new THREE\.InstancedMesh\(/);
});
