/**
 * Original, read-only woven silhouettes for the six actual textured dungeon
 * characters. Every panel is attached outside the imported GLB skeleton:
 * the imported artist's clips, authority, navigation and replay are untouched.
 * Coordinates are metres in the existing 1.82m/2.05m visual rig space.
 */
const panel=(id,side,color,shoulderY,length,width,flare)=>
 Object.freeze({id,side,color,shoulderY,length,width,flare});
const RECIPE=Object.freeze({
 vanguard:Object.freeze([
  panel('vanguard-left-mantle',-1,'#344b60',1.49,.65,.38,.19),
  panel('vanguard-right-mantle',1,'#3e5061',1.49,.70,.39,.23)
 ]),
 ranger:Object.freeze([
  panel('ranger-left-travel-cloak',-1,'#3d5149',1.46,.91,.34,.28),
  panel('ranger-right-travel-cloak',1,'#43584b',1.46,.95,.33,.31)
 ]),
 mystic:Object.freeze([
  panel('mystic-left-ceremonial-robe',-1,'#47435f',1.49,1.12,.40,.32),
  panel('mystic-right-ceremonial-robe',1,'#50486b',1.49,1.08,.38,.37)
 ]),
 revenant:Object.freeze([
  panel('revenant-left-torn-coat',-1,'#3e464c',1.43,.76,.34,.26),
  panel('revenant-right-torn-coat',1,'#46434a',1.43,.89,.30,.36)
 ]),
 cultist:Object.freeze([
  panel('cultist-left-ritual-veil',-1,'#4d3d49',1.52,1.17,.41,.38),
  panel('cultist-right-ritual-veil',1,'#513845',1.52,1.22,.42,.41)
 ]),
 warden:Object.freeze([
  panel('warden-left-war-mantle',-1,'#4f3942',1.69,1.25,.49,.43),
  panel('warden-right-war-mantle',1,'#553a44',1.69,1.30,.48,.46)
 ])
});
const EMPTY=Object.freeze([]);
const STILL=Object.freeze({pitch:0,roll:0});
export const DRAPE_ROWS=8,DRAPE_COLUMNS=6;
export function planDrapePanels(kind){
 return typeof kind==='string'&&Object.hasOwn(RECIPE,kind)?RECIPE[kind]:EMPTY;
}
/**
 * Cache the exact sampled cloth pose without freezing any moving silhouette.
 * Transient actions settle to the SAME rest geometry after their longest
 * panel/swing envelope; reduced-motion and unknown actions are also at rest.
 * For idle/move the existing bounded render age stays part of the key.
 * This is purely a GPU-upload decision; it is never gameplay state.
 */
export function drapePoseKey(action,elapsed=0,reducedMotion=false){
 if(reducedMotion)return 'rest';
 const t=Number.isFinite(elapsed)?Math.max(0,Math.min(60,elapsed)):0;
 if(action==='attack'&&t>=.62)return 'rest';
 if(action==='cast'&&t>=.68)return 'rest';
 if(action==='hurt'&&t>=.42)return 'rest';
 if(action==='guard'&&t>=.48)return 'rest';
 if(!['idle','move','attack','cast','hurt','guard'].includes(action))return 'rest';
 return action+':'+t;
}

export function planDrapeSwing(action,elapsed=0,reducedMotion=false){
 if(reducedMotion)return STILL;
 const t=Number.isFinite(elapsed)?Math.max(0,Math.min(60,elapsed)):0;
 if(action==='move')return {pitch:.075+.038*Math.sin(t*9),roll:.036*Math.sin(t*5.4)};
 if(action==='idle')return {pitch:.014*Math.sin(t*1.8),roll:.009*Math.sin(t*1.1)};
 if(action==='attack'){
  if(t>=.58)return STILL;
  const p=Math.sin(Math.PI*t/.58);
  return {pitch:.14*p,roll:.027*p};
 }
 if(action==='cast'){
  if(t>=.64)return STILL;
  const p=Math.sin(Math.PI*t/.64);
  return {pitch:-.09*p,roll:.045*p};
 }
 if(action==='hurt'){
  if(t>=.40)return STILL;
  const p=Math.sin(Math.PI*t/.40);
  return {pitch:-.12*p,roll:-.065*p};
 }
 if(action==='guard'){
  if(t>=.45)return STILL;
  return {pitch:.035*Math.sin(Math.PI*t/.45),roll:0};
 }
 return STILL;
}

/**
 * A bounded cloth-vertex displacement, evaluated only by the renderer.
 * Pin the shoulder seam. The hem lags an authoritative action and then
 * settles; never integrates velocity or alters imported GLB skeletons.
 * Pure and replay-independent: no RNG, timer, allocation of world objects.
 */
const REST_BEND=Object.freeze({x:0,y:0,z:0});
export function planDrapeVertexBend(row,column,action,elapsed=0,reducedMotion=false){
 if(reducedMotion||!Number.isFinite(row)||!Number.isFinite(column))return REST_BEND;
 const r=Math.max(0,Math.min(1,row)),u=Math.max(0,Math.min(1,column));
 if(r===0)return REST_BEND;
 const t=Number.isFinite(elapsed)?Math.max(0,Math.min(60,elapsed)):0;
 let amplitude=0,frequency=2;
 switch(action){
  case 'idle':amplitude=.014;frequency=1.9;break;
  case 'move':amplitude=.115;frequency=8;break;
  case 'attack':amplitude=t<.62?.145*Math.sin(Math.PI*t/.62):0;frequency=7;break;
  case 'cast':amplitude=t<.68?-.098*Math.sin(Math.PI*t/.68):0;frequency=5;break;
  case 'hurt':amplitude=t<.42?-.118*Math.sin(Math.PI*t/.42):0;frequency=9;break;
  case 'guard':amplitude=t<.48?.039*Math.sin(Math.PI*t/.48):0;frequency=4;break;
  default:return REST_BEND;
 }
 if(amplitude===0)return REST_BEND;
 const weight=r*r,phase=t*frequency-r*1.4+u*2.4;
 return{
  x:weight*amplitude*.19*Math.sin(phase*.81),
  y:-weight*Math.abs(amplitude)*.09*(.6+.4*Math.cos(phase)),
  z:weight*amplitude*(.64+.36*Math.sin(phase))
 };
}
