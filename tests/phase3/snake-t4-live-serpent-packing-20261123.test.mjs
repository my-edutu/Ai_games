import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createSerpent} from '../../public/snake-stream/serpent.mjs';

const line = length => Array.from({length},(_,i)=>Object.freeze({x:0,z:-i}));
const options = detail => ({detail,runToken:'exact-public-2026',direction:{x:0,z:1},reducedMotion:true,time:0,delta:1/60});
function model(length,detail='high'){
 const hero=createSerpent(THREE);
 hero.update([line(length)],options(detail));
 return hero;
}
const body = hero => hero.group.getObjectByName('Continuous sculpted serpent body').geometry;

test('T4 complete original long native serpent retains all authentic geometry with compact normalized normals and safe indices',()=>{
 for(const detail of ['high','low'])for(const length of [48,96]){
  const hero=model(length,detail);
  try{
   const geometry=body(hero),n=geometry.getAttribute('normal'),p=geometry.getAttribute('position'),uv=geometry.getAttribute('uv'),idx=geometry.getIndex(),s=hero.stats();
   assert.ok(s.bodyRings>=length, 'do not reduce original anatomical sampling');
   assert.ok(n.array instanceof Int16Array && n.normalized, 'send original complete dynamic surface normals as native signed 16-bit normalized attributes');
   assert.ok(idx.array instanceof Uint16Array && !idx.normalized, 'use exact index values with 16-bit index buffer while vertex range is safe');
   assert.equal(p.array.BYTES_PER_ELEMENT,4,'physical position precision is unchanged');
   assert.equal(uv.array.BYTES_PER_ELEMENT,4,'original precise full-length UV flow is unchanged');
   assert.ok(p.count>=s.bodyVertices,'original serpent silhouette is uncut');
   assert.ok(s.bodyTriangles>length*12,'genuine complete tube topology');
   const fullPrecisionBytes=s.bodyCapacityRings*(21*3*4+21*3*4+21*2*4+20*6*4);
   assert.ok(s.bufferBytes/fullPrecisionBytes<.70,`complete buffer storage must fall >=30%: ${s.bufferBytes}/${fullPrecisionBytes}`);
   for(let v=0;v<s.bodyVertices;v+=Math.max(1,Math.floor(s.bodyVertices/137))){
    const normal=new THREE.Vector3().fromBufferAttribute(n,v),lengthNormal=normal.length();
    assert.ok(Math.abs(lengthNormal-1)<.00009,`true physically shaded normals must stay unit-length, got ${lengthNormal}`);
    for(const component of [normal.x,normal.y,normal.z])assert.ok(Number.isFinite(component)&&Math.abs(component)<=1);
   }
   for(let k=0;k<geometry.drawRange.count;k+=Math.max(1,Math.floor(geometry.drawRange.count/101)))
    assert.ok(idx.getX(k)<s.bodyVertices,'no wrapped triangle index');
  }finally{hero.dispose()}
 }
});

test('T4 actual growth over 65535 possible vertices safely promotes indices without changing full portal topology',()=>{
 const hero=createSerpent(THREE);
 try{
  const original=line(650);
  hero.update([original],options('high'));
  const g=body(hero),s=hero.stats();
  assert.ok(s.bodyRings>3120,`long native model must cross the true 16-bit position space: ${s.bodyRings}`);
  assert.ok(g.getIndex().array instanceof Uint32Array,'long native geometry must prevent 16-bit wrap');
  assert.ok(g.getAttribute('normal').array instanceof Int16Array && g.getAttribute('normal').normalized);
  const index=g.getIndex();let max=-1;for(let i=0;i<g.drawRange.count;i++)max=Math.max(max,index.getX(i));
  assert.ok(max>65535&&max<s.bodyVertices,`real long-body indices must preserve entire tail ${max}`);
  const originalSnapshot=JSON.stringify(original);
  const separated=[line(42),Array.from({length:12},(_,i)=>({x:25,z:15-i}))];
  hero.update(separated,{...options('low'),runToken:'next-portal-fragment',fragmentDirections:[{x:0,z:1},{x:0,z:1}]});
  assert.equal(hero.stats().paths,2,'no portal bridge introduced');
  assert.equal(JSON.stringify(original),originalSnapshot,'presentation must not mutate authoritative public input');
  assert.equal(g.getAttribute('normal').normalized,true);
 }finally{hero.dispose()}
});
