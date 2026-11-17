// P0 first authentic F8->F9 shot: an old rendered camera can put the hero
// and open gate inside NDC while seeing them through real bronze panels.
// Compare the SAME source-owned physical triangle samples on both proposed
// cameras. This only vetoes presentation; gameplay, roof, HP and passage
// remain the authority. A partially obstructed but unchanged lens is not a
// physical improvement, and a clear body must not lose its gateway.
const keys=Object.freeze([
  'bodyBlockedRays','gatewayBlockedRays','originalGateBlockedRays',
  'originalCapBlockedBodyRays','originalCapBlockedGatewayRays',
  'architectureBlockedRays'
]);
const sane=v=>v?.active===true &&
  Number.isSafeInteger(v.rays) && v.rays>=3 && v.rays<=9 &&
  Number.isSafeInteger(v.score) && v.score>=0 &&
  keys.every(k=>Number.isSafeInteger(v[k]) && v[k]>=0 &&
    v[k]<=v.rays) &&
  v.bodyBlockedRays+v.gatewayBlockedRays<=v.rays &&
  v.score===v.bodyBlockedRays*2+v.gatewayBlockedRays &&
  v.originalCapBlockedBodyRays<=v.bodyBlockedRays &&
  v.originalCapBlockedGatewayRays<=v.gatewayBlockedRays &&
  v.originalGateBlockedRays<=v.bodyBlockedRays &&
  v.architectureBlockedRays<=v.bodyBlockedRays+v.gatewayBlockedRays;

export function assessOriginalGatewayPhysicalCameraBridge(before,after){
  if(!sane(before)||!sane(after)||before.rays!==after.rays)
    return {allowed:false,reason:'missing-or-incomparable-source-triangles',gain:0};
  // No newly occluded skinned shoulder, source doorway or first-F9
  // structural owner may be traded for a tidier 2D composition.
  if(keys.some(k=>after[k]>before[k]) || after.score>before.score)
    return {allowed:false,reason:'physical-occlusion-regression',gain:0};
  if(after.score>0 && after.score===before.score)
    return {allowed:false,reason:'no-physical-sightline-improvement',gain:0};
  return {allowed:true,reason:after.score===0?
    'actual-geometry-clear':'actual-geometry-improved',
    gain:before.score-after.score};
}
