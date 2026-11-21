'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
test('W424 original 2D atmosphere stops vertical sky pillars without allocating another world mesh',()=>{
 const begin=html.indexOf('const skyFragmentSource='),end=html.indexOf('let skyAtmosphereProgram=',begin);
 assert.ok(begin>0&&end>begin);
 const source=html.slice(begin,end);
 for(const fragment of ['float along=sin(', 'float across=sin(', 'float broken=sin(',
  'min(.85,skyCloud*.54)', 'vec3 cloudTone='])assert.ok(source.includes(fragment),fragment);
 assert.doesNotMatch(source,/float wave=sin\(skyUv\.x\*13\.5/);
 assert.ok(!source.includes('new Float32Array(')&&!source.includes('gl.createBuffer()'));
});
test('W424 original seeded wheat leaf remains exactly two-sided and preserves every real planting root',()=>{
 const a=html.indexOf('function rootedLanceolateGrainBlade(');
 const b=html.indexOf('function farmStalk(',a);
 assert.ok(a>0&&b>a);
 const scope=html.slice(a,b);
 assert.match(scope,/const width=\.024\+\.015\*/);
 assert.doesNotMatch(scope,/Math\.random|people\.push|state\./);
 const triangles=[];
 const context={Math,tri:(x,y,z,c)=>{for(const v of [x,y,z])for(const n of v)
  assert.ok(Number.isFinite(n));triangles.push([x,y,z,c]);}};
 vm.createContext(context);vm.runInContext(scope,context,{timeout:1500});
 const anchor=[19.4,1.1,1.3],heading=[.40,.91];
 context.rootedLanceolateGrainBlade(anchor,.22,1,heading,[.5],[.3],true,7);
 assert.equal(triangles.length,4);
 assert.ok(triangles[0].some(p=>p===anchor));
 triangles.length=0;
 context.rootedLanceolateGrainBlade(anchor,.22,-1,heading,[.5],[.3],false,7);
 assert.equal(triangles.length,2);
 assert.ok(triangles[0].some(p=>p===anchor));
});
test('W424 390px farmer orbit now favors planted work instead of giant sky, without bypassing physical collision',()=>{
 const begin=html.indexOf('function planCitizenCamera('),end=html.indexOf('function observedWorkdayCameraPlan(',begin);
 assert.ok(begin>0&&end>begin);
 const code=html.slice(begin,end);
 assert.match(code,/realFarmWork\?\.41:\.27/);
 assert.match(code,/portraitLens\?\[\.29,\.41,\.54,\.65\]/);
 assert.match(code,/physicalFollowEyeClearance\(eye,roofs\)/);
 assert.match(code,/followRayBlockers\(eye,target,roofs\)/);
 assert.doesNotMatch(code,/citizen\.activity\s*=(?!=)|state\.food\s*=(?!=)|Math\.random/);
});
