// Bounded read-only witness for actual first-F9 renderer returns. No camera or source mutations.
export function createFloorNineCameraReturnAudit({sourceTick,previousTick,previousReturnPerfMs,previousCamera,previousFocus,previousFov,previousHero,hero,dt}){
  const finiteVec=v=>Array.isArray(v)&&v.length===3&&v.every(Number.isFinite);
  if(!Number.isSafeInteger(sourceTick)||!Number.isSafeInteger(previousTick)||
    sourceTick<previousTick||!Number.isFinite(previousReturnPerfMs)||
    ![previousCamera,previousFocus,previousHero,hero].every(finiteVec)||
    !Number.isFinite(previousFov)||!Number.isFinite(dt)||dt<0)return null;
  const labels=['before-departure','after-departure','after-joint','final-after-scale'];
  const stages=[];
  const round=n=>+n.toFixed(4);
  const vector=v=>v.map(round);
  const distance=(a,b)=>Math.hypot(...a.map((v,i)=>v-b[i]));
  const previous={camera:previousCamera.slice(),focus:previousFocus.slice(),fov:previousFov};
  const heroDelta=distance(previousHero,hero);
  let valid=true;
  return {
    checkpoint(label,camera,focus,fov,outcome){
      if(!valid||label!==labels[stages.length]||!finiteVec(camera)||!finiteVec(focus)||
        !Number.isFinite(fov)||typeof outcome!=='string'||outcome.length>160){
        valid=false;return;
      }
      stages.push({label,camera:camera.slice(),focus:focus.slice(),fov,outcome});
    },
    finish(returnedPerfMs){
      if(!valid||stages.length!==labels.length||!Number.isFinite(returnedPerfMs)||
        returnedPerfMs<previousReturnPerfMs)return null;
      let from=previous;
      const checkpoints=stages.map(stage=>{
        const result={label:stage.label,outcome:stage.outcome,
          camera:vector(stage.camera),focus:vector(stage.focus),fov:round(stage.fov),
          cameraDeltaFromPriorReturn:round(distance(stage.camera,previous.camera)),
          cameraDeltaFromPriorCheckpoint:round(distance(stage.camera,from.camera)),
          focusDeltaFromPriorCheckpoint:round(distance(stage.focus,from.focus)),
          fovDeltaFromPriorCheckpoint:round(stage.fov-from.fov)};
        from=stage;return result;
      });
      return {sourceTick,previousTick,sourceTickGap:sourceTick-previousTick,
        returnGapMs:round(returnedPerfMs-previousReturnPerfMs),cameraDtSeconds:round(dt),
        heroDeltaMetres:round(heroDelta),previousCamera:vector(previous.camera),
        previousFocus:vector(previous.focus),previousFov:round(previous.fov),
        checkpoints,limitation:'Returned renderer decision trace, not native pixel correspondence, GPU FPS or acceptance'};
    }
  };
}
