/**
 * Original physically grounded warning-stage policy. A genuine public
 * authority snapshot is the ONLY source of what can be dangerous. The same
 * three-beat broad nova that gives AI meaningful evasive tactics lifts small
 * carved stone marks and gains intensity toward actual impact; reduced motion
 * uses stable geometry without pulsing, never hides or fabricates the marks.
 */
const clip=(n,a,b)=>Number.isFinite(n)?Math.max(a,Math.min(b,n)):a;
const IDLE=Object.freeze({shape:'NONE',progress:0,emboss:0,glow:0,warning:false,ornamentScale:0});
export function planWardenTellStage(warning,reducedMotion=false){
 const shape=warning?.shape;
 if(!['NOVA','RIFT_CROSS','ECLIPSE_SWEEP'].includes(shape)||warning?.warning!==true)return IDLE;
 const turns=warning?.turnsUntilImpact,max=shape==='NOVA'?3:2;
 if(!Number.isSafeInteger(turns)||turns<1||turns>max)return IDLE;
 const progress=(max-turns+1)/max,shift=progress-1/3;
 return Object.freeze({shape,progress,emboss:clip(.018+shift*.04,0,.07),
  glow:clip(.24+shift*.36,0,.48),warning:true,
  ornamentScale:clip(.7+shift*.45,.7,1)});
}
