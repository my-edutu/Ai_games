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
 'state.food=Math.max(0,state.food-communityConsumption)',
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
console.log('W126 deterministic household contract PASS (actual browser/long-soak evidence separate).');
