'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {guardianCourtPhysicalScore}=require('../../dist/games/ai-maze-escape/src/generation/content.js');
const {PASSAGE_UP,PASSAGE_RIGHT,PASSAGE_DOWN,PASSAGE_LEFT,passageNeighbors}
  =require('../../dist/games/ai-maze-escape/src/generation/solver.js');

test('authored guardian selects a genuine open, same-terrace pressure/guardian court, never a painted route',()=>{
  const world={width:9,height:9,passages:Array(81).fill(0),blockedCells:[]};
  const connect=(a,b)=>{
    const diff=b-a;
    if(diff===1){world.passages[a]|=PASSAGE_RIGHT;world.passages[b]|=PASSAGE_LEFT;}
    else if(diff===-1){world.passages[a]|=PASSAGE_LEFT;world.passages[b]|=PASSAGE_RIGHT;}
    else if(diff===9){world.passages[a]|=PASSAGE_DOWN;world.passages[b]|=PASSAGE_UP;}
    else if(diff===-9){world.passages[a]|=PASSAGE_UP;world.passages[b]|=PASSAGE_DOWN;}
    else throw new Error('non-cardinal fixture');
  };
  // A real three-cell LEVEL horizontal court with two off-axis, same-tier
  // walkable side rooms: these are not newly inferred or synthesized by scoring.
  for(const [a,b] of [[39,40],[40,41],[40,31],[41,32],
    // A competing, authentic but tier-breaking longitudinal patrol.
    [21,30],[30,39]])connect(a,b);
  const before=JSON.stringify(world);
  const exclusions=new Set();
  const joined=guardianCourtPhysicalScore(world,39,40,41,exclusions);
  const split=guardianCourtPhysicalScore(world,21,30,39,exclusions);
  assert.equal(joined,14);
  assert.ok(split<joined,'a real equal-height guardian court must outrank vertically split masonry');
  assert.equal(guardianCourtPhysicalScore(world,39,40,41,new Set([31,32])),12,
    'off-route spaces count only when genuinely available, never through a reserved hazard/key');
  assert.equal(JSON.stringify(world),before,'ranking must not add an engine passage or mutate collision');
  assert.ok(passageNeighbors(world,40).includes(39)&&passageNeighbors(world,41).includes(40));
  world.passages[41]&=~PASSAGE_LEFT;
  assert.equal(guardianCourtPhysicalScore(world,39,40,41,exclusions),-1,
    'a one-way or fabricated guard retreat is not an authored physical encounter');
  assert.equal(guardianCourtPhysicalScore(world,39,39,41,exclusions),-1);
});
test('real seeded flagship remains deterministic and guardian patrol still uses a lawful traversable branch',()=>{
  const {MazeRuntime}=require('../../dist/games/ai-maze-escape/src/runtime/run.js');
  const config={width:17,height:11,profile:'chambers',level:4,visibilityRadius:3,
    loopChancePermille:170,keyCount:2,trapCount:5,threatCount:1};
  for(const seed of ['maze-visual-reference-3','maze-visual-reference-13','maze-visual-reference-5']){
    const a=MazeRuntime.create(config,seed),b=MazeRuntime.create(config,seed);
    assert.deepEqual(a.state.world,b.state.world,'same seed must retain exact authored world');
    const world=a.state.world,guard=world.threats[0];
    assert.ok(guard&&guard.route.length===2,'actual mobile chapter keeps its moving Thornback');
    assert.ok(passageNeighbors(world,guard.route[0]).includes(guard.route[1])
      &&passageNeighbors(world,guard.route[1]).includes(guard.route[0]),
      'retreat/advance use real reciprocal movement rather than a cinematic teleport');
    assert.ok(!world.traps.includes(guard.route[0])&&!world.traps.includes(guard.route[1]));
  }
});
