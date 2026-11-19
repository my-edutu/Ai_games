'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const { MazeRuntime }=require('../../dist/games/ai-maze-escape/src/runtime/run.js');
const { solveMaze, areAdjacentThroughPassage, passageNeighbors }=
  require('../../dist/games/ai-maze-escape/src/generation/solver.js');
const { solveMazeWithInventory }=
  require('../../dist/games/ai-maze-escape/src/generation/content.js');
const {naturalFlagshipChapter,chooseFlagshipLiveSeed,DEFAULT_SEEDS}=
  require('../../scripts/maze-flagship-chapter.cjs');
const config={width:17,height:11,profile:'chambers',level:4,
  intermissionTicks:12,maxTicks:18000,visibilityRadius:3,loopChancePermille:170,
  keyCount:2,trapCount:5,threatCount:1,memoryTtl:400,noProgressTicks:3000,repairAttempts:3};
const makeWorld=seed=>MazeRuntime.create(config,seed,{policy:'partial-observation'}).state.world;
test('the native live opening picks a REAL joined chapter without changing generation or handing an oracle to the AI',()=>{
  const chosen=chooseFlagshipLiveSeed(makeWorld);
  if(!chosen.chapter){
    // Keep the real strict gate RED. Source diagnostics search additional
    // authentic generated worlds ONCE in CI so the next production commit
    // can pin a verified legal seed inside the unchanged <=48 startup cap.
    // Never invent a path, remove a test or slow down the live startup scan.
    const expanded=chooseFlagshipLiveSeed(makeWorld,
      Array.from({length:2048},(_,i)=>`tideglass-live-chapter-${i}`));
    process.stdout.write('TRUE_CHAPTER_DISCOVERY='+JSON.stringify(expanded)+'\\n');
  }
  assert.ok(chosen.chapter,
    'No generated seed offers an honest pressure / straight Thornback / same-level two-link key / matching gate; improve the real level before calling it flagship');
  const original=makeWorld(chosen.seed);
  const saved=JSON.stringify(original);
  assert.deepEqual(naturalFlagshipChapter(original),chosen.chapter);
  const route=solveMaze(original,{start:original.start,goal:original.exit});
  const inventory=solveMazeWithInventory(original);
  assert.ok(route && inventory && inventory.cells.includes(original.exit));
  const key=original.keys.find(k=>k.id===chosen.chapter.keyId);
  const gate=original.doors.find(d=>d.id===chosen.chapter.gateId);
  assert.ok(key && gate && gate.requiredKeyId===key.id);
  assert.ok(inventory.cells.includes(key.cell));
  assert.ok(inventory.keyOrder.includes(key.id)&&inventory.doorOrder.includes(gate.id));
  assert.equal(passageNeighbors(original,key.cell).length,1,'physical key room is terminal');
  assert.ok(areAdjacentThroughPassage(original,chosen.chapter.entryCell,
    passageNeighbors(original,key.cell)[0]));
  assert.ok(inventory.cells.filter(cell=>cell===passageNeighbors(original,key.cell)[0]).length>=2,
    'the real solver walks into AND out of the two-passage treasure gallery');
  assert.equal(JSON.stringify(original),saved,'chapter scorer cannot edit the source world');
  assert.deepEqual(chooseFlagshipLiveSeed(makeWorld),chosen,'stable seed, no random selection');
});
test('no pressure, no guardian, missing real key or disconnected return cannot be presented as a complete chapter',()=>{
  const source=makeWorld('maze-stream-reference');
  for(const edit of [
    world=>{world.traps=[]},
    world=>{world.threats=[]},
    world=>{world.keys=[]},
    world=>{world.doors=[]},
    world=>{world.blockedCells=Array.from({length:world.width*world.height},(_,i)=>i)}
  ]){
    const world=structuredClone(source);edit(world);
    assert.equal(naturalFlagshipChapter(world),null);
  }
  assert.deepEqual(chooseFlagshipLiveSeed(()=>({...source,traps:[]}),['no-such-chapter']),
    {seed:'maze-stream-reference',chapter:null},
    'negative fallback retains the existing lawful live seed');
  assert.ok(DEFAULT_SEEDS.length<=48,'startup selection must remain bounded');
});
