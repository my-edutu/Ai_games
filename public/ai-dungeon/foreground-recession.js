/**
 * Real original Gothic stage props physically recede below the stone floor.
 * Eligibility is established upstream by authentic living-body camera rays.
 * Render-only: never changes map, navigation, HP, AI, saves, seed, or replay.
 */
const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
export function applyForegroundRecession(group,blocked,frameDelta=0,reducedMotion=false,box=null){
 if(!group?.position||!group.userData||!Number.isFinite(group.position.y)||
  typeof group.visible!=='boolean')return false;
 let state=group.userData.dungeonForegroundRecession;
 if(!state){
  const top=Array.isArray(box)&&box.length===6&&box.every(Number.isFinite)?box[4]:group.position.y+2.5;
  state={baseY:group.position.y,depth:clamp(Math.max(0,top)+.32,.42,8),fraction:blocked?0:1};
  group.userData.dungeonForegroundRecession=state;
 }
 const dt=Number.isFinite(frameDelta)?clamp(frameDelta,0,.05):0;
 // Fast genuine obstruction clearance, slower original architectural return.
 // Every step is bounded even when software WebGL stalls; reduced motion
 // and first-shot sightline protection remain immediate.
 // The camera director expects verified source foreground clearance in
 // the CURRENT frame. A 2-frame recession can obscure source-skinned
 // heads, boots and weapons for seconds during slow software-WebGL frames.
 // Physically clear genuine obstruction now; restore stone only afterward.
 state.fraction=blocked?0:reducedMotion?1:Math.min(1,state.fraction+4*dt);
 const smooth=state.fraction*state.fraction*(3-2*state.fraction);
 group.position.y=state.baseY-state.depth*(1-smooth);
 group.visible=state.fraction>.001;
 return blocked;
}
