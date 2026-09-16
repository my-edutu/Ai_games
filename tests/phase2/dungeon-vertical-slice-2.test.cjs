'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const{DungeonRuntime}=require('../../dist/games/ai-dungeon-endless-adventure/src/runtime/run.js');

const base={schemaVersion:1,width:31,height:21,roomAttempts:24,roomMinSize:3,roomMaxSize:7,loopChancePermille:180,chapterLength:5,maxTicksPerFloor:1800,intermissionTicks:2,maxEnemies:18,maxRelics:6,maxEvents:96,noProgressTicks:600};
const BIOMES=new Set(['ashen-catacomb','drowned-archive','void-observatory']);
const ROLES=new Set(['entrance','combat','ambush','shrine','treasure','elite','boss-approach']);

function manhattan(a,b,width){return Math.abs(a%width-b%width)+Math.abs(Math.floor(a/width)-Math.floor(b/width))}
function nearestRoom(floor,cell){return [...floor.rooms].sort((a,b)=>manhattan(a.center,cell,floor.width)-manhattan(b.center,cell,floor.width)||a.id-b.id)[0]}

test('generated dungeon exposes deterministic biome and authored room-role grammar',()=>{
  const first=new DungeonRuntime(base,'vertical-grammar-seed','grammar-a').state.floor;
  const repeat=new DungeonRuntime(base,'vertical-grammar-seed','grammar-b').state.floor;

  assert.ok(BIOMES.has(first.biome),`unexpected biome ${first.biome}`);
  assert.ok(first.rooms.length>=3);
  assert.ok(first.rooms.every(room=>ROLES.has(room.role)),`invalid roles: ${first.rooms.map(room=>room.role).join(',')}`);
  assert.equal(nearestRoom(first,first.entrance).role,'entrance');
  assert.equal(nearestRoom(first,first.gate).role,'boss-approach');
  assert.equal(first.biome,repeat.biome);
  assert.deepEqual(first.rooms.map(room=>({id:room.id,role:room.role})),repeat.rooms.map(room=>({id:room.id,role:room.role})));

  const biomes=new Set();
  const optionalRoles=new Set();
  for(let i=0;i<24;i++){
    const floor=new DungeonRuntime(base,`vertical-grammar-${i}`,`grammar-${i}`).state.floor;
    biomes.add(floor.biome);
    for(const room of floor.rooms)if(!['entrance','shrine','treasure','boss-approach'].includes(room.role))optionalRoles.add(room.role);
  }
  assert.ok(biomes.size>=2,`expected biome variety, got ${[...biomes].join(',')}`);
  assert.ok(optionalRoles.size>=3,`expected combat/ambush/elite variety, got ${[...optionalRoles].join(',')}`);
});
