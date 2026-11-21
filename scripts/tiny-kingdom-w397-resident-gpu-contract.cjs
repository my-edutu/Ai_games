'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const s=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
for(const script of s.matchAll(/<script[^>]*>([\s\S]*?)<\/script>/g))if(script[1].trim())new vm.Script(script[1]);
const a=s.indexOf('const RESIDENT_GPU_SECTOR_GROUPS='),b=s.indexOf('// W121 Phase 1:',a);
assert.ok(a>0&&b>a,'production source helper must exist');
const disposed=[],env={Float32Array,gpuAvailable:true,gl:{deleteBuffer:b=>disposed.push(b)}};
vm.runInNewContext(s.slice(a,b)+'\nglobalThis.api={chooseResidentGpuSector,resetResidentGpuSector,getResidentGpuDistrictAudit}',env);
const {chooseResidentGpuSector:choose,resetResidentGpuSector:reset,getResidentGpuDistrictAudit:audit}=env.api;
const make=(id,layout,pose='same')=>({buffer:id,mesh:new Float32Array(60),capacity:65536,jointBuffer:id+'J',jointCapacity:8192,jointData:new Float32Array(6),layoutKey:layout,poseKey:pose});
for(const kind of ['commuter','working','foreground']){
 const farm=make('farm'+kind,'farm'),market=make('market'+kind,'market');
 const first=choose(kind,'market','same',farm);
 assert.equal(first.restored,false);assert.equal(first.active.buffer,null);
 const old=choose(kind,'farm','same',market);
 assert.equal(old.restored,true);assert.equal(old.active.buffer,farm.buffer);
 assert.equal(old.active.jointBuffer,farm.jointBuffer);
 const stale=choose(kind,'market','updated-real-pose',old.active);
 assert.equal(stale.restored,false);assert.equal(stale.active.mesh.length,0);
 assert.equal(stale.active.jointData.length,0);
 assert.equal(audit().groups[kind].spareSlots,1);
 reset(kind);assert.equal(audit().groups[kind].spareSlots,0);
}
assert.equal(disposed.length,6);
for(const fn of ['resetResidentCommuters','resetWorkingResidents','resetForegroundResidents']){
 const i=s.indexOf('function '+fn+'(');assert.ok(s.slice(i,i+220).includes('resetResidentGpuSector'));
}
for(const fn of ['prepareRestingActorMesh','prepareResidentCommuters','prepareWorkingResidents','prepareForegroundResidents']){
 const i=s.indexOf('function '+fn+'('),j=s.indexOf('\nfunction ',i+1);
 assert.ok(s.slice(i,j).includes('if(!gpuAvailable)'),fn+' GPU layout preserved on empty camera view');
}
assert.ok(s.includes('getWorkSkinPaletteAudit,getResidentGpuDistrictAudit'));
console.log('W397 full playable JavaScript syntax and actual bounded GPU actor sector tests PASS; hardware FPS and visual experience NOT PROVEN');
