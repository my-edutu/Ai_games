#!/usr/bin/env node
'use strict';
// Source-executed, bounded authentic old-crossing geometry. W193 RED on prior
// source: absent joined oak deck, open water and exposed physical masonry.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path');
const file=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=file.indexOf('let grainwardBridgeStats=');
const end=file.indexOf('function pointedGlassWindow(',start);
assert.ok(start>0&&end>start,'W193 RED no rebuilt original bridge');
assert.match(file,/getGrainwardBridgeAudit,getOuterRiverReachStats/);
let quads=[],triangles=0;
const rgb=n=>[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255];
const ctx={
 Math,Number,Error,SCENIC_SITES:{bridge:{x:-6,z:18.1}},
 MATERIAL:{WOOD:1,STONE:2},rgb,terrain:(x,z)=>.003*x+.002*z,
 materialScope:(id,fn)=>fn(),data:[],
 quad:(a,b,c,d,col)=>{quads.push({a,b,c,d,col});triangles+=2;ctx.data.length+=60;},
 box:()=>{triangles+=12;ctx.data.length+=360;},
 cylinder:()=>{triangles+=24;ctx.data.length+=720;},
 cone:()=>{triangles+=7;ctx.data.length+=210;},
 // Original ellipsoid shell uses 8*segments triangles; bridge stones use 7.
 ellipsoid:()=>{triangles+=56;ctx.data.length+=1680;}
};
vm.createContext(ctx);
vm.runInContext(file.slice(start,end),ctx,{timeout:2500,filename:'W193-real-original-bridge'});
ctx.riverBridge();
const a=ctx.getGrainwardBridgeAudit();
assert.equal(a.source,'W193-original-inhabited-stone-and-oak-bridge');
assert.equal(a.topBoards,20);
assert.equal(a.stoneKerbs,40);
assert.equal(a.joinedSideFaces,40);
assert.equal(a.soffitFaces,20);
assert.equal(a.supportJoists,4);
assert.equal(a.stonePosts,16);
assert.equal(a.oakRailPanels,28);
assert.equal(a.oakDiagonalBraces,14);
assert.equal(a.triangles,triangles);
assert.ok(a.triangles<1900&&a.triangles>200);
assert.equal(a.keepsRiverOpen,true);
assert.equal(a.unchangedDeckProfile,true);
for(const field of ['newNavigationEdges','newResidents','newEconomyEvents'])
 assert.equal(a[field],0);
const eq=(a,b)=>Math.abs(a-b)<1e-8;
for(let j=0;j<19;j++){
 // Six original continuous top/fascia/soffit quads per water span.
 const now=quads[j*6],next=quads[(j+1)*6];
 assert.ok(eq(now.b[2],next.a[2]),'continuous joined z seam');
 assert.ok(eq(now.b[1],next.a[1]),'same deck height along the seam');
}
for(let j=0;j<20;j++){
 const top=quads.slice(j*6,j*6+3);
 assert.equal(top.length,3);
 for(let i=0;i<2;i++){
  assert.ok(eq(top[i].d[0],top[i+1].a[0]),
    'full edge-to-edge joined stone/wood/stone deck');
 }
}
for(const face of quads)for(const p of [face.a,face.b,face.c,face.d])
 assert.ok(p.every(Number.isFinite),'finite physical original vertices');
assert.ok(!/Math\.random|people\.push|city\.push|state\.[a-z]+\s*=/.test(file.slice(start,end)),
 'never invent authority, homes, jobs or an economy');
console.log('W193 original crossing source contract GREEN: 20 joined oak planks, 40 stone kerbs, open fascia, complete rails, no invented game state');
