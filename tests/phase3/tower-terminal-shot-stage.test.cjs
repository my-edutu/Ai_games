'use strict';
// Validate the REAL scene function, not a duplicate staged render mockup.
// This camera-only source test is not normal-speed footage, a critic, or FPS.
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const source = fs.readFileSync(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/scene.mjs'), 'utf8');
const start = source.indexOf('function composeTowerTerminalShot(');
const end = source.indexOf('\n// Evidence-only approximate core occlusion',start);
if(start<0||end<=start)throw new Error('Real camera stage was not found');
const THREE={Vector3:class {
  constructor(x,y,z){this.x=x;this.y=y;this.z=z;}
}};
const context={THREE,Math,Number,clamp:(x,a,b)=>Math.max(a,Math.min(b,x))};
vm.runInNewContext(source.slice(start,end)+'\nthis.shot=composeTowerTerminalShot;',context);
const shot=context.shot;
const radial=p=>Math.hypot(p.x,p.z);
const distance=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y,a.z-b.z);

test('source result presents exterior memorial before resolving on the physical climber',()=>{
  const hero={x:21,y:400,z:17};
  for(const aspect of [390/844,960/600]){
    const opening=shot(hero,aspect,1,0,0);
    const halfway=shot(hero,aspect,1,0,1.25);
    const closing=shot(hero,aspect,1,0,3);
    assert.equal(opening.stageProgress,0);
    assert.ok(halfway.stageProgress>0&&halfway.stageProgress<1);
    assert.equal(closing.stageProgress,1);
    assert.ok(distance(opening.position,closing.focus)>
      distance(halfway.position,closing.focus));
    assert.ok(distance(halfway.position,closing.focus)>
      distance(closing.position,closing.focus));
    assert.ok(radial(closing.position)>=radial(hero)+23.7);
    assert.ok([opening,halfway,closing].every(({position,focus})=>
      [...Object.values(position),...Object.values(focus)].every(Number.isFinite)));
    assert.equal(closing.focus.y,hero.y+2.1);
    assert.equal(hero.x,21);
    assert.equal(hero.y,400);
    assert.equal(hero.z,17);
  }
});

test('the full mobile orbit/zoom envelope never photographs through the solid core',()=>{
  for(const aspect of [390/844,960/600])for(const orbit of [-.5,0,.5]){
    for(const angle of [-Math.PI,-2,0,Math.PI/2]){
      const hero={x:Math.sin(angle)*27.35,y:15,z:Math.cos(angle)*27.35};
      const lens=shot(hero,aspect,1.35,orbit,2);
      const p=lens.position,q=lens.focus,dx=q.x-p.x,dz=q.z-p.z;
      const t=Math.max(0,Math.min(1,-(p.x*dx+p.z*dz)/(dx*dx+dz*dz)));
      assert.ok(Math.hypot(p.x+t*dx,p.z+t*dz)>=23.5,
        'the real climber cannot be hidden by the opaque tower core');
      assert.ok(radial(p)>=27.35);
    }
  }
});

test('reduced-motion and camera recovery keep a stable source-framed resolving shot',()=>{
  const hero={x:27.35,y:92,z:0};
  const first=shot(hero,390/844,1,0,0,true);
  const held=shot(hero,390/844,1,0,6,true);
  assert.deepEqual({...first.position},{...held.position});
  assert.deepEqual({...first.focus},{...held.focus});
  assert.equal(first.stageProgress,1);
  const wide=shot(hero,390/844,1.35,.5,6,true);
  assert.ok(radial(wide.position)>radial(first.position));
});

test('missing/nonfinite result geometry cannot create a false camera stage',()=>{
  const hero={x:0,y:10,z:28};
  for(const bad of [null,{x:NaN,y:1,z:1},{x:0,y:Infinity,z:30}])
    assert.equal(shot(bad,.46),null);
  for(const bad of [0,-1,Infinity,NaN])assert.equal(shot(hero,bad),null);
  assert.equal(shot(hero,.46,NaN),null);
  assert.equal(shot(hero,.46,1,NaN),null);
  assert.equal(shot(hero,.46,1,0,Infinity),null);
  assert.equal(shot(hero,.46,1,0,-100).stageProgress,0);
  assert.equal(shot(hero,.46,1,0,100).stageProgress,1);
});
