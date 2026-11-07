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
check('resetWorkingResidents();restingActorKey=', 'reset invalidates old retained workers');
check("resetResidentCommuters();resetWorkingResidents();restingActorVisible=false;",'save restore invalidates retained workers');
check('(workingResidentVisible.length?workingResidentMesh.length:0)','complete frame triangle count');
assert(!code.includes('Math.random('),'render pose cache never generates authority randomness');
console.log('W121 source contract PASS: real work-only bounded GPU meshes, verified fallback, count, restore; browser+hardware evidence separate.');
