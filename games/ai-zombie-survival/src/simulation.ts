import type { GameConfig, GameEvent, GameState, Survivor, ViewerInfluence, Zombie } from './types.js';
import { createBarricades, createBuildings, createDistricts, createSurvivors, createZombies } from './world.js';
import { randomRange } from './random.js';

const clamp = (v:number,min:number,max:number) => Math.max(min, Math.min(max, v));
const dist = (a:{x:number;y:number}, b:{x:number;y:number}) => Math.hypot(a.x-b.x, a.y-b.y);

function pushEvent(state: GameState, event: Omit<GameEvent,'id'|'time'>): void {
  state.events.push({ ...event, id: ++state.eventSeq, time: state.time.elapsed });
  if (state.events.length > 160) state.events.splice(0, state.events.length - 160);
}

function phaseAt(elapsed: number) {
  const dayLength = 120;
  const day = Math.floor(elapsed / dayLength) + 1;
  const t = (elapsed % dayLength) / dayLength;
  if (t < 0.12) return { day, phase:'dawn' as const, phaseProgress:t/0.12 };
  if (t < 0.58) return { day, phase:'day' as const, phaseProgress:(t-0.12)/0.46 };
  if (t < 0.72) return { day, phase:'sunset' as const, phaseProgress:(t-0.58)/0.14 };
  return { day, phase:'night' as const, phaseProgress:(t-0.72)/0.28 };
}

export function createGame(config: GameConfig = {}): GameState {
  const seed = (config.seed ?? 1337) >>> 0 || 1;
  let rng = seed;
  let survivors; [survivors, rng] = createSurvivors(rng, config.survivorCount ?? 6);
  let zombies; [zombies, rng] = createZombies(rng, config.zombieCount ?? 96);
  let buildings, loot; [buildings, loot, rng] = createBuildings(rng);
  return {
    version:1, seed, rng, tick:0, status:'running', survivors, zombies, barricades:createBarricades(), loot, buildings, districts:createDistricts(),
    resources:{ food:32, water:38, medicine:10, ammo:62, materials:28, fuel:14 },
    time:{ elapsed:0, day:1, phase:'dawn', phaseProgress:0 }, weather:{ kind:'clear', intensity:0 },
    safeHouse:{ x:0,y:0,radius:8,integrity:100,level:1 }, events:[], audit:[], eventSeq:0, hordePressure:0,
    score:{ kills:0,rescued:0,longestSurvival:0,hordesSurvived:0 }
  };
}

function nearestLivingSurvivor(z: Zombie, survivors: Survivor[]): Survivor | null {
  let best:null|Survivor=null; let bd=Infinity;
  for (const s of survivors) if (s.alive) { const d=dist(z,s); if (d<bd) { bd=d; best=s; } }
  return best;
}

function nearestZombie(s: Survivor, zombies: Zombie[]): Zombie | null {
  let best:null|Zombie=null; let bd=Infinity;
  for (const z of zombies) if (z.health>0) { const d=dist(s,z); if (d<bd) { bd=d; best=z; } }
  return best;
}

function moveToward(entity:{x:number;y:number;facing:number}, tx:number,ty:number,speed:number,dt:number) {
  const dx=tx-entity.x, dy=ty-entity.y, d=Math.hypot(dx,dy)||1;
  entity.facing=Math.atan2(dy,dx);
  entity.x += dx/d * Math.min(d, speed*dt); entity.y += dy/d * Math.min(d, speed*dt);
}

function resolveZombieSeparation(zombies: Zombie[]) {
  const cellSize=1.4; const cells=new Map<string,Zombie[]>();
  for (const z of zombies) if (z.health>0) {
    const k=`${Math.floor(z.x/cellSize)},${Math.floor(z.y/cellSize)}`; const arr=cells.get(k) ?? []; arr.push(z); cells.set(k,arr);
  }
  for (const z of zombies) if (z.health>0) {
    const cx=Math.floor(z.x/cellSize), cy=Math.floor(z.y/cellSize);
    for (let ox=-1;ox<=1;ox++) for (let oy=-1;oy<=1;oy++) for (const o of cells.get(`${cx+ox},${cy+oy}`) ?? []) {
      if (o===z) continue; const dx=z.x-o.x, dy=z.y-o.y; const d=Math.hypot(dx,dy); if (d>0 && d<0.45) { const push=(0.45-d)*0.16; z.x += dx/d*push; z.y += dy/d*push; }
    }
  }
}

function updateZombies(state: GameState, dt:number) {
  const nightBoost = state.time.phase==='night' ? 1.18 : 1;
  let aliveZombies=0;
  for (const z of state.zombies) {
    if (z.health<=0) { z.action='dead'; continue; }
    aliveZombies++;
    if (z.stagger>0) { z.stagger=Math.max(0,z.stagger-dt); z.action='stagger'; continue; }
    const target=nearestLivingSurvivor(z,state.survivors); if (!target) continue;
    const d=dist(z,target); z.targetId=target.id; z.distanceToSafeHouse=Math.hypot(z.x,z.y);
    if (d<0.68) {
      z.action='attack'; target.health -= (5.5 + z.variant*0.25)*dt; target.infection=clamp(target.infection+(0.6+z.variant*0.04)*dt,0,100); target.threat=1;
      if (target.health<=0 && target.alive) { target.health=0; target.alive=false; target.action='dead'; }
      continue;
    }
    let blocked:null|typeof state.barricades[number]=null;
    for (const b of state.barricades) if (b.hp>0 && dist(z,b)<0.85) { blocked=b; break; }
    if (blocked) {
      z.action='attack'; const before=blocked.hp; blocked.hp=Math.max(0,blocked.hp-(4.2+z.variant*0.3)*dt); if (Math.floor(before)!==Math.floor(blocked.hp) && state.tick%12===0) pushEvent(state,{type:'barricade-hit',x:blocked.x,y:blocked.y,targetId:blocked.id,value:blocked.hp}); continue;
    }
    z.action = d < 10 ? 'pursue' : 'wander';
    const speed=z.speed*nightBoost*(z.action==='pursue'?1:0.72);
    const tx=z.action==='pursue'?target.x:state.safeHouse.x; const ty=z.action==='pursue'?target.y:state.safeHouse.y;
    moveToward(z,tx,ty,speed,dt);
  }
  resolveZombieSeparation(state.zombies);
  state.hordePressure=clamp(aliveZombies/Math.max(1,state.zombies.length),0,1);
}

function decideSurvivor(state: GameState, s: Survivor) {
  const z=nearestZombie(s,state.zombies); const zd=z?dist(s,z):999; s.threat=clamp(1-zd/9,0,1);
  if (s.health<=22) { s.action=s.role==='medic' && state.resources.medicine>0 ? 'heal':'retreat'; s.targetX=0; s.targetY=0; return; }
  if (zd<2.4 && s.ammo>0) { s.action='attack'; return; }
  if (zd<5 && s.ammo>0) { s.action='aim'; return; }
  const damaged=state.barricades.filter(b=>b.hp>0 && b.hp<b.maxHp*0.72).sort((a,b)=>dist(s,a)-dist(s,b))[0];
  if (s.role==='engineer' && damaged && state.resources.materials>0) { s.action='repair'; s.targetX=damaged.x; s.targetY=damaged.y; return; }
  const available=state.loot.filter(l=>l.amount>0).sort((a,b)=>dist(s,a)-dist(s,b))[0];
  if (available && (s.role==='scavenger' || s.role==='scout' || state.resources.food<18)) { s.action=dist(s,available)<0.9?'scavenge':'move'; s.targetX=available.x; s.targetY=available.y; return; }
  const angle=((Number(s.id.slice(2))+state.time.day)*1.7)% (Math.PI*2); s.action='move'; s.targetX=Math.cos(angle)*5; s.targetY=Math.sin(angle)*5;
}

function updateSurvivors(state:GameState,dt:number) {
  for (const s of state.survivors) {
    if (!s.alive) continue; s.cooldown=Math.max(0,s.cooldown-dt); s.stamina=clamp(s.stamina+5*dt,0,100);
    if (state.tick%18===0 || s.action==='idle') decideSurvivor(state,s);
    const z=nearestZombie(s,state.zombies);
    if ((s.action==='attack'||s.action==='aim') && z) {
      const d=dist(s,z); s.facing=Math.atan2(z.y-s.y,z.x-s.x);
      if (s.action==='attack' && d<3 && s.cooldown<=0 && s.ammo>0) {
        s.ammo--; state.resources.ammo=Math.max(0,state.resources.ammo-1); s.cooldown=0.45; z.health-=28; z.stagger=0.18; pushEvent(state,{type:'shot',x:s.x,y:s.y,actorId:s.id,targetId:z.id});
        if (z.health<=0) { z.health=0; z.action='dead'; s.kills++; state.score.kills++; pushEvent(state,{type:'kill',x:z.x,y:z.y,actorId:s.id,targetId:z.id}); }
      }
      continue;
    }
    if (s.action==='heal') { if (state.resources.medicine>0 && s.cooldown<=0) { state.resources.medicine--; s.health=clamp(s.health+26,0,100); s.cooldown=4; pushEvent(state,{type:'heal',x:s.x,y:s.y,actorId:s.id}); } continue; }
    if (s.action==='repair') {
      const b=state.barricades.filter(b=>b.hp>0).sort((a,b)=>dist(s,a)-dist(s,b))[0];
      if (b && dist(s,b)<0.8 && state.resources.materials>0) { const add=Math.min(10*dt,b.maxHp-b.hp,state.resources.materials); b.hp+=add; state.resources.materials=Math.max(0,state.resources.materials-add*0.08); if (state.tick%20===0) pushEvent(state,{type:'barricade-repair',x:b.x,y:b.y,actorId:s.id,targetId:b.id,value:b.hp}); }
      else if (b) moveToward(s,b.x,b.y,2.4,dt); continue;
    }
    if (s.action==='scavenge') {
      const l=state.loot.filter(l=>l.amount>0).sort((a,b)=>dist(s,a)-dist(s,b))[0];
      if (l && dist(s,l)<1) { l.searched+=dt; if (l.searched>=1.4 && l.amount>0) { const amount=Math.min(3,l.amount); l.amount-=amount; state.resources[l.kind]+=amount; s.carrying+=amount; l.searched=0; pushEvent(state,{type:'loot',x:l.x,y:l.y,actorId:s.id,value:amount}); } }
      else if (l) moveToward(s,l.x,l.y,2.2,dt); continue;
    }
    if (s.action==='retreat') { moveToward(s,0,0,3.2,dt); continue; }
    if (s.action==='move') moveToward(s,s.targetX,s.targetY,2.1,dt);
  }
}

function updateEnvironment(state:GameState) {
  const prev=state.time.phase; const p=phaseAt(state.time.elapsed); state.time.day=p.day; state.time.phase=p.phase; state.time.phaseProgress=p.phaseProgress;
  if (prev!==state.time.phase) pushEvent(state,{type:'phase',x:0,y:0,value:state.time.day});
  if (state.tick%900===0) {
    let roll; [roll,state.rng]=randomRange(state.rng,0,1);
    state.weather = roll<0.18?{kind:'rain',intensity:0.65}:roll<0.28?{kind:'fog',intensity:0.52}:roll<0.33?{kind:'storm',intensity:0.8}:{kind:'clear',intensity:0};
  }
  const near=state.zombies.filter(z=>z.health>0 && z.distanceToSafeHouse<8).length;
  state.safeHouse.integrity=clamp(100-state.barricades.reduce((sum,b)=>sum+(1-b.hp/b.maxHp)*18,0)-near*0.45,0,100);
  if (state.safeHouse.integrity<=0 || state.survivors.every(s=>!s.alive)) state.status='overrun';
}


function maybeSpawnHorde(state:GameState) {
  if (state.tick === 0 || state.tick % (30 * 45) !== 0) return;
  const count=18+Math.min(42,state.time.day*4);
  let fresh; [fresh,state.rng]=createZombies(state.rng,count);
  for (let i=0;i<fresh.length;i++) fresh[i].id=`z-wave-${state.tick}-${i}`;
  state.zombies.push(...fresh);
  pushEvent(state,{type:'horde',x:0,y:0,value:count});
}

export function stepGame(input:GameState,_dt:number):GameState {
  if (input.status!=='running') return structuredClone(input);
  const state=structuredClone(input); const fixed=1/30; state.tick++; state.time.elapsed+=fixed; state.score.longestSurvival=Math.max(state.score.longestSurvival,state.time.elapsed);
  maybeSpawnHorde(state); updateEnvironment(state); updateSurvivors(state,fixed); updateZombies(state,fixed);
  return state;
}

export function applyViewerInfluence(input:GameState,event:ViewerInfluence):GameState {
  const state=structuredClone(input); if (state.audit.some(a=>a.externalId===event.id)) return state;
  let accepted=0;
  if (event.type==='supply-drop') { accepted=clamp(Math.round(event.magnitude),0,12); state.resources.food+=accepted; state.resources.water+=Math.floor(accepted/2); }
  if (event.type==='district-pressure') { accepted=clamp(event.magnitude,-0.15,0.15); state.hordePressure=clamp(state.hordePressure+accepted,0,1); }
  if (event.type==='camera-focus') accepted=clamp(event.magnitude,0,1);
  state.audit.push({externalId:event.id,type:event.type,acceptedMagnitude:accepted,tick:state.tick}); return state;
}
