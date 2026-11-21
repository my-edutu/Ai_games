'use strict';
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const snippet=(start,end)=>{
 const a=html.indexOf(start),b=html.indexOf(end,a);
 assert(a>=0&&b>a,'missing actual source: '+start);return html.slice(a,b);
};
const helper=snippet('function originalVillageRoadLanes(){','function rebuildGroundAtlas(){');
const nav=snippet('function walkable(x,z){','function navPoint(ix,iz)');
const clear=snippet('function clearSegment(a,b){','// Binary priority queue keeps worst-case');
const city=new Function(snippet('const city=[[',';const trees=[]')+';return city')();
const highway=new Function(snippet('const HIGHSTREET_LANES=Object.freeze(','let highStreetStats=')+';return HIGHSTREET_LANES')();
const {walkable,clearSegment,planInhabitedStreetAccess,originalVillageRoadLanes}=
 new Function('city','HIGHSTREET_LANES','NAV_LIMIT','CRAFT_DISTRICT',
 'FARMSTEAD','SCENIC_SITES',nav+clear+helper+
 'return {walkable,clearSegment,planInhabitedStreetAccess,originalVillageRoadLanes}')(
 city,highway,40,{x:19,z:-15,width:8.2,depth:6.4},
 {granary:[29,-5]},{sanctuary:{x:29,z:10},bridge:{x:-6}});
const roads=originalVillageRoadLanes();
assert.equal(city.length,12,'pinned authentic founding-lot fixture changed');
let curved=0;
for(const lot of city){
 const plan=planInhabitedStreetAccess(lot,roads,walkable,clearSegment);
 assert(plan,'actual original occupied home needs a physical doorstep route');
 assert(plan.path.length<=4,'bounded one-bend route');
 for(let i=2;i<plan.path.length;i++)
  assert(clearSegment(plan.path[i-1],plan.path[i]),'never paint across a real obstruction');
 if(plan.bends)curved++;
 assert.deepEqual(plan,planInhabitedStreetAccess(lot,roads,walkable,clearSegment),
  'presentation must be deterministic');
}
assert.equal(curved,5,'expected genuinely blocked straight lanes');
assert.equal(planInhabitedStreetAccess(city[0],[],walkable,clearSegment),null);
assert.equal(planInhabitedStreetAccess(city[0],roads,()=>false,clearSegment),null);
assert.equal(planInhabitedStreetAccess(city[0],roads,walkable,()=>false),null);
assert(html.includes("const accessTopology=city.map(lot=>lot.join(',')).join(';')"),
 'real settlement growth and restore must invalidate cosmetic paths');
assert(html.includes('ctx.drawImage(groundAtlasAccessCanvas,0,0)'),
 'route overlay must be composited in actual world albedo');
assert(!html.includes('homeCtx.lineTo(world(x),world(z-2.35))'),
 'disconnected orphan cottages apron must be gone');
new Function(snippet('<script>','</script>').slice('<script>'.length));
console.log('W153 original-source inhabited frontages: 12/12 connected; 5 validated bends; whole script parsed');
