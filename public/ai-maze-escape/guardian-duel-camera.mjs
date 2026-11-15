// Original 3D camera direction only. The caller has independently required
// a currently disclosed, reciprocal, unlocked guardian encounter in Follow.
// This helper does not observe hidden cells, simulation rules or an actor's
// destination. It only interprets the same witnessed performance clock.
export function publicGuardianDuelCameraElevation(aspect,strength,beat,reducedMotion=false){
  const neutral=21;
  if(reducedMotion || !Number.isFinite(aspect) || aspect<.35 || aspect>=.60
    || !Number.isFinite(strength) || strength<=.70
    || !Number.isFinite(beat) || beat<=0 || beat>1)return neutral;
  // Exact-source Pass329 390px brace/release frames still view the shell and
  // Pip's planted boots mostly from above; the four linked court signals
  // hide their physical warning profile. Make the already WITNESSED warning
  // -> brace -> release an authored three-quarter LOWER reveal, not a new
  // event or private-map camera request. Its 21 -> 13.57 -> 11.5 elevation
  // is smooth, bounded and stable at full release. Native physical full-body
  // +/- .95 and HUD occlusion gates must approve the actual scene, not us.
  // No zoom, altered actor roots, renderer resources or game authority.
  const attention=Math.max(0,Math.min(1,(strength-.70)/.10));
  const t=Math.max(0,Math.min(1,(beat-.07)/.60));
  const reveal=t*t*(3-2*t);
  return neutral-9.5*attention*reveal;
}

// Source-bound, full-mesh portrait pairing. The host already proved a
// disclosed, reciprocal and open encounter before passing the two FULL
// connected actor bounds measured from the actual current WebGL camera.
// Negative evidence (clipped, missing, invalid, reduced motion) never zooms.
export function publicGuardianPhysicalCloseupHalfHeight(
  aspect,strength,baselineHeight,currentHeight,bodies,reducedMotion=false){
  if(reducedMotion || !Number.isFinite(aspect) || aspect<.35 || aspect>=.60
    || !Number.isFinite(strength) || strength<=.70
    || !Number.isFinite(baselineHeight) || baselineHeight<=0
    || !Number.isFinite(currentHeight) || currentHeight<=0
    || !Array.isArray(bodies) || bodies.length!==2)return currentHeight;
  for(const b of bodies){
    if(!b || !['left','right','bottom','top'].every(k=>Number.isFinite(b[k]))
      || b.left>=b.right || b.bottom>=b.top
      || b.left<=-.95 || b.right>=.95 || b.bottom<=-.95 || b.top>=.95)
      return currentHeight;
  }
  const horizontal=Math.max(...bodies.map(b=>Math.max(Math.abs(b.left),Math.abs(b.right))));
  const top=Math.max(0,...bodies.map(b=>b.top));
  const bottom=Math.max(0,...bodies.map(b=>-b.bottom));
  // Stricter than native +/- .95: width reserves .12 NDC for safe headroom,
  // +.70 protects the mobile mission chip, -.84 protects real bottom controls.
  // The 0.79 cap forbids an abrupt, unnatural extreme zoom. No model scaling.
  const safe=Math.max(baselineHeight*.79,currentHeight*horizontal/.88,
    currentHeight*top/.70,currentHeight*bottom/.84);
  return Number.isFinite(safe)?Math.min(currentHeight,safe):currentHeight;
}

/**
 * Source-witnessed guardian over-the-shoulder composition. The approved
 * actor-axis orbit keeps both actors onscreen at warning, but original
 * unaltered 390px brace/release WebGL compressed them into ONE silhouette.
 * On that same witnessed clock, reveal the two opposed physical bodies by
 * easing a little back toward the normal diorama azimuth. This never moves
 * an actor or authorizes a private guardian/camera, new route or collider.
 */
export function publicGuardianDuelShoulderOrbit(aspect,strength,beat,currentOrbit,reducedMotion=false){
  if(reducedMotion || !Number.isFinite(aspect) || aspect<.35 || aspect>=.60
    || !Number.isFinite(strength) || strength<=.70
    || typeof beat!=='number' || !Number.isFinite(beat) || beat<=0 || beat>1
    || !Number.isFinite(currentOrbit) || Math.abs(currentOrbit)<.03)return 0;
  const attention=Math.max(0,Math.min(1,(strength-.70)/.10));
  const t=Math.max(0,Math.min(1,(beat-.16)/.57));
  if(t<=0)return 0;
  const reveal=t*t*(3-2*t);
  // Pass338 exact Pass337 390px WebGL brace still merges the guardian shell
  // with Pip into a near-vertical column. At the same PUBLIC brace and shell
  // release, open up the opposed three-quarter shot rather than repainting
  // yet another static terrace. Pass338's 0.66rad overshot the original
  // native Follow lens depth contract (>0.20rad orbit) and timed out the
  // uncropped 390px WebGL capture. Pass339 holds at most 0.52rad while
  // retaining at least 33% of the authentic original actor-axis orbit.
  // No camera-side reversal. The existing exact full-body NDC
  // fitter, pressure priority and native 44px HUD tests remain authoritative.
  return -Math.sign(currentOrbit)*Math.min(.52,Math.abs(currentOrbit)*.67)*attention*reveal;
}


// Pass384: published-geometry guardian sightline director. This is deliberately
// a VIEW selection, not a cutaway, collider edit, AI hint, or new route.
// Only CURRENTLY visible public solid tile/edge evidence may steer the lens;
// unknown cells have no geometric identity here and cannot authorize a turn.
export function publicGuardianPublishedWallAvoidance(
  s,hero,guardian,target,offset,orbit,aspect,strength,beat,reducedMotion=false) {
  const SIZE=2.4;
  if(reducedMotion || !s || s.lifecycle!=='running' || s.result
    || !Number.isFinite(aspect)||aspect<.35||aspect>=.60
    || !Number.isFinite(strength)||strength<=.70
    || !Number.isFinite(beat)||beat<.20||beat>1
    || !Number.isFinite(orbit)||Math.abs(orbit)<.25
    || !Number.isSafeInteger(s.width)||s.width<2
    || !Number.isSafeInteger(s.height)||s.height<2
    || !Number.isSafeInteger(s.currentCell)
    || !Number.isSafeInteger(guardian?.cell)
    || !Array.isArray(s.visibleCells)||!Array.isArray(s.cells)
    || !Array.isArray(s.doors)||!Array.isArray(s.threats)
    || !s.threats.some(t=>t.cell===guardian.cell))return 0;
  const finitePoint=p=>p && Number.isFinite(p.x)&&Number.isFinite(p.z);
  if(!finitePoint(hero)||!finitePoint(guardian)||!finitePoint(target)||!finitePoint(offset))return 0;
  const visible=new Set(s.visibleCells);
  if(!visible.has(s.currentCell)||!visible.has(guardian.cell))return 0;
  const known=new Map(s.cells.filter(c=>visible.has(c?.cell)
    &&Number.isSafeInteger(c.cell)).map(c=>[c.cell,c]));
  const here=known.get(s.currentCell),other=known.get(guardian.cell);
  if(!here||here.blocked||!other||other.blocked)return 0;
  const solid=(a,b)=>{
    if(a===b||a<0||b<0)return 0;
    const first=known.get(a),second=known.get(b);
    if(!first||!second)return 0;
    if(first.blocked||second.blocked)return 1;
    if(s.doors.some(d=>((d.a===a&&d.b===b)||(d.b===a&&d.a===b))
      &&d.open===false))return 1;
    return Array.isArray(first.neighbors)&&Array.isArray(second.neighbors)
      &&first.neighbors.includes(b)&&second.neighbors.includes(a)?0:1;
  };
  // Exact grid-edge traversal, not fixed-step samples that can skip corners
  // and falsely claim a diagonal wall crossing. Unknown traversals are
  // counted only as a veto against introducing *more* undisclosed foreground.
  const evidence=(viewX,viewZ)=>{
    let walls=0,unknown=0;
    for(const actor of [hero,guardian]){
      const ax=target.x+viewX,az=target.z+viewZ;
      const dx=actor.x-ax,dz=actor.z-az;
      if(Math.abs(dx)+Math.abs(dz)<.0001)continue;
      let col=Math.floor(ax/SIZE+s.width/2),row=Math.floor(az/SIZE+s.height/2);
      const stepX=Math.sign(dx),stepZ=Math.sign(dz);
      const firstX=(col+(stepX>0?1:0)-s.width/2)*SIZE;
      const firstZ=(row+(stepZ>0?1:0)-s.height/2)*SIZE;
      let nextX=stepX?Math.max(0,(firstX-ax)/dx):Infinity;
      let nextZ=stepZ?Math.max(0,(firstZ-az)/dz):Infinity;
      const deltaX=stepX?SIZE/Math.abs(dx):Infinity;
      const deltaZ=stepZ?SIZE/Math.abs(dz):Infinity;
      const id=(c,r)=>c<0||r<0||c>=s.width||r>=s.height?-1:r*s.width+c;
      let last=id(col,row);
      for(let crossings=0;crossings<2*(s.width+s.height)+8;crossings++){
        const t=Math.min(nextX,nextZ);
        if(t>1||!Number.isFinite(t))break;
        if(nextX<nextZ){col+=stepX;nextX+=deltaX;}
        else {row+=stepZ;nextZ+=deltaZ;}
        const current=id(col,row);
        if(last>=0&&current>=0){
          if(!known.has(last)||!known.has(current))unknown++;
          else if(solid(last,current))walls++;
        }
        last=current;
      }
    }
    return {walls,unknown};
  };
  const original=evidence(offset.x,offset.z);
  if(original.walls<1)return 0;
  const spread=(x,z)=>Math.abs(
    (guardian.x-hero.x)*z-(guardian.z-hero.z)*x)/Math.hypot(x,z);
  const baselineSpread=spread(offset.x,offset.z);
  let best=0,bestWalls=original.walls;
  // A bounded six-angle source-visible search, preferring smaller swings.
  // Preserve the original actor-axis side and a non-stacked pair profile.
  for(const delta of [-.12,.12,-.24,.24,-.36,.36]){
    if(Math.sign(orbit+delta)!==Math.sign(orbit)||Math.abs(orbit+delta)<.25
      ||Math.abs(orbit+delta)>1.05)continue;
    const c=Math.cos(delta),q=Math.sin(delta);
    const x=offset.x*c-offset.z*q,z=offset.x*q+offset.z*c;
    if(spread(x,z)<baselineSpread*.78)continue;
    const e=evidence(x,z);
    if(e.unknown>original.unknown||e.walls>=bestWalls)continue;
    best=delta;bestWalls=e.walls;
  }
  // Real witnessed brace only; eased angular correction, no snap or teleport.
  const reveal=Math.max(0,Math.min(1,(beat-.20)/.28));
  return best*reveal*reveal*(3-2*reveal);
}
