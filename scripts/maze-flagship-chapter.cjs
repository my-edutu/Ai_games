'use strict';
// Select a genuine authored opening run, never edit the world or advise the AI.
// Source truth stays in MazeRuntime: every candidate is generated normally,
// and the final autonomous policy sees only its standard public observations.
const { solveMaze, passageNeighbors, areAdjacentThroughPassage } =
  require('../dist/games/ai-maze-escape/src/generation/solver.js');
const { solveMazeWithInventory } =
  require('../dist/games/ai-maze-escape/src/generation/content.js');
const DEFAULT_SEEDS = Object.freeze([
  'maze-stream-reference',
  ...[3,13,5,0,1,2].map(index=>`maze-visual-reference-${index}`),
  ...Array.from({length:36},(_,index)=>`tideglass-live-chapter-${index}`)
]);
function row(cell,width){return Math.floor(cell/width)}
function straight(a,b,c,width){
  return b%width-a%width===c%width-b%width &&
    row(b,width)-row(a,width)===row(c,width)-row(b,width);
}
function level(world,cell){
  return Math.min(2,Math.max(0,Math.floor(row(cell,world.width)*3/Math.max(1,world.height))));
}
// A true joined chapter requires physical, reciprocal PRESSURE, a straight
// moving guardian, a two-link return trip for its ORIGINAL critical key and
// the later actual matching lock. It is not a sequence of unrelated screenshots.
function naturalFlagshipChapter(world){
  if(!world||!Array.isArray(world.threats)||!Array.isArray(world.keys)
    ||!Array.isArray(world.doors)||!Array.isArray(world.traps))return null;
  const route=solveMaze(world,{start:world.start,goal:world.exit});
  const solved=solveMazeWithInventory(world);
  if(!route||!solved||!solved.doorOrder.length)return null;
  const index=new Map(route.map((cell,at)=>[cell,at]));
  for(const guardian of world.threats){
    const [spawn,retreat]=guardian.route||[];
    if(spawn===undefined||retreat===undefined
      ||!areAdjacentThroughPassage(world,spawn,retreat))continue;
    for(let approachIndex=3;approachIndex<route.length-5;approachIndex++){
      const approach=route[approachIndex];
      if(!areAdjacentThroughPassage(world,approach,spawn)
        ||!straight(approach,spawn,retreat,world.width))continue;
      const pressure=world.traps.find(trap=>
        [approachIndex,approachIndex-1,approachIndex-2].some(at=>
          at>=0&&areAdjacentThroughPassage(world,route[at],trap)));
      if(pressure===undefined)continue;
      for(const key of world.keys){
        if(!solved.keyOrder.includes(key.id))continue;
        const shrineLinks=passageNeighbors(world,key.cell);
        if(shrineLinks.length!==1)continue;
        const middle=shrineLinks[0];
        if(!areAdjacentThroughPassage(world,middle,key.cell))continue;
        const middleLinks=passageNeighbors(world,middle);
        if(middleLinks.length!==2)continue;
        const entry=middleLinks.find(cell=>cell!==key.cell);
        const entryIndex=index.get(entry);
        if(entryIndex===undefined||entryIndex<approachIndex+2
          ||!areAdjacentThroughPassage(world,entry,middle)
          ||level(world,entry)!==level(world,middle)
          ||level(world,middle)!==level(world,key.cell))continue;
        const gate=world.doors.find(door=>door.critical
          &&door.requiredKeyId===key.id&&solved.doorOrder.includes(door.id));
        if(!gate)continue;
        const gateIndex=route.findIndex((cell,at)=>at>0
          &&((route[at-1]===gate.a&&cell===gate.b)
          ||(route[at-1]===gate.b&&cell===gate.a)));
        if(gateIndex<=entryIndex+1)continue;
        const firstVisit=solved.cells.indexOf(middle);
        if(firstVisit<0||solved.cells.lastIndexOf(middle)===firstVisit
          ||!solved.cells.includes(key.cell)||!solved.cells.includes(world.exit))continue;
        return Object.freeze({guardianId:guardian.id,pressureCell:pressure,
          keyId:key.id,gateId:gate.id,entryCell:entry,shrineCell:key.cell});
      }
    }
  }
  return null;
}
function chooseFlagshipLiveSeed(makeWorld,seeds=DEFAULT_SEEDS){
  if(typeof makeWorld!=='function')throw new TypeError('world factory');
  for(const seed of seeds){
    const chapter=naturalFlagshipChapter(makeWorld(seed));
    if(chapter)return {seed,chapter};
  }
  // Original live run stays lawful when no source actually contains the
  // chapter. Never fabricate a key, passage, encounter, or validator result.
  return {seed:'maze-stream-reference',chapter:null};
}
module.exports={DEFAULT_SEEDS,naturalFlagshipChapter,chooseFlagshipLiveSeed};
