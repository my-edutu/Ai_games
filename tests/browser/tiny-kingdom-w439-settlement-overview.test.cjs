'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
function sourceBetween(start,end){
 const a=html.indexOf(start),b=html.indexOf(end,a);
 assert.ok(a>=0&&b>a,'Original game camera source missing: '+start);
 return html.slice(a,b);
}
test('RED-to-GREEN: actual 390px overview uses wide 3D perspective without distorting desktop',()=>{
 const source=sourceBetween('function cameraLensProfile(', '// W27 optical contract:');
 const get=new Function('canvas','streetWalk','follow','CAMERA_STANDARD_VFOV',
  source+';return cameraLensProfile;');
 const make=(streetWalk,follow)=>get({clientWidth:390,clientHeight:844},
  streetWalk,follow,Math.PI/3.2);
 const phone=make(false,false)(390,844);
 assert.equal(phone.mode,'settlement-overview');
 assert.ok(phone.responsive,'The formerly 27.75° mobile overview is still cropped');
 assert.ok(phone.horizontalDegrees>=49.5&&phone.horizontalDegrees<=50.5);
 assert.ok(phone.verticalDegrees<=100);
 const native=make(false,false)(1024,640);
 assert.equal(native.responsive,false);
 assert.ok(Math.abs(native.verticalDegrees-56.25)<1e-7);
 const follow=make(false,true)(390,844);
 assert.ok(follow.horizontalDegrees>=47.5);
});
test('real city footprint planner: populated, finite and read-only through 120-day growth',()=>{
 const source=sourceBetween('function physicalSettlementOverviewPlan(', 'function requestSettlementOverview()');
 const factory=new Function('canvas','city','cameraLensProfile',
  source+';return physicalSettlementOverviewPlan;');
 const lens=new Function('canvas','streetWalk','follow','CAMERA_STANDARD_VFOV',
  sourceBetween('function cameraLensProfile(','// W27 optical contract:')+';return cameraLensProfile;')(
   {clientWidth:390,clientHeight:844},false,false,Math.PI/3.2);
 const homes=[[0,0,0],[-14,17,1],[19,-12,1],[8,7,2]];
 const snapshot=JSON.stringify(homes);
 const plan=factory({clientWidth:390,clientHeight:844},homes,lens)(390,844);
 assert.equal(plan.actualHomes,homes.length);
 assert.deepEqual(plan.extent,[-14,-12,19,17]);
 assert.deepEqual(plan.focus,[2.5,2.5]);
 assert.ok(plan.zoom>=43&&plan.zoom<=85);
 assert.ok(plan.horizontalDegrees>=49.5);
 assert.equal(plan.authorityMutated,false);
 assert.equal(plan.newRenderMeshes,0);
 assert.equal(JSON.stringify(homes),snapshot);
 const grown=homes.concat(Array.from({length:35},(_,i)=>[
  ((i*7)%39)-19,((i*13)%45)-22,2]));
 const larger=factory({clientWidth:390,clientHeight:844},grown,lens)(390,844);
 assert.equal(larger.actualHomes,39);
 assert.ok(larger.zoom>=plan.zoom);
 assert.ok(Number.isFinite(larger.focus[0])&&Number.isFinite(larger.focus[1]));
});
