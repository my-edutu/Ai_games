import type{TowerConfig}from'../config/schema';import{canTraversePlatformEdge,towerMovementEnvelope}from'../generation/solver';import type{TowerObservation}from'./observation';
export interface TowerGraphNode{id:string;kind:'solid'|'oneway'|'moving';x:number;y:number;width:number;height:number;neighbors:string[]}
export function buildTowerPlatformGraph(observation:TowerObservation,config:TowerConfig){const envelope=towerMovementEnvelope(config),platforms=observation.platforms,nodes:TowerGraphNode[]=platforms.map(a=>({id:a.id,kind:a.kind,x:a.x,y:a.y,width:a.width,height:a.height,neighbors:platforms.filter(b=>b.id!==a.id&&canTraversePlatformEdge(a,b,envelope)).map(b=>b.id).sort()}));return nodes.sort((a,b)=>a.y-b.y||a.id.localeCompare(b.id))}
export function nextTowerPlatform(observation:TowerObservation,config:TowerConfig,currentId?:string){const graph=buildTowerPlatformGraph(observation,config),start=graph.find(n=>n.id===currentId)??graph[0];if(!start)return undefined;const candidates=start.neighbors.map(id=>graph.find(n=>n.id===id)!).filter(Boolean).sort((a,b)=>a.y-b.y||a.id.localeCompare(b.id));return candidates[0]}


// Tactical-v2 makes an observed route choice only where the real current
// platform graph offers alternatives. Historical replay uses nextTowerPlatform.
// The game already exposes the current floor's geometry, hazards, enemies and
// pickups; no future movement, random number or hidden future floor is read.
// A route must still reach the observed cap if such a route exists.
export function nextTowerTacticalPlatform(
  observation:TowerObservation, config:TowerConfig, currentId:string|undefined,
  previousTargetId:string|undefined, halfWidth:number, halfHeight:number
){
  const graph=buildTowerPlatformGraph(observation,config);
  const current=graph.find(node=>node.id===currentId)??graph[0];
  if(!current)return undefined;
  const byId=new Map(graph.map(node=>[node.id,node]));
  const options=current.neighbors.map(id=>byId.get(id)).filter(
    (node):node is TowerGraphNode=>node!==undefined
  ).sort((a,b)=>(a.y+a.height)-(b.y+b.height)||a.id.localeCompare(b.id));
  if(options.length<2)return options[0];
  const cap=graph.find(node=>node.id===`f${observation.floor}:cap`);
  const leadsToCap=new Set<string>(cap?[cap.id]:[]);
  if(cap){
    for(const node of [...graph].sort((a,b)=>(b.y+b.height)-(a.y+a.height))){
      if(node.neighbors.some(id=>leadsToCap.has(id)))leadsToCap.add(node.id);
    }
  }
  const eligible=cap&&options.some(node=>leadsToCap.has(node.id))
    ?options.filter(node=>leadsToCap.has(node.id)):options;
  const player=observation.player;
  const minLane=10000;
  function inspect(node:TowerGraphNode){
    const top=node.y+node.height;
    const margin=Math.max(halfWidth+4000,Math.min(18000,Math.floor(node.width/8)));
    let lanes=[{left:node.x+margin,right:node.x+node.width-margin}].filter(l=>l.right>l.left);
    function exclude(blockLeft:number,blockRight:number){
      const free:typeof lanes=[];
      for(const lane of lanes){
        if(blockRight<=lane.left||blockLeft>=lane.right){free.push(lane);continue;}
        if(blockLeft-lane.left>=minLane)free.push({left:lane.left,right:blockLeft});
        if(lane.right-blockRight>=minLane)free.push({left:blockRight,right:lane.right});
      }
      lanes=free;
    }
    for(const hazard of observation.hazards){
      if(!hazard.active||hazard.y>=top+halfHeight*2||hazard.y+hazard.height<=top)continue;
      exclude(hazard.x-halfWidth-2500,hazard.x+hazard.width+halfWidth+2500);
    }
    for(const enemy of observation.enemies){
      if(!enemy.active||enemy.position.y-enemy.halfHeight>=top+halfHeight*2||
        enemy.position.y+enemy.halfHeight<=top)continue;
      exclude(enemy.position.x-enemy.halfWidth-halfWidth-2500,
        enemy.position.x+enemy.halfWidth+halfWidth+2500);
    }
    const clearance=lanes.reduce((largest,lane)=>Math.max(largest,lane.right-lane.left),0);
    const healing=observation.pickups.some(item=>item.kind==='health' &&
      item.position.x>=node.x+margin&&item.position.x<=node.x+node.width-margin&&
      Math.abs(item.position.y-(top+halfHeight))<=halfHeight+8000);
    return {node,clearance,healing};
  }
  const assessed=eligible.map(inspect), first=assessed[0];
  // Keep a surviving, already chosen safe alternative stable as temporary
  // spike phases change, rather than reversing the planned launch each tick.
  const committed=assessed.find(item=>item.node.id===previousTargetId);
  if(committed&&committed!==first&&committed.clearance>=minLane)return committed.node;
  const healthRatio=player.maxHealth>0?player.health/player.maxHealth:1;
  if(first.clearance>=minLane){
    // Wounded climbers may take a still-reachable, body-clear health deck
    // before a harder ascent; the pickup must actually be visible now.
    if(healthRatio<=.5&&!first.healing){
      const aid=assessed.filter(item=>item.healing&&item.clearance>=minLane&&
        item.clearance>=first.clearance*.85)
        .sort((a,b)=>(a.node.y+a.node.height)-(b.node.y+b.node.height)||
          a.node.id.localeCompare(b.node.id))[0];
      if(aid)return aid.node;
    }
    return first.node;
  }
  // A live enemy or spike wall occupying the nominal first deck is a reason
  // to choose a genuinely traversable alternate. If no presently clear
  // landing exists, do not invent one: preserve the original physical route.
  const clear=assessed.filter(item=>item.clearance>=minLane)
    .sort((a,b)=>b.clearance-a.clearance||
      (a.node.y+a.node.height)-(b.node.y+b.node.height)||
      a.node.id.localeCompare(b.node.id));
  return clear[0]?.node??first.node;
}
