// The actual 1x F8->9 footage shows a giant opaque violet upper-deck
// undercroft between the opened original guardian gateway and living hero.
// Preserve the SAME full-width, source-collision-aligned upper walkable roof.
// Replace only passive lower steel with two load-bearing edge rails and an
// airy triangulated web. All transforms are deterministic source deck space.
export function planVoidOpenDeckTruss(platform, worldWidth, arc=2.2) {
  const integer=Number.isSafeInteger;
  if(!platform || !/^f9:p[0-9]+$/.test(platform.id??'') ||
     ![platform.x,platform.width,platform.y,platform.height,worldWidth].every(integer) ||
     platform.width<16000 || platform.width>worldWidth ||
     platform.x<0 || platform.x+platform.width>worldWidth ||
     worldWidth<=0 || !Number.isFinite(arc) || arc<=0 || arc>Math.PI) return null;
  const angle=platform.width/worldWidth*arc;
  if(angle<.045 || angle>Math.PI)return null;
  const innerRail=Object.freeze([22.45,22.88]);
  const outerRail=Object.freeze([26.65,27.05]);
  const stations=angle>=.38?5:angle>=.22?4:3;
  const anchors=Array.from({length:stations},(_,i)=>
    -angle*.42 + angle*.84*i/(stations-1));
  return {
    sourcePlatformId:platform.id,nonColliding:true,
    innerRail,outerRail,angle,anchors,
    radialOpenSpan:outerRail[0]-innerRail[1],
    topFootprintUnchanged:true,
    loadPath:'two-edge-rails-plus-connected-triangulated-cross-ribs'
  };
}
