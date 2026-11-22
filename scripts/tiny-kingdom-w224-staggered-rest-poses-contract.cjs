'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(start>=0&&end>start);new Function(html.slice(start+8,end));
const needle='function restingActorPoseBucket(worldHour,citizenIndex){';
const a=html.indexOf(needle),b=html.indexOf('\n}',a);
assert(a>=0&&b>a,'real original render path');
assert(html.includes('const RESTING_ACTOR_POSE_LANES=16;'),'original game owns a 16-lane actor budget');
const bucket=new Function('const RESTING_ACTOR_POSE_LANES=16; return ('+html.slice(a,b+2)+')')();
const indices=Array.from({length:48},(_,i)=>i);
let previous=indices.map(i=>bucket(0,i)),changedTotal=0,maximum=0;
for(let j=1;j<=32;j++){
 const next=indices.map(i=>bucket(j/64,i));
 const dirty=next.filter((n,i)=>n!==previous[i]).length;
 changedTotal+=dirty;maximum=Math.max(maximum,dirty);previous=next;
}
assert.equal(changedTotal,48,'all original citizens refresh');
assert(maximum<=3,'48 people refresh in 16 independent lanes; no group spike');
for(const i of indices){assert.equal(bucket(.5,i)-bucket(0,i),1);
 assert.equal(bucket(120*24+.5,i)-bucket(120*24,i),1);}
for(const [v,i] of [[NaN,0],[1,-1],[1,1.5]])assert.throws(()=>bucket(v,i),/invalid/);
const section=html.slice(html.indexOf('function residentRestingKey(entries){'),html.indexOf('function restingActorCounters(){'));
assert(section.includes('restingActorPoseBucket(state.t,i)'));
assert(!section.includes('Math.floor(state.t*2),entries'));
for(const term of ['restingActorLastDirtyActors=dirtyActors',
 'lastUploadedBytes:restingActorLastUploadBytes','retainedPackedCpuBytes:',
 'retainedIndividualCpuBytes:','allocatedGpuStorageBytes:',
 'restingActorMesh.set(row.entry.mesh,row.offset)','restingActorCache=next'])
 assert(html.includes(term),'source guard: '+term);
console.log('W224 exact original 3D resident independent cadence, 120-day clock and bounded CPU/GPU VBO accounting PASS. No experience/FPS claims.');
