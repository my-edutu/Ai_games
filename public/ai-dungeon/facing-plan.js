/**
 * Presentation-only facing for snapshots produced by the authoritative dungeon.
 * Attack aim is deliberately conservative: only nearest, actually aligned and
 * unobstructed opponents. Healing and radial spells have no invented target.
 * The values turn visible Three.js roots, never game coordinates or AI rules.
 */
const finitePoint=p=>p&&Number.isInteger(p.x)&&Number.isInteger(p.z);
const occupied=(map,p)=>Array.isArray(map)&&typeof map[p.z]==='string'&&map[p.z][p.x]==='.';
function clearAxis(map,a,b){
 if(a.x!==b.x&&a.z!==b.z)return false;
 const dx=Math.sign(b.x-a.x),dz=Math.sign(b.z-a.z);
 const distance=Math.abs(b.x-a.x)+Math.abs(b.z-a.z);
 for(let i=1;i<distance;i++){
  if(map[a.z+dz*i]?.[a.x+dx*i]!=='.')return false;
 }
 return true;
}
export function planCombatFacing(unit,units,map){
 if(!finitePoint(unit)||!Array.isArray(units)||!occupied(map,unit))return null;
 const isAttack=unit.action==='attack',isBolt=unit.kind==='cultist'&&unit.action==='cast';
 if(!isAttack&&!isBolt)return null;
 const range=unit.kind==='ranger'?4:unit.kind==='mystic'||isBolt?3:1;
 // Attackers can aim at the foe just killed on this same authoritative tick.
 // Older corpses, invisible diagonal bolts and out-of-range foes are excluded.
 const opponents=units.filter(other=>other&&other.id!==unit.id&&other.faction!==unit.faction&&finitePoint(other)&&
  (other.hp>0||(other.hp===0&&other.action==='hurt'&&other.actionTick===unit.actionTick)))
 .sort((a,b)=>(Math.abs(a.x-unit.x)+Math.abs(a.z-unit.z))-(Math.abs(b.x-unit.x)+Math.abs(b.z-unit.z))||
  String(a.id).localeCompare(String(b.id),'en'));
 // The real target ID forbids staging a hit on a different enemy.
 const target=typeof unit.targetId==='string'?opponents.find(u=>u.id===unit.targetId):opponents[0];
 if(!target||!occupied(map,target))return null;
 const distance=Math.abs(target.x-unit.x)+Math.abs(target.z-unit.z);
 if(distance<1||distance>range||!clearAxis(map,unit,target))return null;
 return {targetId:target.id,yaw:Math.atan2(unit.x-target.x,unit.z-target.z),distance};
}
export function planMovementFacing(x,z,targetX,targetZ){
 if(![x,z,targetX,targetZ].every(Number.isFinite))return null;
 const dx=targetX-x,dz=targetZ-z;
 if(Math.hypot(dx,dz)<.07)return null;
 // Existing authored models and procedural rigs use negative Z as forward.
 return Math.atan2(-dx,-dz);
}
export function shortestYawDelta(from,to){
 if(!Number.isFinite(from)||!Number.isFinite(to))return 0;
 return Math.atan2(Math.sin(to-from),Math.cos(to-from));
}
export function approachCharacterYaw(current,desired,dt,reducedMotion=false){
 const from=Number.isFinite(current)?current:0;
 if(!Number.isFinite(desired))return Math.atan2(Math.sin(from),Math.cos(from));
 const difference=shortestYawDelta(from,desired);
 const limit=reducedMotion?Math.PI:Math.min(.05,Math.max(0,Number.isFinite(dt)?dt:0))*8.5;
 const changed=from+Math.sign(difference)*Math.min(Math.abs(difference),limit);
 return Math.atan2(Math.sin(changed),Math.cos(changed));
}

/**
 * Resolve a combat CONTACT from one immutable public authority snapshot.
 * Never infer a projectile from proximity alone: the target must be the
 * same nearest opponent eligible under the real grid, range and wall rules.
 * Ordinary mystic casts may be offensive; an authoritative healing event
 * rules those out without guessing from localized event text.
 * Radial Warden casts and ranger trap-disarms have no hostile contact.
 */
export function planVisualContact(unit,snapshot){
 if(!unit||!snapshot||!Array.isArray(snapshot.units))return null;
 if(unit.action==='attack')return planCombatFacing(unit,snapshot.units,snapshot.map);
 if(unit.action!=='cast'||(unit.kind!=='mystic'&&unit.kind!=='cultist'))return null;
 if(unit.kind==='mystic'&&unit.faction==='party'&&Number.isSafeInteger(snapshot.tick)&&
    Array.isArray(snapshot.events)&&snapshot.events.some(e=>e?.kind==='healing'&&e.tick===snapshot.tick))return null;
 // Mystic offensive casts use the authoritative 3-cell attack lane.
 // Cultist shadow-bolt casts use the planner's existing 3-cell cast lane.
 const aimed=unit.kind==='mystic'?{...unit,action:'attack'}:unit;
 return planCombatFacing(aimed,snapshot.units,snapshot.map);
}
