#!/usr/bin/env node
'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
assert.doesNotThrow(()=>new vm.Script(script,{filename:'tiny-kingdom-W248-inline.js'}));
const begin=script.indexOf('function planLivedHouseGroundContact(');
const end=script.indexOf('\nfunction rebuildGroundAtlas(){',begin);
assert.ok(begin>=0&&end>begin,'W248 RED: exact house ground contact absent');
const context={};vm.createContext(context);
vm.runInContext(script.slice(begin,end),context,{timeout:1500});
const ops=[],gradient=()=>({addColorStop(){}});
const paint={save(){ops.push('save')},restore(){ops.push('restore')},
 createRadialGradient(...v){ops.push(['radial',...v]);return gradient()},
 createLinearGradient(...v){ops.push(['linear',...v]);return gradient()},
 beginPath(){},ellipse(...v){ops.push(['ellipse',...v])},
 fill(){ops.push('fill')},stroke(){ops.push('stroke')},
 fillRect(...v){ops.push(['rect',...v])}};
const world=x=>(x+92)*512/184;
for(const lot of [[-10,-7,0],[11,2,1],[16,13,2],[28,-9,3]]){
 const p=context.planLivedHouseGroundContact(lot);
 assert.ok(p.haloRx>p.rx&&p.haloRz>p.rz);
 const audit=context.paintLivedHouseGroundContact(paint,lot,world,512,184);
 assert.equal(audit.addedTriangles,0);assert.equal(audit.textureAllocations,0);
 assert.equal(audit.authorityModified,false);
 assert.ok(audit.haloMetres.every(Number.isFinite));
}
assert.equal(ops.filter(x=>x==='save').length,4);
assert.equal(ops.filter(x=>x==='restore').length,4);
assert.equal(ops.filter(x=>Array.isArray(x)&&x[0]==='radial').length,4);
for(const op of ops.filter(Array.isArray))assert.ok(op.slice(1).every(Number.isFinite));
assert.throws(()=>context.planLivedHouseGroundContact([0,NaN,0]));
assert.throws(()=>context.planLivedHouseGroundContact([0,0,-2]));
assert.ok(script.includes('paintLivedHouseGroundContact(homeCtx,lot,world,size,GROUND_ATLAS_EXTENT)'));
assert.ok(script.includes('groundAtlasHouseKeys[i]!==city[i].join'));
assert.ok(script.includes('planGroundAtlasDirtyRegions(groundAtlasPriorPixels,composite'));
assert.ok(!/Math\.random|state\.[a-z]+\s*=|people\.push\(/.test(script.slice(begin,end)));
console.log('W248 PASS source: original occupied homes grounded in retained atlas; finite contact, 0 new triangles/buffers/authority. Native W248 WebGL and visual acceptance NOT PROVEN.');
