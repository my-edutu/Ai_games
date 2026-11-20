'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');

test('real noncolliding guardian hoist rails stay paired, outboard, behind the full-body corridor and attached to the original crown',async()=>{
  const {originalGuardianHoistPocketLoadPath}=await import('../../public/infinite-tower-climb/visuals/guardian-transmission-layout.mjs');
  const pockets=originalGuardianHoistPocketLoadPath();
  assert.deepEqual(pockets.map(p=>p.side),[-1,1]);
  for(const p of pockets) {
    assert.ok(Math.abs(p.x)>6.8 && Math.abs(p.x)<8);
    assert.ok(p.z<-3.9 && p.z>-4.4);
    assert.ok(Math.abs(p.crownAttachX)<Math.abs(p.x));
    assert.ok(p.centerY-p.height/2>5.2);
    assert.ok(p.topY>p.centerY && p.topY-p.centerY<p.height/2+.5);
  }
  const src=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  assert.match(src,/for\(const pocket of originalGuardianHoistPocketLoadPath\(\)\)/);
  assert.match(src,/GuardianSealHoistPocketLoadTie/);
  assert.match(src,/const unlocked=guardian\.active===false/);
  assert.match(src,/gate\.unlocked=unlocked&&\(!genuineWinch\|\|winchProgress>=1\)/);
});

test('original live guardian remains locked; only authenticated HP-zero winch progress opens and physically stores the SAME paired bronze wings',async()=>{
  const src=fs.readFileSync(path.resolve(__dirname,
    '../../public/infinite-tower-climb/visuals/world.mjs'),'utf8');
  const start=src.indexOf('export function sourceEarnedGuardianSealWingPose(');
  const end=src.indexOf('\n}',start);
  assert.ok(start>0 && end>start);
  // Evaluate only the unchanged pure production pose helper, with no mocked
  // portal, scripted player, fake snapshot or audiovisual acceptance claim.
  const pose=new Function(src.slice(start,end+2).replace(/^export\s+/,'')+
    '\nreturn sourceEarnedGuardianSealWingPose;')();
  const closed=pose(-1,0,false,0),alive=pose(-1,.72,false,0);
  const winching=pose(-1,.80,false,.4);
  const ready=pose(-1,1,true,1),mirror=pose(1,1,true,1);
  assert.equal(closed.x,0);assert.equal(closed.y,0);
  assert.ok(Math.abs(alive.x+1.785)<1e-8);
  assert.equal(alive.y,0,'injured but living guardian cannot hoist source-locked grille');
  assert.ok(winching.y>0 && winching.y<ready.y);
  assert.ok(Math.abs(winching.x)>Math.abs(pose(-1,.80,false,0).x));
  assert.ok(ready.y>=5.8 && Math.abs(ready.x)>6);
  assert.ok(ready.z<-1.9,'opened bronze leaves recede physically into rear pockets');
  // Real leaf steel is not its GROUP ORIGIN. A Y rotation with the wrong
  // sign carried 2.35m bars back across the camera despite the group
  // centroid being nominally behind the door. Check transformed steel
  // against the actual authored guide, both mirrored sides, with no scene
  // mock or fictitious rendered-frame claim.
  const {originalGuardianHoistPocketLoadPath}=await import('../../public/infinite-tower-climb/visuals/guardian-transmission-layout.mjs');
  const pockets=originalGuardianHoistPocketLoadPath();
  for(const guide of pockets){
    const side=guide.side;
    const damaged=pose(side,.8,false,0);
    const midWinch=pose(side,1,false,.5);
    const stored=pose(side,1,true,1);
    const realBar=(pose,localDistance)=>({
      x:pose.x+side*localDistance*Math.cos(pose.yaw)*Math.cos(pose.roll),
      z:pose.z-side*localDistance*Math.sin(pose.yaw)*Math.cos(pose.roll)
    });
    assert.equal(damaged.y,0,'living positive-HP cannot hoist the gate');
    assert.ok(midWinch.y>2 && midWinch.y<stored.y,
      'a genuine intermediate source winch must move real steel overhead');
    assert.ok(stored.y>5.5 && stored.y<6.6);
    const centroid=realBar(stored,2.35);
    assert.ok(centroid.z<-3.7,
      'unlocked original lattice must rotate behind the pedestrian/camera plane');
    assert.ok(Math.abs(centroid.z-guide.z)<.45 &&
      Math.abs(centroid.x-guide.x)<.45,
      'the actual rotated bronze centroid enters its original side guide');
    for(const localDistance of [1.54,2.35,2.9]){
      const steel=realBar(stored,localDistance);
      assert.ok(steel.z<-3.3 && Math.abs(steel.x)>6.7,
        'every original leaf upright must park in the outboard rear gallery');
    }
  }
  assert.equal(ready.x,-mirror.x);assert.equal(ready.y,mirror.y);
});
