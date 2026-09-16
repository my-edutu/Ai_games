'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const{DungeonRuntime}=require('../../dist/games/ai-dungeon-endless-adventure/src/runtime/run.js');
const{planDungeonAction}=require('../../dist/games/ai-dungeon-endless-adventure/src/ai/policy.js');
const{RELICS,relicBuildProfile,spawnFloorEncounters}=require('../../dist/games/ai-dungeon-endless-adventure/src/content/catalogue.js');
const base={schemaVersion:1,width:31,height:21,roomAttempts:24,roomMinSize:3,roomMaxSize:7,loopChancePermille:180,chapterLength:5,maxTicksPerFloor:1800,intermissionTicks:2,maxEnemies:18,maxRelics:6,maxEvents:96,noProgressTicks:600};

test('relic catalogue supports multiple recognizable build families instead of flat stat-only sameness',()=>{
  const ids=Object.keys(RELICS);
  assert.ok(ids.length>=16,`expected at least 16 relics, received ${ids.length}`);
  const families=new Set(ids.map(id=>RELICS[id].family));
  assert.ok(families.size>=5,`expected at least five build families, received ${families.size}`);
  for(const relic of Object.values(RELICS)){
    assert.ok(relic.family);
    assert.ok(relic.name.length>0);
    assert.ok(relic.description.length>0);
    assert.ok(Number.isInteger(relic.priority));
  }
});

test('relic build profile is deterministic and exposes dominant build identity',()=>{
  const ids=['ember-edge','graveglass-prism','hunter-mark','storm-vessel','seer-lens'];
  const a=relicBuildProfile(ids);
  const b=relicBuildProfile([...ids]);
  assert.deepEqual(a,b);
  assert.equal(a.total,ids.length);
  assert.ok(a.dominant!=='none');
  assert.equal(Object.values(a.families).reduce((sum,value)=>sum+value,0),ids.length);
});

test('chapter boss has a third deterministic desperation phase with ranged pressure',()=>{
  const runtime=new DungeonRuntime(base,'boss-depth-seed','boss-depth-run');
  runtime.state.floorNumber=5;
  runtime.state.enemies=spawnFloorEncounters(runtime.state.floor,5,base,runtime.rng);
  const boss=runtime.state.enemies.find(enemy=>enemy.kind==='chapter-boss');
  assert.ok(boss);
  runtime.state.hero.vision=999;
  const candidates=runtime.state.floor.tiles.map((tile,cell)=>tile===1?cell:-1).filter(cell=>cell>=0);
  const distance=(a,b)=>Math.abs(a%base.width-b%base.width)+Math.abs(Math.floor(a/base.width)-Math.floor(b/base.width));
  const rangedCell=candidates.find(cell=>distance(cell,boss.cell)>=2&&distance(cell,boss.cell)<=4);
  assert.ok(Number.isInteger(rangedCell));
  runtime.state.hero.cell=rangedCell;
  boss.hp=Math.max(1,Math.floor(boss.maxHp/4));
  boss.cooldown=0;
  boss.telegraph=null;
  runtime.step({kind:'guard'});
  assert.equal(boss.phase,3);
  assert.equal(boss.telegraph,'ranged');
  const hp=runtime.state.hero.hp;
  runtime.step({kind:'guard'});
  assert.ok(runtime.state.hero.hp<hp||runtime.state.hero.shield<4,'phase-three ranged attack should create authoritative pressure');
});

test('autonomous policy reacts defensively to a visible boss telegraph before greedily attacking',()=>{
  const runtime=new DungeonRuntime(base,'boss-policy-seed','boss-policy-run');
  runtime.state.floorNumber=5;
  runtime.state.hero.vision=999;
  runtime.state.enemies=spawnFloorEncounters(runtime.state.floor,5,base,runtime.rng);
  const boss=runtime.state.enemies.find(enemy=>enemy.kind==='chapter-boss');
  assert.ok(boss);
  const candidates=runtime.state.floor.tiles.map((tile,cell)=>tile===1?cell:-1).filter(cell=>cell>=0);
  const distance=(a,b)=>Math.abs(a%base.width-b%base.width)+Math.abs(Math.floor(a/base.width)-Math.floor(b/base.width));
  const threatenedCell=candidates.find(cell=>distance(cell,boss.cell)>=1&&distance(cell,boss.cell)<=3);
  assert.ok(Number.isInteger(threatenedCell));
  runtime.state.hero.cell=threatenedCell;
  boss.telegraph='boss';
  const proposal=planDungeonAction(runtime.state);
  assert.equal(proposal.action.kind,'guard');
  assert.equal(proposal.ai.goal,'Survive the boss telegraph');
  assert.ok(proposal.ai.confidencePermille>=900);
});
