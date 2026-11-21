'use strict';
// W510: the original farmer's loaded cart must actually reach the bounded
// 13-joint GPU body path on software WebGL, without a duplicate compact body.
// The selected courier and original escrow/cargo are never synthesised here.
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const i=html.indexOf('<script>'),j=html.lastIndexOf('</script>');
assert(i>=0&&j>i);new Function(html.slice(i+8,j));
function extract(name){
 const start=html.indexOf('function '+name+'(');
 assert(start>=0,'missing actual game '+name);
 const open=html.indexOf('{',start);let at=open,depth=0;
 do{if(html[at]==='{')depth++;else if(html[at]==='}')depth--;at++}
 while(depth&&at<html.length);
 assert.equal(depth,0,'unterminated original '+name);
 return html.slice(start,at);
}
const gate=extract('isOriginalGpuCourierBodyCandidate');
const compact=extract('isCompactGpuCourierBodyCandidate');
const selector=extract('authenticWorkerGpuResidentRows');
assert(selector.includes('const courier=isOriginalGpuCourierBodyCandidate('),
 'software selector must admit genuine loaded couriers, not exclude p.delivery');
assert(html.includes('else if(foregroundIndices.has(i))actualActorBodyPaths[i]=6;'),
 'outside-near GPU body must replace rather than duplicate compact CPU body');
assert(html.includes('renderOriginalLiveCourierCart(p,Boolean(compact));'),
 'admitted original courier always draws independent live original cart');
const loaded={name:'Alina',job:'farmer',x:10,z:4,phase:.4,
 activity:'Traveling to market',delivery:{id:'Alina:480',escrowed:true,stage:'travel',
 amount:3.752,resource:'food'}};
const env={
 workingSkinCapable:true,gpuAvailable:true,foregroundResidentEnabled:true,
 swiftGpu:true,follow:true,liveWorkday:true,selectedCitizen:0,
 document:{body:{dataset:{citizenInspect:'off'}}},
 people:Array.from({length:12},(_,i)=>i?{name:'Other'+i}:loaded),
 foregroundResidentCache:new Map(),workingResidentCache:new Map(),
 SOFTWARE_WORKSITE_GPU_MAX_ACTORS:4,
 residentActorGpuEnabled:()=>false,verifiedHouseholdMealEvidence:()=>null,
 isLoadedCourierOnRoad:p=>Boolean(p?.delivery?.escrowed&&p.delivery.stage==='travel'),
 isMarketUnloading:p=>p?.delivery?.stage==='unloading',
 isWorkingAtSite:()=>false,isForegroundWalkingSkinCandidate:()=>false,
 isResidentRestingCandidate:()=>false,isResidentCommuterCandidate:()=>false,
 isResidentWorkingCandidate:()=>false,isObservedWorksiteSkinCandidate:()=>false,
 isForegroundWorksiteCandidate:()=>false,
 projectRealCitizenDetail:()=>({visible:true,heightFraction:.12}),
 originalCommuterScreenLimit:()=>.35,
 FOREGROUND_WALKING_SKIN_ENTER_SCREEN_HEIGHT:.39,
 WORKSITE_SKIN_ENTER_SCREEN_HEIGHT:.245,
 ORIGINAL_COURIER_GPU_ENTER_HEIGHT:.22,ORIGINAL_COURIER_GPU_HOLD_HEIGHT:.27,
 COMPACT_COURIER_GPU_ENTER_HEIGHT:.16,COMPACT_COURIER_GPU_HOLD_HEIGHT:.20
};
const instantiate=e=>new Function('e',`
 const {workingSkinCapable,gpuAvailable,foregroundResidentEnabled,swiftGpu,
 follow,liveWorkday,selectedCitizen,document,people,foregroundResidentCache,
 workingResidentCache,
 SOFTWARE_WORKSITE_GPU_MAX_ACTORS,residentActorGpuEnabled,
 verifiedHouseholdMealEvidence,isLoadedCourierOnRoad,isMarketUnloading,
 isWorkingAtSite,isForegroundWalkingSkinCandidate,isResidentRestingCandidate,
 isResidentCommuterCandidate,isResidentWorkingCandidate,
 isObservedWorksiteSkinCandidate,isForegroundWorksiteCandidate,
 projectRealCitizenDetail,originalCommuterScreenLimit,
 FOREGROUND_WALKING_SKIN_ENTER_SCREEN_HEIGHT,WORKSITE_SKIN_ENTER_SCREEN_HEIGHT,
 ORIGINAL_COURIER_GPU_ENTER_HEIGHT,ORIGINAL_COURIER_GPU_HOLD_HEIGHT,
 COMPACT_COURIER_GPU_ENTER_HEIGHT,COMPACT_COURIER_GPU_HOLD_HEIGHT}=e;
 let softwareWorksiteSelectionFrames=0,softwareWorksiteSelectedRows=0;
 ${gate}\n${compact}\n${selector}\n
 return {admit:isOriginalGpuCourierBodyCandidate,select:authenticWorkerGpuResidentRows};
`)(e);
const scene={};
let {admit,select}=instantiate(env);
assert(admit(loaded,0,new Set(),scene),
 'genuine visible founding courier can use GPU full body even when not in near set');
assert.deepEqual(select([loaded],new Set(),scene).map(row=>row.p.name),['Alina'],
 'software admission must actually select true delivery, not only compile');
assert.deepEqual(select([loaded],new Set([0]),scene).map(row=>row.p.name),['Alina']);
assert(!admit({...loaded,delivery:{...loaded.delivery,escrowed:false}},0,new Set(),scene));
assert(!admit({...loaded,delivery:{...loaded.delivery,stage:'unloading'}},0,new Set(),scene));
assert.deepEqual(select([{...loaded,delivery:{...loaded.delivery,stage:'unloading'}}],
 new Set(),scene),[],'physical unloading is original CPU hand-contact');
assert(!instantiate({...env,document:{body:{dataset:{citizenInspect:'on'}}}})
 .admit(loaded,0,new Set(),scene),'human inspection retains original live CPU hands');
assert(!instantiate({...env,projectRealCitizenDetail:()=>({visible:true,heightFraction:.30})})
 .admit(loaded,0,new Set(),scene),'large close-up freight stays full CPU contact');
assert(!instantiate({...env,projectRealCitizenDetail:()=>({visible:false,heightFraction:.10})})
 .admit(loaded,0,new Set(),scene),'offscreen freight is not GPU-claimed');
const grown={...env,people:Array.from({length:28},(_,i)=>i?{name:'Other'+i}:loaded)};
assert(!instantiate(grown).admit(loaded,0,new Set(),scene),
 'Day-121 unselected courier keeps existing compact route to protect 160k budget');
assert(instantiate(grown).admit(loaded,0,new Set([0]),scene),
 'existing near-person grown-city courier remains eligible');
assert(!instantiate({...env,gpuAvailable:false}).admit(loaded,0,new Set([0]),scene),
 'no GPU falls back to complete CPU actor/cart');
console.log('W510 original courier software-GPU admission tests PASS; real browser/Day121/physical FPS separately gated.');
