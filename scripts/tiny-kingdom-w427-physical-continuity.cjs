'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const segment=(a,b)=>{const i=html.indexOf(a),j=html.indexOf(b,i+a.length);assert(i>=0&&j>i,a);return html.slice(i,j)};
const original=name=>{const a=html.indexOf('function '+name+'(');assert(a>=0,name);const b=html.indexOf('\n}\n',a);assert(b>a,name);return html.slice(a,b+2)};
const phases=['chooseRealMarketReceiptLens','inspectPhysicalMarketWitnessEye','chooseRealGrainHomeLens','inspectRealHomeCamera'];
for(const name of phases)assert(original(name).includes('terrainClearWorkerSightline(eye,'),
 'Original '+name+' must survey the solid terrain between eye and genuine goods/home');
let hill=false;
const env={Math,Number,Array,terrain:(x)=>hill&&Math.abs(x)<.35?3.5:0,
 realGrainHomeFrontage:()=>({aim:[3,1,0],homeKey:'occupied-real-5'}),
 followCameraRoofs:()=>[],physicalFollowEyeClearance:()=>({clear:true}),
 followRayBlockers:()=>0,marketCourierPostSightline:()=>({centerCover:0}),
 foregroundVegetationProjection:()=>({faceBlockers:0,cover:0}),
 foregroundSceneProjection:()=>({cover:0,cargoCover:0}),
 homeWitnessPhysicalSurveys:0};
const cx=vm.createContext(env);
vm.runInContext(segment('const TERRAIN_SIGHTLINE_MAX_SEGMENTS=28;', '// W280: the genuine workday director')+
 original('inspectPhysicalMarketWitnessEye')+original('inspectRealHomeCamera'),cx,{timeout:2000});
const eye=[-3,2,0],receipt={aim:[3,1,0]},home={homeIndex:5};
assert.equal(cx.inspectPhysicalMarketWitnessEye(eye,receipt,[]).clear,true);
assert.equal(cx.inspectRealHomeCamera(home,eye).clear,true);
hill=true;
assert.equal(cx.inspectPhysicalMarketWitnessEye(eye,receipt,[]).reason,'physical-terrain-ray');
assert.equal(cx.inspectRealHomeCamera(home,eye).reason,'physical-terrain-ray');
const report=cx.getTerrainSightlineAudit();
assert(report.terrainOcclusions>=2&&report.samples>=4&&!report.authorityChanged);
console.log('W427 original farm→credited market→inhabited home physical camera: PASS; clear sightline admitted, hill-occluded goods and home rejected, original authority preserved. Gameplay footage, p95 hardware FPS and blind A/B not yet proven.');
