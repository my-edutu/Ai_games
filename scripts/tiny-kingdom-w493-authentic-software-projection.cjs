'use strict';
// W493 contract: run the actual game functions in isolation, not duplicate logic.
// Genuine SwiftShader workers must receive the same physical projection as the
// player camera, never a null frame from the disabled generic citizen VBO tier.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
function extractFunction(name){
 const token='function '+name+'(',start=html.indexOf(token);
 assert.ok(start>=0,'Missing production '+name);
 const brace=html.indexOf('{',start);
 let depth=0,end=-1;
 for(let i=brace;i<html.length;i++){
  if(html[i]==='{')depth++;
  if(html[i]==='}'&&--depth===0){end=i+1;break;}
 }
 assert.ok(end>brace,'Cannot extract '+name);
 return html.slice(start,end);
}
assert.match(html,/const commuterFrame=residentActorProjectionFrame\(detailPlan\)/,
 'Real worksite projection may not depend on the software GPU-stream toggle');
const frame={identity:'same-authoritative-camera',eye:[0,2,4]};
const projected=[];
const ctx={
 Set,Map,Array,Number,Math,
 gpuAvailable:true,swiftGpu:true,workingSkinCapable:true,
 foregroundResidentEnabled:true,selectedCitizen:0,
 SOFTWARE_WORKSITE_GPU_MAX_ACTORS:4,WORKSITE_SKIN_ENTER_SCREEN_HEIGHT:.245,
 residentActorGpuEnabled:()=>false,
 isObservedWorksiteSkinCandidate:(p,i,near)=>Boolean(p&&p.working&&i===0&&near.has(i)&&!p.delivery),
 isForegroundWorksiteCandidate:(p,i,near,f)=>{
  assert.strictEqual(f,frame,'Real worker candidate must use valid camera');
  return Boolean(p&&p.working&&near.has(i)&&!p.delivery);
 },
 isWorkingAtSite:p=>Boolean(p?.working),
 isMarketUnloading:p=>Boolean(p?.unloading),
 verifiedHouseholdMealEvidence:p=>Boolean(p?.meal),
 projectRealCitizenDetail:(p,f)=>{
  assert.strictEqual(f,frame,'Physical projection must be the real camera');
  projected.push(p.name);return p.view;
 },
 softwareWorksiteSelectionFrames:0,softwareWorksiteSelectedRows:0
};
vm.createContext(ctx);
for(const name of ['residentActorProjectionFrame','isSoftwareWorksiteVisible',
 'authenticWorkerGpuResidentRows']){
 vm.runInContext(extractFunction(name),ctx,{filename:'production:'+name});
}
assert.strictEqual(ctx.residentActorProjectionFrame({cameraFrame:frame}),frame);
assert.equal(ctx.residentActorProjectionFrame({}),null);
const p=(name,height,extra={})=>({
 name,working:true,view:{visible:true,heightFraction:height},...extra
});
assert.equal(ctx.isSoftwareWorksiteVisible(p('medium',.22),frame,.37),true);
assert.equal(ctx.isSoftwareWorksiteVisible(p('close',.6),frame,.37),false);
assert.equal(ctx.isSoftwareWorksiteVisible(p('offscreen',.15,{view:{visible:false,heightFraction:.15}}),frame,.37),false);
assert.equal(ctx.isSoftwareWorksiteVisible(p('no camera',.15),null,.37),false);
const actors=[
 p('chosen real harvester',.19),p('actual builder',.19),
 p('close-up hand contact',.67),p('parcel courier',.14,{delivery:{id:1}}),
 p('hidden behind camera',.12,{view:{visible:false,heightFraction:.12}}),
 p('actual forager',.2),p('actual smith',.2),p('another farmer',.19)
];
const rows=ctx.authenticWorkerGpuResidentRows(actors,new Set(actors.map((_,i)=>i)),frame);
assert.deepEqual(Array.from(rows,r=>r.i),[0,1,5,6],
 'Selected visible true worker first, then bounded genuine medium work; no freight, hidden or giant heroes');
assert.equal(ctx.softwareWorksiteSelectionFrames,1);
assert.equal(ctx.softwareWorksiteSelectedRows,4);
assert.deepEqual(Array.from(rows,r=>r.p.name),[
 'chosen real harvester','actual builder','actual forager','actual smith']);
assert.ok(projected.length>=5,'Must inspect real worker viewport');
assert.equal(ctx.authenticWorkerGpuResidentRows(actors,new Set([0,1]),null).length,0,
 'Missing frame must safely use original live worker CPU path');
ctx.gpuAvailable=false;
assert.equal(ctx.authenticWorkerGpuResidentRows(actors,new Set([0,1]),frame).length,0,
 'No GPU means complete original CPU fallback');
console.log('W493 real software worksite projection, authentic action admission, capacity and CPU fallback PASS');
