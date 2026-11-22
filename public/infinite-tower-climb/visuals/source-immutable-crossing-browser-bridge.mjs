// P0 native first-F9 cold WebGL: a recorded, immutable HP-zero crossing is
// STRONGER evidence than an absent record. Preserve the actual prior cap/GPU
// gateway across a <=20-tick sparse HTTP-to-WebGL observation interval, if
// and only if the original two source snapshots and the immutable guardian
// record agree on the same physical sill. This grants no floor, collision,
// gameplay event, rendered frame, or claim about composited native pixels.
const safe=Number.isSafeInteger;
export function observedImmutableCrossingSparseBrowserBridge(previous,next,cap,ground,threshold) {
  const w=next?.lastGuardianCrossing,g=w?.guardian,c=w?.cap;
  const elapsed=next?.tick-previous?.tick;
  if(previous?.floor!==8 || previous.theme!=='clockwork' ||
     next?.floor!==9 || next.theme!=='void' || next.lifecycle!=='running' ||
     typeof next.runToken!=='string' || !next.runToken ||
     previous.runToken!==next.runToken ||
     ![previous.tick,next.tick,elapsed,w?.sourceTick,w?.exitX,
       cap?.x,cap?.y,cap?.width,cap?.height,
       c?.x,c?.y,c?.width,c?.height,
       ground?.y,ground?.height,threshold].every(safe) ||
     elapsed<1 || elapsed>20 || w.sourceTick<=previous.tick ||
     w.sourceTick>next.tick || w.runToken!==next.runToken ||
     w.fromFloor!==8 || w.toFloor!==9 ||
     cap.id!=='f8:cap' || c.id!==cap.id ||
     ground.id!=='f9:ground' || cap.width<=0 || cap.height<=0 ||
     c.x!==cap.x || c.y!==cap.y ||
     c.width!==cap.width || c.height!==cap.height ||
     cap.y+cap.height!==ground.y+ground.height ||
     threshold!==cap.x+Math.floor(cap.width*.76) ||
     w.exitX!==threshold ||
     g?.kind!=='guardian' || g.active!==false ||
     !Number.isFinite(g.health) || g.health>0 ||
     !previous.enemies?.some(enemy=>enemy?.kind==='guardian' &&
       enemy.active===false && enemy.health<=0) ||
     previous.player?.grounded!==true ||
     previous.player.groundedPlatformId!==cap.id ||
     next.player?.grounded!==true ||
     next.player.groundedPlatformId!==ground.id)
    return null;
  return {sourceBound:true,sourceTick:w.sourceTick,maxSparseTicks:20,
    proof:'same-run-immutable-hp0-original-roof-crossing',
    limitation:'Source evidence only; unchanged original GPU geometry must still be present'};
}
