'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const source=path.resolve(__dirname,'../../public/ai-dungeon/perimeter-wall-lantern-plan.js');
const load=()=>import('data:text/javascript;base64,'+Buffer.from(fs.readFileSync(source,'utf8')).toString('base64'));
const courtyard=()=>Array.from({length:19},(_,z)=>Array.from({length:19},(_,x)=>x===0||z===0||x===18||z===18?'#':'.').join(''));
test('perimeter lanterns require true standing wall and traversable inner tile',async()=>{
 const {planPerimeterWallLanterns}=await load();
 const map=courtyard(),before=JSON.stringify(map),sites=planPerimeterWallLanterns(map);
 assert.equal(sites.length,4);assert.equal(new Set(sites.map(s=>s.side)).size,4);
 for(const site of sites){
  assert.equal(map[site.wallZ][site.wallX],'#');
  assert.equal(map[site.approachZ][site.approachX],'.');
  assert.ok(Math.abs(Math.hypot(site.x-(site.wallX-9),site.z-(site.wallZ-9))-.45)<1e-8);
 }
 assert.equal(JSON.stringify(map),before);
});
test('unsupported corner, sealed corridor and live occupied perimeter do not summon standing props',async()=>{
 const {planPerimeterWallLanterns}=await load();
 const solid=Array.from({length:19},()=> '#'.repeat(19));
 assert.equal(planPerimeterWallLanterns(solid).length,0);
 const map=courtyard();map[0]='.'.repeat(19);
 assert.equal(planPerimeterWallLanterns(map).some(s=>s.side==='north'),false);
 const units=[];for(let x=1;x<=17;x++)for(let z=1;z<=17;z++)if(x===1||x===17||z===1||z===17)units.push({hp:1,x,z});
 assert.equal(planPerimeterWallLanterns(courtyard(),units).length,0);
});
test('bounded deterministic physical sites, immutable actors and malformed-input rejection',async()=>{
 const {planPerimeterWallLanterns}=await load();
 const map=courtyard(),actors=Object.freeze([{id:'hero',hp:10,x:5,z:1}]);
 const before=JSON.stringify(actors);
 assert.deepEqual(planPerimeterWallLanterns(map,actors),planPerimeterWallLanterns(map,actors));
 assert.equal(planPerimeterWallLanterns(map,actors,2).length,2);
 assert.equal(JSON.stringify(actors),before);
 assert.deepEqual(planPerimeterWallLanterns(['not-square']),[]);
 assert.deepEqual(planPerimeterWallLanterns(map,[],Infinity),[]);
});
