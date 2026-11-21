'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const {SnakeRuntime}=require('../../dist/games/autonomous-snake/src/runtime/run.js');
const {chooseFallbackAction}=require('../../dist/games/autonomous-snake/src/ai/fallback.js');
const {isLegalAction}=require('../../dist/games/autonomous-snake/src/rules/step.js');

// The actual live PR-head fallback file is git blob b7ab911b66c8996d762de290e75e55ada8c4834c.
// Its old flood fill performs Array.shift once per cell, and allocates a new
// adjacency array for every visit. The bounded candidate must not use either
// queue-shifting mechanism; all authentic legality and state remain intact.
test('actual seeded fallback requires no per-tile Array.shift and never changes authority',()=>{
  let seen=0;
  for(const profile of ['open','corridors','portals']) for(let seed=0;seed<3;seed++){
    const runtime=SnakeRuntime.create({width:28,height:16,targetLength:48,hazardCount:5,profile},`t134:${profile}:${seed}`);
    for(let tick=0;tick<220&&!runtime.state.result;tick++){
      if(tick%13===0){
        const frozen=JSON.stringify(runtime.state);
        const originalShift=Array.prototype.shift;
        let decision;
        try{
          Array.prototype.shift=function(){throw Error('Per-cell FIFO array shifting prohibited in bounded fallback');};
          decision=chooseFallbackAction(runtime.state);
        } finally {Array.prototype.shift=originalShift;}
        assert.equal(JSON.stringify(runtime.state),frozen,'fallback must not mutate live deterministic state');
        if(decision)assert.equal(isLegalAction(runtime.state,decision),true);
        seen++;
      }
      runtime.step();
    }
  }
  assert.ok(seen>=125,`authentic exercised states ${seen}`);
});
