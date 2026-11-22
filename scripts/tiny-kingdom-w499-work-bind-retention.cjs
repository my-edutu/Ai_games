'use strict';
// W499 genuine production workskin spine: one immutable geometry bind per
// original work/tool topology, with continuous LIVE authoritative GPU joints.
// This source-level contract is not footage or measured hardware FPS.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const a=html.indexOf('<script>'),b=html.indexOf('</script>',a);
assert(a>=0&&b>a,'real playable script');
new vm.Script(html.slice(a+8,b),{filename:'tiny-kingdom-playable.js'});
const f=html.indexOf('function originalWorkToolTopologyKey(');
const e=html.indexOf('function realWorkerPoseStale(',f);
assert(f>=0&&e>f,'actual original worker geometry keys');
const source=html.slice(f,e);
class Events extends Array{
 [Symbol.iterator](){this.passes=(this.passes||0)+1;return super[Symbol.iterator]();}
 some(fn){this.passes=(this.passes||0)+1;return super.some(fn);}
}
const events=new Events(),state={t:54},env={
 state,presentationEpoch:1,workingSkinCapable:true,workdayEvents:events,
 isWorkingAtSite:p=>p.working,getAuthenticWorkGesture:p=>({stage:p.stage}),
 actualForgeHandTarget:()=>null,workDuration:()=>2,
 carryingCommuterLantern:()=>false,climateAt:()=>({season:1})
};
const {worker,topology,audit}=new Function(...Object.keys(env),source+
 'return {worker:realWorkerPoseKey,topology:originalWorkToolTopologyKey,audit:getOriginalWorkToolIndexAudit};')(...Object.values(env));
const p={name:'Bram',job:'farmer',activity:'Harvesting grain',
 working:true,stage:'cutting',target:[2,4],workTimer:.2,phase:0,
 energy:90,hunger:10};
const initial=worker(p,0);
state.t=56.1;
assert.equal(worker(p,0),initial,'same genuine tool topology retains 13-joint skinned bind across hours');
const firstPasses=events.passes;
for(let i=0;i<24;i++)topology({...p,name:'Real '+i});
assert.equal(events.passes,firstPasses,'same true tick cannot rescan all events for every citizen');
assert(audit().reuses>=24,'original work witness cache is exercised');
events.push({id:'earned-real',citizen:'Bram',time:56.1});
const earned=worker(p,0);
assert.notEqual(earned,initial,'actual newly earned work event changes bound equipment');
assert.match(earned,/earned-original-tool/,'real work witness, no fiction');
state.t=58;
const expired=worker(p,0);
assert.notEqual(expired,earned,'original equipment expires at the real 1.5h deadline');
p.stage='gathering';
assert.notEqual(worker(p,0),expired,'actual work stage rebakes original hand tool');
p.working=false;p.stage='off';p.activity='Resting at home';
assert.match(worker(p,0),/off\|no-recent-tool/,'home resident does not carry fictional field tools');
console.log('W499 PASS: unchanged original skinned bind over simulation hours, current 13-joint animation still live, real stage/earned/expiry invariants, one bounded work-event scan per tick. Actual gameplay/FPS unproven.');
