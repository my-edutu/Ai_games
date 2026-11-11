'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const src=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/warden-arena-stage-plan.js'),'utf8');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
function scene(){
 const rows=Array.from({length:19},(_,z)=>Array.from({length:19},(_,x)=>
  x>0&&z>0&&x<18&&z<18?'.':'#'));
 rows[6][10]='#';rows[8][10]='#';return rows.map(r=>r.join(''));
}
test('real Warden fighting court loses only unrelated decor and leaves every authority cell intact',async()=>{
 const {planWardenArenaStage:plan}=await load(),map=scene(),exit={x:10,z:10},unchanged=JSON.stringify(map);
 const stage=plan(map,exit);
 assert.equal(stage.status,'court-cleared');assert.equal(stage.clearCourtTile(10,10),true);
 assert.equal(stage.clearCourtTile(7,7),true);assert.equal(stage.clearCourtTile(6,10),false);
 assert.equal(stage.clearCourtTile(10,6),false);assert.equal(stage.clearCourtTile(10,8),false);
 assert.equal(stage.clearCourtTile(14,10),false);assert.equal(stage.gate,null);
 assert.equal(stage.authorityChanges,0);assert.equal(JSON.stringify(map),unchanged);
});
test('a Gothic gate is only admitted between two actual impassable support cells',async()=>{
 const {planWardenArenaStage:plan}=await load(),map=scene(),exit={x:10,z:10};
 const threshold={role:'warden',gridX:10,gridZ:7,yaw:0,supportCells:[[10,6],[10,8]]};
 const route={status:'ready',thresholds:[threshold]},stage=plan(map,exit,route);
 assert.equal(stage.gate.realWalkableEntrance,true);assert.equal(stage.gate.realBlockedSupports,2);
 assert.equal(stage.gate.x,1);assert.equal(stage.gate.z,-2);
 assert.deepEqual(stage.gate.supports,[[10,6],[10,8]]);
 for(const t of [
  {...threshold,supportCells:[[10,6],[10,9]]},
  {...threshold,supportCells:[[10,6],[10,7]]},
  {...threshold,supportCells:[[3,7],[5,7]]},
  {...threshold,gridX:9,gridZ:7}
 ])assert.equal(plan(map,exit,{status:'ready',thresholds:[t]}).gate,null);
 assert.equal(plan(map,exit,{status:'invalid-or-unreachable',thresholds:[threshold]}).gate,null);
});
test('invalid world data fail-closed instead of deleting content or manufacturing a boss gate',async()=>{
 const {planWardenArenaStage:plan}=await load();
 for(const bad of [null,[],['#'],['########','########'],scene().map(r=>r.replaceAll('.','?'))]){
  const p=plan(bad,{x:10,z:10});assert.equal(p.status,'unavailable');
  assert.equal(p.gate,null);assert.equal(p.clearCourtTile(10,10),false);
 }
});
