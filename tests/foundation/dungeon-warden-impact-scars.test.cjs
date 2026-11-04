'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
async function load(){
 const source=fs.readFileSync(path.join(ROOT,'public/ai-dungeon/warden-impact-plan.js'),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
}
const map=['#######','#.....#','#.....#','#.....#','#.....#','#.....#','#######'];
const before={run:1,floor:3,tick:17,phase:'exploring',map,
 units:[{kind:'warden',faction:'enemy',hp:25}],
 bossWarning:{shape:'NOVA',attackTick:18,cells:[{x:3,z:3},{x:2,z:3},{x:2,z:3},{x:0,z:0}]}};
const after={run:1,floor:3,tick:18,phase:'exploring',map,
 events:[{tick:18,kind:'danger',text:'The Warden nova shockwave struck 1 hero'}]};
test('true stone aftermath requires genuine same-run Warden attack and floor-marked cells',async()=>{
 const {planConfirmedWardenImpact:plan}=await load();
 const input=JSON.stringify({before,after}),actual=plan(before,after);
 assert.equal(actual?.tick,18);assert.equal(actual?.shape,'NOVA');
 assert.deepEqual(actual.cells,[{x:3,z:3},{x:2,z:3}]);
 assert.deepEqual(plan(before,after),actual,'same confirmed impact yields same visual plan');
 assert.equal(plan(before,{...after,phase:'intermission'})?.tick,18,
  'a genuine fatal ground strike must remain physically visible under the fallen expedition');
 assert.equal(plan(before,{...after,events:[{tick:18,kind:'evade',text:'The Warden nova shockwave struck 0 heroes'}]})?.tick,18,
  'a real fully dodged boss shockwave still fractures actual marked stone');
 assert.equal(JSON.stringify({before,after}),input,'never modify authoritative snapshots');
 for(const pair of [
  [{...before,bossWarning:null},after],
  [before,{...after,events:[]}],
  [before,{...after,run:2}],
  [before,{...after,floor:4}],
  [before,{...after,tick:17}],
  [before,{...after,events:[{tick:18,kind:'danger',text:'The Warden rift cross shockwave struck 1 hero'}]}]
 ])assert.equal(plan(...pair),null,'no invented environmental damage');
});
test('real 3D renderer attaches historical impact to scene, runtime route and honest diagnostics',()=>{
 const app=fs.readFileSync(path.join(ROOT,'public/ai-dungeon/app.js'),'utf8');
 const renderer=fs.readFileSync(path.join(ROOT,'public/ai-dungeon/warden-impact-scars.js'),'utf8');
 const server=fs.readFileSync(path.join(ROOT,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(app,/wardenImpactScars\?\.accept\(previousState,s,timeNow\(\)\)/);
 assert.match(app,/wardenImpactScars\?\.animate\(time\)/);
 assert.match(app,/wardenImpactScars\?\.dispose\(\)/);
 assert.ok(renderer.includes('const LIMIT=72'));
 assert.ok(renderer.includes('new THREE.InstancedMesh'));
 assert.ok(renderer.includes('const MAX_DEBRIS=20'));
 assert.ok(renderer.includes('falling=plan.cells.slice(0,MAX_DEBRIS)'));
 assert.match(app,/genuineWardenGroundEvent\(event\)/);
 assert.ok(app.includes(String.raw`shockwave struck \d+ hero`),
  'actual Warden combat must trigger physical FX even after every hero dodges');
 assert.ok(server.includes("['/dungeon/warden-impact-scars.js','warden-impact-scars.js']"));
 assert.ok(server.includes("['/dungeon/warden-impact-plan.js','warden-impact-plan.js']"));
});
