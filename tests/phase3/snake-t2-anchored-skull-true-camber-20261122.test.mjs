import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import { createSerpent } from '../../public/snake-stream/serpent.mjs';

const frozen = points => Object.freeze(points.map(([x,z]) => Object.freeze({x,z})));
const north = frozen([[0,0],[0,-1],[0,-2],[0,-3],[0,-4],[0,-5]]);
const east = frozen([[0,0],[-1,0],[-2,0],[-3,0],[-4,0],[-5,0]]);
const curved = frozen([[0,0],[-1,0],[-2,0],[-3,0],[-3,1],[-3,2],[-3,3],[-3,4],[-3,5],[-3,6]]);
const angleError = (a,b) => Math.atan2(Math.sin(a-b), Math.cos(a-b));
const publicOptions = { detail:'high',delta:1/60,runToken:'same-authoritative-run',danger:0,food:null };

test('RED: the main skull never turns away from its own contiguous public neck during a live right-angle transition', () => {
  const hero=createSerpent(THREE),head=hero.group.getObjectByName('Expressive head');
  const before=[JSON.stringify(north),JSON.stringify(east)];
  const initial=hero.stats();
  try {
    for(let f=0;f<12;f++) hero.update([north],{...publicOptions,direction:{x:0,z:1},time:f/60});
    hero.update([east],{...publicOptions,direction:{x:1,z:0},time:12/60});
    assert.ok(Math.abs(angleError(head.rotation.y,Math.PI/2))<=0.001,
      `skull/neck yaw must match the current genuine body tangent; received ${head.rotation.y}`);
    const pose=head.children[0];
    assert.ok(Math.abs(pose.rotation.y)<=0.20, 'bounded expressive face motion may not reintroduce a detached head');
    assert.deepEqual([JSON.stringify(north),JSON.stringify(east)],before,'public paths are immutable');
    for(const field of ['geometries','materials','textures','bufferBytes'])
      assert.equal(hero.stats()[field],initial[field],`changing public heading must not allocate ${field}`);
  }finally{hero.dispose();}
});

test('RED: bent body carries honest banked surface normals rather than shading a tilted cross-section as upright', () => {
  const hero=createSerpent(THREE);
  try {
    hero.update([curved],{...publicOptions,direction:{x:1,z:0},time:2.5});
    const geometry=hero.group.getObjectByName('Continuous sculpted serpent body').geometry;
    const normals=geometry.getAttribute('normal'),ringWidth=21,quarter=5;
    const count=Math.floor(geometry.getAttribute('position').count/ringWidth);
    const banked=[];
    for(let ring=0;ring<count;ring++){
      const i=ring*ringWidth+quarter;
      const x=normals.getX(i),z=normals.getZ(i),y=normals.getY(i);
      if(Math.hypot(x,z)>0.075) banked.push({ring,x,y,z});
      assert.ok(Number.isFinite(x+y+z),'complete ring normal must be finite');
    }
    assert.ok(banked.length>=3,
      `at least three truly banked body cross-sections need their matching normals; got ${banked.length}`);
    assert.equal(hero.stats().paths,1);
  }finally{hero.dispose();}
});

test('exact discontinuity and reduced-motion stillness preserve public orientation and real body topology',()=>{
  const hero=createSerpent(THREE);
  try{
    hero.update([north],{...publicOptions,direction:{x:0,z:1},time:0});
    hero.update([east],{...publicOptions,direction:{x:1,z:0},time:1,reducedMotion:true});
    const head=hero.group.getObjectByName('Expressive head');
    assert.ok(Math.abs(angleError(head.rotation.y,Math.PI/2))<0.001);
    assert.equal(head.children[0].rotation.z,0);
    hero.update([east,frozen([[12,8],[12,9],[13,9]])],{
      ...publicOptions,direction:{x:1,z:0},time:2,runToken:'after-real-portal'});
    assert.equal(hero.stats().paths,2,'no body may bridge portal fragments');
    assert.ok(Math.abs(angleError(head.rotation.y,Math.PI/2))<0.001);
  }finally{hero.dispose();}
});
