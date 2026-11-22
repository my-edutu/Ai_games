#!/usr/bin/env node
// W387 executable original source contract; old game must fail this test.
'use strict';
const assert=require('node:assert/strict'),fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const sources=[...html.matchAll(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/g)]
 .map(m=>m[1]).join('\n');
new vm.Script(sources,{filename:'tiny-kingdom-original.js'});
for(const token of [
 'function specializeResidentHomeVertexShader(source)',
 'function getResidentHomeShaderAudit()',
 'function setResidentHomeShaderForTesting(value)',
 'function bindRealResidentHomeMaterial(ctx)',
 'gl.bindAttribLocation(candidate,location,name)',
 'residentHomeShaderDrawFrames++',
 'audits.push(drawVisibleStaticChunks(entry.buffer,entry.ranges,planes))',
 'gl.useProgram(program)',
 'scenicVisibilityStats.homes=drawHomeClusters(planes,',
 'gl.uniform1i(u.architectureAtlas,1)',
 'gl.uniform4fv(u.commuterLanterns,selectAuthenticCarriedLights())',
 'materialFragmentUnchanged:true',
 'originalFoliageWindIntact:true'
])assert.ok(sources.includes(token),'W387 missing original-source contract '+token);
assert.match(sources,/try\{\s*for\(const entry of homeClusterActive\)/);
assert.match(sources,/finally\{if\(specialized\)gl\.useProgram\(program\)\}/);
assert.match(sources,/!swiftGpu\|\|residentHomeShaderOverride===true/);
console.log('W387 original source syntax and protected occupied-home VBO shader boundaries PASS; actual GPU/time/visual still pending');
