'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
async function load(){const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/postfx-budget.js'),'utf8');return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'))}
const source=()=>({name:'Original Vanguard',isMaterial:true,isMeshStandardMaterial:true,isMeshPhysicalMaterial:false,color:{r:.6},map:{id:'authored-albedo'},emissive:{r:.2},emissiveMap:{id:'authored-light'},emissiveIntensity:.1,alphaMap:{id:'source-alpha'},alphaTest:.1,transparent:true,opacity:.8,side:2,depthWrite:false,depthTest:true,vertexColors:true,flatShading:false,fog:true,wireframe:false,toneMapped:true,normalMap:{id:'pbr-normal'},roughnessMap:{id:'pbr-rough'}});
class Lambert{constructor(props){Object.assign(this,props);this.isMeshLambertMaterial=true}}
test('software keeps original source UV/albedo, tint, alpha, emissive, depth and vertex color',async()=>{
 const {createSoftwareSourceRigMaterial:convert}=await load(),src=source();
 const dst=convert({MeshLambertMaterial:Lambert},src,{software:true});
 assert.equal(dst.isMeshLambertMaterial,true);
 for(const key of ['color','map','emissive','emissiveMap','emissiveIntensity','alphaMap','alphaTest','transparent','opacity','side','depthWrite','depthTest','vertexColors','flatShading','fog','wireframe','toneMapped'])assert.strictEqual(dst[key],src[key],key);
 assert.equal(dst.normalMap,undefined);assert.equal(dst.roughnessMap,undefined);assert.equal(src.map.id,'authored-albedo');
});
test('real hardware PBR and advanced physical material keep identity',async()=>{
 const {createSoftwareSourceRigMaterial:convert}=await load(),src=source();
 assert.strictEqual(convert({},src,{software:false}),src);
 assert.strictEqual(convert({},Object.assign({},src,{isMeshPhysicalMaterial:true}),{software:true}).isMeshPhysicalMaterial,true);
 assert.throws(()=>convert({},null,{software:true}),/Source character material/);
 assert.throws(()=>convert({},src,{software:true}),/Lambert/);
});
test('source-skinned Vanguard, Revenant and Warden original rig material route is genuinely wired to live software context',()=>{
 const model=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/model-assets.js'),'utf8');
 const app=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/app.js'),'utf8');
 for(const fragment of ['nativeSurfaceTier(copy,softwareWebGL)','addWardenRegalia(actor)','addAnatomicalKit(actor)','nativeSurfaceTier(finishes[key],true)','nativeSoftwareSurfaceActors','cloneSkeleton(gltf.scene)'])assert.ok(model.includes(fragment),fragment);
 assert.ok(app.includes('attachCharacter(a,{softwareWebGL})'));
});
