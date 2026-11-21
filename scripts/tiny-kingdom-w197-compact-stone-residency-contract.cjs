'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const source=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const open=source.indexOf('<script>'),close=source.indexOf('</script>',open);
assert(open>=0&&close>open,'must parse real playable game');
new Function(source.slice(open+8,close));
const start=source.indexOf('function compactAtlasStoneCourses(');
const end=source.indexOf('\nfunction compactBurgageFrontage(',start);
assert(start>0&&end>start,'real atlas-backed compact stone-course renderer must exist');
const original=source.slice(source.indexOf('function compactBurgageFrontage('),
  source.indexOf('\nfunction renderLivedBurgageSideMateriality('));
assert(original.includes('compactAtlasStoneCourses(x,z,variant,y,w,d)'),
 'every authentic compact household must use the same atlas-backed stone walls');
assert(!original.includes('for(let tile=0;tile<6;tile++)'),
 'six individually tessellated micro-stones must no longer consume grown-town GPU vertices');
assert(source.includes('function getCompactStoneCoursingAudit()'),
 'real scene budget recovery must be exposed for browser verification');
const blocks=[],data=[],MATERIAL={STONE:5},sampled=[];
const palette={0:[0x7d6b5c,0xa69a88,0x988b7e,0xb4a698],1:[0x7d6b5c,0xa69a88,0x988b7e,0xb4a698],
  2:[0x7d6b5c,0xa69a88,0x988b7e,0xb4a698],3:[0x7d6b5c,0xa69a88,0x988b7e,0xb4a698]};
const renderer=new Function('data','materialScope','MATERIAL','quad','rgb',
 source.slice(start,end)+'\nreturn compactAtlasStoneCourses;')(
 data,(id,emit)=>{assert.equal(id,MATERIAL.STONE);return emit()},MATERIAL,
 (a,b,c,d,col)=>{sampled.push({a,b,c,d,col});data.push(...Array(60).fill(0));},
 hex=>[(hex>>16&255)/255,(hex>>8&255)/255,(hex&255)/255]);
for(const [x,z,variant,y,w,d] of [
 [0,0,0,1.2,2.4,2.1],[9,-7,1,0,2.82,2.28],[-15,12,2,3.1,3.24,2.46]
]){
 data.length=0;sampled.length=0;
 const a=renderer(x,z,variant,y,w,d);
 assert.equal(sampled.length,4,'two true facade faces with two preserved structural courses');
 assert.equal(data.length/30,8,'atlas-backed stone must use only 8 triangles per original home');
 assert.equal(a.triangles,8);
 assert.equal(a.previousTriangles,48);
 assert.equal(a.reclaimedTriangles,40);
 const zs=new Set(sampled.map(q=>q.a[2]));
 assert.equal(zs.size,2,'retain both original front and rear home stone faces');
 for(const q of sampled){
  assert.deepEqual(q.a.length,3);
  for(const p of [q.a,q.b,q.c,q.d])assert(p.every(Number.isFinite));
  const xs=[q.a[0],q.b[0],q.c[0],q.d[0]];
  assert(Math.min(...xs)<=x-w*.499&&Math.max(...xs)>=x+w*.499,
   'keep continuous real cottage base width');
 }
 const rows=sampled.filter(q=>q.a[2]===sampled[0].a[2]).map(q=>Math.min(q.a[1],q.b[1],q.c[1],q.d[1])).sort((a,b)=>a-b);
 assert(Math.abs(rows[0]-(y+.035))<1e-5&&Math.abs(rows[1]-(y+.150))<1e-5,
  'retain both original two-tier courses above genuine terrain');
}
console.log('W197 PASS: source parses; 3 representative original cottage variants keep two real facade courses / outward faces, authored stone texture, 40 genuine static triangles reclaimed per compact inhabited home. Hardware FPS and new gameplay evidence NOT PROVEN.');
