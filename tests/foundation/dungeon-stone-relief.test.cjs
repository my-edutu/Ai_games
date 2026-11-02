'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
const source=path.join(root,'public/ai-dungeon/stone-relief-plan.js');
async function load(){const code=fs.readFileSync(source,'utf8');return import('data:text/javascript;base64,'+Buffer.from(code).toString('base64'))}
function faces(map){
 const N=map.length,O=(N-1)/2,items=[];
 for(let z=1;z<N-1;z++)for(let x=1;x<N-1;x++)if(map[z][x]==='#'){
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   if(map[z+dz]?.[x+dx]!=='.')continue;
   items.push([x-O+dx*.511,1.22,z-O+dz*.511,dz!==0?.88:.024,2.31,dx!==0?.88:.024,0,dx,dz]);
  }
 }
 return items;
}
test('original raised masonry spalls and broken coping reuse only safe exposed real wall faces',async()=>{
 const {planStoneRelief}=await load();
 for(let i=0;i<8;i++){
  const state=DungeonRuntime.create('stone-weathering-seed-'+i).publicState();
  const wall=faces(state.map);
  for(const floor of [1,2,3,4]){
   const p=planStoneRelief(wall,floor);
   assert.ok(p.spalls.length>=12&&p.spalls.length<=96,'bounded relief pieces on a real dungeon wall');
   assert.ok(p.coping.length>=3&&p.coping.length<=48,'bounded broken wall crowns');
   for(const piece of [...p.spalls,...p.coping]){
    const original=wall[piece.faceIndex];assert.ok(original,'piece must be attached to a real exposed wall face');
    for(const dimension of ['x','y','z','sx','sy','sz','yaw','shade'])assert.ok(Number.isFinite(piece[dimension]),dimension);
    assert.ok(Math.abs(piece.x-original[0])<=.45&&Math.abs(piece.z-original[2])<=.45,'stone fits its original wall tile');
    assert.ok(piece.y>.1&&piece.y<3.0);
    assert.ok(piece.sx>.015&&piece.sy>.015&&piece.sz>.015&&Math.max(piece.sx,piece.sy,piece.sz)<.85);
    assert.ok(piece.shade>.4&&piece.shade<1.4);
   }
   assert.deepEqual(p,planStoneRelief(wall,floor),'render-only geometry planning is reproducible');
  }
 }
});
test('weathering has floor identity, strict caps and safe failure on malformed inputs',async()=>{
 const {planStoneRelief}=await load();
 const wall=faces(DungeonRuntime.create('stone-relief-identity').publicState().map);
 assert.notDeepEqual(planStoneRelief(wall,1),planStoneRelief(wall,2));
 assert.deepEqual(planStoneRelief(wall,1,{maxSpalls:0,maxCoping:0}),{spalls:[],coping:[]});
 const tiny=planStoneRelief(wall,2,{maxSpalls:3,maxCoping:2});assert.ok(tiny.spalls.length<=3&&tiny.coping.length<=2);
 assert.deepEqual(planStoneRelief([],1),{spalls:[],coping:[]});
 assert.deepEqual(planStoneRelief([[NaN,0,0,0,0,0,0,1,0]],1),{spalls:[],coping:[]});
 assert.deepEqual(planStoneRelief(wall,NaN),{spalls:[],coping:[]});
 assert.deepEqual(planStoneRelief(wall,-1),{spalls:[],coping:[]});
 const src=fs.readFileSync(source,'utf8');
 assert.doesNotMatch(src,/Math\.random|Date\.|performance\.|fetch\(|requestAnimationFrame|DungeonRuntime/);
});
test('production renderer instantiates weathered stone twice per floor and clears camera-blocking pieces',()=>{
 const scene=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(scene,/import \{planStoneRelief\} from '\/dungeon\/stone-relief-plan\.js'/);
 assert.match(scene,/planStoneRelief\(wallFaces,floor\)/);
 assert.match(scene,/weatheredSpalls:/);
 assert.match(scene,/brokenCopingStones:/);
 assert.match(scene,/clearedWeatheredPieces/);
 assert.match(scene,/spallMesh\.instanceMatrix\.needsUpdate=true/);
 assert.match(scene,/copingMesh\.instanceMatrix\.needsUpdate=true/);
 assert.ok(host.includes("['/dungeon/stone-relief-plan.js','stone-relief-plan.js']"));
});
