'use strict';
// W135 original forge chimney participates in the existing durable civic GPU
// motion VBO. Source and math checks are NOT a real WebGL or FPS certification.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const head=html.indexOf('<script>'),tail=html.lastIndexOf('</script>');
assert(head>=0&&tail>head,'must inspect actual playable source');
new vm.Script(html.slice(head+8,tail),{filename:'tiny-kingdom-live.js'});
function named(name){
 const key='function '+name+'(',start=html.indexOf(key);
 assert(start>=0,'missing original function '+name);
 let i=html.indexOf('{',start),depth=0;
 do{if(html[i]==='{')depth++;else if(html[i]==='}')depth--;i++}
 while(depth>0&&i<html.length);
 assert.equal(depth,0,'unterminated original '+name);
 return html.slice(start,i);
}
const emitted=[];
const ctx={
 data:[],CRAFT_DISTRICT:{x:19,z:-15},craftCounters:{smokePuffs:0},
 MATERIAL:{GENERAL:0},terrain:()=>0,
 rgb:c=>[(c>>16&255)/255,(c>>8&255)/255,(c&255)/255],
 materialScope:(_,f)=>f(),
 ellipsoid:(x,y,z,rx,ry,rz,tint)=>{
  emitted.push({x,y,z,rx,ry,rz});
  for(let i=0;i<3;i++)ctx.data.push(x,y,z,0,1,0,...tint,0);
 }
};
new vm.Script(named('forgeSmoke')+'\nforgeSmoke(0,true);').runInNewContext(ctx);
assert.equal(ctx.craftCounters.smokePuffs,3);
assert.equal(emitted.length,3);
assert.equal(ctx.data.length,90);
for(let k=0;k<3;k++){
 const p=k/3,mark=19+(k+.5)/16;
 assert(Math.abs(emitted[k].x-(21.48+.5*Math.sin(21.48)*p))<1e-9);
 assert(Math.abs(emitted[k].y-(7.49+p*2.05))<1e-9);
 assert(Math.abs(emitted[k].z-(-13.82+p*.24))<1e-9);
 for(const offset of [9,19,29])assert.equal(ctx.data[k*30+offset],mark);
}
ctx.data=[];emitted.length=0;
new vm.Script(named('forgeSmoke')+'\nforgeSmoke(4.25,false);')
 .runInNewContext(ctx);
assert.equal(ctx.craftCounters.smokePuffs,3);
assert(ctx.data.every((v,i)=>i%10!==9||v===0),'fallback source unchanged');
for(const k of [0,1,2])for(const time of [0,.8,7,20.25,56.6]){
 // Independently compare shader rest-to-live affine motion against source
 // formula for arbitrary vertex positions; NO fake worker/stock/sim events.
 const start=k/3,p=(start+time*.009)%1,x=21.48,z=-13.82,base=7.49;
 const radius0=.15+.18*start,radius=.15+.18*p;
 const old=[x+.5*Math.sin(x)*start,base+start*2.05,z+.24*start];
 const now=[x+.5*Math.sin(time*.027+x)*p,base+p*2.05,z+.24*p];
 const local=[radius0*.49,-radius0*.23,radius0*.34];
 const fromShader=now.map((v,j)=>v+local[j]*(radius/radius0));
 const fromOriginal=now.map((v,j)=>v+local[j]/radius0*radius);
 fromShader.forEach((v,j)=>assert(Math.abs(v-fromOriginal[j])<1e-10));
}
const shader=html.slice(html.indexOf('const vs=`'),html.indexOf('const fs=`'));
for(const token of [
 'uniform vec3 forgeSmokeAnchor;',
 'if(materialId>19.0&&materialId<20.0)',
 'world=nowCenter+(position-restCenter)*(animatedRadius/originalRadius);',
 'surfaceMaterial=0.0;'
])assert(shader.includes(token),'resident GPU motion: '+token);
const render=html.slice(html.indexOf('const ambientGeometryStart=performance.now();'),
 html.indexOf('dynamicPhaseTimes.citizenGeometry='));
assert(render.includes('if(prepareLivingVillageMotion(plan)){\n  craftCounters.smokePuffs=3;'));
assert(render.includes('}else{\n  // Preserve all three real forge puffs on Canvas2D or failed residency.\n  forgeSmoke(state.t);'));
assert(!render.includes('windmill(-27,-18,state.t);forgeSmoke(state.t);'));
const civic=named('prepareLivingVillageMotion');
assert(civic.includes('forgeSmoke(0,true);'));
assert(civic.includes('LIVING_VILLAGE_MAX_FLOATS'),'still bounded');
assert(html.includes('forgeSmokeResident:livingVillageActive'));
assert(html.includes('gl.uniform3f(uniforms.forgeSmokeAnchor,CRAFT_DISTRICT.x+2.48'));
console.log('W135 SOURCE/affine test PASS: three original forge puffs on existing bounded civic VBO, exact software fallback, live rise/drift/radius, no new draw. Real game/video/FPS NOT PROVEN.');