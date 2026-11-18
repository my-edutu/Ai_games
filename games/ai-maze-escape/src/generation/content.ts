import type{MazeConfig}from '../../../../packages/game-contracts/src/index';
import type{NamedRng}from '../../../../packages/seeded-rng/src/index';
import type{MazeDoor,MazeWorld}from '../state/types';
import{passageNeighbors,solveMaze}from './solver';
import{validateGeneratedMaze}from './validator';

export function doorBetween(world:MazeWorld,a:number,b:number):MazeDoor|undefined{return world.doors.find(door=>(door.a===a&&door.b===b)||(door.a===b&&door.b===a))}
function shortestDistance(world:MazeWorld,start:number,goal:number){const path=solveMaze(world,{start,goal});return path?path.length-1:Number.POSITIVE_INFINITY}
function chooseUnique(candidates:number[],count:number,rng:NamedRng,stream:string){const pool=[...candidates],out:number[]=[];while(pool.length&&out.length<count){const index=rng.nextInt(stream,pool.length);out.push(pool.splice(index,1)[0])}return out}

// Put one real moving Thornback patrol within an OPEN, traversable side branch
// of the mandatory journey. The guardian still occupies and patrols its own
// generated cells; Pip discovers it through normal public observation. This is
// not a cinematic spawn, hidden-information oracle or forced capture.
function chooseRouteWatchpost(world:MazeWorld,route:number[],unavailable:Set<number>,minimumDistance:number,rng:NamedRng,reserved:Set<number>,traps:number[]){
  const routeCells=new Set(route),ideal=Math.floor(route.length*0.35);
  const choices:{approachIndex:number;spawn:number;retreat:number;straight:boolean}[]=[];
  for(let index=Math.max(2,minimumDistance);index<route.length-2;index++){
    const approach=route[index]!;
    if(unavailable.has(approach))continue;
    for(const spawn of passageNeighbors(world,approach)){
      if(routeCells.has(spawn)||unavailable.has(spawn)
        ||!passageNeighbors(world,spawn).includes(approach)
        ||shortestDistance(world,world.start,spawn)<minimumDistance)continue;
      const retreatOptions=passageNeighbors(world,spawn)
        .filter(cell=>!routeCells.has(cell)&&!unavailable.has(cell)
          &&passageNeighbors(world,cell).includes(spawn)).sort((a,b)=>a-b);
      // A genuine two-cell straight approach makes Thornback readable whether
      // it is advancing or withdrawing. Never cut new passages to stage it.
      const fromRow=Math.floor(approach/world.width),fromCol=approach%world.width;
      const spawnRow=Math.floor(spawn/world.width),spawnCol=spawn%world.width;
      const aligned=retreatOptions.find(cell=>
        Math.floor(cell/world.width)-spawnRow===spawnRow-fromRow
        &&cell%world.width-spawnCol===spawnCol-fromCol);
      const retreat=aligned??retreatOptions[0];
      if(retreat!==undefined)choices.push({approachIndex:index,spawn,retreat,straight:aligned!==undefined});
    }
  }
  if(!choices.length)return null;
  // Keep the first staged encounter meaningfully early without placing a
  // guardian on Pip's required exit/key/gate route. Stable tie-breaks and a
  // named seeded stream retain replayable generation in the new content.
  choices.sort((a,b)=>Math.abs(a.approachIndex-ideal)-Math.abs(b.approachIndex-ideal)
    ||a.approachIndex-b.approachIndex||a.spawn-b.spawn||a.retreat-b.retreat);
  // If a real straight side corridor exists, NEVER randomly select an
  // off-axis bend. At both patrol endpoints the public one/two-cell view
  // then supports the same physical Pip–Thornback encounter contract.
  // Prefer a REAL, traversable pressure-side room within two mandatory
  // journey steps BEFORE the very same moving Thornback watchpost. The
  // previous selection ranked a visually isolated guardian first and only
  // afterwards attempted to attach a trap; most watchposts therefore had
  // no causal pressure-to-guardian sequence. This preference changes seeded
  // content selection, NOT passage geometry or the autonomous agent's
  // knowledge. Actual pressure remains optional and never blocks the key route.
  const staged=traps.length?choices.filter(choice=>{
    for(const back of [1,2,0]){
      const index=choice.approachIndex-back;
      if(index<1||index>=route.length-1||reserved.has(route[index]!))continue;
      const court=route[index]!;
      if(traps.some(cell=>passageNeighbors(world,court).includes(cell)
        &&passageNeighbors(world,cell).includes(court)))return true;
    }
    return guardianPressurePrelude(world,route,reserved,traps,choice)!==null;
  }):[];
  // A straight, legal two-cell patrol is preferable *among* genuinely staged
  // encounters; never sacrifice an available connected pressure performance
  // merely to select an isolated straight guardian. Preserve the deterministic
  // seed stream and original fallback when no suitable pressure room exists.
  const alignedStaged=staged.filter(choice=>choice.straight);
  const alignedChoices=choices.filter(choice=>choice.straight);
  // Whole-repository phase-2 gameplay contract is MORE stringent than
  // the focused phase-3 test: whenever any authentic straight two-cell
  // approach exists, a bent guardian corridor is unacceptable. Never
  // trade away actor readability for pressure proximity. Prefer a linked
  // pressure room WITHIN genuine straight options, otherwise keep the
  // aligned guardian and its unchanged lawful fallback.
  const pool=alignedStaged.length?alignedStaged
    :alignedChoices.length?alignedChoices
      :staged.length?staged:choices;
  // Give the physically connected Pressure Court and Thornback ONE observable
  // route-side room when the original passages permit it. First preserve the
  // six nearest *straight* eligible watchposts above, then prefer those with
  // an actual reciprocal pressure alcove on that SAME disclosed approach.
  // Both hazards remain optional off-route cells: no forged link, trap budget,
  // key/door, escape route, AI perception or patrol movement is changed.
  const nearby=pool.slice(0,Math.min(6,pool.length));
  const sharedCourt=nearby.filter(choice=>{
    const approach=route[choice.approachIndex]!;
    const exits=passageNeighbors(world,approach);
    const actual=traps.some(trap=>exits.includes(trap)
      &&passageNeighbors(world,trap).includes(approach));
    if(actual)return true;
    const candidate=guardianPressurePrelude(world,route,reserved,traps,choice);
    return candidate!==null && exits.includes(candidate)
      && passageNeighbors(world,candidate).includes(approach);
  });
  const shortlist=sharedCourt.length?sharedCourt:nearby;
  return shortlist[rng.nextInt('threat-policy:route-watchpost',shortlist.length)]!;
}

// One genuine optional pressure court on the early public journey: earlier
// traps were scattered across unseen off-route cells. Do not add passage
// geometry, obstruct the required key/gate/exit path or reveal hidden cells.
function chooseRoutePressureAlcove(world:MazeWorld,route:number[],offRoute:number[],reserved:Set<number>,visibilityRadius:number){
  const offRouteCells=new Set(offRoute);
  const minimum=Math.max(3,visibilityRadius+1);
  const ideal=Math.max(minimum,Math.floor(route.length*.15));
  const choices:{approachIndex:number;trap:number}[]=[];
  for(let index=minimum;index<route.length-2;index++){
    const approach=route[index]!;
    if(reserved.has(approach))continue;
    for(const trap of passageNeighbors(world,approach)){
      if(!offRouteCells.has(trap)||!passageNeighbors(world,trap).includes(approach))continue;
      choices.push({approachIndex:index,trap});
    }
  }
  choices.sort((a,b)=>Math.abs(a.approachIndex-ideal)-Math.abs(b.approachIndex-ideal)
    ||a.approachIndex-b.approachIndex||a.trap-b.trap);
  return choices[0]?.trap??null;
}

// One real, public-discoverable optional pressure room may precede Thornback's
// existing moving watchpost. These are already reciprocal generator passages:
// never forge a corridor, change the patrol, or put a trap on the critical route.
function guardianPressurePrelude(world:MazeWorld,route:number[],reserved:Set<number>,
 traps:number[],watchpost:{approachIndex:number;spawn:number;retreat:number}):number|null{
 if(!traps.length)return null;
 const routeSet=new Set(route);
 const denied=new Set([...reserved,...traps,watchpost.spawn,watchpost.retreat]);
 for(const back of [0,1,2]){
  const i=watchpost.approachIndex-back;
  if(i<1||i>=route.length-1)continue;
  const court=route[i]!;
  if(reserved.has(court))continue;
  // An existing legitimate staged pressure room is already sufficient.
  if(traps.some(cell=>passageNeighbors(world,court).includes(cell)
    &&passageNeighbors(world,cell).includes(court)))return null;
  const choices=passageNeighbors(world,court)
   .filter(cell=>!routeSet.has(cell)&&!denied.has(cell)
     &&passageNeighbors(world,cell).includes(court)).sort((a,b)=>a-b);
  if(choices.length)return choices[0]!;
 }
 return null;
}

// A true two-room treasure court is one visually continuous, walkable tier.
// Prefer this authored physical stage when legitimate generation contains it.
// The terrain's public three-band stair profile is fixed from row coordinates;
// neither the AI nor the renderer gains knowledge of undiscovered passages.
// A multi-tier legal chamber remains an entirely playable fallback.
function sharesTreasureTerrace(world:MazeWorld,entry:number,middle:number,shrine:number):boolean{
 const tier=(cell:number)=>Math.min(2,Math.max(0,Math.floor(
  Math.floor(cell/world.width)*3/Math.max(1,world.height))));
 return tier(entry)===tier(middle)&&tier(middle)===tier(shrine);
}

// Preserve the already verified straight guardian: do not rerank its spawn.
// A genuine previously-early required key may instead become a post-guardian
// objective, strictly ahead on walkable route ground and before its own gate.
export function forwardGuardianKeyCell(
 world:MazeWorld,route:number[],approachIndex:number,
 avoid:ReadonlySet<number>=new Set()
):{keyId:string;cell:number}|null{
 if(!Number.isInteger(approachIndex)||approachIndex<1
   ||approachIndex>=route.length-4)return null;
 const occupied=new Set<number>([world.start,world.exit,
   ...world.keys.map(key=>key.cell),...world.doors.flatMap(door=>[door.a,door.b]),
   ...world.traps,...world.clues,...world.checkpoints,...world.blockedCells]);
 for(const key of world.keys){
   const oldIndex=route.indexOf(key.cell);
   if(oldIndex<1||oldIndex>=approachIndex)continue;
   const crossing=route.findIndex((cell,index)=>index>approachIndex+3
     &&world.doors.some(door=>door.critical&&door.requiredKeyId===key.id
       &&((route[index-1]===door.a&&cell===door.b)
         ||(route[index-1]===door.b&&cell===door.a))));
   if(crossing<0)continue;
   const last=Math.min(approachIndex+6,crossing-2);
   // A REAL one-door-side alcove asks Pip to discover and enter a physical
   // chamber to collect the critical key. It must be reached from an existing
   // reciprocal open passage AFTER Thornback but BEFORE the matching gate.
   // Keep every hazard, guardian patrol, route, blocked tile and authored
   // object untouched. Never create fake passages or use hidden AI knowledge.
   // A terminal dead end prevents a hidden second shortcut around the court.
   const mainRoute=new Set(route);
   let oneStepChamber:number|null=null;
   let steppedTwoLinkChamber:number|null=null;
   if(Number.isInteger(world.width)&&world.width>0
     &&Number.isInteger(world.height)&&world.height>0
     &&Array.isArray(world.passages)){
     for(let i=approachIndex+2;i<=last;i++){
       const entry=route[i]!;
       const firstSteps=passageNeighbors(world,entry).filter(cell=>
         !mainRoute.has(cell)&&!occupied.has(cell)&&!avoid.has(cell)
         &&!doorBetween(world,entry,cell)).sort((a,b)=>a-b);
       for(const first of firstSteps){
         const links=passageNeighbors(world,first);
         if(!links.includes(entry))continue; // the gallery must be reciprocal
         if(links.length===1){
           if(oneStepChamber===null)oneStepChamber=first;
           continue;
         }
         if(links.length!==2)continue;
         const shrine=links.find(cell=>cell!==entry);
         if(shrine===undefined||mainRoute.has(shrine)||occupied.has(shrine)
           ||avoid.has(shrine)||doorBetween(world,first,shrine))continue;
         const shrineLinks=passageNeighbors(world,shrine);
         // The real two-link return journey creates a meaningful key detour.
         // Neither hidden shortcuts nor sealed passages count as a chamber.
         if(shrineLinks.length===1&&shrineLinks[0]===first){
           // A same-elevation real gallery earns the connected raised-to-spent
           // Tideglass 3D stage. An earlier multi-tier passage cannot take its
           // place merely because its route index happens to be smaller.
           if(sharesTreasureTerrace(world,entry,first,shrine))
             return {keyId:key.id,cell:shrine};
           if(steppedTwoLinkChamber===null)steppedTwoLinkChamber=shrine;
         }
       }
     }
     // If there is no physically level two-link gallery, keep the previous
     // legal multi-tier detour before one-step / main-route fallbacks.
     if(steppedTwoLinkChamber!==null)
       return {keyId:key.id,cell:steppedTwoLinkChamber};
     if(oneStepChamber!==null)return {keyId:key.id,cell:oneStepChamber};
   }
   // If genuine side chambers do not exist, retain Pass481's original safe
   // public main-route pickup instead of manufacturing a chamber or dead end.
   for(let i=approachIndex+2;i<=last;i++){
     const cell=route[i]!;
     if(!occupied.has(cell)&&!avoid.has(cell))return {keyId:key.id,cell};
   }
 }
 return null;
}

export function populateMazeContent(base:MazeWorld,config:MazeConfig,rng:NamedRng):MazeWorld{
  const world=structuredClone(base),route=solveMaze(world,{start:world.start,goal:world.exit});if(!route)throw new Error('cannot populate unsolved maze');
  const dependencyCount=Math.min(config.keyCount,Math.max(0,Math.floor((route.length-3)/4)));
  for(let i=0;i<dependencyCount;i++){
    const denominator=dependencyCount*2+1;
    let keyIndex=Math.max(1,Math.floor((i*2+1)*(route.length-1)/denominator));
    let doorToIndex=Math.max(keyIndex+1,Math.floor((i*2+2)*(route.length-1)/denominator));
    if(doorToIndex>=route.length)doorToIndex=route.length-1;if(keyIndex>=doorToIndex)keyIndex=Math.max(1,doorToIndex-1);
    const keyId=`key-${i+1}`,doorId=`door-${i+1}`;
    world.keys.push({id:keyId,cell:route[keyIndex],collected:false});
    world.doors.push({id:doorId,a:route[doorToIndex-1],b:route[doorToIndex],requiredKeyId:keyId,open:false,critical:true,temporaryUntilTick:null});
  }
  const reserved=new Set<number>([world.start,world.exit,...world.keys.map(key=>key.cell),...world.doors.flatMap(door=>[door.a,door.b])]);
  const routeSet=new Set(route),offRoute=Array.from({length:world.width*world.height},(_,cell)=>cell).filter(cell=>!reserved.has(cell)&&!routeSet.has(cell));
  const pressureAlcove=config.trapCount>0
    ?chooseRoutePressureAlcove(world,route,offRoute,reserved,config.visibilityRadius):null;
  const remainingOffRoute=pressureAlcove===null?offRoute:offRoute.filter(cell=>cell!==pressureAlcove);
  const remainingTraps=Math.max(0,config.trapCount-(pressureAlcove===null?0:1));
  world.traps=[...(pressureAlcove===null?[]:[pressureAlcove]),
    ...chooseUnique(remainingOffRoute,Math.min(remainingTraps,remainingOffRoute.length),rng,'hazards:traps')]
    .sort((a,b)=>a-b);
  const clueCandidates=route.slice(1,-1).filter(cell=>!reserved.has(cell));
  world.clues=chooseUnique(clueCandidates,Math.min(Math.max(1,dependencyCount),clueCandidates.length),rng,'dependencies:clues').sort((a,b)=>a-b);
  if(route.length>4)world.checkpoints=[route[Math.floor(route.length/2)]];
  const threatCount=Math.min(config.threatCount,8),threatReserved=new Set<number>([...reserved,...world.traps]);
  const minimumDistance=Math.max(3,config.visibilityRadius+1);
  if(threatCount){
    const watchpost=chooseRouteWatchpost(world,route,threatReserved,minimumDistance,rng,reserved,world.traps);
    if(watchpost){
      // Tie a genuine off-route pressure prelude to the same lawful patrol.
      // Pass464b now separately verifies the current PUBLIC guardian before
      // producing an urgent HUD warning during a physical key-gate opening.
      // Reintroduce the stage only under the strict unchanged native gates.
      const linked=guardianPressurePrelude(world,route,reserved,world.traps,watchpost);
      const original=pressureAlcove??world.traps[0];
      if(linked!==null&&original!==undefined){
        world.traps=world.traps.map(cell=>cell===original?linked:cell).sort((a,b)=>a-b);
        threatReserved.delete(original);threatReserved.add(linked);
      }
      world.threats.push({id:'threat-1',cell:watchpost.spawn,route:[watchpost.spawn,watchpost.retreat],routeIndex:0,direction:1,lastSeenTick:null,active:true});
      // Never move the guardian, trap, gate, routes or private AI knowledge:
      // require an actual reciprocal pressure room at this SAME straight
      // two-cell watchpost before shifting its existing matching key forward.
      const joinedPressure=watchpost.straight&&[0,1,2].some(back=>{
        const court=route[watchpost.approachIndex-back];
        return court!==undefined&&world.traps.some(trap=>
          passageNeighbors(world,court).includes(trap)
          &&passageNeighbors(world,trap).includes(court));
      });
      if(joinedPressure){
        const relay=forwardGuardianKeyCell(world,route,watchpost.approachIndex,
          new Set([watchpost.spawn,watchpost.retreat]));
        if(relay){
          const key=world.keys.find(item=>item.id===relay.keyId)!;
          key.cell=relay.cell;
          reserved.add(relay.cell);
          threatReserved.add(relay.cell);
        }
      }
      threatReserved.add(watchpost.spawn);threatReserved.add(watchpost.retreat);
    }
  }
  const threatCandidates=Array.from({length:world.width*world.height},(_,cell)=>cell)
    .filter(cell=>!threatReserved.has(cell)&&shortestDistance(world,world.start,cell)>=minimumDistance
      &&passageNeighbors(world,cell).some(next=>!threatReserved.has(next)));
  const spawns=chooseUnique(threatCandidates,Math.min(threatCount-world.threats.length,threatCandidates.length),rng,'threat-policy:spawns');
  for(const spawn of spawns){
    const neighbor=passageNeighbors(world,spawn).filter(cell=>!threatReserved.has(cell)).sort((a,b)=>a-b)[0];
    if(neighbor===undefined)continue;
    world.threats.push({id:`threat-${world.threats.length+1}`,cell:spawn,route:[spawn,neighbor],routeIndex:0,direction:1,lastSeenTick:null,active:true});
    threatReserved.add(spawn);threatReserved.add(neighbor);
  }
  return world;
}

export interface MazeInventorySolution{cells:number[];keyOrder:string[];doorOrder:string[];expansions:number}
export function solveMazeWithInventory(world:MazeWorld):MazeInventorySolution|null{
  const keyIndex=new Map(world.keys.map((key,index)=>[key.id,index] as const)),stateCount=world.width*world.height*(1<<world.keys.length),parent=new Int32Array(stateCount);parent.fill(-2);const parentDoor=new Array<string|null>(stateCount).fill(null),queue:number[]=[];
  const collect=(cell:number,mask:number)=>{for(const key of world.keys)if(key.cell===cell){const index=keyIndex.get(key.id);if(index!==undefined)mask|=1<<index}return mask};
  const encode=(cell:number,mask:number)=>mask*world.width*world.height+cell,decode=(value:number)=>({cell:value%(world.width*world.height),mask:Math.floor(value/(world.width*world.height))});
  const startMask=collect(world.start,0),startState=encode(world.start,startMask);parent[startState]=-1;queue.push(startState);let goalState=-1,expansions=0;
  for(let q=0;q<queue.length;q++){const currentState=queue[q],{cell,mask}=decode(currentState);expansions++;if(cell===world.exit){goalState=currentState;break}for(const next of passageNeighbors(world,cell)){if(world.blockedCells.includes(next))continue;const door=doorBetween(world,cell,next);if(door&&!door.open){const required=keyIndex.get(door.requiredKeyId);if(required===undefined||!(mask&(1<<required)))continue}const nextMask=collect(next,mask),encoded=encode(next,nextMask);if(parent[encoded]!==-2)continue;parent[encoded]=currentState;parentDoor[encoded]=door?.id??null;queue.push(encoded)}}
  if(goalState<0)return null;const states:number[]=[];for(let at=goalState;at!==-1;at=parent[at])states.push(at);states.reverse();const cells=states.map(state=>decode(state).cell),keyOrder:string[]=[],doorOrder:string[]=[];for(const cell of cells)for(const key of world.keys)if(key.cell===cell&&!keyOrder.includes(key.id))keyOrder.push(key.id);for(let i=1;i<states.length;i++){const door=parentDoor[states[i]];if(door&&!doorOrder.includes(door))doorOrder.push(door)}return{cells,keyOrder,doorOrder,expansions};
}

export interface MazeContentValidation{valid:boolean;reasons:string[];solutionExists:boolean;keyOrderValid:boolean;safeSpawn:boolean;solutionLength:number}
export function validateMazeContent(world:MazeWorld,options:{minimumThreatResponseDistance?:number}={}):MazeContentValidation{
  const reasons=[...validateGeneratedMaze(world).reasons],solution=solveMazeWithInventory(world),keyOrderValid=!!solution&&world.doors.every(door=>solution.keyOrder.indexOf(door.requiredKeyId)>=0&&solution.doorOrder.indexOf(door.id)>=0),minimum=options.minimumThreatResponseDistance??2,safeSpawn=world.threats.every(threat=>shortestDistance(world,world.start,threat.cell)>=minimum);
  if(!solution)reasons.push('content-unsolved');if(!keyOrderValid)reasons.push('key-order');if(!safeSpawn)reasons.push('unsafe-threat-spawn');
  const occupied=[world.start,world.exit,...world.keys.map(key=>key.cell),...world.traps,...world.threats.map(threat=>threat.cell),...world.blockedCells];if(new Set(occupied).size!==occupied.length)reasons.push('content-overlap');
  for(const trap of world.traps)if(trap===world.start||trap===world.exit)reasons.push('trap-clearance');
  return{valid:reasons.length===0,reasons:[...new Set(reasons)],solutionExists:!!solution,keyOrderValid,safeSpawn,solutionLength:solution?solution.cells.length-1:0};
}
