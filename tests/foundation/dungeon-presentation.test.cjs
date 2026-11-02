'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const ROOT=path.resolve(__dirname,'../..');
// Execute the actual production module with only its unavailable browser engine
// boundary replaced. Calls, state transitions and policy all come from source.
function presentation({nestedFailure=false,fixture=null}={}){
 const text=fs.readFileSync(path.join(ROOT,'public/ai-dungeon/model-assets.js'),'utf8')
  .replace(/^import .*;\n/gm,'').replace(/^export \{[^}]+\};?\s*$/m,'');
 class Manager{}
 class Loader{constructor(manager){this.manager=manager}loadAsync(){
  if(nestedFailure)this.manager?.onError?.('blob:broken-texture');
  return Promise.resolve(fixture||{scene:{traverse(){}},animations:[]});
 }}
 // This VM deliberately strips all imports; its stub actors have no skinned GLB
 // head bone. Exercise the missing-mount branch and leave real Three.js scale
 // contract coverage to dungeon-cranial-proportions.test.cjs.
 const noRig=mount=>{assert.equal(mount,undefined);return false};
 const context={THREE:{LoadingManager:Manager,LoopOnce:2200,LoopRepeat:2201},GLTFLoader:Loader,cloneSkeleton:()=>{throw Error('incomplete asset must not be cloned')},restoreCranialProportion:noRig,stageCranialProportion:noRig};
 vm.createContext(context);vm.runInContext(text,context);return context;
}
function actor(action='attack',tick=11){
 const calls={reset:0,play:0,crossFade:0,update:0,loops:[]};
 const clip={name:'Attack'};
 const active={reset(){calls.reset++;return this},setEffectiveTimeScale(){return this},setEffectiveWeight(){return this},setLoop(mode){calls.loops.push(mode);return this},play(){calls.play++;return this},crossFadeFrom(){calls.crossFade++;return this}};
 return {calls,value:{authored:true,u:{id:'vanguard',kind:'vanguard',action,actionTick:tick},availableClips:[clip],currentAction:'',mixer:{clipAction(){return active},update(){calls.update++}}}};
}
test('a new same-type attack tick replays the animation; a rerender does not',()=>{
 const api=presentation(),a=actor();
 api.updateActor(a.value,.016);api.updateActor(a.value,.016);
 assert.equal(a.calls.reset,1);
 a.value.u={...a.value.u,actionTick:12};api.updateActor(a.value,.016);
 assert.equal(a.calls.reset,2,'a second authoritative attack must restart the one-shot');
 assert.equal(a.calls.crossFade,0,'never crossfade an action into itself');
});
test('different one-shot actions sharing a clip restart and update loop mode',()=>{
 const api=presentation(),a=actor();api.updateActor(a.value,.016);
 a.value.u={...a.value.u,action:'cast',actionTick:12};api.updateActor(a.value,.016);
 assert.equal(a.calls.reset,2);
 a.value.u={...a.value.u,action:'idle',actionTick:13};api.updateActor(a.value,.016);
 assert.equal(a.calls.loops.at(-1),2201,'fallback idle must not remain clamped as LoopOnce');
});
test('movement stays continuous when its authoritative tick changes',()=>{
 const api=presentation(),a=actor('move');api.updateActor(a.value,.016);
 a.value.u={...a.value.u,actionTick:12};api.updateActor(a.value,.016);
 assert.equal(a.calls.reset,1);assert.equal(a.calls.update,2);
});
test('presentation does not mutate the authoritative unit',()=>{
 const api=presentation(),a=actor();a.value.u=Object.freeze(a.value.u);
 const before=JSON.stringify(a.value.u);api.updateActor(a.value,.016);
 assert.equal(JSON.stringify(a.value.u),before);
});
test('a swallowed nested texture error rejects the incomplete authored model',async()=>{
 const api=presentation({nestedFailure:true});
 assert.equal(await api.load('player/player_swordsman.glb'),null);
});
function texturedFixture(map){
 const material={map};
 return {scene:{traverse(fn){fn({isMesh:true,material})}},animations:[],parser:{json:{materials:[{pbrMetallicRoughness:{baseColorTexture:{index:0}}}]},associations:new Map([[material,{materials:0}]])}};
}
test('a missing declared base-colour texture cannot count as finished art',async()=>{
 const api=presentation({fixture:texturedFixture(null)});
 assert.equal(await api.load('player/player_swordsman.glb'),null);
});
test('a decoded texture is accepted without replacing the authored model',async()=>{
 const fixture=texturedFixture({image:{width:256,height:256}}),api=presentation({fixture});
 assert.equal(await api.load('player/player_swordsman.glb'),fixture);
});
test('same asset requests share a promise instead of loading every frame',()=>{
 const api=presentation();assert.equal(api.load('player/player_swordsman.glb'),api.load('player/player_swordsman.glb'));
});
function policy(){
 const text=fs.readFileSync(path.join(ROOT,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const source=text.match(/'content-security-policy':"([^"]+)"/);assert.ok(source);
 return Object.fromEntries(source[1].split(';').map(v=>v.trim().split(/\s+/)).filter(v=>v[0]).map(([key,...value])=>[key,value]));
}
test('CSP admits embedded model textures through fetch and image fallback',()=>{
 const p=policy();assert.ok(p['connect-src'].includes('blob:'),'ImageBitmapLoader fetches embedded GLB images as blobs');
 assert.ok(p['img-src'].includes('blob:'),'ImageLoader must also decode the same local images');
});
test('CSP still blocks blob scripts, remote connections, eval and objects',()=>{
 const p=policy();assert.deepEqual(p['script-src'],["'self'"]);assert.deepEqual(p['default-src'],["'self'"]);
 assert.deepEqual(p['object-src'],["'none'"]);assert.ok(!p['connect-src'].some(s=>s==='*'||s==='https:'));
});

// An unlisted module silently prevents ALL scene startup under the strict stream server.
test('new bounded bloom module resolves through the same-origin dungeon route whitelist',()=>{
 const server=fs.readFileSync(path.join(ROOT,'scripts/serve-dungeon-stream.cjs'),'utf8');
 assert.ok(server.includes("['/dungeon/postfx-budget.js','postfx-budget.js']"));
 const app=fs.readFileSync(path.join(ROOT,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/import \{[^}]*planPostFXBudget[^}]*\} from '\/dungeon\/postfx-budget\.js';/);
});


test('live Dungeon progress cannot be mistaken for a stall when its run counter advances and local tick resets',()=>{
 const {hasLiveDungeonAdvanced}=require('../browser/dungeon-fixtures.cjs');
 const baseline={run:4,tick:92};
 assert.equal(hasLiveDungeonAdvanced(baseline,{run:5,tick:0},3),true,'new genuine autonomous run is forward progress even with local tick zero');
 assert.equal(hasLiveDungeonAdvanced(baseline,{run:4,tick:95},3),true,'at least three ticks within one run is forward progress');
 assert.equal(hasLiveDungeonAdvanced(baseline,{run:4,tick:94},3),false,'only two ticks do not meet the sampled threshold');
 assert.equal(hasLiveDungeonAdvanced(baseline,{run:4,tick:92},3),false,'unchanged public state must fail');
 assert.equal(hasLiveDungeonAdvanced(baseline,{run:3,tick:100},3),false,'stale older run is never progress');
 for(const value of [undefined,null,NaN,Infinity,-1,2.3]){
  assert.equal(hasLiveDungeonAdvanced(baseline,{run:value,tick:50},3),false);
  assert.equal(hasLiveDungeonAdvanced(baseline,{run:5,tick:value},3),false);
 }
 assert.equal(hasLiveDungeonAdvanced(null,{run:5,tick:0},3),false);
 assert.equal(hasLiveDungeonAdvanced(baseline,{run:5,tick:0},0),false);
});
