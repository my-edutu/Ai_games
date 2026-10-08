import {NamedRng, type RngSnapshot} from '../../../packages/seeded-rng/src/index';
import {checksum} from '../../../packages/replay/src/index';

export const DUNGEON_VERSION='0.1.0';
export const MAP_SIZE=19;
export type UnitKind='vanguard'|'ranger'|'mystic'|'revenant'|'cultist'|'warden';
export type Faction='party'|'enemy';
export interface Unit {id:string;kind:UnitKind;faction:Faction;x:number;z:number;hp:number;maxHp:number;attack:number;cooldown:number}
export interface DungeonEvent {tick:number;kind:string;text:string}
export interface DungeonState {schemaVersion:1;tick:number;floor:number;run:number;phase:'exploring'|'intermission';intermission:number;theme:string;map:string[];exit:{x:number;z:number};units:Unit[];relics:{x:number;z:number}[];kills:number;gold:number;level:number;intent:string;events:DungeonEvent[]}
export interface DungeonSave {version:string;seed:string;rng:RngSnapshot;state:DungeonState;signature:string}
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
 const rows=map.map(r=>r.join('')),spawn={x:1,z:1},measure=distances(rows,spawn);
 const tiles=[...measure.entries()].map(([k,d])=>({x:k%MAP_SIZE,z:Math.floor(k/MAP_SIZE),d})).sort((a,b)=>b.d-a.d||a.z-b.z||a.x-b.x);
 const exit={x:tiles[0].x,z:tiles[0].z};
 const occupied=new Set([key(spawn.x,spawn.z),key(exit.x,exit.z)]);
 const units:Unit[]=[
  {id:'vanguard',kind:'vanguard',faction:'party',x:1,z:1,hp:previous?.units.find(u=>u.id==='vanguard')?.hp??120,maxHp:120,attack:22,cooldown:0},
  {id:'ranger',kind:'ranger',faction:'party',x:1,z:1,hp:previous?.units.find(u=>u.id==='ranger')?.hp??85,maxHp:85,attack:15,cooldown:0},
  {id:'mystic',kind:'mystic',faction:'party',x:1,z:1,hp:previous?.units.find(u=>u.id==='mystic')?.hp??75,maxHp:75,attack:12,cooldown:0},
  {id:'warden-'+floor,kind:'warden',faction:'enemy',x:exit.x,z:exit.z,hp:65+floor*8,maxHp:65+floor*8,attack:12+Math.min(12,floor),cooldown:0}
 ];
 // Place enemies on distant navigable tiles, away from the spawn and boss.
 const eligible=tiles.filter(p=>p.d>5&&dist(p,exit)>3);
 for(let i=0;i<Math.min(7,3+Math.floor(floor/2))&&eligible.length;i++){
  const index=rng.nextInt('encounters:'+floor+':'+run,eligible.length),p=eligible.splice(index,1)[0],k=key(p.x,p.z);
  if(occupied.has(k))continue;occupied.add(k);
  const kind:UnitKind=i%3===0?'cultist':'revenant',hp=kind==='cultist'?36+floor*3:44+floor*4;
  units.push({id:'enemy-'+floor+'-'+i,kind,faction:'enemy',x:p.x,z:p.z,hp,maxHp:hp,attack:kind==='cultist'?8:10,cooldown:0});
 }
 const relics=tiles.filter(p=>p.d>3&&!occupied.has(key(p.x,p.z))).slice(0,3).map(p=>({x:p.x,z:p.z}));
 return {schemaVersion:1,tick:previous?.tick??0,floor,run,phase:'exploring',intermission:0,theme:THEMES[(floor-1)%THEMES.length],map:rows,exit,units,relics,kills:previous?.kills??0,gold:previous?.gold??0,level:previous?.level??1,intent:'Mapping the uncharted halls',events:previous?.events??[]};
}
export function assertDungeonState(s:DungeonState){
 if(s.schemaVersion!==1||s.map.length!==MAP_SIZE||s.map.some(r=>r.length!==MAP_SIZE))throw Error('Invalid dungeon map');
 if(!walkable(s.map,1,1)||!walkable(s.map,s.exit.x,s.exit.z)||shortestPath(s.map,{x:1,z:1},s.exit).length===0)throw Error('Dungeon exit unreachable');
 const ids=new Set<string>();
 for(const u of s.units){if(ids.has(u.id)||!walkable(s.map,u.x,u.z)||!Number.isInteger(u.hp)||u.hp<0||u.hp>u.maxHp)throw Error('Invalid unit '+u.id);ids.add(u.id)}
 if(s.units.length>18||s.relics.length>6||s.events.length>9)throw Error('Bounded state exceeded');
}
export class DungeonRuntime {
 public state:DungeonState;
 private rng:NamedRng;
 private constructor(private seed:string, rng:NamedRng,state:DungeonState){this.rng=rng;this.state=state;assertDungeonState(state)}
 static create(seed='ashen-dungeon'){const rng=NamedRng.fromSeed(seed);return new DungeonRuntime(seed,rng,createFloor(seed,1,rng,1))}
 static restore(save:DungeonSave){if(save.version!==DUNGEON_VERSION||save.signature!==checksum({seed:save.seed,rng:save.rng,state:save.state}))throw Error('Dungeon snapshot checksum mismatch');return new DungeonRuntime(save.seed,NamedRng.restore(save.rng),clone(save.state))}
 save():DungeonSave {const state=clone(this.state),rng=this.rng.snapshot();return {version:DUNGEON_VERSION,seed:this.seed,rng,state,signature:checksum({seed:this.seed,rng,state})}}
 step(){
  const s=this.state;s.tick++;
  if(s.phase==='intermission'){if(--s.intermission<=0){const run=s.run+1;this.state=createFloor(this.seed,1,this.rng,run);push(this.state,'restart','A new expedition enters the dungeon.')}return this.publicState()}
  const party=s.units.filter(u=>u.faction==='party'&&u.hp>0),foes=s.units.filter(u=>u.faction==='enemy'&&u.hp>0),leader=party[0];
  if(!leader){s.phase='intermission';s.intermission=14;push(s,'defeat','The expedition was lost. A new run begins shortly.');return this.publicState()}
  // Turn-based autonomous tactics. Deterministic unit order and bounded path searches.
  for(const hero of party){
   const enemies=s.units.filter(u=>u.faction==='enemy'&&u.hp>0).sort((a,b)=>dist(hero,a)-dist(hero,b)||a.id.localeCompare(b.id));
   const target=enemies[0],range=hero.kind==='vanguard'?1:hero.kind==='ranger'?4:3;
   if(hero.kind==='mystic'&&s.tick%6===0){const wounded=party.filter(u=>u.hp>0&&u.hp<u.maxHp*.7).sort((a,b)=>a.hp/a.maxHp-b.hp/b.maxHp)[0];if(wounded){wounded.hp=Math.min(wounded.maxHp,wounded.hp+15+s.level);s.intent='Starweaver channels restorative magic';push(s,'healing','Starweaver healed '+wounded.kind);continue}}
   const visible=target&&((hero.x===target.x&&Array.from({length:Math.abs(hero.z-target.z)-1},(_,i)=>Math.min(hero.z,target.z)+1+i).every(z=>walkable(s.map,hero.x,z)))||(hero.z===target.z&&Array.from({length:Math.abs(hero.x-target.x)-1},(_,i)=>Math.min(hero.x,target.x)+1+i).every(x=>walkable(s.map,x,hero.z))));
   if(target&&dist(hero,target)<=range&&(dist(hero,target)===1||visible)){
    const damage=hero.attack+(s.level-1)*2;target.hp=Math.max(0,target.hp-damage);
    s.intent=hero.kind==='mystic'?'Arcane support engaging hostiles':hero.kind==='ranger'?'Ranger providing covering fire':'Vanguard holding the front line';
    if(target.hp===0){s.kills++;s.gold+=12;s.level=1+Math.floor(s.kills/5);push(s,'kill',(target.kind==='warden'?'WARDEN DEFEATED':'Enemy defeated')+' · +12 gold');}
    else if(s.tick%4===0)push(s,'combat',hero.kind+' struck '+target.kind+' for '+damage);
    continue;
   }
   if(hero!==leader) {const route=shortestPath(s.map,hero,leader);if(route.length>1){hero.x=route[0].x;hero.z=route[0].z;}continue}
   const bossAlive=s.units.some(u=>u.kind==='warden'&&u.hp>0);
   const goal=bossAlive?s.units.find(u=>u.kind==='warden'&&u.hp>0)!:s.exit;
   const route=shortestPath(s.map,hero,goal);
   if(route.length){const next=route[0];const blocker=s.units.find(u=>u.faction==='enemy'&&u.hp>0&&u.x===next.x&&u.z===next.z);
    if(blocker){blocker.hp=Math.max(0,blocker.hp-hero.attack);s.intent='Breaking through the enemy line';if(!blocker.hp){s.kills++;s.gold+=12;push(s,'kill','Vanguard cleared the passage');}}
    else{hero.x=next.x;hero.z=next.z;s.intent=bossAlive?'Hunting the dungeon warden':'Claiming the portal';}
   }
  }
  // Enemies pursue only within a bounded aggro distance. Cooldowns prevent unavoidable stun-lock.
  for(const enemy of s.units.filter(u=>u.faction==='enemy'&&u.hp>0)){
   const nearest=party.filter(u=>u.hp>0).sort((a,b)=>dist(a,enemy)-dist(b,enemy)||a.id.localeCompare(b.id))[0];if(!nearest)break;
   const distance=dist(enemy,nearest);
   // Readable periodic boss shockwave creates real danger without hidden outcome forcing.
   if(enemy.kind==='warden'&&distance<=3&&s.tick%3===0){const affected=party.filter(u=>u.hp>0&&dist(enemy,u)<=3);
    const shock=6+Math.min(14,s.floor);
    for(const hero of affected)hero.hp=Math.max(0,hero.hp-shock);
    if(affected.length)push(s,'danger','The Warden unleashed an arcane shockwave · '+shock+' damage');
   }
   if(enemy.kind==='cultist'&&distance>1&&distance<=3&&s.tick%4===0){nearest.hp=Math.max(0,nearest.hp-5-Math.min(8,Math.floor(s.floor/2)));push(s,'danger','Cultist hurled a shadow bolt')}
   if(distance<=1){if(enemy.cooldown===0){nearest.hp=Math.max(0,nearest.hp-enemy.attack);enemy.cooldown=2;push(s,'danger',enemy.kind+' hit '+nearest.kind+' for '+enemy.attack)}}
   else if(distance<=5&&s.tick%2===0){const route=shortestPath(s.map,enemy,nearest);if(route.length>1){enemy.x=route[0].x;enemy.z=route[0].z}}
   if(enemy.cooldown>0)enemy.cooldown--;
  }
  for(const hero of s.units.filter(u=>u.faction==='party'&&u.hp>0)){
   const i=s.relics.findIndex(p=>p.x===hero.x&&p.z===hero.z);
   if(i!==-1){s.relics.splice(i,1);s.gold+=35;hero.hp=Math.min(hero.maxHp,hero.hp+18);push(s,'loot',hero.kind+' discovered a healing relic · +35 gold')}
  }
  const alive=s.units.filter(u=>u.faction==='party'&&u.hp>0);
  if(!alive.length){s.phase='intermission';s.intermission=14;push(s,'defeat','All heroes have fallen. Preparing a new expedition.')}
  else if(!s.units.some(u=>u.faction==='enemy'&&u.hp>0&&u.kind==='warden')&&dist(leader,s.exit)===0){
   const nextFloor=s.floor+1;const next=createFloor(this.seed,nextFloor,this.rng,s.run,s);
   next.units.filter(u=>u.faction==='party').forEach(u=>u.hp=Math.min(u.maxHp,u.hp+26));
   this.state=next;push(next,'floor','FLOOR '+nextFloor+' · '+next.theme);
  }
  assertDungeonState(this.state);return this.publicState();
 }
 publicState(){
  const s=this.state;
  return {version:DUNGEON_VERSION,tick:s.tick,run:s.run,floor:s.floor,theme:s.theme,phase:s.phase,intermission:s.intermission,map:s.map,exit:s.exit,units:s.units.map(u=>({...u})),relics:s.relics.map(r=>({...r})),kills:s.kills,gold:s.gold,level:s.level,intent:s.intent,events:s.events.map(e=>({...e})),checksum:checksum({tick:s.tick,run:s.run,floor:s.floor,units:s.units,relics:s.relics,gold:s.gold})};
 }
}
