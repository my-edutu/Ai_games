'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const src=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new Function(src);
const tokens=[
 'function shouldCollectHouseholdProvisions(p)',
 'function finishHouseholdProvisions(p)',
 'function householdProvisionAudit()',
 'function renderCarriedHouseholdProvisions(p)',
 'p.provisions=(p.provisions||0)+HOUSEHOLD_GRAIN_UNITS',
 'state.food-=HOUSEHOLD_GRAIN_UNITS',
 "p.activity='Traveling home with provisions'",
 // A real issued receipt reserves food before community consumption.
 'state.food=Math.max(receiptReservedFood(),state.food-communityConsumption)',
 'renderCarriedHouseholdProvisions(person);',
 'getHouseholdProvisionAudit:()=>cloneData(householdProvisionAudit())',
 'flow.provisions.homesSupplied','p.lastProvisionAttemptDay===day',
 'p.provisionVisits!==undefined','p.provisions!==undefined'
];
for(const token of tokens)assert(src.includes(token),'W126 genuine society source missing '+token);
const model=src.slice(src.indexOf('function shouldCollectHouseholdProvisions(p)'),
 src.indexOf('function dailyRhythmAudit()'));
assert(!model.includes('Math.random('),'Uncontrolled social RNG in new authoritative model');
assert(!model.includes('state.food+='),'No grain may be created during collection');
// Real execution of the exact game policy and pickup body (isolated domain).
// A screenshot, page load, or symbol assertion cannot prove stock conservation.
const grain=src.slice(src.indexOf('const HOUSEHOLD_GRAIN_UNITS='),
 src.indexOf('function dailyRhythmAudit()'));
const residents=[{name:'Eden',job:'merchant',x:-1,z:10.2,target:[-1,10.2],
 activity:'Collecting household provisions',workTimer:1,provisions:0,
 provisionVisits:0,lastProvisionAttemptDay:-1,energy:90,hunger:10,path:[]}];
for(let i=1;i<12;i++)residents.push({name:'Villager '+i,job:'farmer',
 x:0,z:0,provisions:0,energy:90,hunger:8,path:[]});
const town={t:11,food:100,lastStory:10},routes=[],fallback=[];
const handoffModel=new Function('state','people','dayShiftAt','DELIVERY_MARKET',
 'routeCitizen','citizenHomeDestination','citizenHomeIndex','report','choose',
 grain+'return {shouldCollectHouseholdProvisions,finishHouseholdProvisions,householdProvisionAudit};')(
 town,residents,()=>true,{food:[-1,10.2]},p=>routes.push(p.target.slice()),
 ()=>[3,4],()=>0,()=>{},p=>fallback.push(p.name));
assert.equal(handoffModel.shouldCollectHouseholdProvisions(residents[0]),true);
assert.equal(handoffModel.finishHouseholdProvisions(residents[0]),true);
assert.equal(town.food,99.2,'real market must debit town food');
assert.equal(residents[0].provisions,.8,'real citizen holds a saved ration');
assert.equal(town.food+residents[0].provisions,100,'no food minted');
assert.equal(handoffModel.finishHouseholdProvisions(residents[0]),false,'cannot double collect');
assert.equal(handoffModel.householdProvisionAudit().carrying,1);
assert.equal(handoffModel.householdProvisionAudit().createdActors,0);
const afterPickup=town.food;
residents[0].x=20;residents[0].z=20;
residents[0].activity='Collecting household provisions';residents[0].workTimer=1;
assert.equal(handoffModel.finishHouseholdProvisions(residents[0]),false);
assert.equal(town.food,afterPickup,'remote pickup must never debit or award');
town.food=1;residents[0].x=-1;residents[0].z=10.2;
residents[0].activity='Collecting household provisions';residents[0].workTimer=1;
assert.equal(handoffModel.finishHouseholdProvisions(residents[0]),false);
assert.equal(town.food,1,'low town stock must remain unchanged');
assert.deepEqual(fallback,['Eden']);

console.log('W126 real-simulation-function pickup, idempotency, scarcity and conservation PASS; browser/soak separate.');
