'use strict';
// W158 genuine producer -> granary -> market threshold microgeometry contract.
// node --test scripts/tiny-kingdom-w158-freight-threshold-contract.cjs
// These are source/microgeometry checks, NEVER a running WebGL or FPS pass.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path'),vm=require('node:vm');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const begin=html.indexOf('<script>')+8,end=html.lastIndexOf('</script>');
assert(begin>=8&&end>begin,'real playable inline game required');
const script=html.slice(begin,end);
const first=script.indexOf('const GRAINWARD_TRANSFER_NODE_TRIANGLE_LIMIT=');
const last=script.indexOf('function granaryArchitecture(){',first);
assert(first>=0&&last>first,'W158 original freight-threshold implementation required');
const source=script.slice(first,last);
test('the complete actual playable script parses',()=>{
 assert.doesNotThrow(()=>new vm.Script(script));
});
test('all THREE original world sites are integrated, retained and observable, not film-only',()=>{
 assert.match(script,/farmScene\.transferGranary=grainwardTransferNode\('granary'\)/);
 assert.match(script,/farmScene\.transferField=grainwardTransferNode\('field'\)/);
 assert.match(script,/marketQuarterStats\.transferMarket=grainwardTransferNode\('market'\)/);
 assert.match(script,/getGrainwardDormerAudit,getGrainwardTransferNodeAudit,getInhabitedSkylineAudit/);
 assert.doesNotMatch(source,/\b(?:Math\.random|state\s*\.|people\s*\.|deliveryReceipts\s*\.|city\s*\.)/);
 assert.match(source,/inExistingCivicVbo|existingCivicVbo/);
});
function buildFixture(accessible=true){
 const data=[],patches=[];
 const at=(a,b,c,d)=>{
  const up=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
  assert(Number.isFinite(up)&&up>1e-8,'real terrain polygon must face sky');
  for(const v of [a,b,c,d])assert(v.every(Number.isFinite),'finite actual coordinates');
  patches.push(up);data.length+=60;
 };
 const upward=(a,b,c,d)=>{
  const up=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
  assert(Math.abs(up)>1e-8,'nondegenerate road band');
  if(up<0)at(a,d,c,b);else at(a,b,c,d);
 };
 const box=(x,y,z,w,h,d)=>{
  assert([x,y,z,w,h,d].every(Number.isFinite),'finite actual solid');
  assert(Math.min(w,h,d)>0,'positive masonry dimensions');
  assert(h<=.16,'no tall fake walls or obstruction in real loading aisle');
  data.length+=360; // 12 true box triangles * 30 packed floats
 };
 const ctor=new Function('data','MATERIAL','materialScope','rgb','upwardRoadQuad','box',
  'walkable','terrain','FIELD_TO_GRANARY_GATE','FARM_MARKET_STREET_ORIGIN',
  'FARM_MARKET_STREET_DESTINATION',source+'return grainwardTransferNode;');
 return {data,patches,make:ctor(data,{ROAD:3,STONE:5,WOOD:6},
  (_,fn)=>fn(),n=>[(n>>16&255)/255,(n>>8&255)/255,(n&255)/255],
  upward,box,()=>accessible,
  (x,z)=>.07*Math.sin(x*.4)*Math.cos(z*.3),
  [21.7,-2.45],[29,-7.6],[-1,10.2])};
}
test('original field, grain store and receiving market each have bounded upward stone/wood and open centre',()=>{
 const {data,patches,make}=buildFixture();
 let accumulated=0;
 const results=['field','granary','market'].map(site=>{
  const before=data.length,out=make(site);
  assert(out.built,site+' must be genuine connected physical apron');
  assert.equal(out.triangles,(data.length-before)/30,'account for EVERY triangle');
  assert(out.triangles<=out.maxTriangles);
  assert(out.sections>=8&&out.stoneMargins>=8&&out.oakEdges>=6);
  assert(out.unobstructedAisle&&out.changesNavigation===undefined);
  assert.equal(out.navigationChanged,false);
  assert.equal(out.deliveriesAdded,0);
  accumulated+=out.triangles;return out;
 });
 assert.deepEqual(results.map(x=>x.triangles),[76,120,110]);
 assert.equal(accumulated,306);
 assert(patches.length>100);
});
test('invalid site fails safely and blocked real anchor cannot invent access',()=>{
 const f=buildFixture(false);
 assert.equal(f.make('field').triangles,0);
 assert.equal(f.data.length,0);
 assert.throws(()=>f.make('imagined-cargo'),/invalid real transfer site/);
});
