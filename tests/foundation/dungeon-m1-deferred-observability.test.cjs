'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(path.join(root,'public/ai-dungeon/postfx-budget.js'),'utf8')).toString('base64'));

test('read-only physical ray audits and 3D composition work run only when inspected, once per actual frame',async()=>{
 const {deferRenderDiagnostics}=await load();
 const counts={physical:0,composition:0,actor:0};
 const report={frame:87,renderedState:{tick:47,checksum:'authority-47'},webgl:true};
 deferRenderDiagnostics(report,{
  visibility:()=>{counts.physical++;return {rays:24,blocked:2}},
  composition:()=>{counts.composition++;return {visibleHeroes:3}},
  authored3D:()=>{counts.actor++;return {riggedActors:5}}
 });
 assert.deepEqual(counts,{physical:0,composition:0,actor:0},'the actual render loop must not execute optional diagnostic raycasts');
 assert.equal(report.frame,87);assert.equal(report.renderedState.checksum,'authority-47');
 assert.ok(Object.keys(report).includes('visibility'),'full report remains enumerable for browser evidence');
 assert.deepEqual(report.visibility,{rays:24,blocked:2});
 assert.equal(report.visibility,report.visibility,'one expensive ray scan per requested frame');
 assert.deepEqual(counts,{physical:1,composition:0,actor:0});
 assert.equal(JSON.parse(JSON.stringify(report)).composition.visibleHeroes,3,'JSON evidence retains the complete diagnostic schema');
 assert.deepEqual(counts,{physical:1,composition:1,actor:1});
 report.autoDirector=false;assert.equal(report.autoDirector,false,'manual spectator controls may still update their read-only status');
 const next={frame:88,renderedState:{tick:48}};
 deferRenderDiagnostics(next,{visibility:()=>{counts.physical++;return {rays:3}}});
 assert.equal(next.frame,88);assert.equal(counts.physical,1);
 assert.equal(next.visibility.rays,3);assert.equal(counts.physical,2,'a new real render frame receives a fresh audit');
});

test('invalid producers cannot corrupt truthful cheap rendering fields',async()=>{
 const {deferRenderDiagnostics}=await load();
 const record={frame:13,webgl:true};
 assert.equal(deferRenderDiagnostics(record,{invalid:null}),record);
 assert.equal(record.webgl,true);
 assert.equal('invalid' in record,false);
 assert.throws(()=>deferRenderDiagnostics(null,{}),TypeError);
 assert.throws(()=>deferRenderDiagnostics(record,null),TypeError);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/deferRenderDiagnostics\(diagnostics,/);
 assert.doesNotMatch(app,/visibility:\s*actualHeroVisibility\(/,'actual occlusion tests cannot execute eagerly for each WebGL frame');
});

// Real Chromium on Nov 9 failed with Unexpected end of input at the entrypoint.
// Parse the production ESM entry, not a mock or a text-pattern approximation.
test('production 3D entry module parses before browser start',()=>{
 const {spawnSync}=require('node:child_process');
 const target=path.join(root,'public/ai-dungeon/app.js');
 const check=spawnSync(process.execPath,['--check',target],{encoding:'utf8',timeout:12000});
 assert.equal(check.error,undefined,'source parser should run');
 assert.equal(check.status,0,'invalid 3D entrypoint prevents every WebGL frame: '+check.stderr);
});


test('restore original authored PBR on both hardware and CPU renderers after adverse genuine film evidence',()=>{
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.doesNotMatch(app,/createSoftwareWorldSurfaceTier|softwareWorldTier\.apply/);
 assert.match(app,/world=new THREE\.Group\(\)/);
 assert.match(app,/stone\.map=wallMasonryTexture/);
 assert.match(app,/createRetainedStaticDetailBatches/);
});


test('actual original CPU-world light budget keeps two nearest decorative practicals, core combat lights, and restores on floor teardown',async()=>{
 const {createSoftwareWorldLightBudget}=await load();
 class Vector3{set(x,y,z){Object.assign(this,{x,y,z});return this}}
 const THREE={Vector3};
 const decorative=[0,1,4,9,12].map((x,index)=>({
  isPointLight:true,userData:{dungeonDecorativePractical:true},visible:true,
  getWorldPosition(vector){return vector.set(x,1,0)}
 }));
 const warning={isPointLight:true,userData:{},visible:true};
 const world={traverse(visitor){for(const light of [...decorative,warning])visitor(light)}};
 decorative.forEach(light=>light.parent=world);
 const budget=createSoftwareWorldLightBudget(THREE,world,{software:true,maxDecorativeLights:2});
 assert.equal(budget.update({x:0,z:0}).selected,2);
 assert.deepEqual(decorative.map(light=>light.visible),[true,true,false,false,false]);
 assert.equal(warning.visible,true,'authoritative Warden/hero lights are excluded');
 assert.equal(budget.update({x:12,z:0}).selected,2);
 assert.deepEqual(decorative.map(light=>light.visible),[false,false,false,true,true],
  'only two authored practicals nearest the actual scene focus remain active');
 assert.equal(budget.stats().suppressed,3);
 budget.dispose();
 assert.ok(decorative.every(light=>light.visible),'floor teardown restores all authored lights');
 assert.equal(warning.visible,true);
});

test('hardware rendering retains every authored practical; invalid focus or capacity never changes scene',async()=>{
 const {createSoftwareWorldLightBudget}=await load();
 class Vector3{set(x,y,z){Object.assign(this,{x,y,z});return this}}
 const torch={isPointLight:true,userData:{dungeonDecorativePractical:true},visible:true,
  getWorldPosition(v){return v.set(1,1,2)}};
 const world={traverse(fn){fn(torch)}};
 torch.parent=world;
 const budget=createSoftwareWorldLightBudget({Vector3},world,{software:false});
 budget.update({x:100,z:100});
 assert.equal(torch.visible,true);
 assert.equal(budget.stats().suppressed,0);
 const soft=createSoftwareWorldLightBudget({Vector3},world,{software:true});
 assert.equal(soft.update({x:NaN,z:0}).updates,0);
 assert.equal(torch.visible,true);
 assert.throws(()=>createSoftwareWorldLightBudget({Vector3},world,{maxDecorativeLights:0}),TypeError);
 assert.throws(()=>createSoftwareWorldLightBudget({},world),TypeError);
 soft.dispose();
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const environment=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(app,/softwareWorldLights\?\.update\(\{x:cameraAim\.x,z:cameraAim\.z\}\)/);
 assert.match(app,/softwareWorldLights\?\.dispose\(\)/);
 assert.match(environment,/light\.userData\.dungeonDecorativePractical=true/);
});
