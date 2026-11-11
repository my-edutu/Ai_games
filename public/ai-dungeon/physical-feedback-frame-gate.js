/**
 * Pure D04 submission decision; never infers physical contact, damage or a
 * perpetrator. Production retained visuals supply an actual live-slot check.
 * Null liveness supports older injected test adapters without this interface.
 */
export function classifySubmittedCombatAudio({
 sceneMatches=false,observedFrameVerified=false,elapsedSeconds,
 submissionSeconds,maxStalenessSeconds=.40,visualAccepted=false,visualAlive=null,
 visualDrawable=null,requiresMeasuredBlade=false,
 allowVerifiedSoundOnlyImpact=false
}={}){
 if(!sceneMatches)return 'scene-changed';
 if(!observedFrameVerified||!Number.isFinite(elapsedSeconds)||elapsedSeconds<0||
   !Number.isFinite(submissionSeconds)||submissionSeconds<0||
   !Number.isFinite(maxStalenessSeconds)||maxStalenessSeconds<=0)return 'unverified-frame';
 if(elapsedSeconds+submissionSeconds>maxStalenessSeconds)return 'stale-frame';
 // An unmounted/stale weapon rig cannot justify a synchronized sword whoosh.
 // Neutral event and genuine HP audio may remain sound-only; accessibility
 // suppresses the trail deliberately in reduced-motion mode.
 if(requiresMeasuredBlade&&!visualAccepted)return 'missing-measured-blade';
 if(visualAccepted&&visualAlive===false)return 'expired-visual';
 // A drawable blade demands affirmative evidence from BOTH production
 // retained-slot queries. Legacy adapters may omit them, but absence of
 // proof must never authorize physical sword passage audio.
 if(requiresMeasuredBlade&&visualAlive!==true)return 'unverified-blade-visual';
 // A live but hidden sword ribbon is not a submitted moving blade.
 // A consecutive, authority-confirmed HP loss is independently visible in
 // the real unit/health state. Its original impact may sound on a timely
 // submitted frame even when its retained shard is occluded/non-drawable.
 // Never extend this exemption to sword attempts, guards, warnings or shots.
 if(visualAccepted&&visualDrawable===false&&!allowVerifiedSoundOnlyImpact)
  return 'await-drawable-visual';
 if(requiresMeasuredBlade&&visualDrawable!==true)return 'unverified-blade-visual';
 return 'deliver';
}
