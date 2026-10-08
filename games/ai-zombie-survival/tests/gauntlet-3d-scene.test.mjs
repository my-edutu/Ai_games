import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../dist/index.js';
import { decorateBuilding, decorateWorld } from '../web/scene-art.js';
import { decorateActor } from '../web/actor-art.js';
import { decorateSetpieces } from '../web/world-setpieces.js';
import { clearCamera } from '../web/camera-rig.js';
import { decorateTacticalWorld } from '../web/world-overlays.js';
import { drawEnvironmentVfx } from '../web/environment-vfx.js';

class GeometryAudit {
  constructor(){this.calls=0;this.colors=new Set();this.byKind=new Map();}
  record(kind,values,color){
    for(const value of values)assert.ok(Number.isFinite(value),'Nonfinite '+kind+' coordinate');
    assert.ok(typeof color==='string'&&/^#[a-fA-F0-9]{6}$/.test(color),'Invalid color '+color);
    this.calls++;
    this.colors.add(color.toLowerCase());
    this.byKind.set(kind,(this.byKind.get(kind)||0)+1);
  }
  box(x,y,z,w,h,d,color,yaw=0){
    assert.ok(w>0&&h>0&&d>0,'Degenerate district geometry');
    this.record('box',[x,y,z,w,h,d,yaw],color);
  }
  cylinder(x,y,z,r,h,color,n=8){
    assert.ok(r>0&&h>0&&n>=3);
    this.record('cylinder',[x,y,z,r,h,n],color);
  }
  ball(x,y,z,r,color){
    assert.ok(r>0);this.record('ball',[x,y,z,r],color);
  }
  bone(start,end,width,color){
    assert.equal(start.length,3);assert.equal(end.length,3);assert.ok(width>0);
    this.record('bone',[...start,...end,width],color);
  }
  contactShadow(x,z,rx,rz,color,height=.115){
    assert.ok(rx>0&&rz>0);this.record('contactShadow',[x,z,rx,rz,height],color);
  }
}
function runCity(state){
  const before=JSON.stringify(state),mesh=new GeometryAudit();
  for(const building of state.buildings)decorateBuilding(mesh,building,state);
  decorateWorld(mesh,state);
  assert.equal(JSON.stringify(state),before,'Renderer must never mutate authoritative simulation');
  return mesh;
}

test('3D city art is rich, deterministic, bounded and never changes the authoritative game',()=>{
  const state=createGame({seed:2026,zombieCount:90});
  const first=runCity(state),again=runCity(state);
  assert.ok(first.calls>600,'City art must include materially distinct architecture and street props');
  assert.ok(first.calls<6000,'City art must be geometry-budgeted');
  assert.equal(again.calls,first.calls);
  assert.deepEqual([...again.colors].sort(),[...first.colors].sort());
  assert.ok(first.colors.size>=17,'Scene palette must not collapse to a dull monochrome world');
  assert.ok(first.colors.has('#48dbdc'),'Safehouse must have luminous signal accents');
  assert.ok(first.byKind.get('contactShadow')>=4,'Environment must have visual grounding');
});

test('interior cutaways and emergency night ambience remain safe and visibly distinct',()=>{
  const state=createGame({seed:99,zombieCount:18});
  const building=state.buildings.find(b=>b.kind!=='safehouse');
  building.roofVisible=false;
  const interior=runCity(state);
  const dayPalette=[...interior.colors].sort();
  state.time.phase='night';
  const night=runCity(state);
  assert.ok(night.calls>500);
  assert.notDeepEqual([...night.colors].sort(),dayPalette,
    'Night should affect world lighting accents rather than only HUD labels');
});

test('extreme roof and weather states cannot produce invalid or unbounded geometry',()=>{
  const state=createGame({seed:709,zombieCount:260});
  state.buildings.forEach((b,i)=>{if(i%2===0&&b.kind!=='safehouse')b.roofVisible=false;});
  state.weather={kind:'storm',intensity:1};
  const mesh=runCity(state);
  assert.ok(mesh.calls>400&&mesh.calls<6000);
});

test('3D survivor classes and infected variants receive distinctive bounded cosmetic equipment',()=>{
  const g=createGame({seed:44,zombieCount:40});
  const survivors=g.survivors.slice(0,6).map(s=>{const m=new GeometryAudit();decorateActor(m,s,false,12,1);return m;});
  assert.ok(survivors.every(m=>m.calls>=12&&m.calls<90));
  assert.ok(survivors.some(m=>m.colors.has('#d55b67')||m.colors.has('#d7ebdf')));
  const zombieVariants=['brute','runner','shambler'].map(archetype=>{
    const m=new GeometryAudit(),original={...g.zombies[0],archetype,health:70};
    decorateActor(m,original,true,1,archetype==='brute'?1.34:1);
    assert.ok(m.calls>=5&&m.calls<60);
    return [...m.colors].sort().join(',');
  });
  assert.equal(new Set(zombieVariants).size,3,'mutant variants require individually readable silhouettes');
});

test('Gauntlet setpieces supply readable unique city silhouettes within finite visual geometry budget',()=>{
  const m=new GeometryAudit();decorateSetpieces(m);
  assert.ok(m.calls>=110&&m.calls<1100,'landmark geometry budget must remain bounded');
  assert.ok(m.colors.has('#ffc65b')&&m.colors.has('#59e8e0')&&m.colors.has('#fa6a57'),
    'Landmarks require distinct warning, rescue and medical hues');
  assert.ok(m.byKind.get('bone')>5,'Industrial skyline should contain three-dimensional latticework');
});

test('third-person camera avoids opaque architecture without touching game state',()=>{
  const buildings=[{x:0,y:5,w:5,h:5,floors:4,roofVisible:true,kind:'apartment'}];
  const focus=[0,1.5,0],eye=[0,7.5,15];
  const camera=clearCamera(focus,eye,buildings);
  assert.ok(camera[2]<eye[2],'Camera must shorten against an occluding building');
  assert.ok(camera[2]>2,'Camera should preserve character framing and not collapse into target');
  assert.deepEqual(clearCamera(focus,eye,[]),eye,'Open view must preserve intended framing');
  assert.deepEqual(clearCamera(focus,eye,[{...buildings[0],roofVisible:false}]),eye,'Cutaways should not obstruct view');
});

test('world-space objectives, threatened survivors and rescue signals remain read-only and bounded',()=>{
  const g=createGame({seed:312,zombieCount:180});
  g.survivors[0].health=27;g.survivors[0].infection=58;
  g.barricades[0].hp=g.barricades[0].maxHp*.2;
  const before=JSON.stringify(g);
  const m=new GeometryAudit();
  decorateTacticalWorld(m,g,4,0,0);
  assert.ok(m.calls>20&&m.calls<600,'markers should be visible yet bounded');
  assert.ok(m.colors.has('#ff6d78'),'crisis needs a vivid marker');
  assert.ok(m.colors.has('#ffe397')||m.colors.has('#55ffcf')||m.colors.has('#77d7fc'));
  assert.equal(JSON.stringify(g),before,'World-space UI is presentation-only');
});

test('cinematic burning buildings, damage particles and warning strobes are deterministic presentation only',()=>{
  const g=createGame({seed:118,zombieCount:180});
  const damaged=g.buildings.filter(b=>b.kind!=='safehouse').slice(0,4);
  damaged.forEach(b=>{b.damage=.72;});
  g.time.phase='night';
  const original=JSON.stringify(g);
  const one=new GeometryAudit(),two=new GeometryAudit();
  drawEnvironmentVfx(one,g,12.5,damaged[0].x,damaged[0].y);
  drawEnvironmentVfx(two,g,12.5,damaged[0].x,damaged[0].y);
  assert.ok(one.calls>12&&one.calls<450,'effect mesh must remain finite and bounded');
  assert.equal(one.calls,two.calls);
  assert.ok(one.colors.has('#ffad5c'),'burning ruins should have visible thermal highlights');
  assert.ok(one.colors.has('#44555d'),'damaged structures should have smoldering smoke');
  assert.equal(JSON.stringify(g),original,'visual VFX may not touch authoritative AI/survival state');
});
