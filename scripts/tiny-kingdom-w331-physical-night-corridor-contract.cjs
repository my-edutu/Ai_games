'use strict';
// W331: the original farm->market->inhabited cottage night walk must read
// from its actual four posts and at most two true routed wrist lights.
// This is a source contract, NOT a hardware performance or visual PASS.
const assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const shader=html.split('const fs=`')[1]?.split('`;')[0];
assert.ok(shader,'Original fragment shader must remain present');
const source=(needle)=>assert.ok(html.includes(needle),'Missing actual production contract: '+needle);
source('float livedInLanternPool(');
source('vec3 toLamp=lightPos-surface;');
source('if(distanceSq>radiusSq)return 0.;');
source('const preferredCarrier=follow?people[selectedCitizen]:null;');
source('priority:p===preferredCarrier?0:1');
assert.match(html,/\.sort\(\(a,b\)=>a\.priority-b\.priority\|\|a\.distance-b\.distance/);
assert.match(shader,/float livedInLanternPool\(vec3 lightPos,vec3 normal,vec3 surface,float radiusSq\)/);
assert.match(shader,/float roofGate=1\.-smoothstep\(\.0,1\.2,surface\.y-lightPos\.y\)/);
assert.match(shader,/float bounce=vMaterial<4\.5\?\.16:\.025;/);
assert.match(shader,/dot\(normal,toLamp\*inversesqrt\(max\(distanceSq,\.0001\)\)\)/);
assert.match(shader,/if\(sunStrength<\.47 && vMaterial<9\.0\)/);
assert.match(shader,/livedInLanternPool\(villageLanterns\[li\]\.xyz,n,vWorld,27\.04\)/);
assert.match(shader,/livedInLanternPool\(commuterLanterns\[ci\]\.xyz,n,vWorld,13\.69\)/);
assert.doesNotMatch(shader,/smoothstep\(1\.0,56\.25/,'Broad non-directional lamp fog is forbidden');
assert.doesNotMatch(shader,/float face=\.67\+\.33/,'Light cannot follow an unrelated global direction');
assert.match(shader,/c\+=vec3\(\.34,\.195,\.085\)\*min\(lamplight,\.80\)\*night;/);
const smooth=(a,b,x)=>{const t=Math.min(1,Math.max(0,(x-a)/(b-a)));return t*t*(3-2*t)};
function mirror(light,surface,normal,radiusSq,material=8){
 const dx=light[0]-surface[0],dy=light[1]-surface[1],dz=light[2]-surface[2];
 const d2=dx*dx+dy*dy+dz*dz;if(d2>radiusSq)return 0;
 const l=Math.max(Math.sqrt(d2),.01),face=Math.max(0,(dx*normal[0]+dy*normal[1]+dz*normal[2])/l);
 const roofGate=1-smooth(0,1.2,surface[1]-light[1]),bounce=material<4.5?.16:.025;
 return (1-smooth(.35,radiusSq,d2))*roofGate*(bounce+(1-bounce)*face);
}
const lamp=[0,1.8,0],wall=[2,1.0,0];
assert.ok(mirror(lamp,wall,[-1,0,0],27.04)>mirror(lamp,wall,[1,0,0],27.04)*10,
 'Actual near-facing wall must be substantially more lit than its back side');
assert.equal(mirror(lamp,[0,3.1,0],[0,1,0],27.04),0,'Roofs high above a lamp cannot glow from it');
assert.equal(mirror(lamp,[6,0,0],[0,1,0],27.04),0,'Old 7.5m floodlight is no longer legal');
assert.ok(mirror(lamp,[1,0,0],[0,1,0],27.04,3)>0,'Street under a real lamp remains visible');
console.log('W331 truthful surface-facing local pool, raised roof restraint and selected real-carrier contract PASS; real browser/hardware and G088 experience NOT PROVEN.');
