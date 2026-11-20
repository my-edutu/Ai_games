#!/usr/bin/env node
'use strict';
// W492 test-first original-worker rendering contract: no synthetic labor.
// Reject one-off fake worksite characters, missing CPU fallback, or unlimited VBO.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('const SOFTWARE_WORKSITE_GPU_MAX_ACTORS=4;');
const end=html.indexOf('// W69: one reusable WebGL numeric vertex stream',start);
assert(start>=0&&end>start,'W492 production software-worksite renderer exists');
const code=html.slice(start,end);
const game=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .map(row=>row[1]).find(src=>src.includes('function authenticWorkerGpuResidentRows('));
assert(game);new vm.Script(game);
assert.match(html,/authenticWorkerGpuResidentRows\(people,nearPeople,detailPlan\.cameraFrame\)/);
assert.match(html,/getAuthenticSoftwareWorksiteGpuAudit,setActorStreamSplitForTesting/);
assert.match(html,/if\(!foregroundIndices\.has\(i\)\)villager\(people\[i\]\)/);
assert.doesNotMatch(code,/Math\.random|people\.push|people\.splice|state\.(?:food|wood|gold)|gl\.draw|gl\.bufferData/);
const workers=Array.from({length:11},(_,i)=>({name:'real-'+i,
 job:i%2?'farmer':'builder',active:i<9,x:i,z:i,delivery:null}));
const mock={Array,Set,Math,Number,Float32Array,
 WORKSITE_SKIN_ENTER_SCREEN_HEIGHT:.16,FOREGROUND_WALKING_SKIN_ENTER_SCREEN_HEIGHT:.14,
 gpuAvailable:true,swiftGpu:true,workingSkinCapable:true,
 foregroundResidentEnabled:true,selectedCitizen:2,
 residentActorGpuEnabled:()=>false,
 isObservedWorksiteSkinCandidate:(p,i,near)=>Boolean(p&&p.active&&i===2&&near.has(i)),
 isWorkingAtSite:p=>Boolean(p.active),
 isMarketUnloading:()=>false,verifiedHouseholdMealEvidence:()=>false,
 isForegroundWorksiteCandidate:(p,i)=>p.active&&i!==2,
 isForegroundWalkingSkinCandidate:p=>!p.active,
 isResidentRestingCandidate:p=>p.activity==='Resting at home',
 isResidentCommuterCandidate:p=>(p.activity||'').startsWith('Traveling'),
 projectRealCitizenDetail:()=>({visible:true,heightFraction:.05}),
 foregroundResidentVisible:[],foregroundSkinDrawCalls:0,foregroundResidentBuffer:null,
 people:workers,
};
vm.createContext(mock);
vm.runInContext(code+'\nthis.select=authenticWorkerGpuResidentRows;this.audit=getAuthenticSoftwareWorksiteGpuAudit;',mock);
const near=new Set(workers.map((_,i)=>i));
const rows=mock.select(workers,near,{eye:[0,5,5]});
assert.equal(rows.length,9,'genuine nine workers can share bounded GPU character tiers');
assert.deepEqual(Array.from(rows,row=>row.i),[0,1,2,3,4,5,6,7,8],
 'observed original worker receives its slot, stable actor identity retained');
assert(rows.every(row=>workers[row.i]===row.p));
assert.equal(mock.audit().originalCitizenCount,11);
assert.equal(mock.audit().actuallySkinnedWorksites.length,0,
 'admission without actual shader draw cannot be called real worker proof');
const withoutObserved=mock.select(workers,new Set([0,1,3,4,5]),{eye:[0,5,5]});
assert(withoutObserved.every(row=>row.i!==2),'no invented selected worker');
workers[0].delivery={id:'real-cargo'};
const loaded=mock.select(workers,new Set([0,1,2,3,4]),{eye:[0,5,5]});
assert(loaded.every(row=>row.i!==0),'real cargo requires original hand/contact renderer');
mock.gpuAvailable=false;
assert.equal(mock.select(workers,near,{}).length,0,'no GPU means original CPU fallback');
mock.gpuAvailable=true;mock.workingSkinCapable=false;
assert.equal(mock.select(workers,near,{}).length,0,'no 13-joint shader means CPU fallback');
mock.workingSkinCapable=true;mock.swiftGpu=false;
assert.equal(mock.select(workers,near,{}).length,0,'ordinary hardware default remains unchanged');
mock.residentActorGpuEnabled=()=>true;
assert.equal(mock.select(workers,near,{}).length,workers.length,
 'existing hardware GPU candidate pipeline is preserved');
// W496 actual 28-inhabitant virtual camera admission: fixed workers and
// off-duty residents retain original identity, and real parcels exclude GPU.
const mixed=Array.from({length:28},(_,i)=>({
 name:'original-'+i,job:i%2?'farmer':'builder',active:i<9,
 activity:i<9?'Harvesting':i<19?'Resting at home':'Traveling to market',
 x:i,z:i,phase:1,delivery:null
}));
mock.people=mixed;mock.swiftGpu=true;mock.residentActorGpuEnabled=()=>false;
const mixedNear=new Set(mixed.map((_,i)=>i));
const ordinary=mock.select(mixed,mixedNear,{eye:[0,4,6]});
assert.equal(ordinary.length,10,'ten authentic bodies share limited original GPU tiers');
assert(ordinary.some(row=>row.i===2),'observed active farmer still takes priority');
assert(ordinary.some(row=>row.i>=9&&!row.p.active),
 'at least one original home resident shares genuine worker GPU population');
mixed[9].delivery={id:'real-purchased-parcel'};
const carrying=mock.select(mixed,mixedNear,{eye:[0,4,6]});
assert(carrying.every(row=>row.i!==9),'genuine carrying buyer retains CPU contact');
mock.gpuAvailable=false;
assert.equal(mock.select(mixed,mixedNear,{}).length,0,'GPU failure retains CPU fallback');
console.log('W496 original 28-person mixed work-home GPU admission PASS; real hardware and actual filmed visuals separately NOT PROVEN');
