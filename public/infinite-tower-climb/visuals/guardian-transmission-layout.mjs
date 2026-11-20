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
 // Original 43015360203 portrait WebM and original Three.js triangle owners
 // show the old y=0..4.7 counterweight rail repeatedly covering the live
 // guardian, gate approach and real combat platform. Hoist the entire twin
 // source-HP transmission gallery above the 0..4.8m pedestrian opening;
 // retain the same outboard bearing, visible source damage and door mechanics.
 // At maximum authentic opening the hanging weights still stop above y=5.
 // The 1.40m bronze weight slides down 2.35m on genuine source HP0.
  // The original steel guide ends at y=5.105m (>5.1m combat clearance),
  // contains the full source-open bronze load's lower edge at 5.11m,
  // and reaches the real overhead bearing without shortening the stroke.
  railCenterY:7.77,railHeight:5.33,weightCenterY:8.16,socketY:8.85,
 cameraLowerY:5.0,cameraTopY:11.40,sourceGateCenterY:2
});
// The original source-visible winch now has one connected, rear outboard
// storage bay on each side. Guide center aligns with the ACTUAL rotated
// original lattice centroid at max source winch (-4.19m rear Z), rather
// than the former -3.42m guide that the fully opened metal missed.
// Physical guide geometry lives above the 5m
// climber/guardian walking opening; only original noncolliding guide steel
// is repositioned. Real HP, source lock, colliders and motion are untouched.
export function originalGuardianHoistPocketLoadPath() {
  return Object.freeze([-1,1].map(side=>Object.freeze({
    side,x:side*7.15,z:-4.10,centerY:7.83,topY:10.31,
    width:.20,height:4.96,depth:.20,crownWidth:.60,
    crownAttachX:side*5.15,crownAttachZ:-1.2
  })));
}

export function observedGuardianTransmissionCorners(lockCenter) {
 if(!lockCenter||![lockCenter.x,lockCenter.y,lockCenter.z].every(Number.isFinite))return null;
 const radius=Math.hypot(lockCenter.x,lockCenter.z),d=GUARDIAN_TRANSMISSION_LAYOUT;
 if(radius<=Math.abs(d.rearDepth)+1)return null;
 const angle=Math.atan2(lockCenter.x,lockCenter.z),r=radius+d.rearDepth;
 const x=Math.sin(angle)*r,z=Math.cos(angle)*r,y=lockCenter.y-d.sourceGateCenterY;
 const corners=[];
 for(const side of [-1,1])for(const top of [false,true]){
   const t=side*d.cameraHalfWidth;
   corners.push({x:x+Math.cos(angle)*t,y:y+(top?d.cameraTopY:d.cameraLowerY),z:z-Math.sin(angle)*t});
 }
 return corners;
}
