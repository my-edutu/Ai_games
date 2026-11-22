'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const game=html.slice(html.lastIndexOf('<script>')+8,html.lastIndexOf('</script>'));
assert.doesNotThrow(()=>new vm.Script(game,{filename:'real-tiny-kingdom.js'}));
for(const id of ['camera-tools','camera-home','camera-near','camera-far','camera-street']){
 assert.equal(html.match(new RegExp('id="'+id+'"','g'))?.length,1,id+' must exist once');
}
assert.match(html,/#world\{touch-action:none;overscroll-behavior:contain\}/);
assert.match(html,/@media\(max-width:520px\)[\s\S]*?#camera-tools/);
assert.match(html,/cameraNavigationStats=\{orbitMoves:0,panMoves:0,pinchGestures:0/);
assert.match(html,/function safeFreeOrbit\(/);
assert.match(html,/function progressCameraReturn\(/);
assert.match(html,/function requestSettlementOverview\(/);
assert.match(html,/function getFreeCameraCollisionAudit\(/);
assert.match(html,/function getCameraNavigationAudit\(/);
assert.match(html,/cameraNavigationStats\.pinchGestures\+\+/);
assert.match(html,/getCameraNavigationAudit,getFreeCameraCollisionAudit,getCamera:/);
assert.match(html,/progressCameraReturn\(wallDt\)/);
assert.match(html,/body\[data-hud="cinema"\] #camera-tools\{display:none!important\}/);
const start=game.indexOf('function freeCameraEyeClear(');
const end=game.indexOf('function safeFreeOrbit(',start);
assert.ok(start>=0&&end>start,'physical camera safety guard accessible');
const physical=vm.runInNewContext(game.slice(start,end)+'\nfreeCameraEyeClear',
 {terrain:()=>0,Number,Math});
const realRoof=[{x:0,z:0,rx:2,rz:3,bottom:.3,top:4.8}];
assert.equal(physical([0,2,0],realRoof),false,'a camera may not enter a real roof');
assert.equal(physical([0,6.5,0],realRoof),true,'high clear observer should remain possible');
assert.equal(physical([12,1.5,12],realRoof),true,'unobstructed village eye is legal');
assert.equal(physical([12,.65,12],[]),false,'camera cannot pass below real ground');
assert.equal(physical([NaN,5,12],[]),false,'non-finite camera is invalid');
console.log('W125 PASS: inline script parses; genuine physical-eye samples, world-first camera controls and replay isolation source contract');
