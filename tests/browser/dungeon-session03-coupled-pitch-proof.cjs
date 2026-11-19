'use strict';
/** Evidence-only: the exact, genuinely source-skinned 150ms licensed
 * three-joint pitch. NOT gameplay, foot locking, IK or visual acceptance.
 * The weighted toe still penetrates the dungeon floor by >60mm.
 */
function certifyOriginalSource150msThreeJointPitch({proof,coupled,before,after}={}){
 const finite=n=>typeof n==='number'&&Number.isFinite(n);
 if(!proof||!coupled||!before||!after||
  proof.sourceClip!=='Walking_A'||coupled.sourceClip!=='Walking_A'||
  typeof proof.sourceInstanceId!=='string'||!proof.sourceInstanceId||
  proof.contactLocked!==false||coupled.contactLocked!==false||
  proof.oppositeShoePreserved!==true||coupled.oppositeShoePreserved!==true||
  proof.finalIndependentSourceSkin!==true||
  coupled.finalIndependentSourceSkin!==true||
  proof.originalWorldSolePitchAxisVerified!==true||
  coupled.source!=='measured-original-skinned-coupled-knee-foot'||
  coupled.sourceJointCount!==3||
  ![coupled.upperRad,coupled.lowerRad,coupled.footRad,coupled.toeRad,
   proof.witnessedSourceWeight,proof.witnessedFrameIntervalSeconds,
   proof.witnessedRootTravelMeters,proof.witnessedRootTravelAgeSeconds,
   before.toeY,before.heelY,after.toeY,after.heelY].every(finite)||
  Math.abs(coupled.upperRad+.11)>1e-6||
  Math.abs(coupled.lowerRad-.11)>1e-6||
  Math.abs(coupled.footRad-.24)>1e-6||
  Math.abs(coupled.toeRad)>1e-6||
  proof.witnessedSourceWeight<.99||
  proof.witnessedFrameIntervalSeconds<.145||
  proof.witnessedFrameIntervalSeconds>.155||
  proof.witnessedRootTravelMeters<.008||
  proof.witnessedRootTravelMeters>.24||
  proof.witnessedRootTravelAgeSeconds<0||
  proof.witnessedRootTravelAgeSeconds>.15||
  !Number.isInteger(proof.sourceProbeCount)||
  proof.sourceProbeCount<1||proof.sourceProbeCount>4)return null;
 const floor=-.02,burial=floor-before.toeY,heelAbove=before.heelY-floor;
 const toeLift=after.toeY-before.toeY;
 const heelRise=after.heelY-before.heelY;
 const gain=toeLift-heelRise;
 if(burial<.077||burial>.082||heelAbove<.21||heelAbove>.23||
  toeLift<.015||toeLift>.017||heelRise<0||heelRise>.014||
  gain<.0025||after.toeY>=floor)return null;
 return Object.freeze({
  source:'observed-original-150ms-three-joint-weighted-skin',
  toeLiftMeters:toeLift,heelRiseMeters:heelRise,
  relativePitchGainMeters:gain,
  remainingToeBurialMeters:floor-after.toeY,
  originalSourceInstanceId:proof.sourceInstanceId,
  finalIndependentSourceSkin:true,contactLocked:false,plantCertified:false
 });
}
module.exports={certifyOriginalSource150msThreeJointPitch};
