'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const code=html.split('<script>').at(-1).split('</script>')[0];
new vm.Script(code,{filename:'w102-real-world.js'});
for(const signal of ['function getPhysicalGreeting(p)','function getSocialEncounterAudit()',
 'function getCitizenRigCacheAudit()','citizenRigCache.set(p,pose)',
 'const social=getPhysicalGreeting(p);','getSocialEncounterAudit:()=>cloneData(getSocialEncounterAudit())']){
 assert.ok(code.includes(signal),'Missing actual-world citizen contract: '+signal);
}
const expression=code.slice(code.indexOf('function getPhysicalGreeting(p){'),
 code.indexOf('function getSocialEncounterAudit(){'));
assert.ok(expression.startsWith('function getPhysicalGreeting(p){'));
const witness=(people,p)=>new Function('people','isWorkingAtSite','isMarketUnloading','p',
 expression+';return getPhysicalGreeting(p);')(
 people,p=>p.activity==='Working',p=>p.delivery?.stage==='unloading',p);
const a={name:'Ana',x:0,z:0,activity:'Exploring village',bonds:{Bob:2},delivery:null};
const b={name:'Bob',x:.6,z:.3,activity:'Exploring village',bonds:{Ana:2},delivery:null};
const people=[a,b],snapshot=JSON.stringify(people);
const real=witness(people,a);
assert.equal(real?.companion,'Bob');
assert.ok(real.strength>0&&real.distance<1.3);
assert.equal(JSON.stringify(people),snapshot,'Read-only social view changed authoritative citizens');
b.x=3;assert.equal(witness(people,a),null,'A distant person was staged as a neighbour');
b.x=.6;b.bonds={};assert.equal(witness(people,a),null,'An unbonded person became a fictitious friend');
b.bonds={Ana:2};a.activity='Working';
assert.equal(witness(people,a),null,'Real physical labor was interrupted by a greeting');
a.activity='Exploring village';a.delivery={id:'real-cargo',stage:'travel'};
assert.equal(witness(people,a),null,'A real load was interrupted by a greeting');
a.delivery=null;b.activity='Resting at home';
assert.equal(witness(people,a),null,'Social motion reached someone inside a real home');
console.log('W102 authentic contact, no fake actors/relationships, cargo/work priority, bounded shared rig contracts PASS (Node isolated; browser/hardware separately unproven)');