'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
assert.doesNotThrow(()=>new Function(script),'whole playable JS parses');
const start=html.indexOf('/* W145 TRUE SHOPPER GRAIN ATTACHMENT BEGIN');
const end=html.indexOf('/* W145 TRUE SHOPPER GRAIN ATTACHMENT END',start);
assert.ok(start>=0&&end>start,'actual source owns the original carrying renderer');
const code=html.slice(start,end);
const citizen={name:'Ada',job:'merchant',activity:'Traveling home with provisions',x:3,z:8,
 phase:0,provisions:.8,path:[[3,9]],target:[3,9],
 provisionReceiptId:'R1',provisionTradeId:'T1'};
const people=[citizen],data=[],ellipsoids=[];
const run=new Function('people','citizenRigPose','citizenEmbodiedPose','terrain','data',
 'materialScope','MATERIAL','rgb','ellipsoid','limbSegment',
 code+'return {pose:getCarriedHouseholdProvisionPose,draw:renderCarriedHouseholdProvisions,stats:()=>householdCarriedSackStats}');
const api=run(people,p=>({arms:[{wrist:[-.2,.66,.2]},
 {wrist:[.31+.04*Math.sin(p.phase),.73,.19]}]}),
 ()=>({spineShift:.02,forwardLean:.04,rise:.01}),()=>1,data,
 (_,fn)=>fn(),{GENERAL:1},n=>n,
 (x,y,z)=>{ellipsoids.push([x,y,z]);data.push(...Array(30).fill(0));},
 ()=>{data.push(...Array(30).fill(0));});
function close(a,b){assert.ok(Math.abs(a-b)<1e-8,a+' != '+b)}
for(const [x,z] of [[3,9],[4,8],[2,8],[3,7]]){
 citizen.path=[[x,z]];
 const pose=api.pose(citizen),angle=Math.atan2(x-3,z-8);
 const influence=(.73-.43)/.77,dx=.92*(.31+.02*influence),dz=.92*(.19+.04*influence);
 close(pose.wrist[0],3+Math.cos(angle)*dx+Math.sin(angle)*dz);
 close(pose.wrist[1],1+.92*(.73+.01*influence));
 close(pose.wrist[2],8-Math.sin(angle)*dx+Math.cos(angle)*dz);
 assert.equal(pose.receiptId,'R1');assert.equal(pose.authorityModified,false);
}
citizen.path=[[3,9]];const before=JSON.stringify(citizen),x0=api.pose(citizen).wrist[0];
citizen.phase=Math.PI/2;
assert.ok(Math.abs(api.pose(citizen).wrist[0]-x0)>.02,'grain bag follows real gait');
citizen.phase=0;api.draw(citizen);
assert.equal(api.stats().carriers,1);assert.equal(api.stats().receiptLinked,1);
assert.equal(ellipsoids.length,2);assert.ok(api.stats().triangles>0);
assert.equal(api.pose({...citizen,activity:'Resting at home'}),null);
assert.equal(api.pose({...citizen,provisions:0}),null);
assert.equal(api.pose({...citizen,name:'Foreign'}),null);
assert.equal(JSON.stringify(citizen),before);
citizen.provisionReceiptId=null;
assert.equal(api.pose(citizen).hasRecordedFarmerReceipt,false);
assert.ok(html.includes('householdCarriedSackStats.carriers=0;'));
assert.ok(html.includes('getCarriedHouseholdProvisionPose:person=>'));
console.log('W145 source-only: complete JS parse, 4 direction/rig tests, live goods, no fabrication PASS');
