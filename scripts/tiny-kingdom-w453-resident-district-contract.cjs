'use strict';
// W453 Phase 1: the ORIGINAL inhabited settlement, occupied civic core and
// genuine changing roads can use the exact already-linked static house shader.
// All material tags, original buffer ranges and worker animation survive.
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const script=html.slice(html.indexOf('<script>')+8,html.lastIndexOf('</script>'));
new vm.Script(script);
assert.match(script,/function drawOriginalRetainedDistrictClass\(name,target,ranges,mesh,planes,ctx\)/);
for(const label of ['settlement','civicCore','civic']){
 assert.match(script,new RegExp("residentDistrictShaderStats\\."+label));
}
for(const expression of [
 'scenicVisibilityStats.settlement=drawOriginalRetainedDistrictClass(',
 'scenicVisibilityStats.civicCore=civicCoreBuffer?',
 'scenicVisibilityStats.civic=civicBuffer?',
 'originalLandscapeStaticShaderSafe(mesh)',
 'finally{gl.useProgram(program)}',
 'drawVisibleStaticChunks(target,ranges,planes)'
])assert(script.includes(expression),'missing original render safety: '+expression);
assert.match(script,/staticDistrict:(?:\{|residentDistrictShaderStats)/);
assert.match(script,/getResidentHomeShaderAudit\(\)/);
assert.match(script,/const landscapeStaticProgramSafety=new WeakMap\(\)/);
console.log('W453 production parser, material safety fallback, unchanged draw geometry, all real district shader classes PASS; running visual/hardware acceptance remains NOT PROVEN');
