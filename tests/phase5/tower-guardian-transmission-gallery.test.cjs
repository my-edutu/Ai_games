'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const vis=name=>fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals',name),'utf8');
test('real, source-anchored guardian machine gallery is outboard and rearward',async()=>{
 const {GUARDIAN_TRANSMISSION_LAYOUT:d,observedGuardianTransmissionCorners:f}=await import('file://'+path.join(root,'public/infinite-tower-climb/visuals/guardian-transmission-layout.mjs'));
 assert.ok(d.counterweightX>=8&&d.counterweightX<12&&d.rearDepth<-1&&d.rearDepth>-4);
 assert.ok(d.overheadY>8&&d.capstanY>d.overheadY&&d.beamWidth>=2*d.counterweightX);
 const pts=f({x:0,y:2,z:27.78});
 assert.equal(pts.length,4);
 assert.ok(pts.every(p=>[p.x,p.y,p.z].every(Number.isFinite)));
 assert.ok(pts.every(p=>Math.abs(p.x)>=8.1&&p.z>23.5&&p.z<27));
 assert.ok(pts.some(p=>p.y===0)&&pts.some(p=>p.y>9));
 assert.equal(f(null),null);assert.equal(f({x:NaN,y:2,z:28}),null);
});
test('live three.js gallery shares actual positions with source-only combat lens',()=>{
 const world=vis('world.mjs'),scene=vis('scene.mjs');
 for(const key of ['counterweightX','rearDepth','overheadY','capstanY','beamWidth'])
   assert.ok(world.includes('GUARDIAN_TRANSMISSION_LAYOUT.'+key),'physical '+key);
 assert.match(world,/const socketY=carriage\.position\.y\+socket\.position\.y/);
 assert.match(world,/gate\.tension\.setMatrixAt/);
 assert.match(scene,/observedGuardianTransmissionCorners\(gate\)/);
 assert.match(scene,/view\.transmissionIntrusion\s*\*\s*54/);
 assert.match(scene,/view\.transmissionDominance\s*\*\s*40/);
 assert.match(world,/const unlocked=guardian\.active===false\s*&&/);
});
