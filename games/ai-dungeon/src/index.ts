import {NamedRng, type RngSnapshot} from '../../../packages/seeded-rng/src/index';
import {checksum} from '../../../packages/replay/src/index';

export const DUNGEON_VERSION='0.4.0';
export const MAP_SIZE=19;
export type UnitKind='vanguard'|'ranger'|'mystic'|'revenant'|'cultist'|'warden';
export type Faction='party'|'enemy';
export interface Unit {id:string;kind:UnitKind;faction:Faction;x:number;z:number;hp:number;maxHp:number;attack:number;cooldown:number;action?:'idle'|'move'|'attack'|'cast'|'hurt'|'guard';actionTick?:number;guardTick?:number;targetId?:string}
export interface DungeonEvent {tick:number;kind:string;text:string}
export interface DungeonTrap{id:string;x:number;z:number;kind:'ember'|'arcane';active:boolean;cooldown:number;disarmed:boolean;triggers:number}
export interface DungeonState {schemaVersion:1;tick:number;floor:number;run:number;phase:'exploring'|'intermission';intermission:number;theme:string;map:string[];exit:{x:number;z:number};units:Unit[];relics:{x:number;z:number}[];traps:DungeonTrap[];kills:number;gold:number;level:number;intent:string;events:DungeonEvent[]}
export interface DungeonSave {version:string;seed:string;rng:RngSnapshot;state:DungeonState;signature:string}
export type WardenPhase='SENTINEL'|'RUPTURE'|'ECLIPSE'|'VANQUISHED';
export function wardenPhase(boss?:Pick<Unit,'hp'|'maxHp'>):WardenPhase{
 if(!boss||boss.hp<=0)return 'VANQUISHED';
 const fraction=boss.hp/boss.maxHp;
 return fraction>.65?'SENTINEL':fraction>.30?'RUPTURE':'ECLIPSE';
}
/** The Warden's first-phase barrier is paid for by living defenders, never a hidden timer. */
export function wardenSealActive(s:Pick<DungeonState,'units'>):boolean {
 const guardian=s.units.find(u=>u.kind==='warden'&&u.hp>0);
 return Boolean(guardian&&wardenPhase(guardian)==='SENTINEL'&&s.units.some(u=>u.faction==='enemy'&&u.kind!=='warden'&&u.hp>0));
}
export function damageThroughWardenSeal(s:DungeonState,target:Unit,raw:number):number {
 if(target.kind!=='warden')return raw;
 if(wardenSealActive(s))return Math.max(1,Math.ceil(raw*.24));
 return wardenPhase(target)==='SENTINEL'?Math.max(1,Math.ceil(raw*.7)):raw;
}

/** The exact deterministic floor tiles struck by the Warden's next attack.
 * Presentation renders this same footprint; it cannot invent danger tiles.
 * Attack direction is locked from the warning tick through impact without a
 * new save field, RNG stream, or external service.
 */
export type WardenStrikeShape='NOVA'|'RIFT_CROSS'|'ECLIPSE_SWEEP';
export interface WardenStrike {phase:WardenPhase;shape:WardenStrikeShape;axis:'NORTH_SOUTH'|'EAST_WEST';attackTick:number;warning:boolean;cells:{x:number;z:number}[]}
export function planWardenStrike(s:Pick<DungeonState,'map'|'tick'>,boss:Unit):WardenStrike|null{
 if(boss.kind!=='warden'||boss.hp<=0)return null;
 const phase=wardenPhase(boss),interval=phase==='ECLIPSE'?4:6;
 const attackTick=Math.ceil(s.tick/interval)*interval;
 const axis=Math.floor(attackTick/interval)%2===0?'NORTH_SOUTH':'EAST_WEST';
 const shape:WardenStrikeShape=phase==='SENTINEL'?'NOVA':phase==='RUPTURE'?'RIFT_CROSS':'ECLIPSE_SWEEP';
 const reach=shape==='NOVA'?3:4,cells:{x:number;z:number}[]=[];
 for(let dz=-reach;dz<=reach;dz++)for(let dx=-reach;dx<=reach;dx++){
  const x=boss.x+dx,z=boss.z+dz;
  if(!walkable(s.map,x,z))continue;
  const marked=shape==='NOVA'?Math.abs(dx)+Math.abs(dz)<=3:
   shape==='RIFT_CROSS'?dx===0||dz===0:
   axis==='NORTH_SOUTH'?dx===0:dz===0;
  if(marked)cells.push({x,z});
 }
 return {phase,shape,axis,attackTick,warning:s.tick%interval>=interval-2,cells};
}

const THEMES=['THE SUNKEN CRYPT','THE EMBER CATHEDRAL','THE OBSIDIAN VAULT','THE HOLLOW SANCTUM'];
const DIRS=[[1,0],[0,1],[-1,0],[0,-1]] as const;
const inside=(x:number,z:number)=>x>=0&&z>=0&&x<MAP_SIZE&&z<MAP_SIZE;
const walkable=(map:string[],x:number,z:number)=>inside(x,z)&&map[z][x]==='.';
const dist=(a:{x:number;z:number},b:{x:number;z:number})=>Math.abs(a.x-b.x)+Math.abs(a.z-b.z);
const key=(x:number,z:number)=>z*MAP_SIZE+x;
const clone=<T>(x:T):T=>structuredClone(x);
function push(state:DungeonState,kind:string,text:string){state.events.push({tick:state.tick,kind,text});if(state.events.length>9)state.events.shift()}
function distances(map:string[],from:{x:number;z:number}) {
 const d=new Map<number,number>([[key(from.x,from.z),0]]),queue=[from];
 for(let i=0;i<queue.length;i++){const c=queue[i],n=d.get(key(c.x,c.z))!;
  for(const [dx,dz] of DIRS){const x=c.x+dx,z=c.z+dz,k=key(x,z);
   if(walkable(map,x,z)&&!d.has(k)){d.set(k,n+1);queue.push({x,z})}
  }
 }return d;
}
export function shortestPath(map:string[],from:{x:number;z:number},to:{x:number;z:number}) {
 if(!walkable(map,from.x,from.z)||!walkable(map,to.x,to.z))return [];
 const back=new Map<number,number>(),start=key(from.x,from.z),end=key(to.x,to.z),queue=[from],seen=new Set<number>([start]);
 for(let i=0;i<queue.length;i++){const c=queue[i];if(key(c.x,c.z)===end)break;
  for(const [dx,dz] of DIRS){const x=c.x+dx,z=c.z+dz,k=key(x,z);
   if(walkable(map,x,z)&&!seen.has(k)){seen.add(k);back.set(k,key(c.x,c.z));queue.push({x,z})}
  }
 }if(!seen.has(end))return [];
 const path:{x:number;z:number}[]=[];let k=end;
 while(k!==start){path.unshift({x:k%MAP_SIZE,z:Math.floor(k/MAP_SIZE)});k=back.get(k)!}
 return path;
}
// A contact lane is real only on an unobstructed grid axis.
function clearCombatLane(map:string[],a:{x:number;z:number},b:{x:number;z:number}){
 if(a.x!==b.x&&a.z!==b.z)return false;
 const dx=Math.sign(b.x-a.x),dz=Math.sign(b.z-a.z);
 for(let i=1;i<dist(a,b);i++)if(!walkable(map,a.x+dx*i,a.z+dz*i))return false;
 return true;
}
// Each ranged hero searches no more than 81 candidate tiles with bounded BFS.
function approachFiringLane(s:DungeonState,hero:Unit,enemy:Unit,range:number){
 if(range<=1)return shortestPath(s.map,hero,enemy);
 let best:{route:{x:number;z:number}[];score:number;x:number;z:number}|null=null;
 for(let z=Math.max(1,enemy.z-range);z<Math.min(MAP_SIZE-1,enemy.z+range+1);z++)
  for(let x=Math.max(1,enemy.x-range);x<Math.min(MAP_SIZE-1,enemy.x+range+1);x++){
   const p={x,z},d=dist(p,enemy);
   if(d<1||d>range||!walkable(s.map,x,z)||!clearCombatLane(s.map,p,enemy))continue;
   if(s.units.some(u=>u.hp>0&&u.id!==hero.id&&u.x===x&&u.z===z))continue;
   const route=shortestPath(s.map,hero,p);
   if(!route.length)continue;
   const hazard=s.traps.some(t=>t.active&&!t.disarmed&&t.x===x&&t.z===z);
   const ideal=hero.kind==='ranger'?3:2;
   const score=route.length*30+Math.abs(d-ideal)*3+(hazard?24:0);
   if(best===null||score<best.score||(score===best.score&&(z<best.z||(z===best.z&&x<best.x))))best={route,score,x,z};
  }
 return best?.route??shortestPath(s.map,hero,enemy);
}
/**
 * The oathbound shadow caster can step out of blade range into a legal clear
 * firing lane instead of blindly exchanging melee blows. Deterministic,
 * four-neighbour, bounded and entirely sourced from authoritative state.
 */
function cultistRetreat(s:DungeonState,caster:Unit,hero:Unit){
 if(dist(caster,hero)!==1)return null;
 const escapes=DIRS.map(([dx,dz])=>({x:caster.x+dx,z:caster.z+dz}))
  .filter(p=>walkable(s.map,p.x,p.z)&&dist(p,hero)>=2&&dist(p,hero)<=3)
  .filter(p=>!s.units.some(u=>u.hp>0&&u.id!==caster.id&&u.x===p.x&&u.z===p.z))
  .filter(p=>!s.traps.some(t=>t.active&&!t.disarmed&&t.x===p.x&&t.z===p.z))
  .map(p=>({p,clear:clearCombatLane(s.map,p,hero)}))
  .sort((a,b)=>Number(b.clear)-Number(a.clear)||a.p.z-b.p.z||a.p.x-b.p.x);
 return escapes[0]?.p??null;
}
function createFloor(seed:string,floor:number,rng:NamedRng,run:number,previous?:DungeonState):DungeonState {
 const map=Array.from({length:MAP_SIZE},()=>Array(MAP_SIZE).fill('#'));
 const stack=[{x:1,z:1}];map[1][1]='.';
 while(stack.length){const current=stack[stack.length-1];
  const choices=DIRS.map(([dx,dz])=>({x:current.x+dx*2,z:current.z+dz*2,dx,dz})).filter(p=>p.x>0&&p.z>0&&p.x<MAP_SIZE-1&&p.z<MAP_SIZE-1&&map[p.z][p.x]==='#');
  if(!choices.length){stack.pop();continue}
  const next=choices[rng.nextInt('topology:'+floor+':'+run,choices.length)];
  map[current.z+next.dz][current.x+next.dx]='.';map[next.z][next.x]='.';stack.push({x:next.x,z:next.z});
 }
 // Shortcuts increase encounter visibility while the carved spanning tree guarantees reachability.
 for(let z=2;z<MAP_SIZE-2;z++)for(let x=2;x<MAP_SIZE-2;x++)if(map[z][x]==='#'&&rng.nextInt('shortcuts:'+floor+':'+run,100)<11){
  if((map[z-1][x]==='.'&&map[z+1][x]==='.')||(map[z][x-1]==='.'&&map[z][x+1]==='.'))map[z][x]='.';
 }
 // Open authored-scale sanctuaries into the guaranteed connected maze: variety without retries.
 const chambers=3+rng.nextInt('chambers:'+floor+':'+run,3);
 for(let i=0;i<chambers;i++){
  const x=3+2*rng.nextInt('chamber-x:'+floor+':'+run,7),z=3+2*rng.nextInt('chamber-z:'+floor+':'+run,7);
  const radius=1+rng.nextInt('chamber-size:'+floor+':'+run,2);
  for(let dz=-radius;dz<=radius;dz++)for(let dx=-radius;dx<=radius;dx++){
   if(x+dx>0&&z+dz>0&&x+dx<MAP_SIZE-1&&z+dz<MAP_SIZE-1)map[z+dz][x+dx]='.';
  }
 }
 // The first encounter needs room for actual 1.8 m high protagonists, not a
 // single-cell knot of three bodies. The atrium is part of the *real* grid,
 // never a transparent render-only opening with invisible collision walls.
 for(let z=1;z<=4;z++)for(let x=1;x<=4;x++)map[z][x]='.';
 // Carve bounded flank/escape lanes wherever the original topology already
 // puts two or more routes along an adjacent blocked stone cell. All removals
 // only increase reachability; the named seeded stream preserves exact replay.
 let widened=0;
 for(let z=2;z<MAP_SIZE-2;z++)for(let x=2;x<MAP_SIZE-2;x++){
  if(map[z][x]!=='#'||widened>=34)continue;
  const neighbours=DIRS.reduce((n,[dx,dz])=>n+Number(map[z+dz][x+dx]==='.'),0);
  if(neighbours<2)continue;
  if(rng.nextInt('combat-avenues:'+floor+':'+run,100)<42){map[z][x]='.';widened++}
 }
 const spawn={x:1,z:1};
 let rows=map.map(r=>r.join('')),measure=distances(rows,spawn);
 let tiles=[...measure.entries()].map(([k,d])=>({x:k%MAP_SIZE,z:Math.floor(k/MAP_SIZE),d})).sort((a,b)=>b.d-a.d||a.z-b.z||a.x-b.x);
 // The guardian must occupy a legible interior stage with space for
 // defenders, sidesteps and directional attacks, not a clipped map edge.
 // Retain the long route as a real risk-and-reward expedition.
 const deep=tiles.find(p=>p.x>=4&&p.z>=4&&p.x<MAP_SIZE-4&&p.z<MAP_SIZE-4&&p.d>=12);
 const exit={x:(deep??tiles[0]).x,z:(deep??tiles[0]).z};
 // A seven-cell courtyard supports a true multi-actor Warden confrontation.
 for(let dz=-3;dz<=3;dz++)for(let dx=-3;dx<=3;dx++){
  const x=exit.x+dx,z=exit.z+dz;
  if(x>0&&z>0&&x<MAP_SIZE-1&&z<MAP_SIZE-1)map[z][x]='.';
 }
 rows=map.map(r=>r.join(''));measure=distances(rows,spawn);
 tiles=[...measure.entries()].map(([k,d])=>({x:k%MAP_SIZE,z:Math.floor(k/MAP_SIZE),d})).sort((a,b)=>b.d-a.d||a.z-b.z||a.x-b.x);
 const occupied=new Set([key(spawn.x,spawn.z),key(exit.x,exit.z)]);
 const units:Unit[]=[
  {id:'vanguard',kind:'vanguard',faction:'party',x:1,z:1,hp:previous?.units.find(u=>u.id==='vanguard')?.hp??120,maxHp:120,attack:22,cooldown:0},
  {id:'ranger',kind:'ranger',faction:'party',x:2,z:1,hp:previous?.units.find(u=>u.id==='ranger')?.hp??85,maxHp:85,attack:15,cooldown:0},
  {id:'mystic',kind:'mystic',faction:'party',x:1,z:2,hp:previous?.units.find(u=>u.id==='mystic')?.hp??75,maxHp:75,attack:12,cooldown:0},
  {id:'warden-'+floor,kind:'warden',faction:'enemy',x:exit.x,z:exit.z,hp:260+floor*34,maxHp:260+floor*34,attack:16+Math.min(18,floor*2),cooldown:0}
 ];
 // Place enemies on distant navigable tiles, away from the spawn and boss.
 const eligible=tiles.filter(p=>p.d>5&&dist(p,exit)>3);
 for(let i=0;i<Math.min(7,3+Math.floor(floor/2))&&eligible.length;i++){
  const index=rng.nextInt('encounters:'+floor+':'+run,eligible.length),p=eligible.splice(index,1)[0],k=key(p.x,p.z);
  if(occupied.has(k))continue;occupied.add(k);
  const kind:UnitKind=i%3===0?'cultist':'revenant',hp=kind==='cultist'?36+floor*3:44+floor*4;
  units.push({id:'enemy-'+floor+'-'+i,kind,faction:'enemy',x:p.x,z:p.z,hp,maxHp:hp,attack:kind==='cultist'?8:10,cooldown:0});
 }
 // Living oathbound defenders make the sealed boss fight a close, readable
 // challenge. These seeded, legal units are real AI opponents, not fake VFX.
 const courtTiles=DIRS.flatMap(([dx,dz])=>[2,1].map(d=>({x:exit.x+dx*d,z:exit.z+dz*d})));
 for(let i=0;i<2;i++){
  const options=courtTiles.filter(p=>walkable(rows,p.x,p.z)&&!occupied.has(key(p.x,p.z))&&dist(p,spawn)>4);
  if(!options.length)break;
  const p=options[rng.nextInt('court-guard:'+floor+':'+run+':'+i,options.length)];
  occupied.add(key(p.x,p.z));
  const kind:UnitKind=i===0?'revenant':'cultist',maxHp=(i===0?46:34)+floor*4;
  units.push({id:'oathbound-'+floor+'-'+i,kind,faction:'enemy',x:p.x,z:p.z,hp:maxHp,maxHp,attack:i===0?10:8,cooldown:0});
 }
 for(const unit of units){unit.action='idle';unit.actionTick=previous?.tick??0}
 const relics=tiles.filter(p=>p.d>3&&!occupied.has(key(p.x,p.z))).slice(0,3).map(p=>({x:p.x,z:p.z}));
 const forbidden=new Set(relics.map(p=>key(p.x,p.z)));
 const trapTiles=tiles.filter(p=>p.d>5&&dist(p,exit)>3&&!occupied.has(key(p.x,p.z))&&!forbidden.has(key(p.x,p.z)));
 const traps:DungeonTrap[]=[];
 for(let i=0;i<Math.min(5,2+Math.floor(floor/3))&&trapTiles.length;i++){
  const index=rng.nextInt('trap-positions:'+floor+':'+run,trapTiles.length),p=trapTiles.splice(index,1)[0];
  traps.push({id:'hazard-'+floor+'-'+i,x:p.x,z:p.z,kind:i%2?'arcane':'ember',active:true,cooldown:0,disarmed:false,triggers:0});
 }
 return {schemaVersion:1,tick:previous?.tick??0,floor,run,phase:'exploring',intermission:0,theme:THEMES[(floor-1)%THEMES.length],map:rows,exit,units,relics,traps,kills:previous?.kills??0,gold:previous?.gold??0,level:previous?.level??1,intent:'Mapping the uncharted halls',events:previous?.events??[]};
}
export function assertDungeonState(s:DungeonState){
 if(s.schemaVersion!==1||s.map.length!==MAP_SIZE||s.map.some(r=>r.length!==MAP_SIZE))throw Error('Invalid dungeon map');
 if(!walkable(s.map,1,1)||!walkable(s.map,s.exit.x,s.exit.z)||shortestPath(s.map,{x:1,z:1},s.exit).length===0)throw Error('Dungeon exit unreachable');
 const ids=new Set<string>();
 for(const u of s.units){if(ids.has(u.id)||!walkable(s.map,u.x,u.z)||!Number.isInteger(u.hp)||u.hp<0||u.hp>u.maxHp)throw Error('Invalid unit '+u.id);ids.add(u.id)}
 if(s.units.length>18||s.relics.length>6||s.traps.length>5||s.events.length>9)throw Error('Bounded state exceeded');
 for(const trap of s.traps){if(!walkable(s.map,trap.x,trap.z)||trap.cooldown<0||!Number.isInteger(trap.triggers)||trap.triggers<0||trap.triggers>10000)throw Error('Invalid dungeon trap '+trap.id)}
}
export class DungeonRuntime {
 public state:DungeonState;
 private rng:NamedRng;
 private constructor(private seed:string, rng:NamedRng,state:DungeonState){this.rng=rng;this.state=state;assertDungeonState(state)}
 static create(seed='ashen-dungeon'){const rng=NamedRng.fromSeed(seed);return new DungeonRuntime(seed,rng,createFloor(seed,1,rng,1))}
 static restore(save:DungeonSave){if(save.version!==DUNGEON_VERSION||save.signature!==checksum({seed:save.seed,rng:save.rng,state:save.state}))throw Error('Dungeon snapshot checksum mismatch');return new DungeonRuntime(save.seed,NamedRng.restore(save.rng),clone(save.state))}
 save():DungeonSave {const state=clone(this.state),rng=this.rng.snapshot();return {version:DUNGEON_VERSION,seed:this.seed,rng,state,signature:checksum({seed:this.seed,rng,state})}}
 step(){
  const s=this.state;const warden=s.units.find(u=>u.kind==='warden');const previousWardenPhase=wardenPhase(warden),wardAtStart=wardenSealActive(s);s.tick++;for(const unit of s.units){unit.action='idle';unit.actionTick=s.tick;delete unit.targetId}
  if(s.phase==='intermission'){if(--s.intermission<=0){const run=s.run+1;this.state=createFloor(this.seed,1,this.rng,run);push(this.state,'restart','A new expedition enters the dungeon.')}return this.publicState()}
  const party=s.units.filter(u=>u.faction==='party'&&u.hp>0),foes=s.units.filter(u=>u.faction==='enemy'&&u.hp>0),leader=party[0];
  if(!leader){s.phase='intermission';s.intermission=14;push(s,'defeat','The expedition was lost. A new run begins shortly.');return this.publicState()}
  // Traps cool down on authoritative ticks. Ranger can permanently disarm a nearby hazard.
  for(const trap of s.traps)if(!trap.disarmed&&!trap.active&&trap.cooldown>0){trap.cooldown--;if(trap.cooldown===0)trap.active=true}
  // Turn-based autonomous tactics. Deterministic unit order and bounded path searches.
  for(const hero of party){
   // Respond to real warned tiles; a safe flank is one legal step, otherwise
   // brace for the actual impact. Retain the tactical attack lane when possible.
   const warden=s.units.find(u=>u.kind==='warden'&&u.hp>0);
   const warned=warden?planWardenStrike(s,warden):null;
   if(warned?.warning&&warned.attackTick===s.tick+1&&
      warned.cells.some(p=>p.x===hero.x&&p.z===hero.z)){
    const marked=new Set(warned.cells.map(p=>key(p.x,p.z)));
    const escapes=DIRS.map(([dx,dz])=>({x:hero.x+dx,z:hero.z+dz}))
     .filter(p=>walkable(s.map,p.x,p.z)&&!marked.has(key(p.x,p.z)))
     .filter(p=>!s.units.some(u=>u.hp>0&&u.id!==hero.id&&u.x===p.x&&u.z===p.z))
     .map(p=>({p,risk:s.traps.some(t=>t.active&&!t.disarmed&&t.x===p.x&&t.z===p.z)?20:0,
      flank:Math.abs(dist(p,warden!)-2)}))
     .sort((a,b)=>a.risk-b.risk||a.flank-b.flank||a.p.z-b.p.z||a.p.x-b.p.x);
    if(escapes.length){
     hero.x=escapes[0].p.x;hero.z=escapes[0].p.z;hero.action='move';
     s.intent='Dodging the marked '+warned.shape.toLowerCase().replaceAll('_',' ');
     push(s,'evade',hero.kind+' cleared the '+warned.shape.toLowerCase().replaceAll('_',' ')+' strike');continue;
    }
    hero.guardTick=s.tick+1;hero.action='guard';
    s.intent='Bracing for the marked '+warned.shape.toLowerCase().replaceAll('_',' ');
    push(s,'guard',hero.kind+' braced against the oncoming attack');continue;
   }
   // A successful dodge is a *decision across two ticks*, not a one-tick
   // sidestep followed by immediately walking back into the advertised blast.
   // Stay on the safely marked flank while the impact resolves. We do not
   // invent another move, teleport, or damage result in presentation.
   if(warned?.attackTick===s.tick&&dist(hero,warden!)<=5&&
      !warned.cells.some(p=>p.x===hero.x&&p.z===hero.z)){
    hero.action='guard';s.intent='Holding the safe flank through the Warden strike';
    continue;
   }
   if(hero.kind==='ranger'&&s.tick%4===0){const hazard=s.traps.find(t=>t.active&&!t.disarmed&&dist(hero,t)<=2);
    if(hazard){hazard.active=false;hazard.disarmed=true;hazard.cooldown=0;hero.action='cast';s.intent='Wildshadow disabling a dangerous rune';push(s,'disarm','Wildshadow safely disabled a '+hazard.kind+' trap');continue}
   }
   const enemies=s.units.filter(u=>u.faction==='enemy'&&u.hp>0).sort((a,b)=>dist(hero,a)-dist(hero,b)||a.id.localeCompare(b.id));
   const defenders=enemies.filter(u=>u.kind!=='warden');
   // The expedition deliberately clears the binding guards before its guardian duel.
   // Incidental boss contact still has a real, bounded damage outcome and cannot stall a corridor.
   const attackable=defenders.length?defenders:enemies;
   const range=hero.kind==='vanguard'?1:hero.kind==='ranger'?4:3;
   if(hero.kind==='mystic'&&s.tick%6===0){
    const wounded=party.filter(u=>u.hp>0&&u.hp<u.maxHp*.7).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];
    if(wounded){wounded.hp=Math.min(wounded.maxHp,wounded.hp+15+s.level);hero.action='cast';s.intent='Starweaver channels restorative magic';push(s,'healing','Starweaver healed '+wounded.kind);continue}
   }
   // Choose the nearest actual visible hostile instead of a wall-blocked nearest one.
   const target=attackable.find(e=>dist(hero,e)>=1&&dist(hero,e)<=range&&clearCombatLane(s.map,hero,e));
   if(target){
    const raw=hero.attack+(s.level-1)*2,damage=damageThroughWardenSeal(s,target,raw);
    target.hp=Math.max(0,target.hp-damage);hero.action=hero.kind==='mystic'?'cast':'attack';hero.targetId=target.id;target.action='hurt';
    s.intent=hero.kind==='mystic'?'Arcane support engaging hostiles':hero.kind==='ranger'?'Ranger providing covering fire':'Vanguard holding the front line';
    if(target.hp===0){s.kills++;s.gold+=12;s.level=1+Math.floor(s.kills/5);push(s,'kill',(target.kind==='warden'?'WARDEN DEFEATED':'Enemy defeated')+' · +12 gold')}
    else if(s.tick%4===0)push(s,'combat',hero.kind+' struck '+target.kind+' for '+damage);
    continue;
   }
   // Intercept nearby minions rather than marching past them to the Warden.
   const minion=defenders.find(e=>dist(hero,e)<=5||dist(leader,e)<=4)??defenders[0];
   const boss=enemies.find(e=>e.kind==='warden');
   const nearbyBoss=boss&&dist(hero,boss)<=5?boss:null;
   const engagement=minion||(hero===leader?boss:nearbyBoss);
   if(hero!==leader&&!engagement){
    const route=shortestPath(s.map,hero,leader);
    if(route.length>1){const next=route[0];if(!s.units.some(u=>u.faction==='enemy'&&u.hp>0&&u.x===next.x&&u.z===next.z)){hero.x=next.x;hero.z=next.z;hero.action='move'}}
    continue;
   }
   const route=engagement?approachFiringLane(s,hero,engagement,range):shortestPath(s.map,hero,s.exit);
   if(route.length){
    const next=route[0],blocker=s.units.find(u=>u.faction==='enemy'&&u.hp>0&&u.x===next.x&&u.z===next.z);
    if(blocker){
     const damage=damageThroughWardenSeal(s,blocker,hero.attack+(s.level-1)*2);
     blocker.hp=Math.max(0,blocker.hp-damage);hero.action='attack';hero.targetId=blocker.id;blocker.action='hurt';s.intent='Breaking through the enemy line';
     if(!blocker.hp){s.kills++;s.gold+=12;s.level=1+Math.floor(s.kills/5);push(s,'kill','The expedition cleared the passage')}
    }else{hero.x=next.x;hero.z=next.z;hero.action='move';s.intent=minion?'Intercepting '+minion.kind:engagement?'Hunting the dungeon warden':'Claiming the portal'}
   }
  }
  // One authoritative transition when the last binding guard falls or the Warden's first phase breaks.
  if(wardAtStart&&!wardenSealActive(s)&&warden&&warden.hp>0){
   push(s,'unseal','THE WARDEN SEAL SHATTERS — the guardian is exposed');
   s.intent='Seal broken · confront the Eternal Warden';
  }
  // Enemies pursue only within a bounded aggro distance. Cooldowns prevent unavoidable stun-lock.
  for(const enemy of s.units.filter(u=>u.faction==='enemy'&&u.hp>0)){
   const nearest=party.filter(u=>u.hp>0).sort((a,b)=>dist(a,enemy)-dist(b,enemy)||a.id.localeCompare(b.id))[0];if(!nearest)break;
   const distance=dist(enemy,nearest);
   // Three true boss threats with separate legible dodge tactics: a diamond
   // nova, cardinal rifts and a rotating floor sweep. Collision and warned
   // floor geometry come from the same authoritative planner.
   const bossPhase=enemy.kind==='warden'?wardenPhase(enemy):'SENTINEL';
   const interval=bossPhase==='ECLIPSE'?4:6,attackTick=s.tick%interval,warningTick=interval-2;
   if(enemy.kind==='warden'){
    const strike=planWardenStrike(s,enemy);
    if(strike&&distance<=5&&attackTick===warningTick)
     push(s,'telegraph','WARDEN '+strike.shape.replaceAll('_',' ')+' — leave the marked stone or brace');
    if(strike&&distance<=5&&attackTick===0){
     const marked=new Set(strike.cells.map(p=>key(p.x,p.z)));
     const affected=party.filter(u=>u.hp>0&&marked.has(key(u.x,u.z)));
     const shock=8+Math.min(18,s.floor)+(bossPhase==='ECLIPSE'?6:bossPhase==='RUPTURE'?3:0);
     for(const hero of affected){
      const guarded=hero.guardTick===s.tick;
      const dealt=guarded?Math.max(1,Math.floor(shock*.30)):shock;
      hero.hp=Math.max(0,hero.hp-dealt);hero.action=guarded?'guard':'hurt';
      if(guarded)push(s,'block',hero.kind+' shielded '+(shock-dealt)+' damage');
     }
     enemy.action='cast';
     push(s,affected.length?'danger':'evade','The Warden '+strike.shape.replaceAll('_',' ').toLowerCase()+
      ' shockwave struck '+affected.length+' hero'+(affected.length===1?'':'es'));
     if(enemy.cooldown>0)enemy.cooldown--;
     continue;
    }
    // Wind-up must anchor the boss rather than sliding its hit zone underneath
    // the party while players are responding to already-visible floor marks.
    if(strike?.warning&&attackTick===interval-1){
     enemy.action='guard';if(enemy.cooldown>0)enemy.cooldown--;continue;
    }
   }
   // A real adjacent threat changes a caster's decision. Retreating uses a
   // legal empty walkable cell and may open a later ranged line of fire.
   // No teleport, hidden RNG, instant free attack or forced encounter result.
   if(enemy.kind==='cultist'&&distance===1&&s.tick%3===0){
    const step=cultistRetreat(s,enemy,nearest);
    if(step){enemy.x=step.x;enemy.z=step.z;enemy.action='move';
     s.intent='Shadow caster disengaging to regain a spell lane';
     if(enemy.cooldown>0)enemy.cooldown--;continue}
   }
   if(enemy.kind==='cultist'&&distance>1&&distance<=3&&s.tick%4===0){const visible=(enemy.x===nearest.x&&Array.from({length:Math.abs(enemy.z-nearest.z)-1},(_,i)=>Math.min(enemy.z,nearest.z)+i+1).every(z=>walkable(s.map,enemy.x,z)))||(enemy.z===nearest.z&&Array.from({length:Math.abs(enemy.x-nearest.x)-1},(_,i)=>Math.min(enemy.x,nearest.x)+i+1).every(x=>walkable(s.map,x,enemy.z)));if(visible){nearest.hp=Math.max(0,nearest.hp-5-Math.min(8,Math.floor(s.floor/2)));nearest.action='hurt';enemy.action='cast';enemy.targetId=nearest.id;push(s,'danger','Cultist hurled a shadow bolt')}}
   if(distance<=1){if(enemy.cooldown===0){const braced=nearest.action==='guard'||nearest.guardTick===s.tick;const dealt=braced?Math.max(1,Math.ceil(enemy.attack*.4)):enemy.attack;nearest.hp=Math.max(0,nearest.hp-dealt);enemy.cooldown=2;enemy.action='attack';enemy.targetId=nearest.id;nearest.action=braced?'guard':'hurt';if(braced)push(s,'block',nearest.kind+' blocked '+(enemy.attack-dealt)+' melee damage');else push(s,'danger',enemy.kind+' hit '+nearest.kind+' for '+dealt)}}
   else if(distance<=5&&s.tick%2===0){const route=shortestPath(s.map,enemy,nearest);if(route.length>1){enemy.x=route[0].x;enemy.z=route[0].z;enemy.action='move'}}
   if(enemy.cooldown>0)enemy.cooldown--;
  }
  if(warden&&warden.hp>0&&wardenPhase(warden)!==previousWardenPhase){
   const nextPhase=wardenPhase(warden);
   push(s,'phase','THE ETERNAL WARDEN · '+nextPhase+' PHASE');
   s.intent='The Warden transforms into '+nextPhase.toLowerCase()+' form';
   // Summon from actual free walkable cells, capped by the global unit bound.
   // The summon has its own future AI turns; it is not a cosmetic illusion.
   const slots=DIRS.flatMap(([dx,dz])=>[1,2].map(d=>({x:warden.x+dx*d,z:warden.z+dz*d})))
    .filter(p=>walkable(s.map,p.x,p.z)&&!s.units.some(u=>u.hp>0&&u.x===p.x&&u.z===p.z));
   if(slots.length&&s.units.length<18){
    const cell=slots[this.rng.nextInt('summon:'+s.floor+':'+s.run+':'+nextPhase,slots.length)];
    const kind:UnitKind=nextPhase==='ECLIPSE'?'cultist':'revenant',maxHp=38+s.floor*5;
    s.units.push({id:'summon-'+s.floor+'-'+nextPhase.toLowerCase(),kind,faction:'enemy',x:cell.x,z:cell.z,hp:maxHp,maxHp,attack:11+s.floor,cooldown:0,action:'cast',actionTick:s.tick});
    push(s,'summon','The Warden calls a '+(kind==='cultist'?'void spellcaster':'fallen sentinel')+' into the ritual chamber');
   }
  }
  for(const hero of s.units.filter(u=>u.faction==='party'&&u.hp>0)){
   const trap=s.traps.find(t=>t.active&&!t.disarmed&&t.x===hero.x&&t.z===hero.z);
   if(trap){const damage=8+Math.min(16,s.floor),kind=trap.kind==='ember'?'flame jets':'arcane rune';
    hero.hp=Math.max(0,hero.hp-damage);hero.action='hurt';trap.active=false;trap.cooldown=11;trap.triggers++;push(s,'trap',kind+' struck '+hero.kind+' for '+damage+' damage');
   }
   const i=s.relics.findIndex(p=>p.x===hero.x&&p.z===hero.z);
   if(i!==-1){s.relics.splice(i,1);s.gold+=35;hero.hp=Math.min(hero.maxHp,hero.hp+18);push(s,'loot',hero.kind+' discovered a healing relic · +35 gold')}
  }
  const alive=s.units.filter(u=>u.faction==='party'&&u.hp>0);
  if(!alive.length){s.phase='intermission';s.intermission=14;push(s,'defeat','All heroes have fallen. Preparing a new expedition.')}
  else if(!s.units.some(u=>u.faction==='enemy'&&u.hp>0)&&dist(leader,s.exit)===0){
   const nextFloor=s.floor+1;const next=createFloor(this.seed,nextFloor,this.rng,s.run,s);
   next.units.filter(u=>u.faction==='party').forEach(u=>u.hp=Math.min(u.maxHp,u.hp+26));
   this.state=next;push(next,'floor','FLOOR '+nextFloor+' · '+next.theme);
  }
  assertDungeonState(this.state);return this.publicState();
 }
 publicState(){
  const s=this.state;
  const boss=s.units.find(u=>u.kind==='warden'&&u.hp>0);
  const strike=boss?planWardenStrike(s,boss):null;
  const bossWarning=strike?.warning&&s.units.some(u=>u.faction==='party'&&u.hp>0&&dist(u,boss!)<=5)?strike:null;
  return {version:DUNGEON_VERSION,tick:s.tick,run:s.run,floor:s.floor,theme:s.theme,phase:s.phase,bossPhase:wardenPhase(s.units.find(u=>u.kind==='warden')),guardianWard:wardenSealActive(s),bossWarning,defendersRemaining:s.units.filter(u=>u.faction==='enemy'&&u.kind!=='warden'&&u.hp>0).length,intermission:s.intermission,map:s.map,exit:s.exit,units:s.units.map(u=>({...u})),relics:s.relics.map(r=>({...r})),traps:s.traps.map(t=>({...t})),kills:s.kills,gold:s.gold,level:s.level,intent:s.intent,events:s.events.map(e=>({...e})),checksum:checksum({tick:s.tick,run:s.run,floor:s.floor,units:s.units,relics:s.relics,traps:s.traps,gold:s.gold})};
 }
}
