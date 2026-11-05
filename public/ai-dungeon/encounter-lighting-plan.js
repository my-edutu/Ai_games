/**
 * Truth-locked cinematic portrait lighting for real autonomous encounters.
 * This moves THREE EXISTING lights, never allocating a new shadow map, shader
 * pass, attacker, hit or damage cue. Every source is a living grid actor.
 */
const clamp=(n,lo,hi)=>Math.min(hi,Math.max(lo,n));
const valid=(u,map)=>u&&typeof u.id==='string'&&u.id.length>0&&u.id.length<=128&&
 (u.faction==='party'||u.faction==='enemy')&&Number.isInteger(u.hp)&&u.hp>0&&
 Number.isInteger(u.x)&&Number.isInteger(u.z)&&u.z>=0&&u.z<map.length&&
 u.x>=0&&u.x<map.length&&map[u.z]?.[u.x]==='.';
const modes=new Set(['contact','skirmish-approach','breach-warning','oathguard-cover',
 'warden-contact','warden-warning','warden-approach','warden-exposed','warden-release']);
const fix=n=>Math.round(n*1000)/1000;
export function planEncounterLighting(s,shot,{damageBeat=null,reducedMotion=false}={}){
 const map=s?.map;
 if(!Array.isArray(map)||map.length<3||map.length>64||!Array.isArray(s?.units))return null;
 const validUnits=s.units.filter(u=>valid(u,map)).slice(0,64);
 const party=validUnits.filter(u=>u.faction==='party').slice(0,4);
 if(!party.length)return null;
 const subjects=Array.isArray(shot?.subjects)?
  shot.subjects.filter(id=>typeof id==='string'&&id.length<=128).slice(0,3):[];
 const hero=party.find(u=>subjects.includes(u.id))??party[0];
 const combat=Boolean(shot&&modes.has(shot.mode));
 const enemies=validUnits.filter(u=>u.faction==='enemy');
 const foe=combat?(enemies.find(u=>subjects.includes(u.id))??enemies.slice().sort((a,b)=>
  (Math.abs(a.x-hero.x)+Math.abs(a.z-hero.z))-
  (Math.abs(b.x-hero.x)+Math.abs(b.z-hero.z))||a.id.localeCompare(b.id))[0]):null;
 const separation=foe?Math.hypot(foe.x-hero.x,foe.z-hero.z):0;
 const duel=Boolean(combat&&foe&&separation>=.5&&separation<=7);
 const origin=(map.length-1)/2;
 const hx=hero.x-origin,hz=hero.z-origin,ex=duel?foe.x-origin:hx,ez=duel?foe.z-origin:hz;
 const length=Math.max(1,Math.hypot(ex-hx,ez-hz));
 const sideX=-(ez-hz)/length,sideZ=(ex-hx)/length;
 const heroKey=Object.freeze({x:fix(hx+sideX*1.28),y:2.68,z:fix(hz+sideZ*1.28),
  intensity:duel?3.28:2.65,distance:duel?7.8:6.8});
 const opponentFill=Object.freeze({x:fix(ex-sideX*1.18),y:2.18,z:fix(ez-sideZ*1.18),
  intensity:duel?1.26:1.18,distance:duel?6.45:7.7});
 const boss=enemies.find(u=>u.kind==='warden')??null;
 const warning=Boolean(boss&&s.bossWarning&&Number.isInteger(s.bossWarning.attackTick)&&
  Number.isInteger(s.tick)&&s.bossWarning.attackTick>=s.tick&&s.bossWarning.attackTick<=s.tick+3);
 const release=Boolean(boss&&!warning&&Number.isSafeInteger(s.tick)&&
  boss.action==='cast'&&boss.actionTick===s.tick);
 const threat=boss??(duel?foe:null);
 const bossLight=threat?Object.freeze({x:fix(threat.x-origin),y:2.34,z:fix(threat.z-origin),
  intensity:boss?(warning?3.2:release?2.86:s.bossRecovery?.remaining?1.95:2.25):1.30,
  distance:boss?9.5:5.8}):null;
 const injury=damageBeat?.id===hero.id&&Number.isFinite(damageBeat.damage)&&
  Number.isFinite(damageBeat.maxHp)&&damageBeat.damage>0&&damageBeat.maxHp>0&&!reducedMotion?
  Object.freeze({id:hero.id,strength:clamp(2.2*damageBeat.damage/damageBeat.maxHp,.08,.38)}):null;
 return Object.freeze({mode:duel?'duel':'travel',heroId:hero.id,
  enemyId:duel?foe.id:null,heroKey,opponentFill,bossLight,warning,injury});
}
