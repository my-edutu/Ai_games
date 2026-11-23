'use strict';
// November 4 T1: the continuous island underneath the game is not a visual
// improvement if the old rectangular masonry apron still hides its shoreline.
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const root = path.resolve(__dirname, '../..');
const current = () => fs.readFileSync(path.join(root, 'public/snake-stream/world.mjs'), 'utf8');

test('T1 coast stage replaces the two visibly straight rear blocks and opens the stacked rectangular masonry apron', async () => {
  const source = current();
  assert.match(source, /export function sculptCoastCourse\(/);
  assert.match(source, /export function sculptCopeStone\(/);
  assert.doesNotMatch(source, /add\(cube,cliff,0,-1\.55,-H-2\.2,width\+2\.6,2\.8,4\.5\)/);
  assert.doesNotMatch(source, /add\(cube,moss,0,-\.3,-H-2\.2,width\+2\.9,\.24,4\.55\)/);
  assert.match(source, /add\(rock,cliff,.*-H-3\.1/);
  assert.match(source, /coastalBreak = sculptCoastCourse/);
  assert.match(source, /coping = sculptCopeStone/);
  assert.match(fs.readFileSync(path.join(root, 'tests/browser/snake-stream.spec.cjs'), 'utf8'),
    /expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
});

test('T1 coastal massing is seeded from positions, protects every board cell and has broad real irregular silhouette', async () => {
  const THREE = await import('three');
  const { createWorld, sculptCoastCourse, sculptCopeStone } = await import('../../public/snake-stream/world.mjs');
  const baseline = await import('data:text/javascript;base64,'+Buffer.from(
    fs.readFileSync(path.join(root, 'tests/fixtures/snake-t1-before-exposed-coast-831.mjs'), 'utf8')
  ).toString('base64'));
  for (const [width,height] of [[8,8],[28,16],[40,24]]) {
    const original = baseline.createWorld(THREE,{width,height});
    const candidate = createWorld(THREE,{width,height});
    try {
      const a=original.stats(),b=candidate.stats();
      for(const k of ['staticInstances','staticMeshes','drawObjects','geometries','materials','textures'])
        assert.equal(b[k],a[k],'all original static budget and geometry for '+width+'x'+height+': '+k);
      const W=width/2,H=height/2;
      for(let edge=0;edge<4;edge++)for(let tier=0;tier<3;tier++){
        const len=edge<2?width+2:height+2;
        const xs=[];
        for(let i=0;i<len;i+=1.6){
          const p=sculptCoastCourse(width,height,edge,tier,i);
          assert.ok(Object.values(p).every(Number.isFinite));
          const outward=edge===0?-p.z-H:edge===1?p.z-H:edge===2?-p.x-W:p.x-W;
          const halfDepth=edge<2?p.sz/2:p.sx/2;
          assert.ok(outward-halfDepth>.2,'no stone or shadow intrudes into public gameplay cells');
          assert.ok(p.y+p.sy/2<.17,'real stone band never overtops the playable grid');
          xs.push(outward);
        }
        assert.ok(Math.max(...xs)-Math.min(...xs)>.28,'whole course needs true broken contour, not old straight rail');
      }
      for (const edge of [0,1,2,3]){
        const samples=[];const len=edge<2?width:height;
        for(let i=0;i<len;i++){
          const p=sculptCopeStone(width,height,edge,i+.5);
          assert.ok(Object.values(p).every(Number.isFinite));
          const outward=edge===0?-p.z-H:edge===1?p.z-H:edge===2?-p.x-W:p.x-W;
          const depth=edge<2?p.sz/2:p.sx/2;
          assert.ok(outward-depth>.03,'coping remains exterior and safe for real cells');
          samples.push(outward);
        }
        assert.ok(Math.max(...samples)-Math.min(...samples)>.1,'coping silhouette is physically irregular');
      }
      const immutable=Object.freeze({portals:Object.freeze([{entry:3,exit:width*height-2}]),
        obstacles:Object.freeze([width+1]),hazards:Object.freeze([{cell:5,active:true}]),
        food:Object.freeze({cell:width+2,kind:'normal'})});
      original.update(immutable,{time:1});candidate.update(immutable,{time:1});
      assert.equal(candidate.stats().portalEnds,original.stats().portalEnds);
      assert.equal(candidate.stats().hazards,original.stats().hazards);
      assert.equal(candidate.stats().obstacles,original.stats().obstacles);
    } finally {original.dispose();candidate.dispose();}
  }
});
