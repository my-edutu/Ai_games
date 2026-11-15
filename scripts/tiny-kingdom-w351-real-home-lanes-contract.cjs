'use strict';
// W351: actual-source projection of ORIGINAL assigned household lanes.
// A route is built only from real citizen home assignments and the same
// traversable street geometry; no secondary fake job, actor or inventory.
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const game=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(game,'live Tiny Kingdom script missing');
new Function(game);
const start=game.indexOf('// W351: readable original market-to-inhabited-home streets.');
const end=game.indexOf('// W345 rendering spine:',start);
assert(start>=0&&end>start,'real W351 retained home-lane source unavailable');
assert(game.includes('renderRealInhabitedLaneNetwork();'),
 'authentic market-home corridor must actually render in the civic district');
assert(game.includes('inhabitedConnections:getRealHomeLaneNetworkAudit()'),
 'genuine home-lane audit must appear with original freight audit');
const actual=game.slice(start,end);
let drawTriangles=0,draws=0,routes=0;
const state={food:135,wood:64,gold:25,t:2880};
const initial=JSON.stringify(state);
const city=[[0,3,0],[3,0,1],[0,5,2]];
const people=[{name:'Cora',home:0},{name:'Bram',home:1},{name:'Elin',home:2}];
const data=[];
const init=new Function('city','people','data','MARKET_HOME_STREET_ORIGIN',
 'marketHomeStreetStats','citizenHomeIndex','citizenHomeDestination',
 'walkable','routeBetween','rgb','MATERIAL','materialScope',
 'upwardRoadQuad','terrain',
 actual+'return {build:renderRealInhabitedLaneNetwork,'+
 'audit:getRealHomeLaneNetworkAudit};');
const render=init(city,people,data,[0,0],{homeIndex:0},
 p=>p.home,p=>[city[p.home][0],city[p.home][1]],
 (x,z)=>Number.isFinite(x)&&Number.isFinite(z)&&Math.abs(x)<40&&Math.abs(z)<40,
 (x,z,tx,tz)=>{routes++;return [[tx,tz]];},
 color=>color,{ROAD:4},(_,fn)=>fn(),
 (...args)=>{assert.equal(args.length,5);draws++;drawTriangles+=2;
  for(let i=0;i<60;i++)data.push(0);},
 ()=>0);
render.build();
const audit=render.audit();
assert.equal(audit.occupiedHomes,3);
assert.equal(audit.connectedHomes,2,'two additional REAL resident homes only');
assert(audit.segments>0);
assert.equal(audit.triangles,drawTriangles);
assert.equal(data.length,audit.triangles*30);
assert.equal(draws,audit.segments*3,'exact earth + two rut quads');
assert(audit.triangles<=audit.triangleBudget);
assert(audit.extraGpuBuffers===0&&!audit.changesAuthority&&!audit.changesNavigation);
assert.equal(JSON.stringify(state),initial,'market/world authority must not change');
assert(routes>0,'physical A* must select actual household home targets');
const firstGeometry=data.slice(),firstAudit={...audit};
data.length=0;render.build();
assert.deepEqual(data,firstGeometry,'same town and routes must emit stable real geometry');
assert.deepEqual(render.audit(),firstAudit,'same town must have stable lane audit');
// Growth must never hide a genuine house, exceed the triangle budget, or
// construct roads for nonexistent city positions.
for(let i=3;i<35;i++){
 city.push([(i%7)*4-13,Math.floor(i/7)*5-11,i%3]);
 people.push({name:'Resident '+i,home:i});
}
data.length=0;render.build();
const grown=render.audit();
assert.equal(grown.occupiedHomes,people.length);
assert(grown.connectedHomes<=10&&grown.connectedHomes>0);
assert(grown.triangles<=1020);
assert.equal(grown.triangles,data.length/30);
console.log('W351 SOURCE PASS: true assigned homes, A* lanes, exact draw geometry, bounded Day120 growth; running camera/visual/physical FPS NOT PROVEN.');
