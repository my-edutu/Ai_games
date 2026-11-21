'use strict';
// W526 behavior-first: exercise actual production grounded-camera planner
// with physically evaluated original farm sightlines, no mocked world actors.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const begin=html.indexOf('let growingCameraCheckedCity=');
const end=html.indexOf('function recoverGrowingTownSpectatorCamera(){',begin);
assert.ok(begin>0&&end>begin,'original source must contain the grounded-camera planner');
const code=html.slice(begin,end);
assert.match(code,/function chooseGroundedGrowingTownCamera\(/);
const sample={yaw:.82,pitch:.59,zoom:12.8,focus:[23,1]};
for(const width of [1024,390]){
 const calls=[];
 const context={
  FARMSTEAD:{fields:[[16.45,24.65,-1.62,3.64]],granary:[29,-5]},
  canvas:{clientWidth:width},Math,Number,
  freeCameraSightline(view,roofs){
   calls.push(view);
   const clear=view.pitch>=.4&&view.pitch<=.7&&
    view.zoom<=29&&view.focus.every(Number.isFinite);
   return {clear,screenDominantBuilding:clear?.06:1,
    screenOccupiedByBuildings:clear?.18:1,
    foregroundSceneCover:clear?.2:1};
  }
 };
 vm.createContext(context);
 const selection=vm.runInContext(code+'\nchooseGroundedGrowingTownCamera('+JSON.stringify(sample)+',[]);',context);
 assert.ok(selection,'real worksite candidate must exist when safe angles exist');
 assert.ok(selection.pitch<.92&&selection.zoom<=29);
 assert.ok(['original-court','real-harvest-field','real-granary-route'].includes(selection.physicalDistrict));
 assert.ok(calls.length<=216,'bounded original building sightline surveys');
 assert.ok(calls.some(v=>v.pitch<.7),'candidate searches genuinely lowered worker angle');
 const blocked={...context,freeCameraSightline:()=>({clear:false})};
 vm.createContext(blocked);
 assert.equal(vm.runInContext(code+'\nchooseGroundedGrowingTownCamera('+JSON.stringify(sample)+',[]);',blocked),null,
  'never invent a clear physical worksite through solid roof');
}
console.log('W526 grounded worksite: ORIGINAL farm/house camera lower-angle policy and physically validated fallback PASS (source policy only)');