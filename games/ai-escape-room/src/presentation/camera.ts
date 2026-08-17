import type { EscapeRenderSnapshot } from './snapshot';
export interface EscapeCameraState{xPermille:number;yPermille:number;zoom:number;shakePermille:number;reason:'focus'|'danger'|'result'|'overview';}
export function updateEscapeCamera(snapshot:EscapeRenderSnapshot,previous:EscapeCameraState|null):EscapeCameraState{
  const focus=snapshot.objects.find(object=>object.id===snapshot.focusObjectId);const danger=snapshot.hazards.some(hazard=>hazard.phase==='active');
  const targetX=focus?.xPermille??500,targetY=focus?.yPermille??500;const blend=previous?.reason==='focus'&&snapshot.scene==='normal'?0.35:1;
  const xPermille=Math.round((previous?.xPermille??targetX)*(1-blend)+targetX*blend);const yPermille=Math.round((previous?.yPermille??targetY)*(1-blend)+targetY*blend);
  const reason:EscapeCameraState['reason']=snapshot.scene==='result'?'result':danger?'danger':focus?'focus':'overview';
  const zoom=Math.max(0.85,Math.min(1.3,reason==='focus'?1.12:reason==='danger'?1.04:reason==='result'?0.94:0.9));
  return{xPermille,yPermille,zoom,shakePermille:danger?18:0,reason};
}
