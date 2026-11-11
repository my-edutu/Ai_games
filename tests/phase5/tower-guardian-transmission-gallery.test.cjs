'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const vis=name=>fs.readFileSync(path.join(root,'public/infinite-tower-climb/visuals',name),'utf8');
test('real, source-anchored guardian machine gallery is outboard and rearward',async()=>{
 const {GUARDIAN_TRANSMISSION_LAYOUT:d,observedGuardianTransmissionCorners:f}=await import('file://'+path.join(root,'public/infinite-tower-climb/visuals/guardian-transmission-layout.mjs'));
 assert.ok(d.counterweightX>=8&&d.counterweightX<12&&d.rearDepth<-1&&d.rearDepth>-4);
 assert.ok(d.overheadY>8&&d.capstanY>d.overheadY&&d.beamWidth>=2*d.counterweightX);
 // All suspended mechanical pieces must clear the genuine 0..4.8m duel,
 // including the counterweights after a MAXIMUM source-HP release of 2.35m.
 assert.ok(d.railCenterY-d.railHeight/2>5.1,'rail must not enter the combat passage');
 assert.ok(d.weightCenterY-1.4/2-2.35>5,'full-open hanging weight clears both combatants');
 assert.ok(d.socketY-2.35>6&&d.socketY<d.overheadY,
   'HP-linked cable remains physically suspended from the real pulley');
 assert.ok(d.cameraLowerY>=5&&d.cameraLowerY<d.railCenterY&&
   d.cameraTopY>=d.overheadY,'camera cannot use vanished ground-height rails');
 const pts=f({x:0,y:2,z:27.78});
 assert.equal(pts.length,4);
 assert.ok(pts.every(p=>[p.x,p.y,p.z].every(Number.isFinite)));
 assert.ok(pts.every(p=>Math.abs(p.x)>=8.1&&p.z>23.5&&p.z<27));
 assert.ok(pts.every(p=>p.y>=d.cameraLowerY));
 assert.ok(pts.some(p=>p.y===d.cameraLowerY)&&pts.some(p=>p.y===d.cameraTopY),
   'camera measured corners must surround the actual raised winch and cables');
 assert.equal(f(null),null);assert.equal(f({x:NaN,y:2,z:28}),null);
});
test('live three.js gallery shares actual positions with source-only combat lens',()=>{
 const world=vis('world.mjs'),scene=vis('scene.mjs');
 for(const key of ['counterweightX','rearDepth','overheadY','capstanY','beamWidth'])
   assert.ok(world.includes('GUARDIAN_TRANSMISSION_LAYOUT.'+key),'physical '+key);
 for(const dim of ['railCenterY','railHeight','weightCenterY','socketY'])
   assert.ok(world.includes('GUARDIAN_TRANSMISSION_LAYOUT.'+dim),
     'real Three.js mass is sourced from the common raised gallery '+dim);
 assert.match(world,/const socketY=carriage\.position\.y\+socket\.position\.y/);
 assert.match(world,/gate\.tension\.setMatrixAt/);
 assert.match(scene,/observedGuardianTransmissionCorners\(gate\)/);
 assert.match(scene,/view\.transmissionIntrusion\s*\*\s*54/);
 assert.match(scene,/view\.transmissionDominance\s*\*\s*40/);
 assert.match(world,/const unlocked=guardian\.active===false\s*&&/);
});
