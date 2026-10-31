'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const source=path.resolve(__dirname,'../../games/marble-survival/public/complete-runtime/racer-studio-model.js');
const model=fs.existsSync(source)?require(source):{};
const sample=(id=0)=>({id,number:id+1,name:'Racer '+id,palette:'cyan',pattern:'ring',archetype:'navigator',status:'racing',progressPermille:450,elevation:250,velocityX:50,velocityY:-75});
test('studio provides pure character and bounded geometry interfaces',()=>{
  for(const name of ['appearance','roster','sphere','torus','box','roleParts'])assert.equal(typeof model[name],'function',name);
});
test('all 32 public characters keep distinct repeatable visual identities',()=>{
  assert.equal(typeof model.appearance,'function');
  const identities=Array.from({length:32},(_,id)=>model.appearance(sample(id)));
  assert.equal(new Set(identities.map(x=>x.seed)).size,32);
  for(let i=0;i<32;i++){assert.equal(identities[i].number,i+1);assert.deepEqual(identities[i],model.appearance(sample(i)));}
});
test('studio never mutates public authority or maps one palette to another',()=>{
  assert.equal(typeof model.roster,'function');
  const snapshot={marbles:[sample(3),sample(1)]};const before=JSON.stringify(snapshot);
  const roster=model.roster(snapshot);assert.equal(JSON.stringify(snapshot),before);
  assert.deepEqual(roster.map(x=>x.id),[1,3]);assert.equal(roster[0].name,'Racer 1');
  assert.deepEqual(roster[0].color,[.13,.86,1]);
});
test('untrusted malformed public data is bounded and unknown roles fall back explicitly',()=>{
  assert.equal(typeof model.roster,'function');
  assert.deepEqual(model.roster(null),[]);
  const entries=model.roster({marbles:[null,{...sample(),id:NaN},sample(),sample(),...Array.from({length:70},(_,i)=>sample(i+1))]});
  assert.equal(entries.length,32);assert.equal(new Set(entries.map(x=>x.id)).size,32);
  const bad=model.appearance({...sample(),archetype:'constructor',palette:'__proto__',progressPermille:Infinity,name:'x'.repeat(300)});
  assert.equal(bad.role,'navigator');assert.ok(bad.name.length<=48);assert.ok(Number.isFinite(bad.progress));
  assert.deepEqual(bad.color,[.13,.86,1]);
});
test('all four archetypes have distinct nonempty bounded original silhouettes',()=>{
  assert.equal(typeof model.roleParts,'function');
  const roles=['navigator','sprinter','bruiser','survivor'];
  const forms=roles.map(role=>model.roleParts(role));
  assert.equal(new Set(forms.map(JSON.stringify)).size,4);
  for(const parts of forms){assert.ok(parts.length>=2&&parts.length<=12);for(const part of parts)assert.ok([...part.position,...part.scale,...part.rotation].every(Number.isFinite));}
});
test('portrait meshes have valid normals, finite vertices and bounded unsigned-short indices',()=>{
  assert.equal(typeof model.sphere,'function');
  for(const mesh of [model.sphere(24,36),model.torus(36,10),model.box()]){
    assert.ok(mesh.positions.length>0&&mesh.positions.length<65535*3);
    assert.equal(mesh.positions.length,mesh.normals.length);
    assert.ok(mesh.positions.every(Number.isFinite));assert.ok(mesh.normals.every(Number.isFinite));
    assert.ok(mesh.indices.every(i=>i>=0&&i<mesh.positions.length/3));
    for(let i=0;i<mesh.normals.length;i+=3)assert.ok(Math.abs(Math.hypot(...mesh.normals.slice(i,i+3))-1)<.0001);
  }
  assert.throws(()=>model.sphere(10000,10000),RangeError);
  assert.throws(()=>model.torus(-1,10),RangeError);
});
test('studio triangles face outward so real GPU culling does not erase role rings',()=>{
  for(const mesh of [model.sphere(12,18),model.torus(24,8),model.box()])for(let i=0;i<mesh.indices.length;i+=3){
    const ids=mesh.indices.slice(i,i+3),p=ids.map(id=>mesh.positions.slice(id*3,id*3+3));
    const a=p[1].map((v,k)=>v-p[0][k]),b=p[2].map((v,k)=>v-p[0][k]);
    const cross=[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
    const n=mesh.normals.slice(ids[0]*3,ids[0]*3+3);
    assert.ok(cross.reduce((s,v,k)=>s+v*n[k],0)>=-1e-10,'triangle must face its outward normal');
  }
});
