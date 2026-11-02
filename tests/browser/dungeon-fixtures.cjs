'use strict';
const {DungeonRuntime}=require('../../dist/games/ai-dungeon/src/index.js');
// These snapshots come from real authority. Pin only presentation tests; the
// independent live-runtime tests still exercise the actual ticking HTTP host.
async function pinDungeonScene(page,{seed='dungeon-ui-round17',ticks=18}={}){
 const game=DungeonRuntime.create(seed);for(let i=0;i<ticks;i++)game.step();
 let snapshot=game.publicState();
 await page.route('**/dungeon/state',route=>route.fulfill({json:snapshot}));
 return {get snapshot(){return snapshot},advance(count){for(let i=0;i<count;i++)game.step();snapshot=game.publicState();return snapshot}};
}
/**
 * A live autonomous run legitimately rolls its per-run tick back to zero
 * after defeat. An observable newer run is progress, not a stalled renderer.
 * Consume ONLY genuine public snapshots: never mutate the game or synthesize
 * a passing state.
 */
function hasLiveDungeonAdvanced(before,after,minTicks=3){
 if(!Number.isSafeInteger(before?.run)||!Number.isSafeInteger(before?.tick)||
    !Number.isSafeInteger(after?.run)||!Number.isSafeInteger(after?.tick)||
    before.run<0||after.run<0||before.tick<0||after.tick<0||
    !Number.isSafeInteger(minTicks)||minTicks<1||minTicks>100)return false;
 return after.run>before.run||
  (after.run===before.run&&after.tick-before.tick>=minTicks);
}
module.exports={pinDungeonScene,hasLiveDungeonAdvanced};
