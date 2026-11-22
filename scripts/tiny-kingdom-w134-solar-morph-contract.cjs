'use strict';
// W134 source-only test; real GPU screenshots, shader link and performance remain unproven.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const head=html.indexOf('<script>'),tail=html.lastIndexOf('</script>');
assert(head>=0&&tail>head,'the genuine playable script must exist');
const script=html.slice(head+8,tail);
new vm.Script(script,{filename:'tiny-kingdom-live-game.js'});
function named(name){
 const key='function '+name+'(';
 const start=html.indexOf(key);
 assert(start>=0,'missing source '+name);
 let i=html.indexOf('{',start),depth=0;
 do{if(html[i]==='{')depth++;else if(html[i]==='}')depth--;i++}
 while(depth>0&&i<html.length);
 assert.equal(depth,0,'unterminated '+name);
 return html.slice(start,i);
}
const body='const SOLAR_SHADOW_STEP_HOURS=.5;'+
 'const SOLAR_SHADOW_TRANSITION_HOURS=.12;'+
 named('solarShadowStage')+named('solarShadowTransitionWeight')+
 '\n({stage:solarShadowStage,weight:solarShadowTransitionWeight})';
const {stage,weight}=new vm.Script(body).runInNewContext({});
for(const [time,bucket,blend] of [
 [8,16,1],[8.03,16,.75],[8.06,16,.5],[8.09,16,.25],
 [8.12,16,0],[8.49,16,0],[8.5,17,1],
 [11.5,23,1],[11.62,23,0],[24+8.06,16,.5]
]){
 assert.equal(stage(time).bucket,bucket,'original solar stage '+time);
 assert(Math.abs(weight(time,stage(time))-blend)<1e-8,
  'unbroken authentic daylight transition '+time);
}
const vs=html.slice(html.indexOf('const vs='+String.fromCharCode(96)),html.indexOf('const fs='+String.fromCharCode(96)));
for(const name of ['attribute vec3 shadowPrevPosition','attribute vec3 shadowPrevColor',
 'uniform float shadowTransition','surfaceColor=mix(surfaceColor,shadowPrevColor,shadowTransition)',
 'world=mix(world,shadowPrevPosition,shadowTransition)'])
 assert(vs.includes(name),'genuine GPU morph absent: '+name);
const shadow=named('directionalCastShadows');
for(const token of [
 'solarShadowCache.get(previouslyRenderedShadow.cacheKey)===previouslyRenderedShadow',
 'previouslyRenderedShadow.vertices.length===solarShadowActive.vertices.length',
 'solarShadowPrior.stageBucket===stage.bucket-1',
 'shadowPatch(p.x,p.z,.20,.14,1.1,sun,true,6)',
 'solarShadowTransitionWeight(time,stage)',
 'solarShadowCachedFloats+len>SOLAR_SHADOW_MAX_FLOATS'
])assert(shadow.includes(token),'retain physical geometry, safety and live actors: '+token);
const draw=html.slice(html.indexOf('if(solarShadowActive?.buffer){',html.indexOf('const frameSubmitStart=performance.now();')),
 html.indexOf('const gpuUploadStart=performance.now();'));
const drawCall='gl.drawArrays(gl.TRIANGLES,0,solarShadowActive.triangles*3)';
assert.equal(draw.split(drawCall).length-1,1,'one real solar draw, not two');
for(const token of ['gl.disableVertexAttribArray(shadowPrevPositionLoc)',
 'gl.disableVertexAttribArray(shadowPrevColorLoc)',
 'gl.uniform1f(uniforms.shadowTransition,0)',
 'shadowPrevPositionLoc>=0&&shadowPrevColorLoc>=0'])
 assert(draw.includes(token),'leave live workers and later draw state intact: '+token);
assert(!draw.includes('gl.bufferSubData'),'no per-frame solar-stage GPU upload');
assert(html.includes('solarShadowPrior=null;solarShadowTransition=0;'),
 'reset/restore must invalidate prior shadow references');
console.log('W134 SOURCE contract PASS: authentic solar transition timings, matched same-topology resident stages, one draw, no per-frame upload and full playable syntax. WebGL shader-link, real film and hardware FPS NOT PROVEN.');
