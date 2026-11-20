'use strict';
const {test}=require('node:test'), assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');

test('real noncolliding guardian hoist rails stay paired, outboard, behind the full-body corridor and attached to the original crown',async()=>{
  const {originalGuardianHoistPocketLoadPath}=await import('../../public/infinite-tower-climb/visuals/guardian-transmission-layout.mjs');
  const pockets=originalGuardianHoistPocketLoadPath();
  assert.deepEqual(pockets.map(p=>p.side),[-1,1]);
  for(const p of pockets) {
    assert.ok(Math.abs(p.x)>6.8 && Math.abs(p.x)<8);
    assert.ok(p.z<-3 && p.z>-4);
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

test('original live guardian remains locked; only authenticated HP-zero winch progress opens and physically stores the SAME paired bronze wings',()=>{
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
  assert.equal(ready.x,-mirror.x);assert.equal(ready.y,mirror.y);
});
