'use strict';
// W190 production-source contract: compare the exact cached grid-passage
// code with the original walkable(x,z) oracle over growing/restored towns.
// This tests deterministic routing primitives, not visual parity or FPS.
const assert=require('node:assert/strict'),fs=require('node:fs');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const game=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(game,'actual live game JavaScript missing');
new Function(game);
const begin=game.indexOf('// W190 NAV_NODE_GRID_BEGIN');
const end=game.indexOf('// W190 NAV_NODE_GRID_END',begin);
assert(begin>=0&&end>begin,'RED: real source lacks bounded exact navigation grid');
assert(game.includes('if(!navNodeWalkable(ix,iz)||'), 'actual navSnap must use exact cached passage');
assert(game.includes('if(!navNodeWalkable(nx,nz))continue;'),'A* must use exact cached passage');
assert(game.includes('getNavNodeGridAudit,'),'live browser must expose bounded grid audit');
const source=game.slice(begin,end);
const init=new Function('city','NAV_LIMIT','NAV_SPACING','walkable',
 source+'return {lookup:navNodeWalkable,ensure:ensureNavNodeGrid,audit:getNavNodeGridAudit};');
const city=[[5,8,0],[-7,-4,1],[2,-12,2],[12,9,0]];
let oracleQueries=0;
const original=(x,z)=>{
 oracleQueries++;
 if(!Number.isFinite(x)||!Number.isFinite(z)||Math.abs(x)>40||Math.abs(z)>40)return false;
 if(Math.abs(x)<3.55&&Math.abs(z+1)<2.8)return false;
 if(Math.abs(x)<1.95&&Math.abs(z-5)<1.5)return false;
 if(Math.hypot(x+15,z-4)<1.1)return false;
 if(Math.abs(x-19)<4&&Math.abs(z+15)<3)return false;
 if(Math.abs(z-(20+Math.sin(x*.13)*3))<1.7)return false;
 for(const [hx,hz,k] of city)
  if(Math.abs(x-hx)<(2.4+k*.42)*.5+.39&&
     Math.abs(z-hz)<(2.1+k*.18)*.5+.39)return false;
 return true;
};
const grid=init(city,40,1.15,original);
const samples=[];
for(let iz=-40;iz<=40;iz++)for(let ix=-40;ix<=40;ix++){
 if((ix*97+iz*31)%5===0)samples.push([ix,iz]);
}
let checks=0;
for(const stage of ['founding','35-homes','equal-count-restore']){
 if(stage==='35-homes')
  for(let i=city.length;i<35;i++)city.push([-33+(i%9)*7.1,-31+Math.floor(i/9)*9.7,i%3]);
 if(stage==='equal-count-restore'){
  // Keep exact house COUNT but change the ACTUAL occupied footprint.
  city[12]=[1.7,-6.8,2];city[17]=[-8.3,10.1,1];
 }
 grid.ensure();
 for(const [ix,iz] of samples){
  const expected=original(ix*1.15,iz*1.15);
  assert.equal(grid.lookup(ix,iz),expected,stage+' first at '+ix+','+iz);
  assert.equal(grid.lookup(ix,iz),expected,stage+' cached at '+ix+','+iz);
  checks++;
 }
}
const audit=grid.audit();
assert.equal(audit.maxEntries,audit.gridWidth**2);
assert(audit.maxEntries<=6000,'bounded 40m navigation occupancy');
assert(audit.misses>0&&audit.hits>0,'exact nodes reused');
assert(audit.invalidations>=3,'city mutation and equal-count restore invalidated');
assert(audit.misses<=checks+100,'no repeated recomputation of identical grid nodes');
assert.equal(audit.authorityChanged,false);
assert.equal(audit.collisionOracle,'original walkable()');
console.log('W190 SOURCE PASS: '+checks+' exact grid/oracle parity probes across founding, 35-home and equal-count restoration, bounded cache. No runtime FPS or artistic PASS.');
