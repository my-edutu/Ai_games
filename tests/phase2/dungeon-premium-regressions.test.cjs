'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const{DungeonRuntime,fallbackDungeonAction}=require('../../dist/games/ai-dungeon-endless-adventure/src/runtime/run.js');
const{buildDungeonObservation}=require('../../dist/games/ai-dungeon-endless-adventure/src/ai/observation.js');
const{planDungeonAction}=require('../../dist/games/ai-dungeon-endless-adventure/src/ai/policy.js');

const base={schemaVersion:1,width:31,height:21,roomAttempts:24,roomMinSize:3,roomMaxSize:7,loopChancePermille:180,chapterLength:5,maxTicksPerFloor:1800,intermissionTicks:2,maxEnemies:18,maxRelics:6,maxEvents:96,noProgressTicks:600};

function wallScenario(kind='mireling'){
  const runtime=new DungeonRuntime(base,`premium-${kind}`,`premium-${kind}-run`);
  const width=runtime.state.floor.width;
  const hero=10*width+10;
  const wall=hero+1;
  const target=hero+2;
  runtime.state.floor.tiles.fill(0);
  runtime.state.floor.tiles[hero]=1;
  runtime.state.floor.tiles[target]=1;
  runtime.state.hero.cell=hero;
  runtime.state.hero.vision=5;
  runtime.state.hero.energy=runtime.state.hero.maxEnergy;
  runtime.state.ai.knownCells=[hero];
  runtime.state.enemies=[{id:'behind-wall',kind,cell:target,hp:6,maxHp:6,attack:2,armour:0,cooldown:0,telegraph:kind==='ember-seer'?'ranged':null,phase:1,alive:true}];
  return{runtime,hero,wall,target};
}

test('Astra observation does not reveal an enemy behind an intervening dungeon wall',()=>{
  const{runtime}=wallScenario();
  const observation=buildDungeonObservation(runtime.state);
  assert.equal(observation.visibleEnemies.some(enemy=>enemy.id==='behind-wall'),false);
});

test('Astra ranged attack cannot damage a target through a wall',()=>{
  const{runtime}=wallScenario();
  const beforeHp=runtime.state.enemies[0].hp;
  const events=runtime.step({kind:'ranged',targetId:'behind-wall'});
  assert.equal(runtime.state.enemies[0].hp,beforeHp);
  assert.ok(events.some(event=>event.type==='action.rejected'));
});

test('Ember Seer loses a committed ranged shot when dungeon geometry blocks line of sight',()=>{
  const{runtime}=wallScenario('ember-seer');
  const beforeHp=runtime.state.hero.hp;
  runtime.step({kind:'wait'});
  assert.equal(runtime.state.hero.hp,beforeHp);
  assert.equal(runtime.state.enemies[0].telegraph,null);
});

test('critical-health Astra heals before committing to another adjacent melee exchange',()=>{
  const runtime=new DungeonRuntime(base,'critical-heal','critical-heal-run');
  const width=runtime.state.floor.width;
  const neighbour=runtime.state.floor.tiles.map((value,cell)=>value===1?cell:-1).find(cell=>cell>=0&&Math.abs(cell%width-runtime.state.hero.cell%width)+Math.abs(Math.floor(cell/width)-Math.floor(runtime.state.hero.cell/width))===1);
  assert.notEqual(neighbour,undefined);
  runtime.state.hero.hp=Math.floor(runtime.state.hero.maxHp*.4);
  runtime.state.hero.potions=1;
  runtime.state.enemies=[{id:'adjacent-threat',kind:'mireling',cell:neighbour,hp:6,maxHp:6,attack:2,armour:0,cooldown:0,telegraph:null,phase:1,alive:true}];
  const proposal=planDungeonAction(runtime.state);
  assert.equal(proposal.action.kind,'heal');
  assert.equal(proposal.ai.goal,'Recover health');
});

test('emergency fallback does not change because an unobserved sigil moves elsewhere in hidden topology',()=>{
  const a=new DungeonRuntime(base,'fallback-hidden','fallback-hidden-run');
  const b=new DungeonRuntime(base,'fallback-hidden','fallback-hidden-run');
  const width=a.state.floor.width;
  const hero=10*width+10;
  for(const runtime of[a,b]){
    runtime.state.floor.tiles.fill(1);
    runtime.state.hero.cell=hero;
    runtime.state.hero.hp=runtime.state.hero.maxHp;
    runtime.state.hero.potions=0;
    runtime.state.enemies=[];
    runtime.state.ai.knownCells=[hero];
    runtime.state.ai.lastCells=[];
    runtime.state.floorProgress.sigilCollected=false;
    runtime.state.floorProgress.gateUnlocked=false;
    runtime.state.floorProgress.guardianDefeated=false;
  }
  a.state.floor.sigil=hero-5;
  b.state.floor.sigil=hero+5;
  assert.deepEqual(fallbackDungeonAction(a.state),fallbackDungeonAction(b.state));
});
