'use strict';
// Source-authentic post-guardian landing seam. These are gameplay integrity
// checks, not cinematic/LOOKS-FEELS-PLAYS acceptance votes.
// Requires npm run build before node --test.
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {TowerRuntime}=require('../../dist/games/infinite-tower-climb/src/runtime/run.js');
const {generateTowerChunk,guardianArenaClearanceX}=
  require('../../dist/games/infinite-tower-climb/src/generation/chunks.js');
const {validateTowerChunk}=
  require('../../dist/games/infinite-tower-climb/src/generation/validator.js');
const {parseTowerConfig}=
  require('../../dist/games/infinite-tower-climb/src/config/schema.js');
const {STREAM_CONFIG}=require('../../scripts/serve-tower-stream.cjs');

const config=parseTowerConfig({...STREAM_CONFIG,launchFloor:8});
const seed='tower-transformation-capture-v1';
const capTop=(floor,c)=>floor*c.chunkHeight+c.chunkHeight-28000+12000;

test('actual successor solid roof and spawn meet the preceding earned cap without a 28k height pop',()=>{
  const previous=generateTowerChunk(config,seed,8);
  const next=generateTowerChunk(config,seed,9);
  const cap=previous.platforms.find(p=>p.id==='f8:cap');
  const ground=next.platforms.find(p=>p.id==='f9:ground');
  const step=next.platforms.find(p=>p.id==='f9:gateway-step');
  assert.ok(cap&&ground&&step,'the real generated encounter and follow-on route are required');
  assert.equal(cap.y+cap.height,capTop(8,config));
  assert.equal(ground.y+ground.height,cap.y+cap.height,
    'next-floor collider joins the old actual cap collision roof');
  assert.equal(next.spawn.y-config.playerHalfHeight,ground.y+ground.height,
    'source spawn and the moving body cannot disagree about the floor');
  assert.ok(next.spawn.y<9*config.chunkHeight+12000+config.playerHalfHeight,
    'the original higher successor ground would recreate the observed Y jump');
  assert.ok(step.y>ground.y+ground.height,'ordinary physical climb survives');
  assert.equal(validateTowerChunk(next,config).valid,true,
    'the generated successor still has a verifiable legal ascent');
});

test('earned real cap crossing retains whole body Y, grounded support, forward X and checkpoint',()=>{
  const runtime=TowerRuntime.create(config,seed,{policy:'autonomous'});
  const initial=runtime.state;
  const previous=initial.chunks.find(c=>c.floor===8);
  const cap=previous.platforms.find(p=>p.id==='f8:cap');
  const guardian=initial.enemies.find(e=>e.floor===8&&e.kind==='guardian');
  assert.ok(cap&&guardian);
  const x=guardianArenaClearanceX(cap,initial.player.halfWidth)+1000;
  const y=cap.y+cap.height+initial.player.halfHeight;
  assert.ok(x+initial.player.halfWidth<cap.x+cap.width);
  initial.player.position={x,y};
  initial.player.velocity={x:0,y:0};
  initial.player.state='standing';
  initial.player.grounded=true;
  initial.player.groundedPlatformId=cap.id;
  initial.player.health=Math.max(2,initial.player.health);
  guardian.active=false;guardian.health=0;
  initial.enemies=[guardian];
  initial.projectiles=[];initial.pickups=[];
  previous.hazards=[];
  const snapshotBefore=structuredClone(initial);
  runtime.step({move:0,jump:false,dash:false,attack:false,ability:false});
  const after=runtime.state;
  assert.equal(after.floor,9,'only authentic source rules earn the floor');
  assert.equal(after.player.position.x,x,'the real doorway does not relocate the actor sideways');
  assert.equal(after.player.position.y,y,'the body cannot teleport vertically in the same 50ms tick');
  assert.equal(after.player.grounded,true);
  assert.equal(after.player.groundedPlatformId,'f9:ground');
  assert.deepEqual(after.player.checkpoint,{x,y},'recovery starts from the real arrival');
  const floorEvent=runtime.events.find(e=>e.type==='floor-complete'&&e.data?.floor===9);
  assert.ok(floorEvent?.data?.guardianPassage);
  assert.equal(floorEvent.data.guardianPassage.crossingX,x);
  assert.equal(snapshotBefore.floor,8,'the real old source context is retained for provenance');
});

test('only the opted-in successor of a guardian acquires the lowered source ground',()=>{
  const ordinary=parseTowerConfig({guardianSecondWind:false,guardianArenaHazards:false,guardianInterval:8});
  const optIn9=generateTowerChunk(config,seed,9);
  const frozen9=generateTowerChunk(ordinary,seed,9);
  const regular10=generateTowerChunk(config,seed,10);
  for(const [chunk,c] of [[frozen9,ordinary],[regular10,config]]) {
    const ground=chunk.platforms.find(p=>p.id===`f${chunk.floor}:ground`);
    assert.equal(ground.y,chunk.baseY,'historical and non-successor ground unchanged');
    assert.equal(chunk.spawn.y,chunk.baseY+12000+c.playerHalfHeight);
  }
  assert.equal(optIn9.platforms.find(p=>p.id==='f9:ground').y,
    9*config.chunkHeight-28000);
  const repeat=generateTowerChunk(config,seed,9);
  assert.deepEqual(repeat,optIn9,'unchanged named-seed output and checksum');
});
