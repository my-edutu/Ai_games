'use strict';
// W278 test-first: the actual original farmer/smith/builder tool topology
// is read from the AUTHORITATIVE stage, not inferred from a video prop.
// This contract executes the exact renderer key functions. Browser A/B is
// required separately; successful source tests alone are NOT a milestone.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=html.indexOf('<script>'),end=html.indexOf('</script>',start);
assert(start>=0&&end>start,'original playable document');
new vm.Script(html.slice(start+8,end),{filename:'actual-tiny-kingdom.js'});
const extract=(name,next)=>{
 const a=html.indexOf('function '+name+'('),b=html.indexOf('function '+next+'(',a+5);
 assert(a>=0&&b>a,'original production '+name+' and '+next);
 return html.slice(a,b);
};
const source=extract('originalWorkToolTopologyKey','realWorkerPoseKey')+
 extract('realWorkerPoseKey','realWorkerPoseStale')+
 extract('realForegroundPoseKey','realForegroundPoseStale');
const context={
 state:{t:54},workingSkinCapable:true,workdayEvents:[],
 isWorkingAtSite:p=>p.working,
 getAuthenticWorkGesture:p=>({stage:p.stage}),
 citizenRigPose:()=>({acting:{action:'harvest'}}),
 actualForgeHandTarget:()=>null,workDuration:()=>2,
 carryingCommuterLantern:()=>false,
 climateAt:()=>({season:1})
};
const keys=new Function(...Object.keys(context),source+
 'return {worker:realWorkerPoseKey,foreground:realForegroundPoseKey};')(
 ...Object.values(context));
const farmer={name:'Authentic farmer',job:'farmer',
 activity:'Harvesting grain',stage:'preparing',working:true,
 phase:0,x:0,z:0,target:[2,3],workTimer:.23,energy:83,hunger:18};
const recorded=()=>[keys.worker(farmer,0),keys.foreground(farmer,0,true)];
const preparing=recorded();
farmer.stage='cutting';
const cutting=recorded();
assert.notDeepEqual(cutting,preparing,
 'Real cutting starts a 42-triangle sickle; retained GPU bind must refresh');
farmer.stage='gathering';
const gathering=recorded();
assert.notDeepEqual(gathering,cutting,
 'Real gathering removes sickle and replaces it with original bound sheaf');
farmer.stage='tying';
assert.notDeepEqual(recorded(),gathering,
 'Real tying changes the legitimate tied-straw mesh topology');
farmer.working=false;farmer.activity='Resting at home';farmer.stage='off';
const noEvent=recorded();
context.workdayEvents.push({citizen:farmer.name,time:54});
const withEvent=recorded();
assert.notDeepEqual(withEvent,noEvent,
 'Recent earned event visibly equips authentic worker props after shift');
context.state.t=56;
assert.notDeepEqual(recorded(),withEvent,
 'Expired work event retires the equipment, without inventing stock');
const other={...farmer,name:'Other original citizen'};
assert.notEqual(keys.foreground(other,1,true),keys.foreground(farmer,0,true),
 'A coworker never inherits another worker work event');
console.log('W278 PASS: exact original CPU/GPU topology invalidates for actual preparing/cutting/gathering/tying and earned-event expiry. No FPS/visual claim.');
