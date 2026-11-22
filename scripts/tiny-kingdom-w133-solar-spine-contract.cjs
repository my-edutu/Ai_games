'use strict';
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const source=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const functionSource=name=>{
 const mark='function '+name+'(';
 const first=source.indexOf(mark);
 assert.notEqual(first,-1,'Missing genuine playable '+name);
 assert.equal(source.indexOf(mark,first+1),-1,'Duplicated '+name);
 const last=source.indexOf('\n}',first);
 assert.ok(last>first,'Unclosed '+name);
 return source.slice(first,last+2);
};
const solar=new vm.Script('const SOLAR_SHADOW_STEP_HOURS=.5;\n'+
 functionSource('solarShadowStage')+'\nsolarShadowStage').runInNewContext({});
for(const [time,bucket,center] of [
 [0,0,.25],[.499999,0,.25],[.5,1,.75],[7.49,14,7.25],
 [7.5,15,7.75],[23.999,47,23.75],[24,0,24.25],[48,0,48.25],
 [-.001,47,-.25]
]){
 const actual=solar(time);
 assert.equal(actual.bucket,bucket,'solar bucket '+time);
 assert.ok(Math.abs(actual.centerTime-center)<1e-8,'stable centre '+time);
}
assert.throws(()=>solar(Number.NaN),/Invalid shadow stage time/);
const shadow=source.slice(source.indexOf('function directionalCastShadows(time){'),
 source.indexOf('\n}\n',source.indexOf('function directionalCastShadows(time){'))+2);
assert.match(shadow,/const staticSun=sunShadow\(stage\.centerTime\)/);
assert.match(shadow,/const key=\[stage\.bucket,climate\.season,climate\.weather,topology\]/);
assert.match(shadow,/solarShadowCache\.size>=SOLAR_SHADOW_MAX_ENTRIES/);
assert.match(shadow,/solarShadowCachedFloats\+len>SOLAR_SHADOW_MAX_FLOATS/);
assert.match(shadow,/buffer=recycled\?\.buffer\|\|null/);
assert.match(shadow,/if\(buffer\)solarShadowGpuHandleReuses\+\+/);
assert.match(shadow,/gl\.bufferSubData\(gl\.ARRAY_BUFFER,0,vertices\)/);
assert.match(shadow,/gl\.deleteBuffer\(obsolete\.buffer\)/);
assert.match(shadow,/shadowPatch\(p\.x,p\.z,\.20,\.14,1\.1,sun,true,6\)/,
 'Actual citizens must retain per-frame live physical contact shadows');
for(const name of ['shadowPatch(x,z,width,length,2.4,staticSun,true)',
 'shadowPatch(tree.x,tree.z,.71*tree.s,.63*tree.s,2.7*tree.s,staticSun,false)'])
 assert.ok(shadow.includes(name),'Static original geometry must use stable light '+name);
assert.match(source,/gpuBufferHandleReuses:solarShadowGpuHandleReuses/);
assert.match(source,/solarStepHours:SOLAR_SHADOW_STEP_HOURS/);
const actor={
 follow:false,liveWorkday:false,document:{body:{dataset:{workday:'off'}}},
 lastFollowShot:null,people:[{x:6,z:-2}],selectedCitizen:0,
 focusPoint:[9,4],terrain:(x,z)=>x*.11+z*.03
};
const target=new vm.Script(functionSource('currentPhysicalFollowTarget')+
 '\ncurrentPhysicalFollowTarget').runInNewContext(actor);
const same=(p,expected)=>{assert.equal(p.length,3);p.forEach((v,i)=>
 assert.ok(Math.abs(v-expected[i])<1e-9,'camera component '+i+': '+v+' vs '+expected[i]))};
same(target(),[9,.25,4]);
actor.follow=true;actor.liveWorkday=true;
actor.lastFollowShot={target:[5.3,2.6,7.4]};
same(target(),[8.3,actor.terrain(9,4)+2.6-actor.terrain(6,-2),13.4]);
actor.liveWorkday=false;actor.document.body.dataset.workday='delivery';
same(target(),[8.3,actor.terrain(9,4)+2.6-actor.terrain(6,-2),13.4]);
actor.document.body.dataset.workday='off';
same(target(),[9,actor.terrain(9,4)+1.02,4]);
assert.match(source,/function citizenDetailCameraFrame\(\)\{[\s\S]{0,1800}currentPhysicalFollowTarget\(\)/);
assert.match(source,/const workTarget=currentPhysicalFollowTarget\(\)/);
assert.equal((source.match(/const workTarget=currentPhysicalFollowTarget\(\)/g)||[]).length,1);
const scripts=[...source.matchAll(/<script\b[^>]*>([\s\S]*?)<\/script>/gi)]
 .map(row=>row[1]).filter(body=>body.includes('function directionalCastShadows('));
assert.equal(scripts.length,1,'One original playable WebGL game script');
new vm.Script(scripts[0],{filename:'tiny-kingdom-live-game.js'});
console.log('W133 source contract PASS: deterministic half-hour static sun stages, 4-entry bounded reusable GPU shadow handles, unchanged live citizen footprints, same physical WebGL/LOD worker aim, complete playable JavaScript parse. Real browser/GPU/FPS/visual A-B remain unproven.');