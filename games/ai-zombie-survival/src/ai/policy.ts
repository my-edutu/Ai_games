import type{ResourceKind,SurvivorAction,SurvivorState,ZombieDefense,ZombieState,ZombieStrategy}from'../state/types';
import{manhattan,stableNeighbors}from'../rules/grid';

export interface ZombieObservation{
  day:number;
  lifecycle:ZombieState['lifecycle'];
  weather:ZombieState['weather'];
  strategy:ZombieStrategy;
  self:Pick<SurvivorState,'id'|'role'|'cell'|'health'|'stamina'|'status'|'carrying'|'stuckTicks'>;
  visibleZombies:Array<{id:string;kind:string;cell:number;health:number}>;
  allies:Array<{id:string;role:string;cell:number;health:number;status:string}>;
  defenses:Array<Pick<ZombieDefense,'id'|'cell'|'integrity'|'maxIntegrity'|'level'>>;
  resources:ZombieState['resources'];
  resourceSites:Array<{id:string;kind:ResourceKind;cell:number;stock:number}>;
  coreCell:number;
  coreIntegrity:number;
  forecast:{band:'low'|'medium'|'high'};
}

export interface SurvivorDecision{
  survivorId:string;
  action:SurvivorAction;
  targetCell:number|null;
  targetId:string|null;
  intent:string;
  confidence:number;
}

function survivor(state:ZombieState,id:string){
  const found=state.survivors.find(item=>item.id===id);
  if(!found)throw new Error('survivor not found');
  return found;
}

function forecast(state:ZombieState):'low'|'medium'|'high'{
  const predicted=Math.min(state.config.maxZombies,state.config.waveBaseSize+(state.day-1)*state.config.waveGrowthPerDay);
  const ratio=predicted/state.config.maxZombies;
  return ratio<0.34?'low':ratio<0.67?'medium':'high';
}

export function createSurvivorObservation(state:ZombieState,survivorId:string):ZombieObservation{
  const self=survivor(state,survivorId);
  const radius=state.weather==='fog'?3:6;
  return{
    day:state.day,
    lifecycle:state.lifecycle,
    weather:state.weather,
    strategy:state.strategy,
    self:{id:self.id,role:self.role,cell:self.cell,health:self.health,stamina:self.stamina,status:self.status,carrying:self.carrying?{...self.carrying}:null,stuckTicks:self.stuckTicks},
    visibleZombies:state.zombies.filter(z=>z.status==='active'&&manhattan(self.cell,z.cell,state.world.width)<=radius).sort((a,b)=>a.id.localeCompare(b.id)).map(z=>({id:z.id,kind:z.kind,cell:z.cell,health:z.health})),
    allies:state.survivors.filter(a=>a.id!==self.id).sort((a,b)=>a.id.localeCompare(b.id)).map(a=>({id:a.id,role:a.role,cell:a.cell,health:a.health,status:a.status})),
    defenses:state.defenses.map(d=>({id:d.id,cell:d.cell,integrity:d.integrity,maxIntegrity:d.maxIntegrity,level:d.level})).sort((a,b)=>a.id.localeCompare(b.id)),
    resources:{...state.resources},
    resourceSites:state.world.resourceSites.map(site=>({id:site.id,kind:site.kind,cell:site.cell,stock:site.stock})).sort((a,b)=>a.id.localeCompare(b.id)),
    coreCell:state.world.coreCell,
    coreIntegrity:state.coreIntegrity,
    forecast:{band:forecast(state)},
  };
}

export function chooseTeamStrategy(state:ZombieState):ZombieStrategy{
  const alive=state.survivors.filter(s=>s.status!=='dead').length;
  if(state.coreIntegrity<=Math.floor(state.config.coreMaxIntegrity*0.3)||alive<=1)return'last-stand';
  if(state.survivors.some(s=>s.status!=='dead'&&s.health<60)&&state.resources.medicine>0)return'rescue';
  const weakest=Math.min(...state.defenses.map(d=>d.integrity/d.maxIntegrity));
  if(weakest<0.5&&state.resources.materials>=5)return'fortify';
  if(Math.min(...Object.values(state.resources))<10)return'stockpile';
  return'balanced';
}

function decision(survivorId:string,action:SurvivorAction,targetCell:number|null,targetId:string|null,intent:string,confidence:number):SurvivorDecision{
  return{survivorId,action,targetCell,targetId,intent:intent.slice(0,96),confidence:Math.max(0,Math.min(1,confidence))};
}

function weakestDefense(state:ZombieState){
  return[...state.defenses].sort((a,b)=>a.integrity/a.maxIntegrity-b.integrity/b.maxIntegrity||a.id.localeCompare(b.id))[0];
}

function firstUpgradableDefense(state:ZombieState){
  return state.defenses.find(defense=>defense.level<state.config.wallMaxLevel);
}

function recoveryTarget(state:ZombieState,self:SurvivorState){
  const blocked=new Set(state.world.blockedCells);
  const occupied=new Set(state.survivors.filter(item=>item.status==='active'&&item.id!==self.id).map(item=>item.cell));
  const candidates=stableNeighbors(self.cell,state.world.width,state.world.height).filter(cell=>!blocked.has(cell)&&!occupied.has(cell));
  return candidates[0]??self.cell;
}

function resourcePriority(state:ZombieState,role:SurvivorState['role']):ResourceKind{
  if(role==='builder')return'materials';
  if(role==='medic')return'medicine';
  if(role==='guard')return'ammo';
  const order:ResourceKind[]=['materials','ammo','medicine','food','power'];
  return order.sort((a,b)=>state.resources[a]-state.resources[b]||a.localeCompare(b))[0];
}

export function chooseSurvivorDecision(state:ZombieState,survivorId:string):SurvivorDecision{
  const self=survivor(state,survivorId);
  const observation=createSurvivorObservation(state,survivorId);
  if(self.status!=='active')return decision(self.id,'idle',null,null,'Unavailable for action.',1);

  if(self.stuckTicks>=state.config.stuckRecoveryTicks){
    return decision(self.id,'reposition',recoveryTarget(state,self),null,'Breaking a stuck route loop; seeking an alternate position.',0.91);
  }

  const injured=state.survivors.filter(s=>s.status==='active'&&s.health<100&&s.id!==self.id).sort((a,b)=>a.health-b.health||a.id.localeCompare(b.id))[0];
  if(self.role==='medic'&&injured&&state.resources.medicine>0){
    return decision(self.id,'heal',injured.cell,injured.id,`Treating ${injured.id}.`,0.96);
  }

  const defense=weakestDefense(state);
  if(self.role==='builder'&&defense.integrity<defense.maxIntegrity&&state.resources.materials>=5){
    return decision(self.id,'repair',defense.cell,defense.id,`Repairing ${defense.gateId}.`,0.94);
  }

  const upgrade=firstUpgradableDefense(state);
  if(self.role==='builder'&&state.lifecycle==='preparation'&&upgrade&&state.resources.materials>=state.config.wallBuildCost){
    return decision(self.id,'build',upgrade.cell,upgrade.id,`Reinforcing ${upgrade.gateId} to level ${upgrade.level+1}.`,0.9);
  }

  if(state.lifecycle==='horde'){
    const threat=[...observation.visibleZombies].sort((a,b)=>manhattan(self.cell,a.cell,state.world.width)-manhattan(self.cell,b.cell,state.world.width)||a.id.localeCompare(b.id))[0];
    if(threat&&(manhattan(self.cell,threat.cell,state.world.width)<=1||state.resources.ammo>0)){
      return decision(self.id,'attack',threat.cell,threat.id,`Engaging ${threat.kind}.`,0.92);
    }
    if(self.health<35)return decision(self.id,'retreat',state.world.coreCell,null,'Retreating to the command core.',0.9);
    return decision(self.id,self.role==='guard'?'guard':'reposition',defense.cell,defense.id,'Covering the weakest perimeter.',0.78);
  }

  if(self.carrying)return decision(self.id,'deliver',state.world.coreCell,null,`Delivering ${self.carrying.kind}.`,0.95);
  if(self.stamina<25)return decision(self.id,'rest',self.cell,null,'Recovering stamina before the horde.',0.88);
  const kind=resourcePriority(state,self.role);
  const site=state.world.resourceSites.find(item=>item.kind===kind)??state.world.resourceSites[0];
  return decision(self.id,'scavenge',site.cell,site.id,`Scavenging ${site.kind}.`,0.82);
}
