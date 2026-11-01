'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const planFile=path.join(root,'public/ai-dungeon/fractured-wall-plan.js');
async function load(){const code=fs.readFileSync(planFile,'utf8');return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))}
test('sculpted dungeon wall tile is a closed, irregular, bounded real 3D volume',async()=>{
 const {planFracturedWallStone}=await load();
 for(const floor of [1,2,3,4,1000]){
  const plan=planFracturedWallStone(floor);
  assert.ok(plan.vertices.length>=72&&plan.vertices.length<=240);
  assert.ok(plan.indices.length>=120&&plan.indices.length<=480);
  assert.equal(plan.indices.length%3,0);
  assert.equal(plan.uvs.length,plan.vertices.length/3*2);
  assert.ok(plan.indices.every(i=>Number.isInteger(i)&&i>=0&&i<plan.vertices.length/3));
  const xs=[],ys=[],zs=[];
  for(let i=0;i<plan.vertices.length;i+=3){
   const [x,y,z]=plan.vertices.slice(i,i+3);
   assert.ok([x,y,z].every(Number.isFinite));
   assert.ok(Math.abs(x)<=.50001&&Math.abs(z)<=.50001&&y>=-.50001&&y<=.50001,'sculpture stays inside the existing solid tile');
   xs.push(x);ys.push(y);zs.push(z);
  }
  assert.ok(Math.min(...ys)<=-.499&&Math.max(...ys)>=.42);
  assert.ok(new Set(ys.filter(v=>v>.25).map(v=>v.toFixed(3))).size>=3,'physically varied chipped upper edge');
  assert.deepEqual(plan,planFracturedWallStone(floor));
 }
 assert.notDeepEqual(planFracturedWallStone(1),planFracturedWallStone(2));
});
test('wall stone variations are finite, stable and preserve the original navigation map',async()=>{
 const {planFracturedWallStone,planWallStoneVariation}=await load();
 const signatures=new Set();
 for(let z=-9;z<=9;z++)for(let x=-9;x<=9;x++){
  const a=planWallStoneVariation(x,z,3);
  assert.deepEqual(a,planWallStoneVariation(x,z,3));
  assert.ok([0,Math.PI/2,Math.PI,Math.PI*1.5].includes(a.yaw));
  assert.ok(a.shade>=.80&&a.shade<=1.09);
  signatures.add(a.yaw+':'+a.shade);
 }
 assert.ok(signatures.size>10);
 assert.deepEqual(planFracturedWallStone(NaN),{vertices:[],indices:[],uvs:[]});
 assert.deepEqual(planWallStoneVariation(NaN,0,3),{yaw:0,shade:1});
 const source=fs.readFileSync(planFile,'utf8');
 assert.doesNotMatch(source,/Math\.random|Date\.|fetch\(|performance\.|DungeonRuntime|requestAnimationFrame/);
});
test('real instanced WebGL dungeon walls use the sculpted geometry and preserve cutaway truth',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(app,/import \{planFracturedWallStone,planWallStoneVariation\} from '\/dungeon\/fractured-wall-plan\.js'/);
 assert.match(app,/const fracturedWall=new THREE.BufferGeometry\(\)/);
 assert.match(app,/instance\(fracturedWall,stone,walls/);
 assert.match(app,/wallSculpture:/);
 assert.match(app,/planWallStoneVariation\(point\[0\],point\[1\],state\?\.floor\?\?1\)/);
 assert.ok(host.includes("['/dungeon/fractured-wall-plan.js','fractured-wall-plan.js']"));
});