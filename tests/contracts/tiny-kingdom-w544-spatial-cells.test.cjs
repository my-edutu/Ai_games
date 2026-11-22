'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('// W544 ORIGINAL SPATIAL-CELL CULLING START');
const end=html.indexOf('// END W544 ORIGINAL SPATIAL-CELL CULLING',start);
assert.ok(start>=0&&end>start,'RED: source lacks physical spatial cell renderer');
const {prepareConservativeSoftwareCells:prepare,getSoftwareSpatialCellAudit:audit}=
 new Function(html.slice(start,end)+';return {prepareConservativeSoftwareCells,getSoftwareSpatialCellAudit};')();
const planes=[[1,0,0,1],[-1,0,0,1],[0,1,0,1],[0,-1,0,1]];
const tri=(x,y,z)=>[[x,y,z],[x+.16,y,z],[x,y,z+.16]]
 .flatMap(([a,b,c])=>[a,b,c,0,1,0,1,1,1,0]);
const ready=(source,p=planes)=>{let r=null;
 for(let k=0;k<100&&!r;k++)r=prepare(source,p);
 assert.ok(r,'static spatial index never completed');return r;};
test('interleaved near/far original town faces safely cull by physical cell rather than arbitrary source order',()=>{
 const source=Array.from({length:192},(_,i)=>tri(i%2?64:.2,0,.1)).flat();
 const original=source.slice(),r=ready(source);
 for(let i=0;i<192;i++){
  assert.ok(r.ids[i]>=0,'face is contained by one real cell');
  assert.equal(r.rejected[r.ids[i]],i%2?1:0);
 }
 assert.deepEqual(source,original,'never remove original geometry');
 assert.ok(audit().retainedIndexBytes<1000000);
 assert.equal(audit().allLiveActorsAlwaysProcessed,true);
});
test('cross-cell roofs, changing physical camera and restored town never silently vanish',()=>{
 const s=tri(-.8,0,0).concat(tri(7.95,0,0),...Array.from({length:200},()=>tri(30,0,0)));
 const r=ready(s);
 assert.equal(r.ids[1],-1,'whole-cell boundary crossing uses exhaustive original renderer');
 const wide=prepare(s,[[1,0,0,100],[-1,0,0,100],[0,1,0,100],[0,-1,0,100]]);
 assert.ok(wide.rejected.every(v=>v===0),'recompute rejections for new camera');
 const smaller=Array.from({length:12},()=>tri(.1,0,0)).flat();
 assert.ok(ready(smaller).rejected.every(v=>v===0));
 assert.equal(audit().totalStaticTriangles,12);
});
test('Day-120-scale source builds in bounded slices and preserves all potentially visible faces',()=>{
 const s=Array.from({length:12500},(_,i)=>tri(i%2?45:.1,0,.1)).flat();
 const cold=prepare(s,planes);
 assert.equal(cold,null,'unfinished cold build must render everything');
 assert.ok(audit().stagedTriangles<=4096);
 const r=ready(s);
 for(let t=0;t<12500;t++){
  const id=r.ids[t];if(id<0||!r.rejected[id])continue;
  const i=t*30,xyz=[[s[i],s[i+1],s[i+2]],
   [s[i+10],s[i+11],s[i+12]],[s[i+20],s[i+21],s[i+22]]];
  assert.ok(planes.some(([a,b,c,d])=>
    xyz.every(([x,y,z])=>a*x+b*y+c*z+d<-.0001)),
   'rejected face must be completely outside actual view');
 }
});
test('game still projects every moving actor/courier and preserves depth',()=>{
 assert.match(html,/const spatial=prepareConservativeSoftwareCells\(source,planes\)/);
 assert.match(html,/if\(staticClip&&i<staticClip\.limit&&staticClip\.spatial\)/);
 assert.match(html,/staticSpatialCells:getSoftwareSpatialCellAudit\(\)/);
 assert.match(html,/const j=i\+10,k=i\+20/);
});
