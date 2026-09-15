import type { CameraEvent, GameState } from './types.js';
export function selectCameraEvent(state:GameState):CameraEvent {
  if (state.status==='overrun') return {mode:'failure',targetId:null,score:1};
  const critical=[...state.survivors].filter(s=>s.alive).sort((a,b)=>(a.health+100*(1-a.threat))-(b.health+100*(1-b.threat)))[0];
  if (critical && (critical.health<20 || critical.threat>0.92)) return {mode:'near-death',targetId:critical.id,score:1};
  const close=state.zombies.filter(z=>z.health>0 && z.distanceToSafeHouse<8).length;
  if (close>=18 || state.zombies.length>=220) return {mode:'horde-overview',targetId:null,score:0.88};
  const damaged=state.barricades.find(b=>b.hp<b.maxHp*0.55 && b.hp>0); if (damaged) return {mode:'defense',targetId:damaged.id,score:0.82};
  const scavenger=state.survivors.find(s=>s.alive && s.action==='scavenge'); if (scavenger) return {mode:'scavenge',targetId:scavenger.id,score:0.7};
  const fighter=state.survivors.find(s=>s.alive && (s.action==='attack'||s.action==='aim')); if (fighter) return {mode:'survivor-follow',targetId:fighter.id,score:0.66};
  return {mode:'squad',targetId:null,score:0.5};
}
