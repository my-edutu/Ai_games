#!/usr/bin/env node
'use strict';
// New six-band physical road is sourced FROM the playable scene, not a
// synthetic camera setup. Technical gate only; no claim of 30fps or AAA.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const s=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(s);
const a=s.indexOf('const FIELD_TO_GRANARY_GATE='),b=s.indexOf('// W111 Phase 1:',a),
 p=s.indexOf('function upwardRoadQuad('),q=s.indexOf('function marketToRealHomeStreet()',p);
assert(a>=0&&b>a&&p>=0&&q>p);
const field=s.slice(a,b);
assert.match(field,/renderGradedRoadSection\(/);
assert.doesNotMatch(field,/upwardRoadQuad\(at\(a,-\.51,\.041\)/);
const data=[],faces=[],state={food:18,t:14},terrain=(x,z)=>.09*Math.sin(x*.23+z*.17);
const scope={Math,Number,Error,Map,Set,data,state,terrain,
 FARM_MARKET_STREET_ORIGIN:[29,-7.6],MATERIAL:{ROAD:3,STONE:5},
 walkable:()=>true,routeBetween:(_x,_z,tx,tz)=>[[24.3,-4.65],[tx,tz]],
 rgb:n=>[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255]};
let material=0;scope.materialScope=(m,run)=>{const prev=material;material=m;
 try{return run()}finally{material=prev}};
scope.quad=(a,b,c,d,color)=>{
 const ny=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
 assert(ny>1e-8,'graded road faces must be visible in WebGL');
 assert([a,b,c,d].every(pt=>pt.every(Number.isFinite)));
 faces.push({material,pts:[a,b,c,d]});
 for(const pt of [a,b,c,a,c,d])data.push(...pt,0,1,0,...color,material);
};
const authority=JSON.stringify(state);
const vmContext=vm.createContext(scope);
const api=vm.runInContext(s.slice(p,q)+field+
 ';({draw:fieldToGranaryFootway,audit:getFieldToGranaryFootwayAudit,road:getGradedRoadAudit})',
 vmContext,{timeout:2500});
api.draw();const result=api.audit(),graded=api.road();
assert(result.connected&&result.sections>=10);
assert.equal(result.crownedSections,result.sections);
assert.equal(result.wheelRuts,result.sections*2);
assert.equal(result.grassShoulders,result.sections*2);
assert.equal(result.surfaceBandsPerSection,6);
assert.equal(result.overlaidFakeWheelMeshes,0);
assert.equal(result.usesExistingCivicBuffer,true);
assert.equal(graded.classes.field,result.sections);
assert(Math.abs(result.crownedMetres-result.distance)<.01);
assert.equal(result.triangles,data.length/30);
assert(result.triangles<=900);
assert.equal(result.threshingStones,9);
assert.equal(result.addedJobs,0);assert.equal(result.addedCargo,0);
assert.equal(result.authorityModified,false);assert.equal(result.changesNavigation,false);
assert.equal(JSON.stringify(state),authority);
assert.equal(faces.filter(f=>f.material===scope.MATERIAL.ROAD).length,result.sections*6);
console.log('W392 PASS original field-to-granary crowned route, '+result.triangles+
 ' physical triangles. Look/feel/play and physical FPS NOT PROVEN');
