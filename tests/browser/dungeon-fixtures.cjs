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
module.exports={pinDungeonScene};
