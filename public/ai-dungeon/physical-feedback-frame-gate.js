/**
 * Pure D04 submission decision; never infers physical contact, damage or a
 * perpetrator. Production retained visuals supply an actual live-slot check.
 * Null liveness supports older injected test adapters without this interface.
 */
export function classifySubmittedCombatAudio({
 sceneMatches=false,observedFrameVerified=false,elapsedSeconds,
 submissionSeconds,maxStalenessSeconds=.40,visualAccepted=false,visualAlive=null
}={}){
 if(!sceneMatches)return 'scene-changed';
 if(!observedFrameVerified||!Number.isFinite(elapsedSeconds)||elapsedSeconds<0||
   !Number.isFinite(submissionSeconds)||submissionSeconds<0||
   !Number.isFinite(maxStalenessSeconds)||maxStalenessSeconds<=0)return 'unverified-frame';
 if(elapsedSeconds+submissionSeconds>maxStalenessSeconds)return 'stale-frame';
 if(visualAccepted&&visualAlive===false)return 'expired-visual';
 return 'deliver';
}
