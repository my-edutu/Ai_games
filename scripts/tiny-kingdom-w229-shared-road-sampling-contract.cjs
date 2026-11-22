#!/usr/bin/env node
'use strict';
// W229 RED/GREEN: The REAL granary -> receiving market -> occupied home
// has the identical joined, cambered roadway, but performs only the unique
// terrain-height evaluations per emitted strip. Never hide a road, person,
// building or original transaction to meet the renderer budget.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=source.indexOf('const GRAINWARD_ROAD_PROFILE=');
const end=source.indexOf('\nfunction marketToRealHomeStreet(){',start);
assert.ok(start>0&&end>start,'real public-road source block present');
const faces=[];
let terrainCalls=0;
const elevation=(x,z)=>{terrainCalls++;return .13*Math.sin(x*.32)*Math.cos(z*.24)+.013*x-.005*z};
const context={Math,Number,Error,terrain:elevation,
 upwardRoadQuad:(a,b,c,d,col)=>faces.push({points:[a,b,c,d],color:col})};
vm.createContext(context);
vm.runInContext(source.slice(start,end),context,{timeout:4000});
const draw=context.renderGradedRoadSection;
const palette={earth:[11,12,13],wheel:[21,22],verge:[31,32,33]};
for(const [a,b,halfWidth,role] of [
 [[29,-7.6],[18,-3.3],.70,'granary'],
 [[-1,10.2],[-12,13],.59,'household']]){
 const before=faces.length;
 const startCalls=terrainCalls,begin=[...a],finish=[...b];
 const audit=draw(a,b,.20,.72,halfWidth,17,palette,role);
 assert.equal(audit.triangles,12,'all six physical surface bands retained');
 assert.equal(terrainCalls-startCalls,14,'seven unique cross-section heights at each end: no duplicate expensive terrain samples');
 assert.deepEqual(a,begin,'actual route start retained');
 assert.deepEqual(b,finish,'actual route end retained');
 const nx=-(b[1]-a[1])/Math.hypot(b[0]-a[0],b[1]-a[1]);
 const nz=(b[0]-a[0])/Math.hypot(b[0]-a[0],b[1]-a[1]);
 const offsets=[-1.30,-1,-.58,0,.58,1,1.30];
 const heights=[.022,.031,.020,.056,.020,.031,.022];
 const point=(t,k)=>{
  const x=a[0]+(b[0]-a[0])*t+nx*offsets[k]*halfWidth;
  const z=a[1]+(b[1]-a[1])*t+nz*offsets[k]*halfWidth;
  return [x,.13*Math.sin(x*.32)*Math.cos(z*.24)+.013*x-.005*z+heights[k],z];
 };
 const facesHere=faces.slice(before);
 assert.equal(facesHere.length,6,'six complete, real walkable road bands');
 for(let band=0;band<6;band++){
  const expected=[point(.20,band),point(.72,band),point(.72,band+1),point(.20,band+1)];
  const actual=facesHere[band].points;
  // The source's established upwardRoadQuad may reverse winding for upward normals.
  const normal=actual.every((p,k)=>p.every((v,i)=>Math.abs(v-expected[k][i])<1e-10));
  const reversed=actual.every((p,k)=>p.every((v,i)=>Math.abs(v-expected[[0,3,2,1][k]][i])<1e-10));
  assert.ok(normal||reversed,'exact terrain geometry and winding retained for band '+band);
 }
}
assert.match(source,/renderGradedRoadSection\(a,b,t,u,\.70,k,/,'genuine granary route remains in use');
assert.match(source,/renderGradedRoadSection\(a,b,f,g,\.59,key,roadPalette,'household'\)/,'actual occupied-home street remains in use');
assert.ok(!/Math\.random\(|state\.food\s*=|people\.push\(/.test(source.slice(start,end)),'no synthetic economy or authority edits');
console.log('W229: exact six-band granary/market/home mesh, 14 unique height samples, original cargo and roads intact');
