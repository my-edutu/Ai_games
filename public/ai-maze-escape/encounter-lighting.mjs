// Cinematic light targets consume only the CURRENT, published encounter beat.
// The stage lights already exist in scene.js; no new light, shadow map,
// geometry or simulation input is created by this presentation contract.
const within = value => Number.isFinite(value)
  ? Math.max(0, Math.min(1, value)) : 0;
export const NORMAL_MAZE_LIGHTING = Object.freeze({sky:1.42,sun:2.90,rim:1.04,lantern:2.10});

export function publicEncounterLighting({guardianStrength=0,guardianBeat=0,
  pressureStrength=0,pressureProgress=0,terminal=false,reducedMotion=false}={}) {
  if(terminal || reducedMotion) return {...NORMAL_MAZE_LIGHTING};
  // No proximity alone invents a strike; the guardian must have an ACTUAL
  // disclosed warning phase. The real pressure shutter is separately sourced
  // from the observed public mechanism, never a hidden trap or AI intention.
  const guardian=within(guardianStrength)*within(guardianBeat);
  const pressure=within(pressureStrength);
  const closing=within(pressureProgress);
  const stage=Math.max(guardian,pressure*.7);
  return {
    sky:NORMAL_MAZE_LIGHTING.sky-.25*stage,
    sun:NORMAL_MAZE_LIGHTING.sun-.65*stage,
    rim:NORMAL_MAZE_LIGHTING.rim+.65*guardian+.22*pressure,
    lantern:NORMAL_MAZE_LIGHTING.lantern+.70*guardian+.58*pressure*(.45+.55*closing)
  };
}

export function easePublicEncounterLighting(current,target,elapsedSeconds) {
  const elapsed=Number.isFinite(elapsedSeconds)
    ? Math.max(0, Math.min(.8, elapsedSeconds)) : 0;
  // Smooth 3D shadows and material transitions without photosensitive flashes.
  // At a reset/terminal snapshot the same bounded ease returns to neutral.
  const fraction=1-Math.exp(-3.2*elapsed);
  return Object.fromEntries(Object.keys(NORMAL_MAZE_LIGHTING).map(key=>{
    const value=Number.isFinite(current?.[key])?current[key]:NORMAL_MAZE_LIGHTING[key];
    const desired=Number.isFinite(target?.[key])?target[key]:NORMAL_MAZE_LIGHTING[key];
    return [key,value+(desired-value)*fraction];
  }));
}
