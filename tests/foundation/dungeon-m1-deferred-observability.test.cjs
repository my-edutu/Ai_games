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


test('actual CPU-world practicals retain two fixed source-anchored shader slots without ghost torch or false Warden lighting',async()=>{
 const {createSoftwareWorldLightBudget}=await load();
 const THREE=require('three'),world=new THREE.Group();
 const decorative=[0,1,4,9,12].map((x,index)=>{
  const p=new THREE.PointLight('#ffbd76',index+1,8,2);
  p.userData.dungeonDecorativePractical=true;
  p.position.set(x,1,0);world.add(p);return p;
 });
 const warning=new THREE.PointLight('#fc4747',5,8,2);world.add(warning);
 const budget=createSoftwareWorldLightBudget(THREE,world,{software:true,maxDecorativeLights:2});
 const slots=world.children.filter(n=>n.userData.dungeonSoftwarePracticalProxy===true);
 assert.equal(slots.length,2,'only two permanently visible software shader slots');
 assert.ok(decorative.every(light=>light.visible===false),'original decorative lights cannot double illuminate');
 assert.equal(budget.update({x:0,z:0}).selected,2);
 assert.deepEqual(slots.map(p=>p.intensity),[1,2],'source energy comes from the two nearest real torches');
 assert.equal(warning.visible,true,'authoritative Warden and hero lighting remains untouched');
 assert.equal(budget.update({x:12,z:0}).selected,2);
 assert.deepEqual(slots.map(p=>p.intensity),[5,4],
  'the same two physical slots follow different genuine original positions');
 assert.ok(slots.every(light=>light.visible),'camera movement never toggles shader-light count');
 assert.equal(budget.stats().suppressed,3);
 assert.equal(budget.stats().retainedShaderSlots,2);
 budget.dispose();
 assert.ok(slots.every(light=>light.parent===null),'no stale slot survives a floor');
 assert.ok(decorative.every(light=>light.visible),'floor teardown restores original fixtures');
 assert.equal(warning.visible,true);
});

test('hardware preserves every authored light; software invalid focus cannot activate a false torch or change shader slots',async()=>{
 const {createSoftwareWorldLightBudget}=await load();
 const THREE=require('three'),world=new THREE.Group();
 const torch=new THREE.PointLight('#ffd4aa',3,7,2);
 torch.userData.dungeonDecorativePractical=true;torch.position.set(1,1,2);world.add(torch);
 const hardware=createSoftwareWorldLightBudget(THREE,world,{software:false});
 hardware.update({x:100,z:100});
 assert.equal(torch.visible,true);
 assert.equal(hardware.stats().suppressed,0);
 assert.equal(hardware.stats().retainedShaderSlots,0);
 hardware.dispose();
 const soft=createSoftwareWorldLightBudget(THREE,world,{software:true});
 const slot=world.children.find(n=>n.userData.dungeonSoftwarePracticalProxy===true);
 assert.ok(slot&&slot.visible&&slot.intensity===0);
 assert.equal(soft.update({x:NaN,z:0}).updates,0);
 assert.equal(torch.visible,false,'original scene light is pooled, not removed from its own floor');
 assert.equal(slot.intensity,0,'an invalid focus must not illuminate a pretend torch');
 assert.equal(soft.stats().retainedShaderSlots,1);
 assert.throws(()=>createSoftwareWorldLightBudget(THREE,world,{maxDecorativeLights:0}),TypeError);
 assert.throws(()=>createSoftwareWorldLightBudget({},world),TypeError);
 soft.dispose();
 assert.equal(torch.visible,true);assert.equal(slot.parent,null);
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 const environment=fs.readFileSync(path.join(root,'public/ai-dungeon/environment.js'),'utf8');
 assert.match(app,/softwareWorldLights\?\.update\(\{x:cameraAim\.x,z:cameraAim\.z\}\)/);
 assert.match(app,/softwareWorldLights\?\.dispose\(\)/);
 assert.match(environment,/light\.userData\.dungeonDecorativePractical=true/);
});
