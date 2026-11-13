'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
async function load(){
 const src=fs.readFileSync(path.resolve(__dirname,'../../public/ai-dungeon/software-world-raster.js'),'utf8');
 return import('data:text/javascript;base64,'+Buffer.from(src).toString('base64'));
}
class Lambert{constructor(fields){Object.assign(this,fields);this.isMeshLambertMaterial=true}}
const THREE={MeshLambertMaterial:Lambert};
const standard=(overrides={})=>({isMeshStandardMaterial:true,color:{r:.4},map:{id:'authored-albedo'},
 emissive:{r:0,g:0,b:0},roughness:.94,metalness:.08,transparent:false,opacity:1,alphaTest:0,
 side:2,fog:true,depthWrite:true,depthTest:true,...overrides});
function mesh(material,extra={}){return {isMesh:true,material,geometry:{id:'original physical triangles'},parent:null,userData:{},...extra}}
function group(children=[]){const root={children,parent:null,traverse(fn){
 const visit=(node,parent)=>{if(parent)node.parent=parent;fn(node);for(const child of node.children||[])visit(child,node)};
 visit(root,null)
}};return root}
test('CPU diffuse preserves geometry, original albedo/tint/depth and shared material',async()=>{
 const {applySoftwareWorldRasterTier:apply}=await load();
 const source=standard(),a=mesh(source),b=mesh(source);
 const result=apply(THREE,group([a,b]),{software:true});
 assert.equal(result.adaptedMeshes,2);assert.equal(result.createdMaterials,1);
 assert.equal(a.material,b.material);assert.notEqual(a.material,source);
 assert.equal(a.material.map,source.map);assert.equal(a.material.color,source.color);
 assert.equal(a.material.depthWrite,source.depthWrite);assert.equal(a.geometry.id,'original physical triangles');
 assert.equal(source.isMeshStandardMaterial,true);
});
test('hardware path retains all physical PBR by identity',async()=>{
 const {applySoftwareWorldRasterTier:apply}=await load();
 const source=standard(),a=mesh(source),result=apply({},group([a]),{software:false});
 assert.equal(result.adaptedMeshes,0);assert.equal(a.material,source);
});
test('do not repaint emissive warnings, transparent effects, precious metal or normal surfaces',async()=>{
 const {applySoftwareWorldRasterTier:apply}=await load();
 const cases=[{emissive:{r:1,g:0,b:0}},{metalness:.8},{roughness:.2},{transparent:true},
  {opacity:.7},{normalMap:{}},{userData:{dungeonCriticalVisual:true}}];
 const originals=cases.map(x=>standard(x)),nodes=originals.map(m=>mesh(m));
 assert.equal(apply(THREE,group(nodes),{software:true}).adaptedMeshes,0);
 nodes.forEach((n,i)=>assert.equal(n.material,originals[i]));
});
test('never touch skinned actors or licensed imported world assets',async()=>{
 const {applySoftwareWorldRasterTier:apply}=await load();
 const skin=mesh(standard(),{isSkinnedMesh:true}),foreign=mesh(standard()),authored={children:[foreign]},ordinary=mesh(standard());
 const result=apply(THREE,group([skin,authored,ordinary]),{software:true,authoredRoot:authored});
 assert.equal(result.adaptedMeshes,1);assert.equal(result.skippedProtected,2);
 assert.equal(skin.material.isMeshStandardMaterial,true);assert.equal(foreign.material.isMeshStandardMaterial,true);
 assert.equal(ordinary.material.isMeshLambertMaterial,true);
});
test('multi-material physically staged mesh keeps original warning overlay material',async()=>{
 const {applySoftwareWorldRasterTier:apply}=await load();
 const rough=standard(),warn=standard({emissive:{r:1,g:0,b:0}}),n=mesh([rough,warn]);
 const result=apply(THREE,group([n]),{software:true});
 assert.equal(result.createdMaterials,1);assert.equal(n.material[0].isMeshLambertMaterial,true);
 assert.equal(n.material[1],warn);
});
test('fail safely on missing original scene or software shader',async()=>{
 const {applySoftwareWorldRasterTier:apply}=await load();
 assert.throws(()=>apply(THREE,null,{software:true}),/floor scene/);
 assert.throws(()=>apply({},group(),{software:true}),/diffuse shader/);
});
