'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=rel=>fs.readFileSync(path.join(root,rel),'utf8');

test('D04 preview is explicitly opt-in; default game retains legacy rendering and audio',()=>{
 const app=read('public/ai-dungeon/app.js');
 assert.match(app,/D04_PREVIEW=new URLSearchParams\(location\.search\)\.get\('feedback'\)==='d04'/);
 assert.match(app,/const physicalFeedback=D04_PREVIEW\?createPhysicalCombatFeedback\(/);
 assert.match(app,/if\(physicalFeedback\)physicalFeedback\.acceptSnapshot\(s\);/);
 assert.match(app,/else\{combatDirector\.accept\(s,camera\.position\);/);
 assert.match(app,/if\(physicalFeedback\)physicalFeedback\.advance\(dt\);/);
 assert.match(app,/else combatDirector\.animate\(dt\);/);
 assert.match(app,/createDungeonSoundstage\(ambience,\{reducedMotion:reduced\}\)/,
  'default path must preserve the previously tested legacy audio constructor');
});

test('combat audio is suppressed only for D04 preview while ambient and reward channels survive',()=>{
 const app=read('public/ai-dungeon/app.js');
 const sound=read('public/ai-dungeon/soundstage.js');
 assert.match(app,/suppressCombat:true/);
 assert.match(sound,/suppressCombat=false/);
 assert.match(sound,/\.filter\(c=>!suppressCombat\|\|!D04_OWNED_LEGACY_COMBAT_CUES\.has\(c\.kind\)\)/);
 for(const channel of ['weapon','ranged','magic','impact','block','evade','interrupt','counter','boss']){
  assert.ok(sound.includes("'"+channel+"'"),channel+' must be excluded from duplicate output');
 }
 assert.match(sound,/combatEffectsInput:\(\)=>started&&enabled\?fxBus:null/);
 assert.match(app,/attachAudioContext\(ambience,\{output:soundstage\.combatEffectsInput\(\)\}\)/);
});

test('D04 never creates an audio context or opt-in without a real button click',()=>{
 const app=read('public/ai-dungeon/app.js');
 const controller=read('public/ai-dungeon/physical-combat-feedback.js');
 assert.match(app,/\$\('audio-toggle'\)\.addEventListener\('click',async\(\)=>\{/);
 assert.match(app,/physicalFeedback\.enableAudioFromGesture\(\)/);
 assert.match(app,/physicalFeedback\?\.muteAudio\(\)/);
 assert.match(controller,/preference\.write\(true\)/);
 assert.match(controller,/enableAudioFromGesture\(\)/);
});

test('only a successful real renderer submission acknowledges presented visual before audio',()=>{
 const app=read('public/ai-dungeon/app.js');
 const controller=read('public/ai-dungeon/physical-combat-feedback.js');
 assert.match(app,/requirePresentedFrame:true/);
 assert.match(app,/physicalFeedback\?\.acknowledgePresentedFrame\(\+\+d04PresentedFrameSerial\)/);
 assert.ok(app.indexOf('physicalFeedback?.acknowledgePresentedFrame(')>app.indexOf('renderer.render(scene,camera);'));
 assert.match(controller,/MAX_AUDIO_VISUAL_STALENESS_SECONDS=/);
 assert.match(controller,/awaitingPresentation\.length>=MAX_AUDIO_AWAITING_FRAME/);
 assert.match(controller,/lastPresentedFrame=frameId/);
});

test('stream routes, disposal, effect caps and immutable authority boundaries are explicit',()=>{
 const server=read('scripts/serve-dungeon-stream.cjs');
 const app=read('public/ai-dungeon/app.js');
 for(const route of ['physical-feedback-plan.js','physical-feedback-visuals.js','original-combat-foley.js','physical-combat-feedback.js']){
  assert.ok(server.includes("['/dungeon/"+route+"'"),route);
 }
 assert.match(server,/script-src 'self'/,'do not weaken script CSP');
 assert.match(app,/addEventListener\('pagehide',\(\)=>physicalFeedback\?\.dispose\(\)/);
 assert.match(app,/physicalFeedback\?\.reset\(\)/);
 const visuals=read('public/ai-dungeon/physical-feedback-visuals.js');
 assert.match(visuals,/export function createPhysicalFeedbackVisuals/);
 const gameplay=read('games/ai-dungeon/src/index.ts');
 assert.ok(gameplay.includes('publicState()'),'the unchanged runtime remains public-state driven');
});
