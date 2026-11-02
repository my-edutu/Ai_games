'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const planPath=path.join(root,'public/ai-dungeon/melee-arc-plan.js');
const directorPath=path.join(root,'public/ai-dungeon/combat-director.js');
const load=async()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(planPath,'utf8')).toString('base64'));

test('only actual adjacent physical weapon attacks get the melee arc; ranger and hostile casts keep their projectiles',async()=>{
 const {canStageMeleeArc}=await load();
 const a=Object.freeze({x:4,z:3}),b=Object.freeze({x:5,z:3});
 for(const kind of ['vanguard','revenant','warden'])assert.equal(canStageMeleeArc(kind,'attack',a,b),true,kind);
 for(const kind of ['ranger','mystic','cultist','unknown'])assert.equal(canStageMeleeArc(kind,'attack',a,b),false,kind);
 assert.equal(canStageMeleeArc('warden','cast',a,b),false);
 assert.equal(canStageMeleeArc('vanguard','hurt',a,b),false);
 assert.equal(canStageMeleeArc('vanguard','attack',a,{x:6,z:3}),false,'no distant magic sword');
 assert.equal(canStageMeleeArc('vanguard','attack',a,{x:5,z:4}),false,'no diagonal wall-traversing sword');
 assert.equal(canStageMeleeArc('vanguard','attack',a,{x:4,z:3}),false,'no self-contact');
 assert.equal(canStageMeleeArc('vanguard','attack',a,{x:Infinity,z:3}),false);
});

test('3D weapon arc advances along genuine adjacent lane, remains body-height and frame-bounded, supports reduced motion',async()=>{
 const {planMeleeArcFrame,MELEE_ARC_DURATION}=await load();
 const source=Object.freeze({x:4,z:3}),target=Object.freeze({x:5,z:3});
 assert.ok(MELEE_ARC_DURATION>=.25&&MELEE_ARC_DURATION<=.5);
 const start=planMeleeArcFrame(source,target,0),middle=planMeleeArcFrame(source,target,MELEE_ARC_DURATION/2),end=planMeleeArcFrame(source,target,MELEE_ARC_DURATION);
 assert.ok(start.x<middle.x&&middle.x<end.x,'crescent must cross the lane, not spin in place');
 for(const frame of [start,middle,end]){
  assert.ok(frame.x>=source.x&&frame.x<=target.x);
  assert.equal(frame.z,3);
  assert.ok(frame.y>=.95&&frame.y<=1.5,'above-ground weapon contact, not floor halos');
  assert.ok(Number.isFinite(frame.yaw)&&Number.isFinite(frame.roll));
  assert.ok(frame.scale>=.45&&frame.scale<=1.5);
  assert.ok(frame.opacity>=0&&frame.opacity<=1);
 }
 assert.ok(end.opacity<start.opacity,'arc decays into follow-through');
 assert.deepEqual(planMeleeArcFrame(source,target,-100),start);
 assert.deepEqual(planMeleeArcFrame(source,target,100),end);
 const reducedA=planMeleeArcFrame(source,target,0,true);
 const reducedB=planMeleeArcFrame(source,target,MELEE_ARC_DURATION/2,true);
 assert.equal(reducedA.x,reducedB.x,'no sweeping animation in reduced-motion mode');
 assert.equal(reducedA.y,reducedB.y);
 assert.equal(reducedA.roll,reducedB.roll);
 assert.ok(reducedA.opacity<=.75,'non-strobing alternative');
 assert.equal(planMeleeArcFrame(source,{x:7,z:3},.2),null);
 assert.equal(planMeleeArcFrame(source,target,NaN),null);
 assert.equal(JSON.stringify(source),'{"x":4,"z":3}');
 const src=fs.readFileSync(planPath,'utf8');
 assert.doesNotMatch(src,/Math\.random|Date\.|performance\.|requestAnimationFrame|fetch\(|DungeonRuntime/);
});

test('real WebGL director stages and animates contact arcs without altering authoritative time or faking ranger sword swings',()=>{
 const src=fs.readFileSync(directorPath,'utf8');
 const host=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.match(src,/import \{canStageMeleeArc,planMeleeArcFrame,MELEE_ARC_DURATION\}/);
 assert.match(src,/canStageMeleeArc\(kind,action,source,target\)/);
 assert.match(src,/planMeleeArcFrame\(source,target,life,reducedMotion\)/);
 assert.match(src,/stagedArcFrame\(effect\.source,effect\.target,effect\.from,effect\.to,effect\.life,reducedMotion,actorById\)/,
  'the real current animated hand may anchor the arc but must retain the authoritative adjacent-cell source and target');
 assert.match(src,/if\(canStageMeleeArc\(kind,action,source,target\)\)/,'only genuine adjacent melee actions create the forged blade');
 assert.match(src,/from:stagePoint\(stagePositions,u\)/,'contact positions must originate from real same-snapshot actors');
 assert.match(src,/activeMeleeArcs:/);
 assert.match(src,/totalMeleeArcs:/);
 assert.ok(host.includes("['/dungeon/melee-arc-plan.js','melee-arc-plan.js']"));
 assert.doesNotMatch(src,/Math\.random|Date\.now|performance\.now/);
});
