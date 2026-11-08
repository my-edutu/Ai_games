'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const fs=require('node:fs');
const {pathToFileURL}=require('node:url');
const project=path.resolve(__dirname,'../..');
const load=()=>import(pathToFileURL(path.join(project,'public/ai-dungeon/measured-weapon-trail.js')).href);
const actor=(kind,{authored=true,wrist=null,hand=null,more=[]}={})=>({
 u:{kind},authored,assetRoot:{},rigHandBone:hand,
 rigMeleeBones:[...(wrist?[{part:'wrist',bone:wrist}]:[]),...more]
});
const bone={isBone:true,name:'mixamorigRightHand'};
test('all melee sword roles consume the existing skinned wrist, not the unrelated grip field',async()=>{
 const {selectObservedWeaponHandBone}=await load();
 for(const kind of ['vanguard','revenant','warden'])
  assert.equal(selectObservedWeaponHandBone(actor(kind,{wrist:bone})),bone,kind);
});
test('ranger and mystic retain their actual accessory hand; cultist never invents a hand',async()=>{
 const {selectObservedWeaponHandBone}=await load();
 for(const kind of ['ranger','mystic'])
  assert.equal(selectObservedWeaponHandBone(actor(kind,{hand:bone})),bone);
 assert.equal(selectObservedWeaponHandBone(actor('cultist',{hand:bone})),null);
});
test('unavailable, unbound, invalid or ambiguous wrist is suppressed, not approximated',async()=>{
 const {selectObservedWeaponHandBone}=await load();
 assert.equal(selectObservedWeaponHandBone(actor('vanguard')),null);
 assert.equal(selectObservedWeaponHandBone(actor('vanguard',{wrist:{name:'rightHand'}})),null);
 assert.equal(selectObservedWeaponHandBone(actor('vanguard',{wrist:bone,authored:false})),null);
 assert.equal(selectObservedWeaponHandBone(actor('vanguard',{wrist:bone,more:[{part:'wrist',bone:{isBone:true}}]})),null);
 const off=actor('warden',{wrist:bone});off.assetRoot=null;
 assert.equal(selectObservedWeaponHandBone(off),null);
 assert.equal(selectObservedWeaponHandBone(null),null);
});
test('corrected wrist still has no synthetic trail on an isolated root turn',async()=>{
 const {planMeasuredHandTrail}=await load();
 assert.equal(planMeasuredHandTrail(
  {x:.24,y:1,z:0,rootX:0,rootY:0,rootZ:0,yaw:0},
  {x:0,y:1,z:-.24,rootX:0,rootY:0,rootZ:0,yaw:Math.PI/2},.016),null);
});
test('real D04 visual stage connects the joint selector on the actual sample and permission path',()=>{
 const visuals=fs.readFileSync(path.join(project,'public/ai-dungeon/physical-feedback-visuals.js'),'utf8');
 const assets=fs.readFileSync(path.join(project,'public/ai-dungeon/model-assets.js'),'utf8');
 const grip=fs.readFileSync(path.join(project,'public/ai-dungeon/rig-attachment-plan.js'),'utf8');
 assert.match(visuals,/import \{[^\n]*selectObservedWeaponHandBone[^\n]*\} from '\.\/measured-weapon-trail\.js';/);
 assert.match(visuals,/const bone=hand&&actor\.authored\?selectObservedWeaponHandBone\(actor\):/);
 assert.match(visuals,/actor\.u\?\.actionTick!==cue\.tick\|\|!selectObservedWeaponHandBone\(actor\)/);
 assert.doesNotMatch(visuals,/!actor\.rigHandBone\)\)return null/);
 assert.match(assets,/actor\.rigMeleeBones=\[\]/);
 assert.match(assets,/const hand=\['vanguard','revenant','warden'\]\.includes\(actor\.u\.kind\)\?selectHandBone/);
 assert.match(grip,/if\(bone\)actor\.rigMeleeBones\.push\(/);
});
