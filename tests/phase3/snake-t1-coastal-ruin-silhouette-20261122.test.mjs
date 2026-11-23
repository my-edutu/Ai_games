import test from 'node:test';
import assert from 'node:assert/strict';
import * as THREE from 'three';
import {createWorld,sculptCopeStone,sampleTidalTerraceRelief} from '../../public/snake-stream/world.mjs';

const boards=[[8,8],[28,16],[40,24]];
const samples=(width,height,edge)=>{
  const extent=edge<2?width:height;
  const W=width/2,H=height/2;
  return Array.from({length:extent},(_,i)=>{
    const along=i+.5, stone=sculptCopeStone(width,height,edge,along);
    const x0=edge<2?along-W:edge===2?-W-1:W+1;
    const z0=edge<2?edge===0?-H-1:H+1:along-H;
    return {stone,relief:sampleTidalTerraceRelief(width,height,Math.atan2(z0,x0)),
      outward:edge<2?Math.abs(stone.z)-H:Math.abs(stone.x)-W};
  });
};

test('T1 entire four-shore coping follows the real native cape/inlet rather than another rigid rectangle',()=>{
  for(const [width,height] of boards){
    for(let edge=0;edge<4;edge++){
      const cells=samples(width,height,edge);
      const outward=cells.map(c=>c.outward), elevation=cells.map(c=>c.stone.y);
      assert.ok(outward.every(x=>Number.isFinite(x) && x>=.32 && x<2.7),'stone remains outside gameplay without a fake outer bridge');
      assert.ok(Math.max(...outward)-Math.min(...outward)>.86,
        `${width}x${height} shore ${edge} must include whole-landform inlets and headlands`);
      assert.ok(Math.max(...elevation)-Math.min(...elevation)>.17,
        `${width}x${height} shore ${edge} must have raised old capes and worn tidal bays`);
      for(const {stone} of cells) assert.ok([stone.x,stone.y,stone.z,stone.sx,stone.sy,stone.sz,stone.ry].every(Number.isFinite));
    }
  }
});

test('T1 visible high capes are genuinely aligned to the shared four-shore eroded terrain relief',()=>{
  for(const [width,height] of [[28,16],[40,24]]) for(let edge=0;edge<4;edge++){
    const s=samples(width,height,edge);
    const capes=s.filter(x=>x.relief.cape>.75 && x.relief.inlet<.2);
    const inlets=s.filter(x=>x.relief.inlet>.75 && x.relief.cape<.2);
    assert.ok(capes.length>0 && inlets.length>0,`board ${width}x${height} edge ${edge} must contain authentic landforms`);
    const mean=a=>a.reduce((s,x)=>s+x,0)/a.length;
    assert.ok(mean(capes.map(x=>x.outward))>mean(inlets.map(x=>x.outward))+.52,
      `edge ${edge}: stony cape must be farther outboard than coves`);
    assert.ok(mean(capes.map(x=>x.stone.y))>mean(inlets.map(x=>x.stone.y))+.1,
      `edge ${edge}: ancient stone coping follows raised cape vs tidal basin`);
  }
});

test('T1 native four-shore world preserves original renderer batch and complete legal contact cells',()=>{
  for(const [width,height] of boards){
    const world=createWorld(THREE,{width,height});
    const meshes=[];
    world.group.traverse(o=>{if(o.isMesh)meshes.push(o)});
    assert.equal(world.stats().staticMeshes,13,'complete original stone/forest/sculpture batches remain');
    assert.equal(world.stats().textures,4,'all original world texture resources remain');
    assert.ok(meshes.length>=13,'full native world with physical coast remains');
    world.dispose();
  }
});
