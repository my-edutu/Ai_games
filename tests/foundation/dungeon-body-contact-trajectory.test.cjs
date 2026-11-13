'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const source=path.join(root,'public/ai-dungeon/melee-arc-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
const a=Object.freeze({x:8,z:6,kind:'vanguard'}),b=Object.freeze({x:9,z:6,kind:'warden'});

test('a verified adjacent attack visibly lands at the real skinned opponent sternum and then releases',async()=>{
 const {planBodyTrackedArcFrame,MELEE_ARC_DURATION}=await load();
 const opt=Object.freeze({from:{x:8.1,z:6},to:{x:9.08,z:6.08},
  hand:{x:8.16,y:1.36,z:5.89},chest:{x:9.09,y:1.64,z:6.05}});
 const early=planBodyTrackedArcFrame(a,b,.035,false,opt);
 const land=planBodyTrackedArcFrame(a,b,MELEE_ARC_DURATION*.52,false,opt);
 const late=planBodyTrackedArcFrame(a,b,MELEE_ARC_DURATION*.99,false,opt);
 assert.ok(early.skinnedHand&&early.x<8.5,'real hand leads the physical anticipation');
 assert.ok(land.skinnedChest&&land.bodyContactWeight>.5,'real chest owns the impact moment');
 assert.ok(Math.hypot(land.x-opt.chest.x,land.z-opt.chest.z)<.25,'stroke reaches visible skinned body, not empty tile');
 assert.ok(Math.abs(land.y-opt.chest.y)<.22);
 assert.ok(late.bodyContactWeight<.2&&late.x>early.x,'stroke clears into real recovery');
 assert.deepEqual(opt.from,{x:8.1,z:6},'input poses must not be mutated');
});
test('stale, off-cell, invalid, or missing bones cannot produce a distant ghost stroke',async()=>{
 const {planBodyTrackedArcFrame,MELEE_ARC_DURATION}=await load();
 const stale={from:{x:99,z:99},to:{x:Infinity,z:6},hand:{x:13,y:7,z:6},chest:{x:77,y:1,z:6}};
 const f=planBodyTrackedArcFrame(a,b,MELEE_ARC_DURATION/2,false,stale);
 assert.equal(f.skinnedHand,false);
 assert.equal(f.skinnedChest,false);
 assert.ok(f.x>=8&&f.x<=9&&f.z===6&&f.y>.9&&f.y<1.8);
 for(const v of [NaN,Infinity,-Infinity]){
  assert.equal(planBodyTrackedArcFrame(a,b,v,false),null);
 }
 assert.equal(planBodyTrackedArcFrame(a,{x:12,z:6},.2,false),null);
 assert.equal(planBodyTrackedArcFrame(a,{x:9,z:7},.2,false),null);
});
test('reduced motion holds a clear static blade regardless of skinned wrist and impact timing',async()=>{
 const {planBodyTrackedArcFrame,MELEE_ARC_DURATION}=await load();
 const pose={hand:{x:8.1,y:1.4,z:6},chest:{x:9.1,y:1.7,z:6}};
 const p=planBodyTrackedArcFrame(a,b,0,true,pose);
 const q=planBodyTrackedArcFrame(a,b,MELEE_ARC_DURATION*.5,true,pose);
 assert.equal(p.x,q.x);assert.equal(p.z,q.z);assert.equal(p.y,q.y);
 assert.equal(p.skinnedHand,false);assert.equal(p.skinnedChest,false);
 assert.equal(q.bodyContactWeight,0);
});
test('physical melee stroke is tied to the real live skinned body, not damage invention',()=>{
 const code=fs.readFileSync(path.join(root,'public/ai-dungeon/combat-director.js'),'utf8');
 assert.match(code,/planBodyTrackedArcFrame\(source,target,life,reducedMotion/);
 assert.match(code,/defender\.u\.hp>0/);
 assert.match(code,/attacker\.u\.hp>0/);
 assert.match(code,/rigHandBone/);
 assert.match(code,/b\.part==='spine'/);
 assert.match(code,/skinnedChestArcFrames/);
 assert.match(code,/canStageMeleeArc\(kind,action,source,target\)/);
 assert.match(code,/planTrueDamageCue\(beat/);
 assert.doesNotMatch(code,/Math\.random|Date\.now|DungeonRuntime/);
});
