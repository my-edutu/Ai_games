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


test('original world remains intact on hardware; CPU world shader budget is reversible and never touches danger or skinned actors',async()=>{
 const {createSoftwareWorldSurfaceTier}=await load();
 const THREE={MeshLambertMaterial:class{constructor(x){Object.assign(this,x);this.disposed=false}dispose(){this.disposed=true}}};
 const standard=(id,x={})=>({isMeshStandardMaterial:true,transparent:false,opacity:1,alphaTest:0,color:{id,clone(){return {id}}},map:{id},emissive:{r:0,g:0,b:0},emissiveIntensity:1,...x});
 const stone=standard('stone'),iron=standard('iron'),fire=standard('fire',{emissive:{r:.4,g:0,b:0}}),glass=standard('glass',{transparent:true});
 const mesh=(material,x={})=>({material,isInstancedMesh:true,name:'static-stone',...x});
 const meshes=[mesh(stone),mesh(stone),mesh(iron),mesh(fire),mesh(glass),mesh(stone,{isSkinnedMesh:true}),mesh(stone,{name:'warden-warning-ring'}),mesh(stone,{isInstancedMesh:false})];
 const scene={traverse(fn){meshes.forEach(fn)}};
 const gpu=createSoftwareWorldSurfaceTier(THREE,false);
 assert.equal(gpu.apply(scene).activeBatches,0);assert.equal(meshes[0].material,stone);
 const cpu=createSoftwareWorldSurfaceTier(THREE,true);
 assert.equal(cpu.apply(scene).activeBatches,3);assert.equal(cpu.stats().activeAlternativeMaterials,2);
 assert.equal(meshes[0].material,meshes[1].material);
 assert.equal(meshes[0].material.map,stone.map);
 assert.deepEqual(meshes[0].material.color,{id:'stone'});
 for(let i=3;i<meshes.length;i++)assert.equal(meshes[i].material,i===3?fire:i===4?glass:stone);
 const shader=meshes[0].material;cpu.restore();
 assert.equal(meshes[0].material,stone);assert.equal(meshes[2].material,iron);assert.equal(shader.disposed,true);
 cpu.restore();assert.equal(cpu.apply(scene).activeBatches,3);cpu.restore();
 const app=fs.readFileSync(path.join(root,'public/ai-dungeon/app.js'),'utf8');
 assert.match(app,/softwareWorldTier\.apply\(world\)/);
 assert.match(app,/function clearWorld\(\)\{softwareWorldTier\.restore\(\)/);
 assert.match(app,/softwareWorldTier:\(\)=>softwareWorldTier\.stats\(\)/);
});
