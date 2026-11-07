/**
 * A genuine autonomous hero escape becomes one grounded full-body performance.
 * Authority, navigation, damage, save and replay never consume this module.
 * Rejects any inferred evasion: require the actual contemporaneous semantic
 * event, one legally entered stone cell, a living party member and same floor.
 */
export const EVASION_BEAT_DURATION=.58;
const smooth=x=>{const t=Math.min(1,Math.max(0,x));return t*t*(3-2*t)};
const KINDS=Object.freeze({vanguard:1,ranger:1.18,mystic:.90});
const legal=(u,map)=>u&&typeof u.id==='string'&&u.id.length>0&&u.id.length<=128&&
 u.faction==='party'&&Object.hasOwn(KINDS,u.kind)&&u.hp>0&&
 Number.isInteger(u.x)&&Number.isInteger(u.z)&&u.x>=0&&u.z>=0&&map[u.z]?.[u.x]==='.';
export function planAuthorityEvasions(previous,next){
 if(!Number.isSafeInteger(previous?.tick)||!Number.isSafeInteger(next?.tick)||
  next.tick<=previous.tick||next.tick-previous.tick>3||previous.run!==next.run||
  previous.floor!==next.floor||next.phase!=='exploring'||
  !Array.isArray(previous.units)||!Array.isArray(next.units)||!Array.isArray(next.map)||
  !Array.isArray(next.events))return Object.freeze([]);
 const earlier=new Map(previous.units.filter(u=>legal(u,next.map)).map(u=>[u.id,u]));
 const events=new Set(next.events.filter(e=>e?.kind==='evade'&&e.tick===next.tick&&
  typeof e.text==='string').map(e=>e.text));
 const beats=[];
 for(const u of next.units.slice(0,18)){
  if(!legal(u,next.map)||u.action!=='move'||u.actionTick!==next.tick)continue;
  const from=earlier.get(u.id);if(!from||from.kind!==u.kind)continue;
  const dx=u.x-from.x,dz=u.z-from.z;
  if(Math.abs(dx)+Math.abs(dz)!==1)continue;
  const prefix=u.kind+' slipped away from the marked ';
  const threat=events.has(prefix+'shadow hex')?'shadow-hex':
   events.has(prefix+'revenant breach')?'revenant-breach':
   events.has(u.kind+' moved toward clear stone before the Warden strike')?'warden-warning':null;
  if(!threat)continue;
  beats.push(Object.freeze({id:u.id,kind:u.kind,tick:next.tick,threat,dx,dz,
   from:Object.freeze({x:from.x,z:from.z}),to:Object.freeze({x:u.x,z:u.z})}));
 }
 return Object.freeze(beats.slice(0,3));
}
const rest=()=>({strength:0,root:{x:0,y:0,z:0,pitch:0,roll:0},
 spine:{pitch:0,yaw:0,roll:0},
 arms:{left:{pitch:0,roll:0},right:{pitch:0,roll:0}},elbows:{left:0,right:0},
 legs:{left:{upper:0,lower:0,foot:0},right:{upper:0,lower:0,foot:0}}});
/** Reversible skinned crouch, side-drive, opposite-foot plant and landing.
 * The camera and original mixer supply yaw; the real hero's outer root
 * already follows the authority's legal one-cell move. Visual-only offsets <= .08m.
 */
export function planEvasionPerformance(kind,age,beat,{reducedMotion=false,yaw=0}={}){
 if(reducedMotion||!Object.hasOwn(KINDS,kind)||beat?.kind!==kind||
  !Number.isFinite(age)||age<0||age>=EVASION_BEAT_DURATION||
  !Number.isInteger(beat.dx)||!Number.isInteger(beat.dz)||
  Math.abs(beat.dx)+Math.abs(beat.dz)!==1||!Number.isFinite(yaw))return rest();
 const crouch=age<.105?smooth(age/.105):age<.19?1-smooth((age-.105)/.085):0;
 const drive=age<.10?0:age<.275?smooth((age-.10)/.175):
  1-smooth((age-.275)/.305);
 const land=age<.27?0:age<.43?smooth((age-.27)/.16):1-smooth((age-.43)/.15);
 const lateral=Math.cos(yaw)*beat.dx-Math.sin(yaw)*beat.dz;
 const forward=Math.sin(yaw)*beat.dx+Math.cos(yaw)*beat.dz;
 const side=lateral>=0?1:-1,weight=KINDS[kind];
 return {strength:Math.max(crouch,drive,land),
  root:{x:lateral*.068*drive,y:-.072*crouch+.025*drive-.035*land,
   z:forward*.025*drive,pitch:.095*crouch-.065*drive,roll:-lateral*.16*drive},
  spine:{pitch:.065*crouch-.075*drive,yaw:-lateral*.10*drive,roll:-lateral*.12*drive},
  arms:{
   left:{pitch:-.16*crouch+.13*weight*drive,roll:-side*(.08*crouch+.13*weight*drive)},
   right:{pitch:-.19*crouch+.15*weight*drive,roll:side*(.10*crouch+.16*weight*drive)}
  },elbows:{left:.16*crouch+.07*land,right:.20*crouch+.11*land},
  legs:{
   left:{upper:side*(.11*crouch+.23*weight*drive),lower:.13*crouch+.10*land,foot:-side*.09*drive},
   right:{upper:-side*(.10*crouch+.22*weight*drive),lower:.14*crouch+.095*land,foot:side*.09*drive}
  }
 };
}
