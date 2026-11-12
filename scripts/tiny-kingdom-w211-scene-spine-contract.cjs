'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const a=html.indexOf('<script>'),b=html.lastIndexOf('</script>');
assert(a>=0&&b>a);new vm.Script(html.slice(a+8,b),{filename:'tiny-kingdom.js'});
const forest=html.slice(html.indexOf('function tree('),html.indexOf('function leaf',html.indexOf('function tree(')+15)>0?html.indexOf('function leaf',html.indexOf('function tree(')+15):html.indexOf('function getForest',html.indexOf('function tree(')+15));
assert(forest.includes('crownLobe(center[0]')&&forest.includes('crownLobe(fork[0]')&&
 forest.includes('cone(centerX,baseY')&&forest.includes("detailTier==='far'?4"),
 'every far tree keeps real 3D branch crowns / evergreen tiers (W244 changed the detail policy)');
assert(forest.includes("detailTier==='near'?5:3")&&
 forest.includes('leafWhorl('),'real distant three-blade leaf whorls remain');
// W247: prove the ORIGINAL fence presents an unblocked physically valid gate,
 // two-sided woven bands and no additional triangle load from rail redesign.
const fenceSource=html.slice(html.indexOf('function fenceLine('),html.indexOf('function well('));
assert(fenceSource.includes('for(let course=0;course<3;course++)')&&
 fenceSource.includes('for(let segment=0;segment<2;segment++)')&&
 fenceSource.includes('if(first>=0&&i>=first&&i<first+2)continue'),
 'three interlaced real fence bands must preserve the genuine open courier gate');
const fenceCounters={posts:0,quads:0,slabs:0,coordinates:[]};
const makeFence=new Function('rgb','terrain','walkable','box','quad',
 'materialScope','MATERIAL','upwardRoadQuad',
 'let farmFencePresentationAudit=null;'+fenceSource+
 ';return {fenceLine,audit:()=>farmFencePresentationAudit}');
const fence=makeFence(c=>c,(x,z)=>x*.02+z*.01,()=>true,
 (...args)=>{fenceCounters.posts++;fenceCounters.coordinates.push(...args.slice(0,3));},
 (...args)=>{fenceCounters.quads++;args.slice(0,4).forEach(p=>fenceCounters.coordinates.push(...p));},
 (_,fn)=>fn(),{WOOD:1,STONE:2},()=>fenceCounters.slabs++);
fence.fenceLine(16,-2,6,false,[21.7,-2.45]);
assert.equal(fenceCounters.posts,6,'retain actual posts except middle gate post');
assert.equal(fenceCounters.quads,48,'24 triangles per intact panel, same as old two-rail fence');
assert.equal(fenceCounters.slabs,8,'original eight real crossing stones retained');
assert(fenceCounters.coordinates.every(Number.isFinite),'wattle follows real terrain');
assert.equal(fence.audit().openSpanMetres,3);
const canopy=html.slice(html.indexOf('function grainwardStreetDoorCanopy('),html.indexOf('function grainwardInhabitedLot('));
assert(canopy.includes('materialScope(MATERIAL.ROOF')&&canopy.includes('materialScope(MATERIAL.STONE'));
assert(canopy.includes('limbSegment'),'wall-mounted braces physically modelled');
assert(!canopy.includes('city.push(')&&!canopy.includes('people.push('));
assert(html.includes('villageVisualLod.grainwardStreetCanopies++'));
assert(html.includes('rainCanopyTriangles:villageVisualLod.grainwardStreetCanopyTriangles'));
console.log('W211 3D forest and occupied-house architecture source safety PASS; running-game, Day121 and hardware still separately required.');
