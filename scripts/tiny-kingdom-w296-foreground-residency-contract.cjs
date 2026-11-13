'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const a=html.indexOf('<script>'),b=html.lastIndexOf('</script>');
assert(a>=0&&b>a);new vm.Script(html.slice(a+8,b),{filename:'tiny-kingdom.js'});
const source=(start,end)=>{
 const x=html.indexOf(start),y=html.indexOf(end,x+start.length);
 assert(x>=0&&y>x,'missing authentic production source '+start);return html.slice(x,y);
};
const work=source('const WORKSITE_SKIN_ENTER_SCREEN_HEIGHT=', 'function getWorksiteSkinContinuityAudit(){');
const walk=source('const FOREGROUND_WALKING_SKIN_ENTER_SCREEN_HEIGHT=', 'function isForegroundWalkingSkinCandidate(');
const evalWindow=(code,fn)=>new Function(code+';return '+fn)();
const workWindow=evalWindow(work,'worksiteGpuSkinSizeGate');
const walkingWindow=evalWindow(walk,'physicallySmallWalkingSkinWindow');
assert(workWindow(.23,false,true),'real unselected 23%-high working body should use living GPU 13-joint rig');
assert(workWindow(.27,true,true),'moving view must hold a legitimate 27%-high real worker rig');
assert(!workWindow(.32,false,true),'portrait-sized foreground hero still needs live CPU hands');
assert(!workWindow(.22,false,false),'driver with no skin must preserve original large-worker CPU behavior');
assert(walkingWindow(.255,false),'real mid-shot non-working commuter should use full detailed original GPU rig');
assert(walkingWindow(.31,true),'real previously admitted commuter should not continuously re-upload at close orbit');
assert(!walkingWindow(.37,true),'larger person must still use original live CPU sculpt');
const selection=source('function foregroundResidentBudgetAdmits(', 'function prepareForegroundResidents(');
const accepts=evalWindow(selection,'foregroundResidentBudgetAdmits');
assert(accepts(120000,0,760000));assert(accepts(180000,570000,760000));
assert(!accepts(180000,590000,760000),'exhausted budget rejects ONE row');
assert(!accepts(29,0,760000),'unaligned source data must stay in genuine fallback');
assert(!accepts(0,0,760000));assert(!accepts(NaN,0,760000));
const assembly=source('function prepareForegroundResidents(', 'function drawForegroundResidentMesh(');
assert(/foregroundResidentBudgetAdmits\(entry\.mesh\.length,total,\s*FOREGROUND_RESIDENT_FLOAT_BUDGET\)/.test(assembly),
 'actual 3D resident mesh must use the verified resource bound');
assert(assembly.includes('foregroundResidentBudgetBypasses++')&&
 assembly.includes('resetRestingActorMetrics(beforeActor)')&&assembly.includes('continue;'),
 'one excessive real person falls back to original CPU, not the entire visible town');
const draw=source('const foregroundRows=gpuAvailable?', 'dynamicPhaseTimes.residentActorManagement=');
assert(draw.includes('foregroundResidentVisible.map(row=>row.i)')&&
 draw.includes('isForegroundWorksiteCandidate(')&&
 draw.includes('isForegroundResidentCandidate('),
 'all nonadmitted real people must keep original villager() render path');
const candidate=source('function isForegroundWalkingSkinCandidate(','function realForegroundPoseKey(');
assert(candidate.includes('p.delivery')&&candidate.includes('isMarketUnloading(p)')&&
 candidate.includes('isWorkingAtSite(p)')&&candidate.includes('i===selectedCitizen')&&
 candidate.includes('verifiedHouseholdMealEvidence(p)'),
 'real freight hands, active jobs, followed citizen and verified meal are never faked by commuter skin');
console.log('W296 original full-detail worker GPU-admission screen contract and authentic CPU overflow safety PASS (browser FPS separate)');
