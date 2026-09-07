'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const{DungeonRuntime}=require('../../dist/games/ai-dungeon-endless-adventure/src/runtime/run.js');
const{buildDungeonRenderSnapshot}=require('../../dist/games/ai-dungeon-endless-adventure/src/presentation/snapshot.js');

const base={schemaVersion:1,width:31,height:21,roomAttempts:24,roomMinSize:3,roomMaxSize:7,loopChancePermille:180,chapterLength:5,maxTicksPerFloor:1800,intermissionTicks:2,maxEnemies:18,maxRelics:6,maxEvents:96,noProgressTicks:600};

test('spectator snapshot does not reveal an enemy through intervening wall geometry',()=>{
  const runtime=new DungeonRuntime(base,'spectator-occlusion','spectator-occlusion-run');
  const width=runtime.state.floor.width;
  const hero=10*width+10,target=hero+2;
  runtime.state.floor.tiles.fill(0);
  runtime.state.floor.tiles[hero]=1;
  runtime.state.floor.tiles[target]=1;
  runtime.state.hero.cell=hero;
  runtime.state.hero.vision=5;
  runtime.state.ai.knownCells=[hero];
  runtime.state.enemies=[{id:'spectator-hidden',kind:'mireling',cell:target,hp:5,maxHp:5,attack:1,armour:0,cooldown:0,telegraph:null,phase:1,alive:true}];
  const snapshot=buildDungeonRenderSnapshot(runtime.state);
  assert.equal(snapshot.entities.some(enemy=>enemy.id==='spectator-hidden'),false);
});

test('stream host serves every stylesheet referenced by the Game 9 HTML entrypoint',()=>{
  const root=path.join(__dirname,'../../');
  const html=fs.readFileSync(path.join(root,'public/ai-dungeon/index.html'),'utf8');
  const server=fs.readFileSync(path.join(root,'scripts/serve-dungeon-stream.cjs'),'utf8');
  assert.match(html,/\/dungeon\/ux-v2\.css/);
  assert.match(server,/['"]ux-v2\.css['"]/);
  assert.match(server,/\/dungeon\/ux-v2\.css/);
});

test('browser presentation declares bounded quality presets without changing authoritative state inputs',()=>{
  const root=path.join(__dirname,'../../public/ai-dungeon');
  const core=fs.readFileSync(path.join(root,'app-core.js'),'utf8');
  const main=fs.readFileSync(path.join(root,'app-main.js'),'utf8');
  assert.match(core,/QUALITY_PRESETS/);
  assert.match(core,/\blow\s*:/);
  assert.match(core,/\bbalanced\s*:/);
  assert.match(core,/\bhigh\s*:/);
  assert.match(core,/\bultra\s*:/);
  assert.match(main,/dataset\.quality/);
});

test('quality presets bound DPR and cosmetic event budgets while keeping telegraph rendering unconditional',()=>{
  const root=path.join(__dirname,'../../public/ai-dungeon');
  const art=fs.readFileSync(path.join(root,'app-art.js'),'utf8');
  const audio=fs.readFileSync(path.join(root,'app-audio.js'),'utf8');
  const scene=fs.readFileSync(path.join(root,'app-scene.js'),'utf8');
  assert.match(art,/quality\.maxDpr/);
  assert.match(audio,/quality\.particleBudget/);
  assert.match(audio,/quality\.floaterBudget/);
  assert.match(scene,/entity\.telegraph/);
  assert.doesNotMatch(scene,/quality[^\n]{0,120}telegraph/);
});

test('movement continuity is presentation-only and reduced motion snaps to authoritative cells',()=>{
  const root=path.join(__dirname,'../../public/ai-dungeon');
  const scene=fs.readFileSync(path.join(root,'app-scene.js'),'utf8');
  assert.match(scene,/interpolatedGridPosition/);
  assert.match(scene,/previousSnapshot/);
  assert.match(scene,/reduced\?1:/);
});

test('integrity and quarantine cues have an implemented browser audio path instead of a silent mapping',()=>{
  const audio=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/app-audio.js'),'utf8');
  assert.match(audio,/cue\.audio==='integrity-warning'/);
});

test('public recent-event feed drops routine movement and wait churn while retaining meaningful events',()=>{
  const runtime=new DungeonRuntime(base,'recent-feed','recent-feed-run');
  runtime.state.eventHistory=[
    {sequence:1,tick:1,type:'hero.moved',message:'Astra advances.'},
    {sequence:2,tick:2,type:'hero.waited',message:'Astra waits.'},
    {sequence:3,tick:3,type:'enemy.defeated',message:'Mireling defeated.'}
  ];
  const snapshot=buildDungeonRenderSnapshot(runtime.state);
  assert.deepEqual(snapshot.events.map(event=>event.type),['enemy.defeated']);
});

test('floating cue policy reserves center-screen text for rare high-priority moments and caps simultaneous labels',()=>{
  const root=path.join(__dirname,'../../public/ai-dungeon');
  const core=fs.readFileSync(path.join(root,'app-core.js'),'utf8');
  const audio=fs.readFileSync(path.join(root,'app-audio.js'),'utf8');
  assert.match(core,/MIN_FLOATING_PRIORITY\s*=\s*65/);
  assert.match(core,/MAX_SIMULTANEOUS_FLOATERS\s*=\s*2/);
  assert.match(audio,/cue\.priority\s*>=\s*MIN_FLOATING_PRIORITY/);
  assert.match(audio,/floaters\.length\s*<\s*Math\.min\(floaterLimit,MAX_SIMULTANEOUS_FLOATERS\)/);
});

test('spectator HUD renders one compact contextual audience status instead of hiding active influence state',()=>{
  const scene=fs.readFileSync(path.join(__dirname,'../../public/ai-dungeon/app-scene.js'),'utf8');
  assert.match(scene,/function audienceStatusLabel/);
  assert.match(scene,/snapshot\.audience\.vote/);
  assert.match(scene,/snapshot\.audience\.route/);
  assert.match(scene,/snapshot\.audience\.pressure/);
  assert.match(scene,/AUDIENCE/);
});
