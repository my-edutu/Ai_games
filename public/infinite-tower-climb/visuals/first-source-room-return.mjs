// P0 original F8->F9 first native episode evidence ownership.
// Capture the FIRST successful source-bound Floor9 WebGL return for a run,
// and never replace that evidence when an autonomous episode restarts.
// This is a read-only eligibility policy, not a gameplay or pixel verdict.
export function firstReturnedOriginalRoomAdmission(firstEpisodeRun, source, returned) {
  if(firstEpisodeRun!==null &&
      (typeof firstEpisodeRun!=='string'||!firstEpisodeRun))return null;
  if(source?.floor!==9 || source.theme!=='void' ||
      source.lifecycle!=='running' || !(source.player?.health>0) ||
      typeof source.runToken!=='string'||!source.runToken ||
      !Number.isSafeInteger(source.tick) ||
      returned?.sourceBound!==true ||
      returned.runToken!==source.runToken ||
      returned.sourceTick!==source.tick ||
      (returned.originalOwnerPresent!==true &&
       returned.successorOwnerPresent!==true))return null;
  // A second legitimate completion is NOT the first recorded crossing.
  // Never clear the original returned-frame ledger or mix two run tokens.
  if(firstEpisodeRun!==null && firstEpisodeRun!==source.runToken)return null;
  return {runToken:source.runToken,isFirst:firstEpisodeRun===null};
}
