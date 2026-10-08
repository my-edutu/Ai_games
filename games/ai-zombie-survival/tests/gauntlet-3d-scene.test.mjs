import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame } from '../dist/index.js';
import { decorateBuilding, decorateWorld } from '../web/scene-art.js';
import { decorateActor } from '../web/actor-art.js';

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
    const m=new GeometryAudit(),original=g.zombies.find(z=>z.archetype===archetype);
    assert.ok(original);
    decorateActor(m,original,true,1,archetype==='brute'?1.34:1);
    assert.ok(m.calls>=5&&m.calls<60);
    return [...m.colors].sort().join(',');
  });
  assert.equal(new Set(zombieVariants).size,3,'mutant variants require individually readable silhouettes');
});
