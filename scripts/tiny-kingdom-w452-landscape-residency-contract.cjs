'use strict';
// W452 production-source RED/GREEN: live-world terrain/forest shares the
// already compiled home static program on hardware, but NO dynamic object,
// worker, authoritative world state or shader foliage sway is discarded.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(script);
assert.match(script,/function drawOriginalRetainedLandscape\(planes,ctx\)/);
assert.match(script,/scenicVisibilityStats\.landscape=drawOriginalRetainedLandscape\(planes,/);
assert.match(script,/function originalLandscapeStaticShaderSafe\(mesh\)/);
assert.match(script,/const landscapeStaticProgramSafety=new WeakMap\(\)/);
assert.match(script,/landscapeStaticSpecializedTriangles\+=audit\.visibleTriangles/);
assert.match(script,/finally\{gl\.useProgram\(program\)\}/);
assert.match(script,/return drawVisibleStaticChunks\(landscapeBuffer,landscapeChunkRanges,planes\)/);
// Evaluate the exact original material-tag guard with every legal/illegal
// material, including the original farm, weather and animated forge markers.
const begin=script.indexOf('const landscapeStaticProgramSafety=new WeakMap();');
const end=script.indexOf('function drawOriginalRetainedLandscape(',begin);
assert(begin>0&&end>begin);
const guard=new Function(script.slice(begin,end)+
  'return {check:originalLandscapeStaticShaderSafe,audit:()=>({scans:landscapeStaticSafetyScans,hits:landscapeStaticSafetyCacheHits,rejected:landscapeStaticSafetyRejected})};')();
const mesh=tags=>new Float32Array(tags.flatMap(t=>{
 const vertex=[0,1,2,0,1,0,1,1,1,t];return [...vertex,...vertex,...vertex];
}));
const legal=mesh([0,1,2,3,4,5,6,7,8,9,10.49]);
assert.equal(guard.check(legal),true);
assert.equal(guard.check(legal),true);
assert.equal(guard.audit().hits,1);
for(const tag of [10.5,11,12,13,14.2,17.5,18.5,19.5,20.5,-1,Infinity,NaN]){
 assert.equal(guard.check(mesh([4,tag])),false,'must not suppress genuine animated scene tag '+tag);
}
const invalid=new Float32Array(29);assert.equal(guard.check(invalid),false);
assert.match(script,/float crown=smoothstep\(1\.2,4\.4,position\.y\);/);
assert.match(script,/if\(materialId>3\.5&&materialId<4\.5\)\{/);
assert.match(script,/const RESIDENT_HOME_SKIP_BRANCHES=/);
console.log('W452 truthful static landscape eligibility, cache, fallback and unchanged full running script syntax PASS; fresh gameplay/real hardware performance remain NOT PROVEN.');
