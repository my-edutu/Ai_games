'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const model=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/model-assets.js'),'utf8');
test('authentic continuous GLB skin, clothing, hands, face and weapon replace disconnected overlay in the actual live actor path',()=>{
 assert.match(model,/actor\.assetRoot\.traverse\(obj=>\{\s*if\(!obj\.isMesh\)return;\s*obj\.visible=true;/);
 assert.match(model,/actor\.nativePresentation=\{mode:'original-continuous-rig'/);
 assert.match(model,/actor\.rigHandBone=joints\.rightHand\?\?null/);
 assert.doesNotMatch(model,/actor\.cinematicFigure=createCinematicFigure/);
 assert.match(model,/if\(isBoss\)addWardenRegalia\(actor\)/);
 assert.match(model,/changeAction\(actor,actor\.u\.action\|\|'idle'\)/);
});
test('metrics distinguish visible original skinned anatomy from any cosmetic figure count',()=>{
 for(const name of ['nativeContinuousActors','nativeVisibleSourceMeshes','nativeVisibleSkinnedMeshes','nativeTexturedSourceMeshes','nativePresentationModes'])
  assert.ok(model.includes(name),`missing ${name} audit`);
 assert.match(model,/original-continuous-rig/);
 assert.match(model,/actor\.cinematicFigure\?\.dispose\?\.\(\)/);
});
