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
// Execute the actual W283 screen-space hysteresis helper, not a duplicated threshold.
const screenStart=html.indexOf('const FOREGROUND_WALKING_SKIN_ENTER_SCREEN_HEIGHT=');
assert(screenStart>=0&&screenStart<fStart,'real moving-resident LOD contract exists');
const screenSource=html.slice(screenStart,fStart);
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
 'foregroundResidentCache',
 screenSource+'\nreturn ('+source+');')(
 opt.skin!==false,opt.gpu!==false,()=>!!opt.unload,()=>!!opt.working,
 !!opt.follow,!!opt.documentary,opt.selectedIndex??1,
 ()=>({visible:opt.visible!==false,heightFraction:opt.height??.085}),
 ()=>opt.verifiedMeal?{receipt:'real'}:null,
 new Map(opt.cached?[[2,{skinned:true,key:'2:Iris:gatherer:motion'}]]:[]));
const person={name:'Iris',job:'gatherer',x:3,z:1,phase:.4,activity:'Resting at home',
 provisions:0,delivery:null};
const yes=(a={},f={})=>assert.equal(make(f)({...person,...a},2,{}),true);
const no=(a={},f={})=>assert.equal(make(f)({...person,...a},2,{}),false);
yes();yes({activity:'Finding a home'});yes({activity:'Waiting for a safe route'});
yes({activity:'Traveling to farm'});yes({activity:'Returning home at dusk'});
yes({}, {visible:false});yes({activity:'Exploring the valley'});
// A real citizen may possess food while resting without physically eating.
 // The original meal's receipt-linked hand motion still blocks GPU skin.
 yes({provisions:.8});yes({provisions:2.4});
 no({}, {verifiedMeal:true});no({provisions:.8},{verifiedMeal:true});
 no({activity:'Traveling home with provisions',provisions:.8});
no({delivery:{id:'Bram:32'}});no({}, {unload:true});no({}, {working:true});
// W296's actual 27%-enter/32.5%-hold ORIGINAL commuter full-body
// GPU joint rig now covers readable mid-shots. A selected worker, receipt,
// real tool contact or earned household meal still uses live CPU hands.
yes({}, {height:.16});yes({}, {height:.21});
yes({}, {height:.269});no({}, {height:.270});
yes({}, {height:.30,cached:true});
yes({}, {height:.324,cached:true});
no({}, {height:.325,cached:true});
no({}, {skin:false});no({}, {gpu:false});
no({}, {follow:true,selectedIndex:2});no({}, {documentary:true,selectedIndex:2});
no({activity:'Unloading grain'});no({activity:'Collecting household provisions'});
no({activity:'Forging a hinge'});no({phase:NaN});
no({}, {height:.33,visible:true});
const fn=html.slice(html.indexOf('function getForegroundSkinAudit('),
 html.indexOf('let actorGpuStaging=',html.indexOf('function getForegroundSkinAudit(')));
assert(fn.includes('passiveSkinnedWithoutReceiptMeal:true'));
assert(html.includes('ranked.sort((a,b)=>b.priority-a.priority'),
 'full-detail GPU slots favor real eligible workers, not citizen list order');
assert(html.includes('if(!foregroundIndices.has(i))villager(people[i]);'),
 'unselected residents continue using the untouched live original mesh');
assert(html.includes('physicallySkinnedPassiveResidents:foregroundResidentVisible'));
// W273: actual day/night topology change on the SAME real citizen must
// invalidate GPU-cached mesh, without refreshing an unrelated resting body.
const keyStart=html.indexOf('function realForegroundPoseKey(');
const keyEnd=html.indexOf('function realForegroundPoseStale(',keyStart);
assert(keyStart>=0&&keyEnd>keyStart,'actual full-detail GPU key exists');
const clock={t:12};
const helperStart=html.indexOf('function originalWorkToolTopologyKey(');
const helperEnd=html.indexOf('function realWorkerPoseKey(',helperStart);
assert(helperStart>0&&helperEnd>helperStart,
 'Read the exact production earned-tool topology predicate');
const keyFunction=new Function('state','workingSkinCapable',
 'isWorkingAtSite','getAuthenticWorkGesture','workdayEvents',
 'citizenRigPose','climateAt','carryingCommuterLantern',
 html.slice(helperStart,helperEnd)+html.slice(keyStart,keyEnd)+
 ';return realForegroundPoseKey;')(
 clock,true,()=>false,()=>({stage:'off'}),[],
 ()=>({acting:{action:'rest'}}),
 ()=>({season:'SPRING'}),p=>clock.t>=16&&p.activity==='Returning home at dusk');
const originalWalker={name:'Iris',job:'gatherer',activity:'Returning home at dusk',
 trait:'patient',friend:0,target:[2,9],phase:.35,workTimer:0,
 energy:85,hunger:20};
const beforeDusk=keyFunction(originalWalker,0,true);
clock.t=17;
assert.notEqual(keyFunction(originalWalker,0,true),beforeDusk,
 'same original GPU commuter must gain their real physical dusk lantern');
const resting={...originalWalker,activity:'Resting at home'};
const restAfter=keyFunction(resting,0,true);clock.t=12;
assert.equal(keyFunction(resting,0,true),restAfter,
 'non-carrying sleeping resident must retain stable GPU binding');
const lanternStart=html.indexOf('function renderCommuterLantern(');
const lanternEnd=html.indexOf('function ',lanternStart+12);
assert(lanternStart>0&&lanternEnd>lanternStart);
assert(html.slice(lanternStart,lanternEnd).includes('tagWorkSkinRange(5,first)'),
 'genuine 3D lantern cannot float away from original forearm during GPU motion');
const compactStart=html.indexOf('function realWorkerPoseKey(');
const compactEnd=html.indexOf('function ',compactStart+12);
assert(html.slice(compactStart,compactEnd).includes('carryingCommuterLantern(p)'),
 'compact original GPU topology also invalidates at actual night shift');
console.log('W212 GPU passive body source+predicate: PASS; real 1024px/390px/WebGL/physical FPS independent evidence required.');
