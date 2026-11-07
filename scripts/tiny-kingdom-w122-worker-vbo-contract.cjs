'use strict';
// W122 safe rendering contract: original workers, no fake actors or stock.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const beg=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(beg>=0&&end>beg,'full playable game exists');
new Function(html.slice(beg+8,end));
const between=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i+a.length);
 assert(i>=0&&j>i,'missing source '+a);return html.slice(i,j);};
const moduleSrc=between('const WORKER_ROOT_CONTACT_METERS=','function prepareWorkingResidents(');
const module=new Function('state','climateAt','occupationalPerformance',
 moduleSrc+';return {realWorkerPoseKey,realWorkerPoseStale,realWorkerFacing};')(
 {t:40},t=>({season:Math.floor(t/120)}),
 p=>({focus:[p.x+.62,p.z+.34]}));
const p={name:'Original farmer',job:'farmer',activity:'Harvesting grain',
 x:18,z:1,phase:.6,workTimer:1.2,energy:74,hunger:18,target:[18,1],path:[]};
const before=JSON.stringify(p),key=module.realWorkerPoseKey(p,3),angle=module.realWorkerFacing(p);
const e={key,x:p.x,z:p.z,angle};
assert(!module.realWorkerPoseStale(e,p,key,angle),'same authentic IK pose reuses buffer');
assert.equal(key,module.realWorkerPoseKey({...p,x:18.07,z:1.05},3),
 'small movement is shader root motion');
assert(!module.realWorkerPoseStale(e,{...p,x:18.07,z:1.05},key,angle),
 'conservative sub-contact displacement reuses original pose');
assert(module.realWorkerPoseStale(e,{...p,x:18.38},key,angle),
 'actual worker must rebuild after large worksite displacement');
assert(module.realWorkerPoseStale(e,p,key,angle+.2),
 'actual turn past contact limit rebuilds');
assert.notEqual(key,module.realWorkerPoseKey({...p,workTimer:2.8},3),
 'real occupational action phase rebuilds');
assert.equal(before,JSON.stringify(p),'read-only original authority');
const prepare=between('function prepareWorkingResidents(','function drawWorkingResidentMesh(');
const draw=between('function drawWorkingResidentMesh(','function getWorkingResidentAudit(');
for(const t of ['row.offset=offset/10','const layoutKey=selected.map',
 'if(!row.fresh)continue','gl.bufferSubData(gl.ARRAY_BUFFER,row.offset*40,row.entry.mesh)',
 'workingResidentMesh.set(row.entry.mesh,row.offset*10)','workingResidentPartialUploads++',
 'workingResidentFullUploads++','workingResidentVisible=[]','workingResidentFallbacks++'])
 assert(prepare.includes(t),'missing bounded original-worker dirty range '+t);
for(const t of ['gl.drawArrays(gl.TRIANGLES,0,workingResidentMesh.length/10)',
 'gl.uniform1f(uniforms.commuterEnabled,1)','gl.uniform3f(uniforms.commuterOrigin',
 'gl.uniform4f(uniforms.commuterMotion','gl.drawArrays(gl.TRIANGLES,offset,count)',
 'finally{gl.uniform1f(uniforms.commuterEnabled,0)}'])
 assert(draw.includes(t),'actual per-worker WebGL draw missing '+t);
for(const t of ['drawWorkingResidentMesh();','!workingIndices.has(i))compactVillager(people[i]);',
 'addSceneGeometryStats(animated,workingResidentMesh);','getWorkingResidentAudit,',
 'WORKING_RESIDENT_FLOAT_BUDGET=900000'])
 assert(html.includes(t),'no workers/triangles omitted '+t);
console.log('W122 safe real worker pose stream source contract PASS; actual WebGL and hardware FPS are separate.');
