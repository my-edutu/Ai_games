'use strict';
// W212: the real full-detail citizen has ONE authoritative body. Physical
// GPU skin residency may substitute CPU triangle rebuild for small, passive
// inhabitants; no invented population, parcels, meals or skipped work hands.
const fs=require('node:fs'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('<script>'),end=html.lastIndexOf('</script>');
assert(start>=0&&end>start);new Function(html.slice(start+8,end));
const fStart=html.indexOf('function isForegroundWalkingSkinCandidate(');
const fEnd=html.indexOf('\nfunction realForegroundPoseKey(',fStart);
assert(fStart>0&&fEnd>fStart,'original passive GPU skin gate exists');
const source=html.slice(fStart,fEnd);
assert(source.includes("action==='Resting at home'"),'physically reached original home can retain small body');
assert(source.includes("action==='Waiting for a safe route'"),'stranded real residents stay in the town');
assert(source.includes('verifiedHouseholdMealEvidence(p)'),'original receipt-linked meal contact protected');
assert(html.includes('workSkinDetailedMatrices(entry,p)'),'current true rig still drives the bone palette');
assert(html.includes('if(!foregroundIndices.has(i))villager(people[i]);'),'full CPU geometry fallback stays');
assert(html.includes('for(const person of people)renderCarriedHouseholdProvisions(person);'));
assert(html.includes('for(const person of people)renderVerifiedHomeMeal(person);'));
const make=(opt={})=>new Function('workingSkinCapable','gpuAvailable',
 'isMarketUnloading','isWorkingAtSite','follow','liveWorkday',
 'selectedCitizen','projectRealCitizenDetail','verifiedHouseholdMealEvidence',
 'return ('+source+');')(
 opt.skin!==false,opt.gpu!==false,()=>!!opt.unload,()=>!!opt.working,
 !!opt.follow,!!opt.documentary,opt.selectedIndex??1,
 ()=>({visible:opt.visible!==false,heightFraction:opt.height??.085}),
 ()=>opt.verifiedMeal?{receipt:'real'}:null);
const person={name:'Iris',x:3,z:1,phase:.4,activity:'Resting at home',
 provisions:0,delivery:null};
const yes=(a={},f={})=>assert.equal(make(f)({...person,...a},2,{}),true);
const no=(a={},f={})=>assert.equal(make(f)({...person,...a},2,{}),false);
yes();yes({activity:'Finding a home'});yes({activity:'Waiting for a safe route'});
yes({activity:'Traveling to farm'});yes({activity:'Returning home at dusk'});
yes({}, {visible:false});yes({activity:'Exploring the valley'});
no({provisions:.8});no({}, {verifiedMeal:true});
no({delivery:{id:'Bram:32'}});no({}, {unload:true});no({}, {working:true});
no({}, {height:.16});no({}, {skin:false});no({}, {gpu:false});
no({}, {follow:true,selectedIndex:2});no({}, {documentary:true,selectedIndex:2});
no({activity:'Unloading grain'});no({activity:'Collecting household provisions'});
no({activity:'Forging a hinge'});no({phase:NaN});
no({}, {height:.16,visible:true});
const fn=html.slice(html.indexOf('function getForegroundSkinAudit('),
 html.indexOf('let actorGpuStaging=',html.indexOf('function getForegroundSkinAudit(')));
assert(fn.includes('passiveSkinnedWithoutReceiptMeal:true'));
assert(html.includes('physicallySkinnedPassiveResidents:foregroundResidentVisible'));
console.log('W212 GPU passive body source+predicate: PASS; real 1024px/390px/WebGL/physical FPS independent evidence required.');
