'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const a=html.indexOf('const SOFTWARE_ORIGINAL_PROBE_MISS_LIMIT=');
const b=html.indexOf('const SOFTWARE_ACTOR_DIRTY_MAX_FLOATS=',a);
assert(a>=0&&b>a,'RED: missing bounded software source probe and full-upload fallback');
const policy=new Function(html.slice(a,b)+
 'return {allowSoftwareOriginalProbe,recordSoftwareOriginalProbe,originalSoftwareProbeState};')();
const {allowSoftwareOriginalProbe:allow,recordSoftwareOriginalProbe:record,
 originalSoftwareProbeState:state}=policy;
let attempts=0,missed=0;
for(let tick=0;tick<40;tick++){
 if(allow('actor',124380)){attempts++;record('actor',0);}
 else missed++;
}
assert.equal(attempts,7,'zero-benefit comparisons must become periodic probes');
assert.equal(missed,33,'not a single actor or GPU upload may be skipped, only source comparisons');
assert.equal(state.actor.wins,0);
assert.equal(state.actor.misses,6);
let recovered=false;
for(let tick=0;tick<24;tick++)if(allow('actor',124380)){
 record('actor',64*1024);recovered=true;break;
}
assert.equal(recovered,true);
assert.equal(state.actor.wins,1);
assert.equal(state.actor.misses,0);
assert.equal(allow('actor',124380),true,'real sparse savings restore continuous inspection');
assert.equal(allow('actor',124410),true,'source topology changes force immediate examination');
for(let tick=0;tick<8;tick++)if(allow('world',28260))record('world',0);
assert.equal(state.world.attempted,6);
assert.equal(state.world.skipped,2);
assert.equal(allow('actor',0),false);
assert.match(html,/const softwareUnchanged=softwareProbe&&/);
assert.match(html,/if\(softwareProbe\)recordSoftwareOriginalProbe\('world',/);
assert.match(html,/swiftGpu\?\(softwareActorProbe\?/);
assert.match(html,/if\(softwareActorProbe\)recordSoftwareOriginalProbe\('actor',/);
assert.match(html,/comparisonPolicy:\{\.\.\.originalSoftwareProbeState.actor\}/);
assert.match(html,/comparisonPolicy:\{\.\.\.originalSoftwareProbeState.world\}/);
assert.match(html,/if\(softwareUnchanged\)\{\s*softwareSplitWorldUnchanged\+\+;/);
assert.match(html,/gl.bufferSubData\(gl.ARRAY_BUFFER,0,currentActor\)/);
const js=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/gi)]
 .find(x=>x[1].includes('function render(now)'))[1];
new vm.Script(js);
console.log('W508 source comparison backoff / full original actor+world GPU uploads PASS');
