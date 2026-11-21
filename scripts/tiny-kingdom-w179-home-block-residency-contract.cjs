'use strict';
// W179: inspect the exact original playable WebGL home-partition source.
// RED on W178 before packLocalHomeResidentMesh exists. Browser and hardware
// acceptance are independent and cannot be inferred from this source test.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const inline=html.match(/<script[^>]*>([\s\S]*?)<\/script>/i)?.[1];
assert.ok(inline,'the real playable inline script');
new Function(inline);
const marker='let homeLocalMeshPacked=0,homeLocalMeshFallbacks=0,homeLocalMeshFloatsRetained=0;';
const a=html.indexOf(marker),b=html.indexOf('function buildHomeClusters(fullHomes,climateKey){',a);
assert.ok(a>0&&b>a,'W179 complete typed local-home resident packer exists in original renderer');
assert.match(html,/const packed=packLocalHomeResidentMesh\(mesh\);/);
const oldSpatial=mesh=>({vertices:new Float32Array(mesh),ranges:[
 {first:0,count:mesh.length/10,minX:-100,minY:-100,minZ:-100,maxX:100,maxY:100,maxZ:100}
]});
const tested=new Function('packSpatialScenery','HOME_CLUSTER_EDGE',
 html.slice(a,b)+'return {packLocalHomeResidentMesh,stats:()=>({homeLocalMeshPacked,homeLocalMeshFallbacks,homeLocalMeshFloatsRetained})};'
)(oldSpatial,16);
const nearby=new Float32Array(240*30);
for(let i=0;i<nearby.length;i+=10){
 const n=i/10;nearby[i]=2+(n%22)*.22;
 nearby[i+1]=.2+(n%13)*.28;
 nearby[i+2]=-4+(n%17)*.25;
 nearby[i+3]=0;nearby[i+4]=1;nearby[i+5]=0;
 nearby[i+6]=.4;nearby[i+7]=.5;nearby[i+8]=.6;nearby[i+9]=7;
}
const packed=tested.packLocalHomeResidentMesh(nearby);
assert.equal(packed.vertices,nearby,'no copied or scattered original house triangles');
assert.equal(packed.ranges.length,1,'a truly local home cell is one conservative draw range');
assert.equal(packed.ranges[0].first,0);
assert.equal(packed.ranges[0].count,nearby.length/10);
for(let i=0;i<nearby.length;i+=10){
 const r=packed.ranges[0];
 assert.ok(nearby[i]>=r.minX&&nearby[i]<=r.maxX);
 assert.ok(nearby[i+1]>=r.minY&&nearby[i+1]<=r.maxY);
 assert.ok(nearby[i+2]>=r.minZ&&nearby[i+2]<=r.maxZ);
}
const wide=nearby.slice();wide[0]=65;
const fallback=tested.packLocalHomeResidentMesh(wide);
assert.notEqual(fallback.vertices,wide,'overspread scene retains original spatial packing fallback');
assert.equal(fallback.ranges[0].count,wide.length/10);
assert.throws(()=>tested.packLocalHomeResidentMesh(new Float32Array(31)),/stride|triangle/);
const invalid=nearby.slice();invalid[11]=NaN;
assert.throws(()=>tested.packLocalHomeResidentMesh(invalid),/nonfinite/);
assert.deepEqual(tested.stats(),{
 homeLocalMeshPacked:1,homeLocalMeshFallbacks:1,
 homeLocalMeshFloatsRetained:nearby.length
});
assert.match(html,/if\(homeClusterActive.reduce\(\(n,e\)=>n\+e.homes,0\)!==city.length\)/);
assert.match(html,/throw Error\('W76 dropped a real inhabited cottage'\)/);
console.log('W179 source PASS: complete original JS parses; 240 triangles exact, 1 local conservative range, zero reordering/copy, full vertex AABB, overspread fallback, invalid rejection and no missed real homes. Browser, GPU timings and visual milestone NOT PROVEN.');
