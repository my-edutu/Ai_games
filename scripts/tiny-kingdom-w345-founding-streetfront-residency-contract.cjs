'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const game=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(game,'original running WebGL game required');
new vm.Script(game);
const a=game.indexOf('let foundingStreetfrontCoreBuilds=');
const b=game.indexOf('// W83: ONE physical granary-to-market',a);
assert(a>0&&b>a,'original frontages and occupied-home road must be separated');
const core=game.slice(a,b);
assert(game.includes('highStreetStats.totalTriangles=renderFoundingStreetfronts();'),
 'founding home frontages must enter retained ORIGINAL market/farm core');
assert(game.includes('inhabitedHighStreet(false);farmMarketStreet();'),
 'changed real road may not rebuild unchanged original buildings');
assert(game.includes('foundingStreetfronts:{...highStreetStats}'),
 'live original core must retain high-street counters');
assert(game.includes('highStreetStats={...entry.stats.foundingStreetfronts}'),
 'core recall must restore actual founding yard/workshop audit');
function exercise(split){
 const city=Array.from({length:12},(_,i)=>[i-6,i%3,i%2]);
 const calls={};
 const ctx={data:[],city,highStreetStats:{},Math,Number,
  civicGpuResidencyEnabled:false,civicCoreBuffer:null,
  HIGHSTREET_LANES:[[[0,0],[1,1]],[[1,1],[2,2]]]};
 function emit(name){
  return ()=>{calls[name]=(calls[name]||0)+1;
   for(let k=0;k<30;k++)ctx.data.push(name==='shop'?101:
    name==='yard'?102:name==='lane'?103:104);
   if(name==='shop')ctx.highStreetStats.shopfronts++;
   if(name==='yard')ctx.highStreetStats.houseYards++;
   if(name==='lane')ctx.highStreetStats.connectedLanes++;
  };
 }
 ctx.highStreetCraftShop=emit('shop');ctx.highStreetHomeYard=emit('yard');
 ctx.highStreetLane=emit('lane');
 ctx.marketToRealHomeStreet=emit('road');
 const c=vm.createContext(ctx);vm.runInContext(core,c,{timeout:2000});
 const run=x=>vm.runInContext(x,c,{timeout:2000});
 if(split){
  run('resetHighStreetBuildStats()');
  run('highStreetStats.totalTriangles=renderFoundingStreetfronts()');
  run('inhabitedHighStreet(false)');
 }else run('inhabitedHighStreet()');
 const audit=run('getFoundingStreetfrontCoreAudit()');
 return {calls,stats:{...ctx.highStreetStats},size:ctx.data.length,
  triangles:ctx.data.filter((_,i)=>i%30===0).sort((a,b)=>a-b),audit};
}
const stand=exercise(false),resident=exercise(true);
assert.deepEqual(resident.calls,stand.calls,
 'no original shop, yard, lived road or house transaction visualization lost');
assert.deepEqual(resident.triangles,stand.triangles,
 'same genuine complete original source triangles, no duplicates');
assert.equal(resident.size,stand.size);
assert.equal(resident.calls.shop,2);
assert.equal(resident.calls.yard,10);
assert.equal(resident.calls.lane,2);
assert.equal(resident.calls.road,1);
for(const key of ['totalTriangles','shopfronts','houseYards','connectedLanes'])
 assert.equal(resident.stats[key],stand.stats[key],
  'original counters and actual source geometry must match');
assert.equal(resident.audit.changesAuthority,false);
assert.equal(resident.audit.inventedTrades,0);
assert.equal(resident.audit.allOriginalGeometryPreserved,true);
console.log('W345 PASS: actual founding shops and occupied yards retained independent of re-planned real streets; all original geometry/counters preserved. No physical FPS or commercial A/B claim.');
