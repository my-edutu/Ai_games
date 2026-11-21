'use strict';
// W511 Phase 1: genuinely delivered market freight in a grown Day-121 world
// uses the original SMALL 13-joint compact body, but its SAME cart, wheels
// and escrow remain live on the dynamic stream, never duplicated in a pose VBO.
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const begin=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(begin>=0&&end>begin);new Function(html.slice(begin+8,end));
function extract(name){
 const i=html.indexOf('function '+name+'(');
 assert(i>=0,'missing genuine renderer '+name);
 const open=html.indexOf('{',i);let depth=0,j=open;
 for(;j<html.length;j++){if(html[j]==='{')depth++;else if(html[j]==='}'&&!--depth){j++;break}}
 assert.equal(depth,0);return html.slice(i,j);
}
const compact=extract('isCompactGpuCourierBodyCandidate');
const full=extract('isOriginalGpuCourierBodyCandidate');
const select=extract('authenticWorkerGpuResidentRows');
assert(html.includes('function compactVillager(p,omitLiveCart=false)'));
assert(html.includes('if(!omitLiveCart)emitStreetCargo(p,x,y,z,s);'));
assert(html.includes('compactVillager(p,courierSkin);'),
 'retained compact worker must contain NO baked animated cart');
assert(html.includes('renderOriginalLiveCourierCart(p,Boolean(compact));'),
 'compact GPU courier keeps genuine wheel-distance and physical cargo LIVE');
assert(html.includes('isCompactGpuCourierBodyCandidate(p,i,nearPeople,commuterFrame)'),
 'compact tier must admit actual distant Day-121 road courier');
assert(html.includes('if(workingIndices.has(i)){actualActorBodyPaths[i]=5;}'),
 'detail-reserved compact actor must replace rather than duplicate the original body');
assert(html.includes('else if(workingIndices.has(i))actualActorBodyPaths[i]=5;'),
 'GPU compact body must replace not duplicate its CPU original');
const actual={name:'Alina',job:'farmer',x:7,z:5,phase:.5,
 activity:'Traveling to market',
 delivery:{id:'Alina:480',resource:'food',amount:3.752,stage:'travel',escrowed:true}};
const make=opt=>{
 const e={
  workingSkinCapable:true,gpuAvailable:true,swiftGpu:true,
  foregroundResidentEnabled:true,follow:false,liveWorkday:false,
  selectedCitizen:0,document:{body:{dataset:{citizenInspect:'off'}}},
  people:Array.from({length:28},(_,i)=>i?{name:'Other'+i}:actual),
  foregroundResidentCache:new Map(),workingResidentCache:new Map(),
  SOFTWARE_WORKSITE_GPU_MAX_ACTORS:10,foregroundResidentVisible:[],
  residentActorGpuEnabled:()=>false,verifiedHouseholdMealEvidence:()=>null,
  isLoadedCourierOnRoad:p=>Boolean(p?.delivery?.escrowed&&p.delivery.stage==='travel'),
  isMarketUnloading:p=>p?.delivery?.stage==='unloading',isWorkingAtSite:()=>false,
  isForegroundWalkingSkinCandidate:()=>false,isResidentRestingCandidate:()=>false,
  isResidentCommuterCandidate:()=>false,isResidentWorkingCandidate:()=>false,
  isObservedWorksiteSkinCandidate:()=>false,isForegroundWorksiteCandidate:()=>false,
  projectRealCitizenDetail:()=>({visible:true,heightFraction:.12}),
  originalCommuterScreenLimit:()=>.35,
  FOREGROUND_WALKING_SKIN_ENTER_SCREEN_HEIGHT:.39,
  WORKSITE_SKIN_ENTER_SCREEN_HEIGHT:.245,
  ORIGINAL_COURIER_GPU_ENTER_HEIGHT:.22,ORIGINAL_COURIER_GPU_HOLD_HEIGHT:.27,
  COMPACT_COURIER_GPU_ENTER_HEIGHT:.16,COMPACT_COURIER_GPU_HOLD_HEIGHT:.20,
  ...opt
 };
 return new Function('e',`
 const {workingSkinCapable,gpuAvailable,swiftGpu,foregroundResidentEnabled,
 follow,liveWorkday,selectedCitizen,document,people,foregroundResidentCache,
 workingResidentCache,SOFTWARE_WORKSITE_GPU_MAX_ACTORS,residentActorGpuEnabled,
 verifiedHouseholdMealEvidence,isLoadedCourierOnRoad,isMarketUnloading,
 isWorkingAtSite,isForegroundWalkingSkinCandidate,isResidentRestingCandidate,
 isResidentCommuterCandidate,isResidentWorkingCandidate,
 isObservedWorksiteSkinCandidate,isForegroundWorksiteCandidate,
 projectRealCitizenDetail,originalCommuterScreenLimit,
 FOREGROUND_WALKING_SKIN_ENTER_SCREEN_HEIGHT,WORKSITE_SKIN_ENTER_SCREEN_HEIGHT,
 ORIGINAL_COURIER_GPU_ENTER_HEIGHT,ORIGINAL_COURIER_GPU_HOLD_HEIGHT,
 COMPACT_COURIER_GPU_ENTER_HEIGHT,COMPACT_COURIER_GPU_HOLD_HEIGHT}=e;
 let softwareWorksiteSelectionFrames=0,softwareWorksiteSelectedRows=0;
 ${full}\n${compact}\n${select}
 return {compact:isCompactGpuCourierBodyCandidate,
  select:authenticWorkerGpuResidentRows};
 `)(e);
};
const real=make(),scene={};
assert(real.compact(actual,0,new Set(),scene),
 'real grown-town freight body enters bounded compact rig');
assert.deepEqual(real.select([actual],new Set(),scene).map(row=>row.p.name),['Alina']);
assert(real.compact(actual,0,new Set([0]),scene),
 'small projected but detail-reserved freight must still reach compact GPU rig');
assert(!make({projectRealCitizenDetail:()=>({visible:true,heightFraction:.31})})
 .compact(actual,0,new Set(),scene),'close-up hand and shafts remain CPU');
assert(!make({projectRealCitizenDetail:()=>({visible:false,heightFraction:.12})})
 .compact(actual,0,new Set(),scene),'no offscreen GPU success');
assert(!make({document:{body:{dataset:{citizenInspect:'on'}}}})
 .compact(actual,0,new Set(),scene),'manual human contact remains CPU');
for(const delivery of [null,{...actual.delivery,escrowed:false},
 {...actual.delivery,stage:'unloading'}]){
 assert(!real.compact({...actual,delivery},0,new Set(),scene),
  'only authentic on-road escrow deliveries use compact skinned route');
}
assert(!make({gpuAvailable:false}).compact(actual,0,new Set(),scene),
 'WebGL allocation absence retains complete original CPU actor+cart');
console.log('W511 compact true-courier GPU and live-cart routing contract PASS; physical GPU FPS and gameplay evidence separately gated.');
