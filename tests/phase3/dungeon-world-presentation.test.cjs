'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const{DungeonRuntime}=require('../../dist/games/ai-dungeon-endless-adventure/src/runtime/run.js');
const{buildDungeonRenderSnapshot}=require('../../dist/games/ai-dungeon-endless-adventure/src/presentation/snapshot.js');

const config={schemaVersion:1,width:31,height:21,roomAttempts:24,roomMinSize:3,roomMaxSize:7,loopChancePermille:180,chapterLength:5,maxTicksPerFloor:1800,intermissionTicks:2,maxEnemies:18,maxRelics:6,maxEvents:96,noProgressTicks:600};

test('world projection is deterministic, bounded and derived only from public cells',()=>{
  const a=new DungeonRuntime(config,'world-projection-seed','world-run');
  const b=new DungeonRuntime(config,'world-projection-seed','world-run');
  for(let i=0;i<24;i++){a.step();b.step();}
  const sa=buildDungeonRenderSnapshot(a.state);
  const sb=buildDungeonRenderSnapshot(b.state);
  assert.deepEqual(sa.world,sb.world);
  assert.ok(sa.world.tiles.length<=sa.cells.length);
  assert.ok(sa.world.tiles.every(tile=>sa.cells.some(cell=>cell.cell===tile.cell)));
  assert.ok(sa.world.props.length<=96);
  assert.ok(sa.world.lights.length<=32);
});

test('world projection exposes isometric depth, biome and physical interactables',()=>{
  const runtime=new DungeonRuntime(config,'world-depth-seed','world-depth-run');
  runtime.state.ai.knownCells.push(runtime.state.floor.sigil,runtime.state.floor.chest,runtime.state.floor.shrine,runtime.state.floor.gate);
  const snapshot=buildDungeonRenderSnapshot(runtime.state);
  assert.ok(['ancient-crypt','infernal-forge','fungal-caverns','flooded-ruins','frozen-vault','arcane-library','void-depths'].includes(snapshot.world.biome));
  assert.ok(snapshot.world.tiles.some(tile=>Number.isFinite(tile.isoX)&&Number.isFinite(tile.isoY)&&Number.isFinite(tile.elevation)));
  assert.ok(snapshot.world.interactables.some(item=>item.kind==='chest'));
  assert.ok(snapshot.world.interactables.some(item=>item.kind==='shrine'));
  assert.ok(snapshot.world.interactables.some(item=>item.kind==='gate'));
  assert.ok(snapshot.world.interactables.some(item=>item.kind==='sigil'));
});

test('each authored room receives one coherent deterministic archetype',()=>{
  const runtime=new DungeonRuntime(config,'room-coherence-seed','room-coherence-run');
  runtime.state.hero.vision=999;
  runtime.state.ai.knownCells=runtime.state.floor.tiles.map((_,cell)=>cell);
  const snapshot=buildDungeonRenderSnapshot(runtime.state);
  for(const room of runtime.state.floor.rooms){
    const roomCells=[];
    for(let y=room.y;y<room.y+room.height;y++)for(let x=room.x;x<room.x+room.width;x++)roomCells.push(y*runtime.state.floor.width+x);
    const archetypes=new Set(snapshot.world.tiles.filter(tile=>tile.walkable&&roomCells.includes(tile.cell)&&!snapshot.cells.find(cell=>cell.cell===tile.cell)?.objective).map(tile=>tile.room));
    assert.ok(archetypes.size<=1,`room ${room.id} mixed archetypes: ${[...archetypes].join(',')}`);
  }
});

test('entity presentation communicates tactical role and animation state',()=>{
  const runtime=new DungeonRuntime(config,'world-entity-seed','world-entity-run');
  runtime.state.hero.vision=999;
  const enemy=runtime.state.enemies[0];
  enemy.telegraph=enemy.kind==='ember-seer'?'ranged':'melee';
  const snapshot=buildDungeonRenderSnapshot(runtime.state);
  const rendered=snapshot.entities.find(item=>item.id===enemy.id);
  assert.ok(rendered);
  assert.ok(['swarm','controller','caster','flanker','ambusher','boss'].includes(rendered.role));
  assert.ok(['idle','advance','attack','cast','leap','guard','stagger','dead','boss-attack'].includes(rendered.animation));
  assert.ok(Number.isFinite(rendered.worldX));
  assert.ok(Number.isFinite(rendered.worldY));
  assert.ok(Number.isFinite(rendered.elevation));
});

test('boss presentation exposes arena/camera/lighting/music directives without changing authority',()=>{
  const runtime=new DungeonRuntime(config,'world-boss-seed','world-boss-run');
  runtime.state.hero.vision=999;
  const boss=runtime.state.enemies.find(enemy=>enemy.kind==='chapter-boss');
  if(!boss){
    runtime.state.floorNumber=5;
    runtime.state.chapter=1;
    runtime.state.enemies.push({id:'boss-test',kind:'chapter-boss',cell:runtime.state.floor.bossCell,hp:300,maxHp:300,attack:20,armour:5,cooldown:0,telegraph:'boss',phase:2,alive:true});
  }
  const before={tick:runtime.state.tick,score:runtime.state.hero.score,hp:runtime.state.hero.hp};
  const snapshot=buildDungeonRenderSnapshot(runtime.state);
  assert.ok(snapshot.boss);
  assert.equal(snapshot.world.director.mode,'boss');
  assert.ok(snapshot.world.director.musicState.startsWith('boss'));
  assert.ok(snapshot.world.director.lightState.includes('boss'));
  assert.deepEqual({tick:runtime.state.tick,score:runtime.state.hero.score,hp:runtime.state.hero.hp},before);
});
