'use strict';
// W216 structural contract: camera-only presentationEpoch must NOT trigger
// recreation of the real citizens/courier/market geometry for an unchanged tick.
const fs=require('node:fs'),vm=require('node:vm'),assert=require('node:assert/strict');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const first=html.indexOf('<script>'),last=html.indexOf('</script>',first);
assert(first>0&&last>first);
new vm.Script(html.slice(first+8,last),{filename:'tiny-kingdom-original-playable.js'});
const begin=html.indexOf('const candidateCameraDynamicKey=gpuAvailable?[');
const end=html.indexOf("].join('|'):null;",begin);
assert(begin>0&&end>begin,'actual dynamic geometry residency key exists');
const key=html.slice(begin,end);
assert(!/\bpresentationEpoch\b/.test(key),'RED W216: camera only epoch still rebuilds entire dynamic world');
for(const dependency of ['state.t','scenicMeshKey','detailPlan.mode','nearPeople','citizenMidVisualIndices','selectedCitizen','visibleActualWorksites()','workdayEvents.length','deliveryReceipts.length']){
 assert(key.includes(dependency),'lost real-world invalidation dependency '+dependency);
}
assert(html.includes('if(cameraMeshReused){')&&html.includes('if(!cameraMeshReused&&data.length)'));
assert(html.includes('if(cameraMeshReused)cameraDynamicSkippedUploads++'));
assert(html.includes('function step(dt){presentationEpoch++'), 'existing fixed-step revision preserved');
console.log('W216 structural cache contract PASS; real camera WebGL verification is separate');
