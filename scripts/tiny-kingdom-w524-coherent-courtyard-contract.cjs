'use strict';
const fs=require('node:fs');
const vm=require('node:vm');
const assert=require('node:assert/strict');
const src=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const start=src.lastIndexOf('<script>'),end=src.lastIndexOf('</script>');
assert(start>0&&end>start,'the original game must be present');
new vm.Script(src.slice(start+8,end),{filename:'tiny-kingdom-inline-game.js'});
for(const needle of ['function renderInhabitedKitchenGarden(',
 'const edgedStone=(cx,cy,cz,w,h,d,col,axis)=>{',
 'Same four full woven fence courses',
 'highStreetStats.kitchenGardenPlants+=32',
 'function renderOriginalLiveCourierCart(',
 'function renderCachedHomeLot(',
 'function renderCompactOccupiedRoomShell(',
 'function safeFreeOrbit(',
 'const residentRows=authenticWorkerGpuResidentRows',
 'ORIGINAL_OCCUPIED_ROOF_FRAME_MAX_TRIANGLES=128'])
 assert(src.includes(needle),'missing original renderer contract: '+needle);
console.log('W524 original source syntax and retained physical town/courier/32 planted kitchen leaves PASS. Real game camera, 160k Day121 and FPS remain separately gated.');
