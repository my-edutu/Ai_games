// Original F8 guardian gateway -> F9 real raised-deck camera safety.
// The 390x844 original normal-speed film shows the skinned climber hidden
// behind the ACTUAL successor deck underside while old bronze architecture
// is still visible. NDC and tower-core tests alone cannot detect that.
// Cast against existing source-authored, already built Three.js platform
// triangles, never an inferred collision, predicted landing or proxy mesh.
// This is presentation-only and all vectors/hit arrays are caller-owned.
const finite=Number.isFinite;
const integer=Number.isSafeInteger;
const valid3=p=>p&&[p.x,p.y,p.z].every(finite);
function renderedTriangle(hit,root) {
  let object=hit?.object;
  if(!object?.isMesh)return false;
  while(object){
    if(object.visible===false)return false;
    if(object===root)break;
    object=object.parent;
  }
  if(object!==root)return false;
  const mats=Array.isArray(hit.object.material)
    ?hit.object.material:[hit.object.material];
  return mats.some(m=>m&&m.visible!==false &&
    (!m.transparent || m.opacity>.055));
}
export function measureAuthoritativeDeckSightline({
  source,held,camera,body,bodyHalfHeight,gate=null,
  platformRoots,raycaster,direction,point,hits,stale=false
}={}) {
  if(stale || source?.floor!==9 || source.theme!=='void' ||
    source.lifecycle!=='running' || !(source.player?.health>0) ||
    typeof source.runToken!=='string' || !source.runToken ||
    held?.guardianGateRetained!==true || held.floor!==9 ||
    held.runToken!==source.runToken ||
    !integer(source.tick) || !integer(held.sourceTick) ||
    source.tick<held.sourceTick || source.tick-held.sourceTick>70 ||
    !valid3(camera) || !valid3(body) ||
    !finite(bodyHalfHeight) || bodyHalfHeight<=0 ||
    !Array.isArray(platformRoots) || !platformRoots.length ||
    platformRoots.length>3 || !platformRoots.every(root=>root?.isGroup) ||
    !raycaster?.set || !raycaster?.intersectObject ||
    !direction?.copy || !point?.copy ||
    !Array.isArray(hits) || (gate!=null && !valid3(gate)))return null;
  let blockedBodyRays=0, blockedGatewayRays=0, rays=0, realTrianglesChecked=0;
  const samples=gate?4:3;
  for(let sample=0;sample<samples;sample++){
    point.copy(sample===3?gate:body);
    if(sample===1)point.y+=bodyHalfHeight*.76;
    else if(sample===2)point.y-=bodyHalfHeight*.72;
    direction.copy(point).sub(camera);
    const distance=direction.length();
    if(!finite(distance)||distance<=.45)continue;
    raycaster.set(camera,direction.multiplyScalar(1/distance));
    raycaster.near=0;
    raycaster.far=distance-.25;
    rays++;
    let blocked=false;
    for(const root of platformRoots){
      if(root.visible===false)continue;
      // Current moving deck transforms are owned by authoritative snapshots,
      // not by this camera probe. No geometry rebuild or collision mutation.
      root.updateWorldMatrix(true,true);
      hits.length=0;
      raycaster.intersectObject(root,true,hits);
      realTrianglesChecked+=hits.length;
      if(hits.some(hit=>renderedTriangle(hit,root))){blocked=true;break;}
    }
    hits.length=0;
    if(blocked){if(sample===3)blockedGatewayRays++;else blockedBodyRays++;}
  }
  return {active:true,rays,bodyBlockedRays:blockedBodyRays,
    gatewayBlockedRays:blockedGatewayRays,
    score:blockedBodyRays*2+blockedGatewayRays,
    actualTriangleIntersections:realTrianglesChecked,
    limitation:'Source-owned real Three.js platform triangle rays, NOT native pixels, supported-device FPS, or permission to move a collider'};
}
