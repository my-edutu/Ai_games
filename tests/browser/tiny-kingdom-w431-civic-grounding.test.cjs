'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const start=source.indexOf('function planOriginalCivicGroundContacts(){');
const end=source.indexOf('function rebuildGroundAtlas(){',start);
test('W431 original civic grounded atmosphere uses retained atlas, never new world props',()=>{
 assert.ok(start>0&&end>start);
 assert.match(source,/paintOriginalCivicGroundContacts\(ctx,world,size,GROUND_ATLAS_EXTENT\);\s*groundAtlasBaseCanvas=canvasAtlas/);
 assert.match(source,/groundAtlasBaseReuses\+\+/);
 assert.match(source,/realCivicGrounding:getOriginalCivicGroundContactAudit\(\)/);
 assert.match(source,/getOriginalCivicGroundContactAudit,getRealHomeLaneAlbedoAudit/);
 assert.match(source,/const FARMSTEAD=Object\.freeze\(\{granary:\[29,-5\]/);
 assert.match(source,/const CRAFT_DISTRICT=Object\.freeze\(\{x:19,z:-15,width:8\.2,depth:6\.4\}/);
});
const build=new Function('FARMSTEAD','CRAFT_DISTRICT','EXCHANGE_CANOPY',
 'let originalCivicGroundAudit={paintedSites:0}; let groundAtlasTexture={};'+
 source.slice(start,end)+
 'return {planOriginalCivicGroundContacts,paintOriginalCivicGroundContacts,getOriginalCivicGroundContactAudit};');
const functions=build({granary:[29,-5]},{x:19,z:-15,width:8.2,depth:6.4},
 {tableWidth:2.34,tableDepth:.78,supportX:2.72,supportZ:.65});
test('W431 all eight original civic contacts are sourced from physically real building foundations',()=>{
 const spots=functions.planOriginalCivicGroundContacts();
 assert.equal(spots.length,8);
 assert.deepEqual(spots.slice(0,4).map(x=>x.id),
  ['guildhall','granary','smith-workshop','market-weighing-table']);
 assert.deepEqual(spots.slice(0,4).map(x=>[x.x,x.z]),[[0,-1],[29,-5],[19,-15],[0,5]]);
 const posts=spots.filter(x=>x.id.startsWith('market-bearing'));
 assert.equal(posts.length,4);
 assert.deepEqual(posts.map(x=>x.x).sort((a,b)=>a-b),[-2.72,-2.72,2.72,2.72]);
 assert.ok(posts.every(x=>Math.abs(x.z-5)===.65));
 assert.ok(spots.every(x=>x.rx>0&&x.rz>0));
});
test('W431 source-driven atlas paints 8 bounded sites without changing economic or geometric authority',()=>{
 const calls={fills:0,strokes:0,gradientStops:0};
 const ctx={save(){},restore(){},translate(){},scale(){},beginPath(){},arc(){},
  fill(){calls.fills++},strokeRect(){calls.strokes++},
  createRadialGradient(){return {addColorStop(){calls.gradientStops++}}}};
 const audit=functions.paintOriginalCivicGroundContacts(ctx,v=>(v+92)*512/184,512,184);
 assert.equal(calls.fills,8);assert.equal(calls.strokes,4);
 assert.equal(calls.gradientStops,24);
 assert.equal(audit.paintedSites,8);
 assert.equal(audit.originalBearingPosts,4);
 assert.equal(audit.extraTriangles,0);
 assert.equal(audit.extraGpuTextures,0);
 assert.equal(audit.authorityModified,false);
 assert.equal(audit.terrainNavigationChanged,false);
 assert.equal(audit.retainedCanvasPixels,262144);
 assert.equal(audit.hardwareFps,'NOT MEASURED');
 assert.throws(()=>functions.paintOriginalCivicGroundContacts(ctx,()=>0,512,0),/finite atlas/);
 assert.equal(functions.getOriginalCivicGroundContactAudit().sceneAtlasRetained,true);
});
test('W431 original inline game syntax, real citizens and freight paths remain intact',()=>{
 const sections=source.match(/<script>([\s\S]*?)<\/script>/g)||[];
 assert.ok(sections.length>0);
 for(const section of sections)new Function(section.replace(/^<script>|<\/script>$/g,''));
 assert.match(source,/function villager\(p\)/);
 assert.match(source,/function marketSupplyView\(\)/);
 assert.match(source,/function advanceRealGrainJourney\(\)/);
 assert.match(source,/function recallCivicCore\(key\)/);
});
