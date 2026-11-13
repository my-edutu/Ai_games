/**
 * Authored original cast surface direction for the ACTUAL existing, licensed
 * skinned GLB geometry. Embedded source maps, skeletons, UVs and material
 * instances stay attached; this only shapes their PBR response at load.
 * No new geometry, texture allocation, light, render pass, or game authority.
 */
const CAST=Object.freeze({
 vanguard:Object.freeze({iron:'#707d85',leather:'#4c463f',cloth:'#4b5c69',bone:'#b5a89a'}),
 revenant:Object.freeze({iron:'#656663',leather:'#51443e',cloth:'#544a49',bone:'#b3a48d'}),
 warden:Object.freeze({iron:'#514f50',leather:'#4c403d',cloth:'#4b3537',bone:'#b8ab95'})
});
const OUTSIDE=Object.freeze({surface:'unmodified',tint:null,mix:0,roughness:null,metalness:null});
export function planNativeCastFinish(kind,meshName){
 const palette=typeof kind==='string'?CAST[kind]:null;
 if(!palette||typeof meshName!=='string'||meshName.length>128)return null;
 const part=/(?:^|_)(Body|ArmLeft|ArmRight|LegLeft|LegRight|Head|Skull|Jaw|Eyes|Helmet|Hat|Cape|BootLeft|BootRight|Sword|Shield)$/i.exec(meshName)?.[1]?.toLowerCase();
 if(!part)return OUTSIDE;
 if(part==='eyes')return Object.freeze({surface:'eyes',tint:null,mix:0,roughness:.78,metalness:0});
 if(part==='head'||part==='skull'||part==='jaw')return Object.freeze({
  surface:'native-face',tint:palette.bone,mix:kind==='vanguard'?.10:.16,roughness:.83,metalness:0
 });
 if(part==='body'||part==='armleft'||part==='armright'||part==='legleft'||part==='legright')
  return Object.freeze({surface:'native-plate',tint:palette.iron,
   mix:kind==='warden'?.42:kind==='revenant'?.38:.34,roughness:.61,metalness:.26});
 if(part==='helmet'||part==='hat'||part==='shield'||part==='sword')
  return Object.freeze({surface:'native-steel',tint:palette.iron,mix:.39,roughness:.53,metalness:.46});
 if(part==='bootleft'||part==='bootright'||part==='cape')
  return Object.freeze({surface:'native-leather',tint:palette.leather,mix:.37,roughness:.88,metalness:.04});
 return OUTSIDE;
}
