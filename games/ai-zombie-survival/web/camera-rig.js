// Presentation-only obstruction solver for cinematic 3D cameras. No gameplay state changes.
export function clearCamera(focus,desired,buildings){
  const dx=desired[0]-focus[0],dy=desired[1]-focus[1],dz=desired[2]-focus[2];
  const span=Math.hypot(dx,dy,dz);
  if(!Number.isFinite(span)||span<0.01)return desired;
  const minSpan=4.6,steps=28;
  let first=1;
  for(const b of buildings){
    if(!b.roofVisible)continue;
    const halfW=b.w*.5+.25,halfH=b.h*.5+.25;
    // A near-camera hero can be standing in a building's footprint. Don't snap for that structure.
    if(Math.abs(focus[0]-b.x)<halfW&&Math.abs(focus[2]-b.y)<halfH)continue;
    const top=b.kind==='safehouse'?5.55:2.7+b.floors*1.25+.5;
    // Sample along focal ray from hero to camera; choose the nearest actual occluder.
    for(let i=3;i<steps;i++){
      const t=i/steps;
      if(t>=first)break;
      const x=focus[0]+dx*t,y=focus[1]+dy*t,z=focus[2]+dz*t;
      if(y<top+.55&&Math.abs(x-b.x)<halfW&&Math.abs(z-b.y)<halfH){
        first=t;break;
      }
    }
  }
  if(first>=1)return desired;
  const clamped=Math.min(1,Math.max(minSpan/span,first-.06));
  return[
    focus[0]+dx*clamped,
    focus[1]+dy*clamped+Math.min(2.2,(1-clamped)*2.5),
    focus[2]+dz*clamped,
  ];
}
