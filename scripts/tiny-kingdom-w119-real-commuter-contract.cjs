'use strict';
// W119 test-first source contract: original compact commuters, not synthetic agents.
// This is a safety floor; WebGL, FPS and experience must be assessed separately.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const a=html.indexOf('<script>'),b=html.lastIndexOf('</script>');
assert(a>=0&&b>a,'real runnable Tiny Kingdom HTML source');
new Function(html.slice(a+8,b));
const between=(from,to)=>{
 const i=html.indexOf(from),j=html.indexOf(to,i+from.length);
 assert(i>=0&&j>i,'missing real commuter rendering contract: '+from);
 return html.slice(i,j);
};
const source=between('function isResidentCommuterCandidate(', 'function realCommuterFacing(');
const facingSrc=between('function realCommuterFacing(','function commuterPoseStale(');
const staleSrc=between('function commuterPoseStale(','function prepareResidentCommuters(');
const eligible=new Function('gpuAvailable','isWorkingAtSite','isMarketUnloading',
 'projectRealCitizenDetail',source+';return isResidentCommuterCandidate;')(
 true,p=>!!p.atWork,p=>!!p.unloading,p=>({visible:p.visible===true,heightFraction:p.heightFraction??.02}));
const facing=new Function(facingSrc+';return realCommuterFacing;')();
const stale=new Function(staleSrc+';return commuterPoseStale;')();
const p={name:'Original resident',job:'farmer',activity:'Traveling to work',
 x:0,z:0,phase:.4,energy:75,hunger:10,
 target:[0,8],path:[[0,8]],delivery:null};
const frame={};
const near=new Set();
assert.equal(eligible(p,3,near,frame),true,'small authentic original commuter qualifies');
assert.equal(eligible({...p,delivery:{id:1}},3,near,frame),false,'loaded real courier stays fully live');
assert.equal(eligible({...p,atWork:true},3,near,frame),false,'working actor has real detailed hand contacts');
assert.equal(eligible({...p,unloading:true},3,near,frame),false,'real unloading actor remains live');
assert.equal(eligible({...p,visible:true,heightFraction:.23},3,near,frame),false,'visible large worker stays live');
assert.equal(eligible(p,3,new Set([3]),frame),false,'selected face/IK citizen remains full detail');
assert.equal(eligible({...p,activity:'Resting at home'},3,near,frame),false,'resting actors remain in W118 residency');
assert.equal(eligible({...p,activity:'Unknown job'},3,near,frame),false,'other activities do not enter cache');
const f=facing(p);
assert(Math.abs(f)<1e-8,'original northward target heading preserved');
const cached={name:p.name,job:p.job,activity:p.activity,
 x:0,z:0,phase:.4,angle:f,energy:75,hunger:10,mesh:new Float32Array(30)};
assert.equal(stale(cached,{...p,x:.19,phase:.7},f),false,'tiny physical travel reuses retained pose');
assert.equal(stale(cached,{...p,x:.85},f),true,'measurable travel triggers new authoritative gait pose');
assert.equal(stale(cached,{...p,phase:1.5},f),true,'authentic foot phase must refresh');
assert.equal(stale(cached,{...p,job:'builder'},f),true,'real profession must invalidate');
assert.equal(stale(cached,{...p,activity:'Returning home at dusk'},f),true,'real activity must invalidate');
assert.equal(stale(cached,p,f+.55),true,'real route turn must refresh');
for(const token of ['drawResidentCommuters();','getResidentCommuterAudit',
 'commuterResidentMesh.length','commuterResidentVisible.length',
 'commuterEnabled'])assert(html.includes(token),'missing complete GPU draw/audit guard '+token);
console.log('W119 moving compact citizen source contract PASS; real WebGL + hardware FPS NOT MEASURED');
