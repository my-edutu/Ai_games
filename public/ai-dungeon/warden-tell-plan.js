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
 const turns=warning?.turnsUntilImpact,max=shape==='RIFT_CROSS'?2:3;
 if(!Number.isSafeInteger(turns)||turns<1||turns>max)return IDLE;
 const progress=(max-turns+1)/max,shift=progress-1/3;
 return Object.freeze({shape,progress,emboss:clip(.018+shift*.04,0,.07),
  glow:clip(.24+shift*.36,0,.48),warning:true,
  ornamentScale:clip(.7+shift*.45,.7,1)});
}

/**
 * Physical rhythm for a REAL, public-state Warden strike. All three NOVA / Eclipse beats (or two narrow Rupture beats) lift the SAME threatened floor cells.
 * Actual impact settles those stones; reduced motion keeps a static, visible
 * warning with no extra presentation movement. Never creates danger, damage,
 * a false safe lane or a gameplay clock.
 */
export function planWardenReliefBeat(stage,impactAge=0,reducedMotion=false){
 const warning=stage?.warning===true&&Number.isFinite(stage.progress);
 const progress=warning?clip(stage.progress,0,1):0;
 const impact=!warning?clip(impactAge,0,.42)/.42:0;
 const lift=warning?(reducedMotion?.018:.011+.047*progress):
  reducedMotion?0:impact>0?.012+.033*impact:0;
 return Object.freeze({
  active:warning||impact>0,
  lift:Number(lift.toFixed(4)),
  footprint:warning?Number((.92+.035*progress).toFixed(4)):.945,
  ember:warning?Number((.13+.36*progress).toFixed(4)):Number((.11+.34*impact).toFixed(4)),
  impact:!warning&&impact>0
 });
}

/**
 * A single continuous, original basalt shock-front moves out through the
 * ALREADY authoritatively marked Warden cells. The map and attack geometry are
 * never generated here. All marked stones remain visible from the first
 * warning; a tiny radial crest makes the honest countdown beats feel
 * like one physical event instead of 25 unrelated flashing HUD squares.
 * Reduced motion exposes the complete hazard with no vertical wave or tilt.
 */
export function planWardenReliefTile(stage,impactAge=0,radialDistance=0,reducedMotion=false){
 if(!Number.isFinite(radialDistance)||radialDistance<0||radialDistance>7)
  return Object.freeze({lift:0,tilt:0,footprint:0});
 const base=planWardenReliefBeat(stage,impactAge,reducedMotion);
 if(!base.active)return Object.freeze({lift:0,tilt:0,footprint:base.footprint});
 if(reducedMotion)return Object.freeze({lift:base.lift,tilt:0,footprint:base.footprint});
 const warning=stage?.warning===true;
 const center=warning?(stage.shape==='NOVA'?3:4)*clip(stage.progress,0,1):0;
 const crest=warning?clip(1-Math.abs(radialDistance-center)/1.25,0,1):0;
 const decay=warning?0:clip(impactAge,0,.42)/.42;
 const lift=base.lift+.026*crest+.014*decay;
 const tilt=.045*crest+.035*decay;
 return Object.freeze({lift:Number(lift.toFixed(4)),tilt:Number(tilt.toFixed(4)),
  footprint:base.footprint});
}
