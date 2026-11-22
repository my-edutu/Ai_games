'use strict';
// Test FIRST: previous W447 original playable HTML has no physically rooted
// near-leaf fan and fails. Execute the real game functions, not test replicas.
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const assert=require('node:assert/strict');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
function functionSource(name){
 const begin=html.indexOf('function '+name+'(');
 assert(begin>=0,'W448 missing real original game function '+name);
 const open=html.indexOf('{',begin);let depth=0,pos=open;
 for(;pos<html.length;pos++){
  if(html[pos]==='{')depth++;
  if(html[pos]==='}'&&!--depth)return html.slice(begin,pos+1);
 }
 throw Error('Malformed real original function '+name);
}
const ctx={faces:[],forestVisualStats:{nearBranchFans:0,individualLeaves:0},
 forestLodStats:{reclaimedTriangles:0}};
ctx.rgb=x=>[(x>>16)&255,(x>>8)&255,x&255].map(v=>v/255);
ctx.tri=(a,b,c,color)=>ctx.faces.push([a,b,c,color]);
vm.runInNewContext(['leafBlade','leafWhorl','renderOriginalNearBroadleafFans']
 .map(functionSource).join('\n')+'\nthis.make=renderOriginalNearBroadleafFans;',ctx);
const args=[[2,3,4],.8,.72,1.1,.9,1,0,3.25];
assert.equal(ctx.make(...args),40,'two five-blade rooted fans must cost 40 triangles');
assert.equal(ctx.faces.length,40,'previous two fine crowns and whorl cost 68');
assert.equal(ctx.forestVisualStats.nearBranchFans,2);
assert.equal(ctx.forestVisualStats.individualLeaves,10);
assert.equal(ctx.forestLodStats.reclaimedTriangles,28);
assert(ctx.faces.every(face=>face.flat(1).every(Number.isFinite)));
const original=JSON.stringify(ctx.faces);
ctx.faces.length=0;
assert.equal(ctx.make(...args),40);
assert.equal(JSON.stringify(ctx.faces),original,'seed + world position are stable');
assert.throws(()=>ctx.make([NaN,3,4],.8,.72,1.1,.9,1,0,3.25),
 /invalid original rooted branch foliage/);
const tree=functionSource('tree');
assert(tree.includes("if(detailTier==='near')renderOriginalNearBroadleafFans("),
 'real near trees must invoke this helper, not props for screenshots');
assert(!tree.includes("for(let rim=0;rim<(detailTier==='near'?2:0);rim++){"),
 'remove old spherical satellites rather than layering extra faces');
assert(tree.includes('forestLodStats.skippedMicroLobes+=2;'),
 'same real mid/far compact tier remains');
assert(tree.includes('taperedBranch([x,y,z],fork'),'original rooted trunk remains');
assert(html.includes('nearBranchFans:forestVisualStats.nearBranchFans'),
 'show measured original near-forest fan counts in the live audit');
console.log('W448 RED prior absent rooted fans; GREEN 40 vs 68 actual near foliage faces, true tree invocation, unchanged mid/far, seeded finite/unchanged authority; running-game, FPS and independent critics pending.');
