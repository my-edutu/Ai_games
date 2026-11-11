// Single authored, non-colliding guardian transmission gallery: real world
// placement and source-observed camera share these actual physical dimensions.
// Original normal-speed 9a0d1842 source film shows bulky foreground rails and
// counterweights obscuring both combatants. Stage them outboard, further rear,
// above combat; observe the true enlarged side gallery in the camera policy.
// Actual guardian HP and door physics are unchanged.
// The AI, gate collision, HP, crusher and real floor crossing are untouched.
export const GUARDIAN_TRANSMISSION_LAYOUT = Object.freeze({
 counterweightX:10.7,rearDepth:-3.25,overheadY:10.35,
 capstanY:10.70,beamWidth:22.2,cameraHalfWidth:11.4,
 cameraTopY:11.40,sourceGateCenterY:2
});
export function observedGuardianTransmissionCorners(lockCenter) {
 if(!lockCenter||![lockCenter.x,lockCenter.y,lockCenter.z].every(Number.isFinite))return null;
 const radius=Math.hypot(lockCenter.x,lockCenter.z),d=GUARDIAN_TRANSMISSION_LAYOUT;
 if(radius<=Math.abs(d.rearDepth)+1)return null;
 const angle=Math.atan2(lockCenter.x,lockCenter.z),r=radius+d.rearDepth;
 const x=Math.sin(angle)*r,z=Math.cos(angle)*r,y=lockCenter.y-d.sourceGateCenterY;
 const corners=[];
 for(const side of [-1,1])for(const top of [false,true]){
   const t=side*d.cameraHalfWidth;
   corners.push({x:x+Math.cos(angle)*t,y:y+(top?d.cameraTopY:0),z:z-Math.sin(angle)*t});
 }
 return corners;
}
