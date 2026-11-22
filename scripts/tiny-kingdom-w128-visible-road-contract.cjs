'use strict';
// W128 RED=>GREEN: the actual 3D granary→market→home road must have
// upward-facing physical surfaces, not a hidden back face plus painted atlas.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(start>=0&&end>start);
const source=html.slice(start+8,end);new vm.Script(source);
const part=(a,b)=>{const i=source.indexOf(a),j=source.indexOf(b,i+a.length);
 assert(i>=0&&j>i,'missing authored road block '+a);return source.slice(i,j)};
const helper=part('function upwardRoadQuad(','function marketToRealHomeStreet(){');
const freight=part('function farmMarketStreet(){','// W07: founding families');
const household=part('function marketToRealHomeStreet(){','function inhabitedHighStreet(){');
assert(source.includes('gl.enable(gl.CULL_FACE);gl.cullFace(gl.BACK)'));
assert(source.includes('renderRealRoadsideMicroterrain(points);'));
assert(source.includes('getRealRoadscapeAudit'));
assert(freight.split('upwardRoadQuad(at(').length>=5,'all 4 real freight strips face the viewer');
assert(household.split('upwardRoadQuad(at(').length>=4,'all 3 home-road strips face the viewer');
assert(!freight.includes('quad(at(')&&!household.includes('quad(at('),
 'hidden backward road triangles must not survive this reconstruction');
const signedY=(a,b,c)=>(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
const seen=[];const scope={quad:(a,b,c,d,col)=>seen.push({a,b,c,d,col,ny:signedY(a,b,c)})};
const orient=vm.runInNewContext(helper+';upwardRoadQuad',scope);
const a=[0,.035,-.7],b=[1,.036,-.7],c=[1,.035,.7],d=[0,.034,.7],col=[.6,.5,.4];
assert.equal(orient(a,b,c,d,col),true);
assert.equal(orient(a,d,c,b,col),false);
assert.equal(seen.length,2);
assert(seen.every(p=>p.ny>0&&p.col===col));
assert.throws(()=>orient([0,0,0],[1,0,0],[2,0,0],[3,0,0],col),
 /invalid public road/);
const roadCode=part('const ROADSIDE_MAX_TRIANGLES=','function farmMarketStreet(){');
assert(!roadCode.includes('Math.random'),'cosmetic fields never use rule RNG');
const env={
 Math,city:[],FARMSTEAD:{fields:[[16.45,24.65,-1.62,3.64,12,17],[26,32,-1.38,3.78,10,13]]},
 state:{t:17,food:543,wood:271,gold:49},
 climateAt:()=>({season:1}),walkable:()=>true,
 terrain:(x,z)=>.13*Math.sin(x*.32)*Math.cos(z*.24),
 rgb:h=>[(h>>16&255)/255,(h>>8&255)/255,(h&255)/255],
 data:[],MATERIAL:{ROAD:3,FOLIAGE:4},currentMaterial:0
};
let faceChecks=0,rootBound=0;
env.materialScope=(id,fn)=>{const previous=env.currentMaterial;
 env.currentMaterial=id;try{return fn()}finally{env.currentMaterial=previous}};
env.tri=(a,b,c,color)=>{
 for(const vertex of [a,b,c])assert(vertex.length===3&&vertex.every(Number.isFinite));
 assert(color.length===3&&color.every(v=>v>=0&&v<=1&&Number.isFinite(v)));
 for(const vertex of [a,b,c])env.data.push(...vertex,0,1,0,...color,env.currentMaterial);
};
env.quad=(a,b,c,d,color)=>{
 const y=signedY(a,b,c);assert(y>0,'physical service-road polygon must face upward');
 faceChecks++;env.tri(a,b,c,color);env.tri(a,c,d,color);
};
env.upwardRoadQuad=vm.runInNewContext(helper+';upwardRoadQuad',{quad:env.quad});
const oldState=JSON.stringify(env.state),oldFields=JSON.stringify(env.FARMSTEAD);
const fixture=[[29,-7.6],[25,-9],[17,-10],[11,-10],[7,-11],[-1,10.2]];
const stats=vm.runInNewContext(roadCode+
 ';renderRealRoadsideMicroterrain(fixture);getRealRoadscapeAudit()',
 {...env,fixture});
assert.equal(stats.routeWaypoints,fixture.length);
assert(stats.sections>20&&stats.verges>5&&stats.skipped>0);
assert.equal(stats.drainagePanels,stats.verges*3);
assert.equal(stats.triangles,env.data.length/30);
assert(stats.triangles<=stats.maxBudget&&stats.triangles>100);
assert(stats.shrubs>0&&stats.maxHeight<=.50);
assert.equal(stats.extraBuffers,0);
assert.equal(stats.closestNewVergeOffset,1.08);
assert.equal(stats.changesNavigation,false);
assert.equal(stats.changesAuthoritativeState,false);
assert.equal(JSON.stringify(env.state),oldState);
assert.equal(JSON.stringify(env.FARMSTEAD),oldFields);
assert(faceChecks>=stats.drainagePanels,'every roadway swale is truly upward facing');
console.log('W128 actual 3D public-road winding and connected verges PASS',JSON.stringify(
 {correctedFreightStrips:4,correctedHomeStrips:3,
 roadPanels:stats.drainagePanels,triangleBudget:stats.triangles,
 upstreamFaceChecks:faceChecks,rootHeight:stats.maxHeight,authoritativeStateUnchanged:true}));
