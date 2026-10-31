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
