'use strict';
// W121 test-first guard for a retained GPU pose stream of GENUINE working
// compact residents; never move authority, fake jobs, omit actors or freeze
// foreground hands. Run before implementation and with exact-source soak.
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const start=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(start>=0&&end>start,'complete playable inline game');
new Function(html.slice(start+8,end));
const startWorker=html.indexOf('function isResidentWorkingCandidate(');
const endWorker=html.indexOf('\nlet actorGpuStaging=',startWorker);
assert(startWorker>=0&&endWorker>startWorker,'W121 worker GPU module present');
const code=html.slice(startWorker,endWorker);
for(const token of [
 'isWorkingAtSite(p)','nearPeople.has(i)','p.delivery',
 'isMarketUnloading(p)','projectRealCitizenDetail(p,frame)',
 'compactVillager(p)','restingActorDifference(before,after)',
 'applyRestingActorMetrics(entry.delta)','resetRestingActorMetrics(beforeAll)',
 'gl.createBuffer()','gl.bufferSubData(','gl.drawArrays(gl.TRIANGLES',
 'function getWorkingResidentAudit()','function resetWorkingResidents()'
])assert(code.includes(token),'Missing authentic bounded worker path: '+token);
const check=(source,message)=>assert(html.includes(source),message);
check('const workingReady=prepareWorkingResidents(workingRows);','worker staging used in real render');
check('!workingIndices.has(i))compactVillager(people[i]);','fallback renders each original citizen');
check('drawWorkingResidentMesh();','real GPU draw issued in current frame');
check('addSceneGeometryStats(animated,workingResidentMesh);','worker geometry audited with material and bounds');
check('getWorkingResidentAudit,','published exact-render worker telemetry');
check('resetResidentCommuters();resetWorkingResidents();resetForegroundResidents();restingActorKey=', 'reset invalidates every resident actor cache');
check("resetResidentCommuters();resetWorkingResidents();resetForegroundResidents();restingActorVisible=false;",'save restore invalidates retained workers');
check('(workingResidentVisible.length?workingResidentMesh.length:0)','complete frame triangle count');
assert(!code.includes('Math.random('),'render pose cache never generates authority randomness');

const eligibleSrc=html.slice(startWorker,html.indexOf('function realWorkerPoseKey(',startWorker));
const keySrc=html.slice(html.indexOf('function realWorkerPoseKey(',startWorker),
 html.indexOf('function prepareWorkingResidents(',startWorker));
const make=(enabled=true,following=false)=>
 new Function('gpuAvailable','isWorkingAtSite','isMarketUnloading',
  'follow','liveWorkday','selectedCitizen','projectRealCitizenDetail',
  eligibleSrc+'; return isResidentWorkingCandidate;')(
  enabled,p=>!!p.trueWork,p=>!!p.unloading,
  following,false,5,
  p=>({visible:p.visible!==false,heightFraction:p.screenHeight??.025}));
const working={name:'Real farmer',job:'farmer',activity:'Harvesting grain',
 x:18,z:1,phase:.62,workTimer:1.5,energy:72,hunger:18,
 target:[18,1],path:[],delivery:null,trueWork:true,visible:true,screenHeight:.03};
const before=JSON.stringify(working);
assert.equal(make()(working,3,new Set(),{}),true,'actual small working farmer must qualify');
assert.equal(make(false)(working,3,new Set(),{}),false,'Canvas2D preserves original live worker');
assert.equal(make()(working,3,new Set([3]),{}),false,'original detail worker always live');
assert.equal(make()(working,3,new Set(),{}),true,'repeated lens selection deterministic');
assert.equal(make()({...working,screenHeight:.19},3,new Set(),{}),false,
 'foreground harvest hands always live, even when compact');
assert.equal(make()({...working,trueWork:false},3,new Set(),{}),false,
 'no imaginary worker enters retained work group');
assert.equal(make()({...working,delivery:{id:'actual-escrow'}},3,new Set(),{}),false,
 'real loaded courier cargo always live');
assert.equal(make()({...working,unloading:true},3,new Set(),{}),false,
 'original market handoff IK always live');
assert.equal(make(true,true)(working,5,new Set(),{}),false,
 'focused workday citizen cannot have coarse cached hands');
assert.equal(JSON.stringify(working),before,
 'eligibility must never mutate authority');
const clock={t:22};
const makeSignature=skinned=>new Function(
 'state','climateAt','workingSkinCapable','actualForgeHandTarget','workDuration',
 keySrc+';return realWorkerPoseKey;')(
 clock,t=>({season:Math.floor(t/120)}),skinned,()=>null,()=>3);
const signature=makeSignature(true);
const key=signature(working,3);
assert.equal(key,signature(working,3),'same actual source state reuses worker pose');
assert.equal(key,signature({...working,phase:2.12},3),
 'GPU bones follow real gait without regenerating the full actor topology');
assert.equal(key,signature({...working,workTimer:3.7},3),
 'GPU bone transforms follow real workTimer without CPU mesh reconstruction');
const originalFallback=makeSignature(false);
assert.notEqual(originalFallback(working,3),
 originalFallback({...working,phase:2.12},3),
 'CPU fallback still regenerates the original real gait phase');
assert.notEqual(originalFallback(working,3),
 originalFallback({...working,workTimer:3.7},3),
 'CPU fallback still regenerates original real workTimer phases');
assert.notEqual(key,signature({...working,activity:'Constructing cottages'},3),
 'real job activity changes invalidate worker pose');
assert.equal(key,signature({...working,x:18.1},3),
 'worker world position is transformed by GPU without rebuilding all body geometry');
clock.t=240;
assert.notEqual(key,signature(working,3),
 'season changes invalidate original working poses');

console.log('W121 source contract PASS: real work-only bounded GPU meshes, verified fallback, count, restore; browser+hardware evidence separate.');
