'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const{DungeonRuntime}=require('../../dist/games/ai-dungeon-endless-adventure/src/runtime/run.js');
const{buildDungeonRenderSnapshot}=require('../../dist/games/ai-dungeon-endless-adventure/src/presentation/snapshot.js');
const{mapDungeonPresentationCues}=require('../../dist/games/ai-dungeon-endless-adventure/src/presentation/semantic.js');
const{computeDungeonLayout}=require('../../dist/games/ai-dungeon-endless-adventure/src/presentation/layout.js');
const{DungeonPresentationController}=require('../../dist/games/ai-dungeon-endless-adventure/src/presentation/controller.js');
const{DungeonOutputHealth}=require('../../dist/games/ai-dungeon-endless-adventure/src/presentation/health.js');
const config={schemaVersion:1,width:31,height:21,roomAttempts:24,roomMinSize:3,roomMaxSize:7,loopChancePermille:180,chapterLength:5,maxTicksPerFloor:1800,intermissionTicks:2,maxEnemies:18,maxRelics:6,maxEvents:96,noProgressTicks:600};

test('public snapshot excludes secrets hidden topology and hidden enemies',()=>{
  const runtime=new DungeonRuntime(config,'private-seed-value','private-run-id');
  runtime.state.hero.vision=1;
  const hidden=runtime.state.enemies.find(enemy=>Math.abs(enemy.cell%config.width-runtime.state.hero.cell%config.width)+Math.abs(Math.floor(enemy.cell/config.width)-Math.floor(runtime.state.hero.cell/config.width))>1);
  assert.ok(hidden);
  const snapshot=buildDungeonRenderSnapshot(runtime.state);
  const text=JSON.stringify(snapshot);
  assert.ok(!text.includes('private-seed-value'));
  assert.ok(!text.includes('private-run-id'));
  assert.ok(!text.includes(hidden.id));
  assert.ok(!('seed' in snapshot));
  assert.ok(!('runId' in snapshot));
  assert.ok(snapshot.cells.length<runtime.state.floor.tiles.length);
});

test('snapshot is deeply frozen bounded and exposes ten-second comprehension hierarchy',()=>{
  const runtime=new DungeonRuntime(config,'snapshot-ui','snapshot-ui-run');
  for(let i=0;i<15;i++)runtime.step();
  const snapshot=buildDungeonRenderSnapshot(runtime.state);
  assert.equal(Object.isFrozen(snapshot),true);
  assert.equal(Object.isFrozen(snapshot.hero),true);
  assert.ok(snapshot.entities.length<=32);
  assert.ok(snapshot.events.length<=8);
  assert.equal(snapshot.progress.floor,runtime.state.floorNumber);
  assert.ok(snapshot.objective.label.length>0);
  assert.ok(snapshot.intent.goal.length>0);
  assert.ok(['low','guarded','high','critical'].includes(snapshot.danger.band));
  assert.ok(snapshot.publicChecksum.length>0);
  assert.equal(new Set(snapshot.events.map(event=>`${event.type}:${event.message}`)).size,snapshot.events.length);
});

test('completed objective markers are removed from the public map',()=>{
  const runtime=new DungeonRuntime(config,'marker-seed','marker-run');
  runtime.state.ai.knownCells.push(runtime.state.floor.sigil,runtime.state.floor.chest,runtime.state.floor.shrine);
  runtime.state.floorProgress.sigilCollected=true;
  runtime.state.floorProgress.chestOpened=true;
  runtime.state.floorProgress.shrineUsed=true;
  const snapshot=buildDungeonRenderSnapshot(runtime.state);
  assert.ok(!snapshot.cells.some(cell=>cell.objective==='sigil'));
  assert.ok(!snapshot.cells.some(cell=>cell.objective==='chest'));
  assert.ok(!snapshot.cells.some(cell=>cell.objective==='shrine'));
});

test('semantic cue mapper preserves danger and result priority while capping event storms',()=>{
  const events=Array.from({length:80},(_,i)=>({sequence:i+1,tick:i,type:i===79?'run.ended':'hero.moved',message:i===79?'Astra fell.':undefined}));
  const cues=mapDungeonPresentationCues(events);
  assert.ok(cues.length<=24);
  assert.equal(cues[0].priority,100);
  assert.equal(cues[0].kind,'result');
  assert.ok(cues.some(cue=>cue.caption==='Astra fell.'));
  const movement=mapDungeonPresentationCues([{sequence:81,tick:81,type:'hero.moved'}])[0];
  assert.equal(movement.caption,'Astra advances deeper.');
  assert.equal(mapDungeonPresentationCues([{sequence:82,tick:82,type:'combat.ranged'}])[0].caption,'Astra fires a lantern bolt.');
});

test('responsive layout protects game viewport and caption safe zone at desktop and mobile sizes',()=>{
  const desktop=computeDungeonLayout(1920,1080,false);
  const mobile=computeDungeonLayout(640,360,false);
  assert.ok(desktop.stage.width>desktop.side.width);
  assert.ok(desktop.caption.y>=desktop.stage.y+desktop.stage.height);
  assert.ok(mobile.stage.width>=400);
  assert.ok(mobile.caption.height>=40);
  assert.equal(computeDungeonLayout(640,360,true).side.width,0);
});

test('presentation controller rejects stale snapshots and keeps bounded replay and cue history',()=>{
  const runtime=new DungeonRuntime(config,'controller-seed','controller-run');
  const controller=new DungeonPresentationController({replayCapacity:30,maxEntities:32});
  let snapshot=buildDungeonRenderSnapshot(runtime.state);
  assert.equal(controller.accept(snapshot,[]).accepted,true);
  assert.equal(controller.accept(snapshot,[]).accepted,false);
  for(let i=0;i<60;i++){const events=runtime.step();snapshot=buildDungeonRenderSnapshot(runtime.state);controller.accept(snapshot,events);}
  assert.ok(controller.replayWindow(999).length<=30);
  assert.ok(controller.frame().cues.length<=24);
});

test('output health distinguishes healthy stale degraded and recovered presentation state',()=>{
  const health=new DungeonOutputHealth({staleAfterMs:1000,deadAfterMs:3000});
  health.observe(10,1000);
  assert.equal(health.report(1500).status,'healthy');
  assert.equal(health.report(2501).status,'stale');
  assert.equal(health.report(5001).status,'degraded');
  health.fail('renderer fault',5100);
  assert.equal(health.report(5100).status,'recovering');
  health.observe(11,5200);
  assert.equal(health.report(5200).status,'healthy');
});

test('browser source contains accessible controls reduced-motion support and bounded rendering',()=>{
  const root=path.join(__dirname,'../../public/ai-dungeon');
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  const css=fs.readFileSync(path.join(root,'styles.css'),'utf8');
  const app=['app-core.js','app-art.js','app-audio.js','app-scene.js','app-main.js'].map(name=>fs.readFileSync(path.join(root,name),'utf8')).join('\n');
  assert.match(html,/aria-live="polite"/);
  assert.match(html,/data-testid="dungeon-canvas"/);
  assert.match(html,/data-testid="captions"/);
  assert.match(css,/prefers-reduced-motion/);
  assert.match(app,/MAX_PARTICLES\s*=\s*180/);
  assert.match(app,/MAX_FLOATERS\s*=\s*12/);
  assert.match(app,/AUDIO_COOLDOWNS/);
  assert.match(app,/AMBIENCE_STATES/);
  assert.match(app,/MIN_CAMERA_CELLS_X\s*=\s*15/);
  assert.match(app,/__DUNGEON_PUBLIC_STATE__/);
  assert.match(app,/URLSearchParams/);
  assert.match(css,/\.controls\{[^}]*opacity:0/);
  assert.ok(!app.includes('innerHTML'));
});
