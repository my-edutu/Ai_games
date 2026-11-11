'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/measured-weapon-trail.js')).href);

const basis=()=>[1,0,0,0,0,1,0,0,0,0,1,0,0,0,0,1];
const body=Object.freeze({});
const bone=Object.freeze({});
const captured=()=>({
 bodyM0:1,bodyM1:0,bodyM2:0,
 bodyM4:0,bodyM5:1,bodyM6:0,
 bodyM8:0,bodyM9:0,bodyM10:1,
 bodyM12:0,bodyM13:0,bodyM14:0
});
const wrist=(localX,matrix,extra={})=>({
 x:localX,y:1.2,z:0,rootX:0,rootY:0,rootZ:0,yaw:0,
 sourceBone:bone,sourceBodyRoot:body,localX,localY:1.2,localZ:0,
 poseFrameMatrix:matrix,...captured(),...extra
});

test('D04 measured authored stroke uses the sampled matrix, not a later mutated live matrix',async()=>{
 const {planMeasuredHandTrail}=await load();
 const matrix=basis(),previous=wrist(0,matrix),current=wrist(.12,matrix);
 const expected=planMeasuredHandTrail(previous,current,.016);
 assert.ok(expected);
 matrix[0]=7;matrix[8]=4;matrix[10]=.1;
 const afterMutation=planMeasuredHandTrail(previous,current,.016);
 assert.deepEqual(afterMutation,expected,
  'a mutable Matrix4 reference must not rewrite an already witnessed local-hand travel');
});

test('D04 captured rotated authored basis projects the actual sampled hand delta',async()=>{
 const {planMeasuredHandTrail}=await load();
 const matrix=basis(),previous=wrist(0,matrix),current=wrist(.12,matrix,{
  bodyM0:0,bodyM1:0,bodyM2:-1,bodyM8:1,bodyM9:0,bodyM10:0
 });
 const segment=planMeasuredHandTrail(previous,current,.016);
 assert.ok(segment);
 assert.ok(Math.abs(segment.direction.z+1)<1e-9);
 assert.ok(Math.abs(segment.direction.x)<1e-9);
 assert.ok(Math.abs(segment.length-.12)<1e-9);
});

test('D04 incomplete or nonfinite captured body basis fails closed despite a plausible live matrix',async()=>{
 const {planMeasuredHandTrail}=await load();
 for(const bad of [{bodyM0:NaN},{bodyM10:Infinity},{bodyM5:undefined},
  {bodyM8:undefined},{bodyM12:NaN}]){
  const matrix=basis(),previous=wrist(0,matrix),current=wrist(.12,matrix,bad);
  assert.equal(planMeasuredHandTrail(previous,current,.016),null);
 }
});

test('D04 a complete body snapshot remains usable without a mutable matrix pointer',async()=>{
 const {planMeasuredHandTrail}=await load();
 const matrix=basis(),previous=wrist(0,matrix),current=wrist(.12,matrix);
 delete current.poseFrameMatrix;
 assert.ok(planMeasuredHandTrail(previous,current,.016));
});

test('D04 older body-local adapters without captured coefficients still use their matrix witness',async()=>{
 const {planMeasuredHandTrail}=await load();
 const matrix=basis(),previous=wrist(0,matrix),current=wrist(.12,matrix);
 for(const key of Object.keys(captured())){delete previous[key];delete current[key]}
 assert.ok(planMeasuredHandTrail(previous,current,.016));
});

test('D04 non-body numeric fallback stays a hand-only proxy',async()=>{
 const {planMeasuredHandTrail}=await load();
 const a={x:0,y:1,z:0,rootX:0,rootY:0,rootZ:0,yaw:0};
 const b={...a,x:.12};
 const s=planMeasuredHandTrail(a,b,.016);
 assert.ok(s);
 assert.ok(Math.abs(s.length-.12)<1e-9);
});
