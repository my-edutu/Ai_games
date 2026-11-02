'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const policyPath=path.join(root,'public/ai-dungeon/party-visibility-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(policyPath,'utf8')).toString('base64'));

test('the live camera opens a bounded waist-high pocket beside living heroes without deleting room boundaries',async()=>{
 const {planPartyWallReveal}=await load();
 const subjects=[{x:0,z:0}],camera={x:6,z:0};
 assert.equal(planPartyWallReveal(3,0,subjects,camera),'sightline','camera-to-hero ray must still fully clear');
 assert.equal(planPartyWallReveal(0,2.4,subjects,camera),'nearby','side wall near a hero is low, not an opaque roof');
 assert.equal(planPartyWallReveal(-1.2,-1.2,subjects,camera),'nearby','other side of party receives equal clear room composition');
 assert.equal(planPartyWallReveal(0,3.5,subjects,camera),'none','distant room boundaries retain full height');
 assert.equal(planPartyWallReveal(-6,5,subjects,camera),'none','no global map transparency');
});

test('cutaway input is deterministic, finite, five-subject bounded and cannot mutate authority or camera',async()=>{
 const {planPartyWallReveal}=await load();
 const subjects=Object.freeze([{x:0,z:0},...Array.from({length:7},(_,i)=>Object.freeze({x:99+i,z:99+i}))]);
 const camera=Object.freeze({x:6,z:0});
 const first=planPartyWallReveal(0,2.4,subjects,camera);
 assert.equal(first,'nearby');
 assert.equal(planPartyWallReveal(0,2.4,subjects,camera),first);
 assert.equal(planPartyWallReveal(105,105,subjects,camera),'none','sixth+ subject must not unbound renderer work');
 assert.equal(planPartyWallReveal(Infinity,0,subjects,camera),'none');
 assert.equal(planPartyWallReveal(0,0,subjects,{x:NaN,z:1}),'none');
 assert.equal(planPartyWallReveal(0,0,[],camera),'none');
 assert.equal(planPartyWallReveal(0,0,[{x:'0',z:0}],camera),'none');
 assert.equal(planPartyWallReveal(0,-10,subjects,camera,999),'none','padding clamps to safe max without removing more distant space');
 const code=fs.readFileSync(policyPath,'utf8');
 assert.doesNotMatch(code,/Math\.random|Date\.|performance\.|fetch\(|DungeonRuntime|localStorage|requestAnimationFrame/);
});

test('base walls, weathered masonry and real browser share the same render-only clearance planner',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const environment=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
 const config=fs.readFileSync(path.join(root,'tests/browser/dungeon.playwright.config.cjs'),'utf8');
 const pkg=JSON.parse(fs.readFileSync(path.join(root,'package.json'),'utf8'));
 assert.ok(app.includes("from '/dungeon/party-visibility-plan.js'"));
 assert.ok(environment.includes("from '/dungeon/party-visibility-plan.js'"));
 assert.match(app,/cutawayNearbyWalls:/);
 assert.match(environment,/planPartyWallReveal\(/);
 assert.ok(server.includes("['/dungeon/party-visibility-plan.js','party-visibility-plan.js']"));
 assert.ok(config.includes("'dungeon-party-visibility.spec.cjs'"));
 assert.ok(pkg.scripts['dungeon:test'].includes('dungeon-party-visibility.test.cjs'));
});

test('reused cosmetic cutaway cache uploads a wall only after its visibility band changes',async()=>{
 const {createCutawayBandCache,shouldUploadCutawayBand}=await load();
 const cache=createCutawayBandCache(3);
 assert.ok(cache instanceof Uint8Array);
 assert.deepEqual([...cache],[255,255,255],'unknown initial GPU state must upload once');
 assert.equal(shouldUploadCutawayBand(cache,0,0),true);
 assert.equal(shouldUploadCutawayBand(cache,0,0),false,'steady 3D room must not rewrite identical matrices');
 assert.equal(shouldUploadCutawayBand(cache,0,2),true,'camera entering sightline must update');
 assert.equal(shouldUploadCutawayBand(cache,0,1),true,'nearby masonry height is distinct');
 assert.equal(shouldUploadCutawayBand(cache,0,0),true,'leaving cutaway restores wall height');
 assert.equal(shouldUploadCutawayBand(cache,1,0),true,'other instances retain independent state');
 assert.equal(shouldUploadCutawayBand(cache,0,0),false);
 assert.deepEqual([...cache],[0,0,255]);
 assert.equal(shouldUploadCutawayBand(cache,-1,1),false);
 assert.equal(shouldUploadCutawayBand(cache,3,1),false);
 assert.equal(shouldUploadCutawayBand(cache,1,255),false);
 assert.equal(shouldUploadCutawayBand(cache,1,NaN),false);
 assert.deepEqual([...cache],[0,0,255],'rejected inputs cannot poison valid cache');
 assert.equal(createCutawayBandCache(-1),null);
 assert.equal(createCutawayBandCache(16385),null,'unbounded cosmetic allocations are forbidden');
});

test('actual masonry and dressing only write changing GPU instance transforms while still testing each hero sightline',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const environment=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(app,/shouldUploadCutawayBand\(wallBands,/);
 assert.match(app,/shouldUploadCutawayBand\(parapetBands,/);
 assert.match(app,/if\(wallMatrixWrites\)mesh\.instanceMatrix\.needsUpdate=true/);
 assert.match(app,/wallMatrixWrites:/,'real WebGL diagnostics must publish actual writes');
 assert.match(environment,/shouldUploadCutawayBand\(facadeBands,/);
 assert.match(environment,/if\(facadeMatrixWrites\)facadeMesh\.instanceMatrix\.needsUpdate=true/);
 assert.match(environment,/if\(weatheredChanged\)/,'shared stone detail must stop redundant GPU uploads');
 assert.match(environment,/matrixWrites:/,'live browser can review true dressing work');
});

test('camera-facing nearby masonry now reveals full actor weapons but preserves distant room boundaries',async()=>{
 const text=fs.readFileSync(path.join(root,'public/ai-dungeon/cutaway-floor-plan.js'),'utf8');
 const {planCutawayWallTransform}=await import('data:text/javascript;base64,'+Buffer.from(text).toString('base64'));
 assert.ok(planCutawayWallTransform('nearby',2.6).height<=.48);
 assert.equal(planCutawayWallTransform('sightline',2.6).height,.16);
 assert.equal(planCutawayWallTransform('none',2.6).height,2.6);
 const environment=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(environment,/reveal==='nearby'\?\.42/);
 assert.match(environment,/reveal==='nearby'\?\.22/);
});
