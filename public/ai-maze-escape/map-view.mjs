/**
 * Only a previously disclosed key actually collected in the SAME public run
 * and present in the authoritative public inventory can trigger visual art.
 * No private topology, future prediction or synthetic pickup is allowed.
 */
export function publicKeyCollectionMoment(before, after) {
  if (!before || !after || typeof before.runToken !== 'string'
    || before.runToken !== after.runToken || before.result || after.result
    || !Number.isInteger(before.tick) || !Number.isInteger(after.tick)
    || after.tick <= before.tick || before.width !== after.width
    || before.height !== after.height || !Array.isArray(before.keys)
    || !Array.isArray(after.keys) || !Array.isArray(before.cells)
    || !Array.isArray(after.inventory)) return null;
  const knownBefore = new Set(before.cells.map(cell => cell?.cell));
  const afterById = new Map(after.keys.map(key => [key.id, key]));
  const real = before.keys.filter(key =>
    typeof key?.id === 'string' && !!key.id
    && Number.isInteger(key.cell) && key.cell >= 0
    && key.cell < before.width * before.height
    && knownBefore.has(key.cell) && key.collected === false
    && afterById.get(key.id)?.collected === true
    && afterById.get(key.id)?.cell === key.cell
    && after.inventory.includes(key.id));
  if (!real.length) return null;
  real.sort((a,b) => a.id.localeCompare(b.id));
  return {id:real[0].id,cell:real[0].cell};
}
export const MAX_TRAIL = 240;
const clamp = (value, min, max) => Math.max(min, Math.min(max, value));

/**
 * Camera-only composition for the ACTUAL visible, published pressure hazard.
 * The 2026-11-05 native 390x844 WebGL trap PNG exposed a real physical
 * right-edge crop (+1.082 NDC) despite Pip remaining centered. The public
 * trap and Pip deserve one shared stage, not a hidden-data-informed map pan.
 *
 * Strict inputs: only a current published non-blocked trap in visibleCells,
 * and the public interpolated hero position. Never consult secret seeds,
 * private-map fields, AI plans or future traps. Return a bounded continuous
 * pan fraction, not a gameplay command, a camera zoom or an invented event.
 * Detail, overview, landscape, and non-portrait layouts are untouched.
 */
/**
 * Native 320/390 pressure gameplay showed the actual jaws in the top-right
 * while a merely known closed gate dictated the camera (and occupied the
 * foreground). Once Pip is genuinely beside a CURRENTLY VISIBLE trap, the
 * immediate physical danger deserves the shared shot rather than the stale
 * gate portrait. This selects only a cosmetic Follow camera, never AI intent.
 *
 * Validate the original published cells/current cell AGAIN instead of
 * trusting a caller-supplied candidate. Witnessed gate opening, actual
 * guardian, pickup, terminal, hidden and manual camera always outrank it.
 */
export function publicPressureTakesFocus(snapshot, trap, cellSize, aspect,
  cameraMode = 'follow', hasGuardian = false, gateOpening = false, pickup = false) {
  if (!snapshot || snapshot.result || cameraMode !== 'follow'
    || hasGuardian || gateOpening || pickup
    || !(Number.isFinite(aspect) && aspect >= .35 && aspect < .60)
    || !(Number.isFinite(cellSize) && cellSize > 0)
    || !(Number.isFinite(trap?.distance) && trap.distance >= 0
      && trap.distance <= cellSize * 1.06)
    || !(Number.isFinite(trap?.weight) && trap.weight >= .34)
    || !Number.isSafeInteger(snapshot.width) || snapshot.width < 2
    || !Number.isSafeInteger(snapshot.height) || snapshot.height < 2
    || !Number.isSafeInteger(snapshot.currentCell)
    || snapshot.currentCell < 0
    || snapshot.currentCell >= snapshot.width * snapshot.height
    || !Number.isSafeInteger(trap.cell) || trap.cell < 0
    || trap.cell >= snapshot.width * snapshot.height
    || !Array.isArray(snapshot.cells)
    || !Array.isArray(snapshot.visibleCells)) return false;
  const known = snapshot.cells.find(cell => cell?.cell === trap.cell
    && cell.trap === true && cell.blocked !== true);
  if (!known || !snapshot.visibleCells.includes(trap.cell)) return false;
  const distance = Math.abs(trap.cell % snapshot.width
    - snapshot.currentCell % snapshot.width)
    + Math.abs(Math.floor(trap.cell / snapshot.width)
    - Math.floor(snapshot.currentCell / snapshot.width));
  return distance <= 1;
}


/**
 * Preserve a real publicly witnessed cardinal pressure confrontation through
 * its next diagonal withdrawal. Original tick-6 320px WebGL cut the physical
 * jaw at -1.290725 NDC when an unrelated known closed gate stole the camera.
 * This is presentation-only, NEVER generic diagonal discovery or AI authority.
 */
/**
 * Keep the LAST DISTINCT authoritative public tick as the renderer's
 * presentation predecessor. Real 320px same-source pressure chronology at
 * tick6 still cropped the complete jaw [-1.28288,-.6017] NDC because repeated
 * network polls of the SAME tick replaced the previous tick5 witness. This
 * helper retains exactly one real adjacent published tick, not an invented
 * frame, guessed route or private simulation state. A new run, skipped tick,
 * backwards tick or malformed public sample clears the optical witness.
 */
export function publicDistinctPublicPredecessor(prior, previous, current) {
  if (!previous || !current
    || typeof previous.runToken !== 'string' || !previous.runToken
    || previous.runToken !== current.runToken
    || !Number.isSafeInteger(previous.tick) || !Number.isSafeInteger(current.tick))
    return null;
  if (current.tick === previous.tick)
    return prior?.runToken === current.runToken
      && Number.isSafeInteger(prior.tick)
      && prior.tick === current.tick-1 ? prior : null;
  return current.tick === previous.tick+1 ? previous : null;
}

export function publicPressureWithdrawalTakesFocus(before, after, trap, cellSize, aspect,
  cameraMode='follow', guardian=false, opening=false, pickup=false) {
  if (!before || !after || before.result || after.result
    || typeof before.runToken!=='string' || !before.runToken
    || before.runToken!==after.runToken
    || !Number.isSafeInteger(before.tick) || !Number.isSafeInteger(after.tick)
    || after.tick<=before.tick || before.width!==after.width || before.height!==after.height
    || !Number.isSafeInteger(after.width) || after.width<2
    || !Number.isSafeInteger(after.height) || after.height<2
    || !Number.isSafeInteger(before.currentCell) || !Number.isSafeInteger(after.currentCell)
    || before.currentCell<0 || after.currentCell<0
    || before.currentCell>=after.width*after.height || after.currentCell>=after.width*after.height
    || cameraMode!=='follow' || guardian || opening || pickup
    || !(Number.isFinite(aspect) && aspect>=.35 && aspect<.60)
    || !(Number.isFinite(cellSize) && cellSize>0)
    || !Number.isSafeInteger(trap?.cell) || trap.cell<0
    || trap.cell>=after.width*after.height
    || !(Number.isFinite(trap.distance) && trap.distance>=0
      && trap.distance<=cellSize*1.82)
    || !(Number.isFinite(trap.weight) && trap.weight>=.34)) return false;
  const witnessed=state=>Array.isArray(state.cells)
    && Array.isArray(state.visibleCells) && state.visibleCells.includes(trap.cell)
    && state.cells.some(cell=>cell?.cell===trap.cell
      && cell.trap===true && cell.blocked!==true);
  if(!witnessed(before)||!witnessed(after))return false;
  const separation=(a,b)=>({
    x:Math.abs(a%after.width-b%after.width),
    z:Math.abs(Math.floor(a/after.width)-Math.floor(b/after.width))
  });
  const contact=separation(before.currentCell,trap.cell);
  const withdrawn=separation(after.currentCell,trap.cell);
  const step=separation(before.currentCell,after.currentCell);
  return contact.x+contact.z===1 && withdrawn.x===1 && withdrawn.z===1
    && step.x+step.z===1;
}

/**
 * Return a PRESENTATION partner for the one real 320px pressure withdrawal,
 * when an already-observed jaw remains in the known scene but a newly
 * discovered destination takes Pip outside the current trap-focus search.
 * Real Pass231 tick6 showed the physical jaw [-1.268,-.585] NDC while a
 * sealed gate stole the lens. This never queries private state, guesses an
 * upcoming move, makes a passage, or introduces a new hazard.
 *
 * Unlike ordinary live contact, a retreat is verified from TWO public
 * snapshots: a previously visible cardinally adjacent jaw, the next
 * authoritative grid step, the currently disclosed reciprocal connection,
 * and the same already-known trap. Previously seen is not a hidden tile.
 * The fixed .57 optical pan is the existing disclosed diagonal stage weight.
 */
export function publicVerifiedPressureRetreatPartner(before, after, cellSize, aspect,
  cameraMode='follow', guardian=false, opening=false, pickup=false) {
  if (!before || !after || before.result || after.result
    || typeof before.runToken!=='string' || !before.runToken
    || before.runToken!==after.runToken
    || !Number.isSafeInteger(before.tick) || !Number.isSafeInteger(after.tick)
    || after.tick!==before.tick+1
    || !Number.isSafeInteger(after.width) || after.width<2
    || !Number.isSafeInteger(after.height) || after.height<2
    || before.width!==after.width || before.height!==after.height
    || cameraMode!=='follow' || guardian || opening || pickup
    || !(Number.isFinite(aspect) && aspect>=.35 && aspect<.60)
    || !(Number.isFinite(cellSize) && cellSize>0)
    || !Array.isArray(before.cells) || !Array.isArray(after.cells)
    || !Array.isArray(before.visibleCells) || !Array.isArray(after.visibleCells)
    || !Array.isArray(before.doors) || !Array.isArray(after.doors)
    || !Number.isSafeInteger(before.currentCell) || !Number.isSafeInteger(after.currentCell))
    return null;
  const limit=after.width*after.height, from=before.currentCell, to=after.currentCell;
  if(from<0 || to<0 || from>=limit || to>=limit) return null;
  const distance=(a,b)=>({
    dx:Math.abs(a%after.width-b%after.width),
    dz:Math.abs(Math.floor(a/after.width)-Math.floor(b/after.width))
  });
  const step=distance(from,to);
  if(step.dx+step.dz!==1 || !after.visibleCells.includes(to)) return null;
  const current=new Map(after.cells.map(cell=>[cell?.cell,cell]));
  const source=new Map(before.cells.map(cell=>[cell?.cell,cell]));
  const start=current.get(from), end=current.get(to);
  const observedStart=source.get(from);
  const edgeClosed=state=>state.doors.some(d=>!d.open
    && ((d.a===from&&d.b===to)||(d.a===to&&d.b===from)));
  if(!start || !end || !observedStart
    || start.blocked || end.blocked || observedStart.blocked
    || !Array.isArray(start.neighbors) || !start.neighbors.includes(to)
    || !Array.isArray(end.neighbors) || !end.neighbors.includes(from)
    || edgeClosed(before) || edgeClosed(after))
    return null;
  const candidates=[];
  for(const cell of before.cells) {
    const id=cell?.cell, now=current.get(id), old=source.get(id);
    if(!Number.isSafeInteger(id) || id<0 || id>=limit
      || !old || old.trap!==true || old.blocked===true
      || !now || now.trap!==true || now.blocked===true
      || !before.visibleCells.includes(id)) continue;
    // The pressure sculpture was PHYSICALLY SEEN at one-cell distance
    // in the prior public frame. It need not be a walkable neighbor:
    // an open-route requirement here incorrectly discarded a genuine
    // wall-side mechanism and let a sealed gate crop the retreat shot.
    // The hero's actual from->to movement IS checked reciprocally above;
    // this visual camera partner grants no passage or attack cue.
    const contact=distance(from,id), withdrawn=distance(to,id);
    if(contact.dx+contact.dz!==1 || withdrawn.dx!==1 || withdrawn.dz!==1)
      continue;
    // A previously disclosed physical danger remains a lawful one-step
    // camera subject even if it has left the CURRENT vision set.
    // Never introduce a formerly unknown/undiscovered trap or blocked cell.
    candidates.push(id);
  }
  if(candidates.length!==1) return null;
  const id=candidates[0];
  return {cell:id,
    x:(id%after.width-(after.width-1)/2)*cellSize,
    z:(Math.floor(id/after.width)-(after.height-1)/2)*cellSize,
    distance:Math.SQRT2*cellSize,weight:.57,verifiedRetreat:true};
}

export function publicObservedTrapCameraFocus(snapshot, hero, cellSize, aspect) {
  if (!snapshot || snapshot.result
    || !(Number.isFinite(aspect) && aspect >= .35 && aspect < .60)
    || !(Number.isFinite(cellSize) && cellSize > 0)
    || !(Number.isFinite(hero?.x) && Number.isFinite(hero?.z))
    || !Number.isSafeInteger(snapshot.width) || snapshot.width < 2
    || !Number.isSafeInteger(snapshot.height) || snapshot.height < 2
    || !Array.isArray(snapshot.cells) || !Array.isArray(snapshot.visibleCells))
    return null;
  const visible = new Set(snapshot.visibleCells);
  // Real native 320px diagonal public approach (2026-11-05): a full
  // physical jaw can be visible in the published world yet clipped by the
  // old weak 1.414-cell follow-camera aim. Only use known public traps.
  const maxDistance = cellSize * 1.82;
  let closest = null;
  for (const cell of snapshot.cells) {
    const id = cell?.cell;
    if (cell?.trap !== true || cell.blocked === true
      || !Number.isSafeInteger(id) || id < 0
      || id >= snapshot.width * snapshot.height || !visible.has(id)) continue;
    const x = (id % snapshot.width - (snapshot.width-1)/2) * cellSize;
    const z = (Math.floor(id/snapshot.width) - (snapshot.height-1)/2) * cellSize;
    const distance = Math.hypot(x-hero.x,z-hero.z);
    if (distance > maxDistance || (closest
      && (distance > closest.distance
        || (distance === closest.distance && id >= closest.cell)))) continue;
    closest = {cell:id,x,z,distance};
  }
  if (!closest) return null;
  // Preserve the prior verified .44 one-cell pan. A disclosed diagonal
  // mechanism farther from Pip needs a stronger shared target instead of
  // clipping its right jaw at +1.4567 NDC (unchanged silhouette gate +.95).
  // Fade continuously outside the close interaction; do not zoom Pip out,
  // move hazards/actors, leak hidden cells or modify autonomous decisions.
  const cellsAway = closest.distance / cellSize;
  // The old distance-only boost mistook a collinear 1.33-cell departure for
  // a diagonal encounter, increasing the pan instead of fading it. Treat
  // actual X/Z separation as the published diagonal evidence, while an
  // axis-aligned approach keeps its original .44 one-cell weight and fades
  // continuously to zero by 1.5 cells. This never reads a planned route.
  const diagonal = clamp(Math.min(Math.abs(closest.x-hero.x),
    Math.abs(closest.z-hero.z))/cellSize,0,1);
  const axisWeight = .44*clamp((1.5-cellsAway)/.5,0,1);
  const diagonalWeight = (.44+.13*diagonal)*diagonal;
  const departureFade = clamp((1.82-cellsAway)/.30,0,1);
  return {...closest,weight:Math.max(axisWeight,diagonalWeight)*departureFade};
}


/**
 * Keep the actual 3D tide-shear jaws at their original native action scale
 * when Pip presents a genuinely carried matching key to a disclosed sealed
 * gate with a *simultaneously visible diagonal trap*. The 2026-11-05 source-
 * bound 390px withdrawal screenshot measured full physical jaw span .662 NDC
 * (strict existing >.70), while both complete models had ample edge margin.
 *
 * This tiny optical move is reserved for public key/lock strength >= .8 and
 * a known diagonal 1.3-1.55-cell stage. The nearer one-cell pressure beat
 * already has only .068 NDC physical right margin and must NOT be zoomed.
 * No hidden hazard, route, AI plan, model resizing or camera-test threshold.
 * Full model and gate must pass independent real WebGL framing again.
 */
export function publicKeyedPressureStageHalfHeight(aspect, halfHeight,
  keyLockStrength, publicTrap, cellSize, reducedMotion=false) {
  if (reducedMotion
    || !(Number.isFinite(aspect) && aspect >= .35 && aspect < .60)
    || !(Number.isFinite(halfHeight) && halfHeight > 0)
    || !(Number.isFinite(keyLockStrength) && keyLockStrength >= .8)
    || !(Number.isFinite(cellSize) && cellSize > 0)
    || !(Number.isFinite(publicTrap?.distance) && Number.isFinite(publicTrap?.weight))
    || publicTrap.weight < .35
    || publicTrap.distance < cellSize * 1.3
    || publicTrap.distance > cellSize * 1.55)
    return halfHeight;
  return Math.max(5.8, halfHeight * .92);
}

/** Camera-only response speed for ACTUALLY witnessed public scene partners.
 * The previously generic 4.5/s camera can lag a real 320px autonomous
 * diagonal approach to a known physical pressure mechanism. Use guardian
 * settling only for the selected published pressure stage, never for hidden
 * traps, and retain pickup/gate/neutral priorities without changing AI.
 */

/**
 * Physical, source-bound portrait pressure-camera safety pan.
 *
 * The real 320px rendered retreat previously cropped a jaw at -1.283 NDC
 * while the actor and hazard together occupied less than the original 1.90
 * NDC safe width. First stage the genuine public hero/jaw using the existing
 * camera choreography; only if the ACTUAL projected connected meshes still
 * breach ±0.95, translate the lens horizontally in world-space enough to
 * keep BOTH physical silhouettes. Never shrink or move either model, infer
 * undiscovered geometry, fabricate a hazard or change the strict test bar.
 *
 * Returns camera-right WORLD displacement, not a new objective or zoom.
 * An impossible combined silhouette must remain a failing real visual gate.
 */
/**
 * Pass258 real 320px source capture: the NEW full-body tideglass pressure
 * counterbalance expands the witnessed physical hero+mechanism envelope to
 * 1.89444 NDC, above the existing 1.89 framing target (±.945). The old
 * translation correctly refuses an impossible fit and Pip reaches +.9562,
 * FAILING the unchanged ±.95 strict full-model gate.
 *
 * Repair the true source geometry, NOT the screenshot or acceptance gate:
 * on the verified public one-step withdrawal only, widen the existing
 * optical half-height by the minimum amount needed for an interior ±.935
 * target. Refuse any expansion >2.5%, unsupported viewport, invalid model
 * bounds or a mechanism that would shrink below the original 0.70 NDC
 * withdrawal action-scale floor. Never alter source positions or game state.
 */
export function publicPhysicalPressureRetreatHalfHeight(hero, jaw, halfHeight, aspect, verifiedRetreat=false) {
  if (!verifiedRetreat || !(Number.isFinite(aspect) && aspect>=.35 && aspect<.60)
    || !(Number.isFinite(halfHeight) && halfHeight>0)
    || !hero || !jaw
    || ![hero.left,hero.right,jaw.left,jaw.right].every(Number.isFinite)
    || hero.left>=hero.right || jaw.left>=jaw.right) return halfHeight;
  const width=Math.max(hero.right,jaw.right)-Math.min(hero.left,jaw.left);
  const interior=.935, safeWidth=interior*2;
  if (width<=safeWidth) return halfHeight;
  const factor=width/safeWidth;
  if (factor>1.025 || (jaw.right-jaw.left)/factor < .70) return halfHeight;
  return halfHeight*factor;
}

export function publicPhysicalPressureHorizontalReframe(hero, jaw, halfHeight, aspect, contactMargin=null) {
  if (!(Number.isFinite(aspect) && aspect>=.35 && aspect<.60)
    || !(Number.isFinite(halfHeight) && halfHeight>0)
    || !hero || !jaw || ![hero.left,hero.right,jaw.left,jaw.right].every(Number.isFinite)
    || hero.left>=hero.right || jaw.left>=jaw.right) return 0;
  const left=Math.min(hero.left,jaw.left);
  const right=Math.max(hero.right,jaw.right);
  // Compose with 0.005 NDC interior slack. The REAL 320px WebGL proof
  // reached exactly +0.9500000000000002 after correction: floating-point
  // roundoff defeated the *unchanged* inclusive ±0.95 acceptance gate.
  // This is a stricter camera TARGET, never a test or clipping-limit change.
  // The existing public pressure/withdrawal camera still uses the original
  // .945 interior. The genuine one-cell CONTACT shot requests a stricter .89,
  // after its physical full-mesh zoom has been reprojected.
  const safe=.945;
  const interior=contactMargin===null ? safe : contactMargin;
  if (!(Number.isFinite(interior) && interior>=.89 && interior<=safe)
    || right-left>interior*2) return 0;
  const minimum=right-interior,maximum=left+interior;
  // Positive world camera-right displacement moves the objects left.
  // Choose the smallest necessary translation, preserving safe frames.
  return clamp(0,minimum,maximum)*halfHeight*aspect;
}

/**
 * Measure ACTUAL connected source-bound WebGL silhouettes before staging
 * a publicly discovered diagonal pressure action. Pass244's nominal optical
 * percentage still rendered a .6897967 NDC jaw at 390px (strict >.70 FAIL).
 * A readable .76 NDC target is permitted only if the genuine complete Pip
 * and jaw bounds retain MORE margin than the unchanged strict ±.95 gate.
 * No mesh manipulation, AI input, secret map access or test relaxation.
 */
/**
 * One genuinely VISIBLE, public, one-cell Tide-Shear encounter can stage its
 * actual connected Pip + moving-jaw meshes closer. This is derived from the
 * conservative existing source-bound 3D bounding-box diagnostics, never AI
 * plans, private hazard coordinates, or a made-up visual marker.
 * Only tighten if BOTH complete projected silhouettes remain strictly inside
 * +/-0.90 NDC, leaving MORE slack than the immutable browser +/-0.95 gate.
 * Withdrawal, diagonal study, unknown/closed hazards, wide views, manual
 * cameras and reduced motion are ineligible at the caller.
 */
export function publicPhysicalPressureContactHalfHeight(hero,jaw,halfHeight,aspect,eligible=false) {
  if (!eligible || !Number.isFinite(aspect) || aspect < .35 || aspect >= .60
    || !Number.isFinite(halfHeight) || halfHeight <= 0
    || !hero || !jaw) return halfHeight;
  const valid=box=>[box.left,box.right,box.bottom,box.top].every(Number.isFinite)
    && box.left<box.right && box.bottom<box.top;
  if (!valid(hero)||!valid(jaw)) return halfHeight;
  const left=Math.min(hero.left,jaw.left), right=Math.max(hero.right,jaw.right);
  const bottom=Math.min(hero.bottom,jaw.bottom), top=Math.max(hero.top,jaw.top);
  // Original complete Pass268 native 390px WebGL actually measured the
  // pressure machine at x=-.776857 and Pip at +.428748. Refusing the
  // 18% contact shot because the group was LEFT of screen centre made the
  // previous nominal zoom only ~2%; it was NOT a physical size constraint.
  // The immediately following public camera pass can translate its target
  // horizontally. Calculate the achievable zoom from the whole CONNECTED
  // two-actor width instead of falsely treating an off-centre pair as cropped.
  // Preserve stricter +/- .89 horizontal and vertical NDC BEFORE claiming
  // contact-stage eligibility; the renderer must reproject both meshes and
  // execute its real horizontal safety pan after changing the lens.
  const pairWidth=right-left;
  const maxAbsY=Math.max(Math.abs(bottom),Math.abs(top));
  if (!(pairWidth>0 && maxAbsY>0)) return halfHeight;
  const zoom=Math.min(1.18, halfHeight/5.45,
    1.76/pairWidth, .88/maxAbsY);
  if (!(zoom>1.06)) return halfHeight;
  return halfHeight/zoom;
}

export function publicPhysicalPressureApproachHalfHeight(hero,jaw,halfHeight,aspect,eligible=false) {
  if (!eligible || !(Number.isFinite(aspect) && aspect>=.45 && aspect<.60)
    || !(Number.isFinite(halfHeight) && halfHeight>0)
    || !hero || !jaw) return halfHeight;
  const valid=box=>[box.left,box.right,box.bottom,box.top].every(Number.isFinite)
    && box.left<box.right && box.bottom<box.top;
  if (!valid(hero) || !valid(jaw)) return halfHeight;
  const jawWidth=jaw.right-jaw.left;
  const actionWidth=.76;
  if (jawWidth>=actionWidth || jawWidth<.65) return halfHeight;
  const magnification=actionWidth/jawWidth;
  if (magnification>1.18) return halfHeight;
  const left=Math.min(hero.left,jaw.left)*magnification;
  const right=Math.max(hero.right,jaw.right)*magnification;
  const bottom=Math.min(hero.bottom,jaw.bottom)*magnification;
  const top=Math.max(hero.top,jaw.top)*magnification;
  // Interior camera margin .90 is stricter than the native ±.95 test.
  if (left<-.90 || right>.90 || bottom<-.90 || top>.90) return halfHeight;
  return halfHeight/magnification;
}

/**
 * Actual public Tide-Shear action close-up, never a fabricated hazard.
 * Pass238 original 390x844 WebGL showed the ENTIRE Pip/pressure mechanism
 * in frame but measured Pip at 0.4697888 NDC (fixed strict minimum >0.49).
 * Only an authentic pressure-first Follow stage earns a 6% closer lens;
 * the original mesh/AI/collision remain unchanged, while the renderer still
 * has to pass real full-model ±0.95 native portrait framing.
 */

/**
 * Pass273: Source-authentic 390px pressure images at exact HEAD 887554c show
 * the *whole* published Tide-Shear jaws already readable (.782 NDC) but the
 * actual connected Pip shrunk to .445227 NDC during the diagonal approach.
 * The older jaw-only optical stage correctly did nothing: it cannot judge
 * the companion actor. Measure BOTH real complete mesh bounds; move the
 * existing orthographic lens only when the actual public encounter would
 * otherwise lose Pip. The caller strictly gates public diagonal or verified
 * same-run withdrawal; never use hidden cells, an AI plan or synthetic HUD.
 * Width fit uses the combined actors so the already-existing camera-right
 * translation can keep BOTH inside the unchanged +/- .95 native test.
 */
/**
 * An observed pressure contact earns ONE slow, cinematic side-orbit.
 * The caller gates this with a visibly disclosed real hazard, a live Follow
 * shot and the actual public visual-pressure clock. No hidden cell, future
 * prediction or fabricated dodge may move the lens. Withdrawal, manual
 * camera and reduced-motion settings always return zero.
 *
 * A camera that stays frontal at the full closing stroke lets the foreground
 * jaws eclipse Pip's lower-body response. A quarter view separates their
 * physical silhouettes without moving, hiding or altering either model.
 */
export function publicPressureContactOrbitWeight(
  progress, publicStage=false, reducedMotion=false, cameraMode='follow',
  withdrawal=false) {
  if (!publicStage || reducedMotion || cameraMode !== 'follow' || withdrawal
    || !Number.isFinite(progress)) return 0;
  const t=Math.max(0,Math.min(1,(progress-.28)/.60));
  return t*t*(3-2*t);
}

export function publicPhysicalPressureHeroReadabilityHalfHeight(
  hero, jaw, halfHeight, aspect, eligible=false, withdrawal=false) {
  if (!eligible || !(Number.isFinite(aspect) && aspect>=.45 && aspect<.60)
    || !(Number.isFinite(halfHeight) && halfHeight>0)
    || !hero || !jaw) return halfHeight;
  const valid=box=>[box.left,box.right,box.bottom,box.top].every(Number.isFinite)
    && box.left<box.right && box.bottom<box.top;
  if (!valid(hero) || !valid(jaw)) return halfHeight;
  const heroWidth=hero.right-hero.left;
  if (!(heroWidth>=.36 && heroWidth<.515)) return halfHeight;
  const zoom=.515/heroWidth;
  // Genuine diagonal action normally needs ~15.7%. Retreat may need more
  // after Pip physically travels away, but never sacrifice jaw legibility.
  if (zoom> (withdrawal ? 1.38 : 1.20)) return halfHeight;
  const jawWidth=(jaw.right-jaw.left)*zoom;
  const pairWidth=(Math.max(hero.right,jaw.right)-Math.min(hero.left,jaw.left))*zoom;
  const vertical=Math.max(Math.abs(hero.bottom),Math.abs(hero.top),
    Math.abs(jaw.bottom),Math.abs(jaw.top))*zoom;
  if (jawWidth<.70 || pairWidth>1.76 || vertical>.88) return halfHeight;
  return halfHeight/zoom;
}

export function publicPressureActionHalfHeight(aspect, halfHeight, pressureFirst, reducedMotion=false) {
  if (!pressureFirst || reducedMotion
    || !(Number.isFinite(aspect) && aspect >= .35 && aspect < .60)
    || !(Number.isFinite(halfHeight) && halfHeight > 0))
    return halfHeight;
  return halfHeight * .94;
}

/**
 * Public diagonal pressure approach: the ORIGINAL 390x844 same-run WebGL
 * tick-4 frame at 5fcce207 showed both connected jaws entirely in shot, but
 * their .6897967 NDC silhouette failed the unchanged >.70 readable-action
 * bound. Compose a 4% closer real action stage ONLY on a witnessed, presently
 * disclosed diagonally adjacent hazard before contact.
 *
 * 320px (already .737), one-cell pressure, the tight-margin withdrawal,
 * guardians, gates, unseen hazards and reduced-motion cameras keep their
 * previous safe optics. Full ±.95 no-crop remains a separate hard WebGL gate.
 * This is a lens-only adjustment: no player/trap movement or AI authority.
 */
export function publicPressureDiagonalApproachHalfHeight(
  aspect, halfHeight, snapshot, trap, cellSize,
  pressureFirst=false, verifiedRetreat=false, reducedMotion=false) {
  if (pressureFirst || verifiedRetreat || reducedMotion || !snapshot || snapshot.result
    || !(Number.isFinite(aspect) && aspect>=.45 && aspect<.60)
    || !(Number.isFinite(halfHeight) && halfHeight>0)
    || !(Number.isFinite(cellSize) && cellSize>0)
    || !(Number.isFinite(trap?.distance) && trap.distance>=cellSize*1.30
      && trap.distance<=cellSize*1.55)
    || !(Number.isFinite(trap?.weight) && trap.weight>=.35)
    || !Number.isSafeInteger(snapshot.width) || snapshot.width<2
    || !Number.isSafeInteger(snapshot.height) || snapshot.height<2
    || !Number.isSafeInteger(snapshot.currentCell)
    || snapshot.currentCell<0
    || snapshot.currentCell>=snapshot.width*snapshot.height
    || !Number.isSafeInteger(trap.cell) || trap.cell<0
    || trap.cell>=snapshot.width*snapshot.height
    || !Array.isArray(snapshot.cells) || !Array.isArray(snapshot.visibleCells)
    || !snapshot.visibleCells.includes(trap.cell)
    || !snapshot.cells.some(cell=>cell?.cell===trap.cell && cell.trap===true
      && cell.blocked!==true)) return halfHeight;
  const dx=Math.abs(trap.cell%snapshot.width
    - snapshot.currentCell%snapshot.width);
  const dz=Math.abs(Math.floor(trap.cell/snapshot.width)
    - Math.floor(snapshot.currentCell/snapshot.width));
  if(dx!==1 || dz!==1)return halfHeight;
  return halfHeight*.96;
}

export function publicCameraSettleRate(pickup=false, encounter=false, pressure=false, opening=false) {
  if (pickup) return 12;
  if (encounter || pressure) return 10;
  if (opening) return 8;
  return 4.5;
}

/**
 * Native gameplay camera staging is derived only from an ALREADY DISCLOSED
 * guardian's bounded visual attention. Detail mode must not silently ignore
 * that threat: authentic tick-13 screenshots placed Thornback near the right
 * edge with Pip near the opposite edge even though both share a corridor.
 * No private threat location, hidden map cell, animation, navigation command
 * or unsafe-route assumption is involved. Keep the hero dominant on phones.
 */
export function publicEncounterFrameWeight(attentionStrength, cameraMode, result, aspect) {
  if (result || (cameraMode !== 'follow' && cameraMode !== 'detail')
    || !Number.isFinite(attentionStrength)) return 0;
  const alert = clamp(attentionStrength, 0, 1);
  // The former hero-biased Follow composition left both already-visible
  // actors tiny on real 320/390 full-screen portraits. Recenter only an actual
  // close public encounter, at most 46% of the real hero-to-guardian span.
  // Wider Follow, landscape, hidden, and terminal snapshots stay unchanged.
  const narrowPortrait = Number.isFinite(aspect) && aspect >= .35 && aspect < .60;
  if (cameraMode === 'follow')
    return narrowPortrait ? Math.min(.46, alert * .82) : alert * .22;
  const portrait = Number.isFinite(aspect) && aspect > 0 && aspect < .9;
  // Native 390px production evidence showed one truly disclosed guardian entirely
  // outside the picture despite a visible warning. Detail is an actor-pair view:
  // share its bounded aim almost evenly for a genuine close opponent, retaining
  // slightly more of Pip on phones. Follow, terminal and hidden-state rules stay.
  return portrait ? Math.min(.48, alert * .85) : Math.min(.5, alert * .9);
}

/**
 * Portrait Detail must preserve the previously verified horizontal world span
 * when its game-first HUD makes the 3D canvas taller. Orthographic framing
 * otherwise crops a real disclosed guardian even though the view gained pixels.
 * 4.275 = 5.7 * 0.75: the horizontal half-span of the real 390x520 encounter.
 * This is a presentation calculation only; no private maze/AI state enters.
 */
/**
 * A full-screen phone canvas is taller than the former 390px in-page stage.
 * Preserve the PREVIOUS horizontal diorama world span (~.70 old aspect)
 * rather than cropping a known key/closed gate or the disclosed guardian
 * when the HUD moves into the corners. Does not invent a cell or move actors.
 * Only the camera frustum changes; the live simulation is unchanged.
 */
/**
 * Neutral, genuinely discovered stage close-up. Source-bound 1280 and
 * 390px WebGL frames showed the original hero/fossils occupying very few
 * pixels while the lagoon dominated. This compacts ONLY Follow exploration
 * with a reciprocal, currently public adjacent passage and at least five
 * genuine disclosed cells. No revealed exit, planned route, simulation
 * decision, private map or pseudo-event is consumed.
 *
 * Active gates, discoveries, guardian encounters, manual camera and
 * reduced-motion staging are excluded by the rendering caller; existing
 * portrait/gate fit helpers keep their original strict thresholds.
 */
export function publicCompactExplorationHalfHeight(aspect, selectedHalfHeight, snapshot) {
  const base=Number.isFinite(selectedHalfHeight)&&selectedHalfHeight>0?selectedHalfHeight:7.3;
  if (!(Number.isFinite(aspect)&&aspect>.35&&aspect<=2.2)
    || !snapshot || snapshot.result
    || !Number.isSafeInteger(snapshot.width)||snapshot.width<2
    || !Number.isSafeInteger(snapshot.height)||snapshot.height<2
    || !Number.isSafeInteger(snapshot.currentCell)
    || !Array.isArray(snapshot.cells)||snapshot.cells.length<5) return base;
  const known=new Map(snapshot.cells.filter(c=>Number.isSafeInteger(c?.cell)
    && c.cell>=0 && c.cell<snapshot.width*snapshot.height
    && c.blocked===false).map(c=>[c.cell,c]));
  const here=known.get(snapshot.currentCell);
  if (!here || !Array.isArray(here.neighbors)) return base;
  const connected=here.neighbors.some(n=>{
    const other=known.get(n);
    return !!other && Array.isArray(other.neighbors)
      && other.neighbors.includes(snapshot.currentCell)
      && Math.abs(n%snapshot.width-snapshot.currentCell%snapshot.width)
       +Math.abs(Math.floor(n/snapshot.width)-Math.floor(snapshot.currentCell/snapshot.width))===1;
  });
  if (!connected) return base;
  // Pass126: native 1280×900 renders still place Pip and the authored
  // fossil interaction inside a comparatively small ocean island. Give
  // ordinary, reciprocally disclosed desktop exploration a closer real
  // *camera*, not larger props or a cropped fake screenshot. The short
  // 844×390 landscape must keep its former taller safe stage; portrait,
  // gate, guardian and terminal framing retain their own controls.
  // This does not use a route plan, unknown neighbor or private cell.
  if (aspect>=1.22 && aspect<=1.75) return Math.min(base,5.85);
  if (aspect>1.75) return Math.min(base,6.35);
  if (aspect<.60) return Math.min(base,8.05);
  return base;
}

export function publicFullBleedFollowHalfHeight(aspect, selectedHalfHeight) {
  const base = Number.isFinite(selectedHalfHeight) && selectedHalfHeight > 0 ? selectedHalfHeight : 7.3;
  if (!Number.isFinite(aspect) || aspect >= .60 || aspect <= 0) return base;
  const safeAspect = Math.max(.35, aspect);
  return Math.max(base, Math.min(base * 2.2, base * .70 / safeAspect));
}

/**
 * Tighten ONLY an actual publicly disclosed guardian/hero encounter in a
 * full-screen narrow portrait. Use the existing live pair's 3D world positions
 * and a conservative model-radius reserve, never hidden maze data, a guessed
 * guardian or a screen-space impostor. The physical models stay their true size.
 *
 * Preserve the broader original shot whenever either character would approach
 * the edge. The 15:18 camera heading is the actual unrotated Follow isometric
 * offset in scene.js; sealed-gate views deliberately never call this helper.
 */
/**
 * Center the real, publicly disclosed portrait pair by their approximate
 * physical silhouettes, not their eye/actor centers. Thornback's claws and
 * sails occupy a wider screen envelope than Pip's arms and scarf.
 * The correction only pans the FOLLOW camera; it never moves game objects,
 * reveals private topology, or directs either autonomous character.
 */
/**
 * A disclosed, nearby hero/guardian pair may be staged from a slightly
 * different physical azimuth on a motion-enabled portrait. Look along the
 * *already public* actor separation, never hidden topology or a future route.
 * Limit rotation to 0.55 rad, preserve the usual shot for reduced motion,
 * unknown threats, all landscapes, Detail/Overview and terminal results.
 * Pure and allocation-free: each public snapshot yields the same angle.
 */
export function publicPortraitGuardianOrbitAngle(aspect, attention, hero, guardian, reducedMotion=false) {
  if (reducedMotion || !(Number.isFinite(aspect)&&aspect>=.35&&aspect<.60)
    || !(Number.isFinite(attention)&&attention>.30)
    || ![hero?.x,hero?.z,guardian?.x,guardian?.z].every(Number.isFinite))
    return 0;
  const dx=guardian.x-hero.x, dz=guardian.z-hero.z;
  if (Math.hypot(dx,dz)<.3) return 0;
  const baseline=Math.atan2(18,15);
  const bearing=Math.atan2(dz,dx);
  let turn=Math.atan2(Math.sin(bearing-baseline),Math.cos(bearing-baseline));
  // Facing either end of the public actor axis minimizes their lateral span;
  // use the nearest orientation, never a sudden half-turn.
  if (turn>Math.PI/2) turn-=Math.PI;
  if (turn< -Math.PI/2) turn+=Math.PI;
  return clamp(turn*clamp((attention-.30)/.26,0,1),-.55,.55);
}

export function publicPortraitGuardianBalance(aspect, attention, hero, guardian, focus, view={x:15,z:18}) {
  const neutral={x:0,z:0};
  if (!(Number.isFinite(aspect) && aspect>=.35 && aspect<.60)
    || !(Number.isFinite(attention) && attention>0)
    || ![hero?.x,hero?.z,guardian?.x,guardian?.z,focus?.x,focus?.z,view?.x,view?.z].every(Number.isFinite))
    return neutral;
  const length=Math.hypot(view.x,view.z);
  if (!(length>0)) return neutral;
  const screenX=p=>((p.x-focus.x)*view.z-(p.z-focus.z)*view.x)/length;
  const heroCenter=screenX(hero), guardianCenter=screenX(guardian);
  // Authored physical envelope reserves: helmet/scarf 1.10, shell/claws/sails 1.80.
  // A pure midpoint left the actual native 390px guardian sail cropped at 1.004 NDC.
  const min=Math.min(heroCenter-1.10,guardianCenter-1.80);
  const max=Math.max(heroCenter+1.10,guardianCenter+1.80);
  const shift=clamp((min+max)*.5,-.55,.55);
  return {x:shift*view.z/length,z:-shift*view.x/length};
}

export function publicPortraitGuardianHalfHeight(aspect, fullBleedHeight, attention, hero, guardian,
  focus, previousFocus=focus, view={x:15,z:18}, previousView=view) {
  const base=Number.isFinite(fullBleedHeight)&&fullBleedHeight>0?fullBleedHeight:7.3;
  if (!(Number.isFinite(aspect)&&aspect>=.35&&aspect<.60)
    || !(Number.isFinite(attention)&&attention>0)
    || ![hero?.x,hero?.z,guardian?.x,guardian?.z,focus?.x,focus?.z,
      previousFocus?.x,previousFocus?.z,view?.x,view?.z,
      previousView?.x,previousView?.z].every(Number.isFinite))
    return base;
  if (!(Math.hypot(view.x,view.z)>0 && Math.hypot(previousView.x,previousView.z)>0))
    return base;
  const screenX=(p,target,offset)=>((p.x-target.x)*offset.z-(p.z-target.z)*offset.x)
    /Math.hypot(offset.x,offset.z);
  // The actual camera focus eases toward the new public target. The entire
  // transition lies between these two targets: protecting BOTH endpoints
  // prevents an otherwise valid pair shot from cropping a real guardian
  // during the easing itself, not just when the camera finally settles.
  // Preserve genuine 3D extents, not merely the two projected eye centers.
  // The guardian's articulated silhouette is wider than Pip's; .94 NDC
  // leaves actual visible clearance rather than touching the viewport edge.
  // Check BOTH ends of camera easing so a formerly centered shot stays safe.
  const pairExtent=(target,offset)=>Math.max(
    Math.abs(screenX(hero,target,offset))+1.10,
    Math.abs(screenX(guardian,target,offset))+1.80);
  // Protect both actor outlines at BOTH camera aim and azimuth endpoints.
  // Even during rotation no model may be sacrificed to manufacture scale.
  const physicallySafeHeight=Math.max(
    pairExtent(focus,view),pairExtent(previousFocus,view),
    pairExtent(focus,previousView),pairExtent(previousFocus,previousView))/(aspect*.94);
  const orbiting=Math.abs(Math.atan2(view.z,view.x)-Math.atan2(18,15))>.02;
  const maximumZoom=base*(1-(orbiting?.38:.16)*clamp(attention,0,1));
  return Math.min(base,Math.max(maximumZoom,physicallySafeHeight));
}

/**
 * A real, already-disclosed guardian can dominate the wide gameplay stage
 * instead of remaining a pin-sized island in open water. Zoom is cosmetic:
 * preserve the ACTUAL hero/guardian physical extents at both ends of the
 * easing, including fixed armor/claw reserves. Narrow portrait uses its
 * separately source-verified camera; sealed gates, results, Overview and
 * reduced-motion are excluded by scene.js. No AI truth, path or hidden cell.
 */
export function publicLandscapeGuardianHalfHeight(aspect, selectedHalfHeight,
  attention, hero, guardian, focus, previousFocus = focus) {
  const base = Number.isFinite(selectedHalfHeight) && selectedHalfHeight > 0
    ? selectedHalfHeight : 7.3;
  if (!(Number.isFinite(aspect) && aspect >= 1.1)
    || !(Number.isFinite(attention) && attention > 0)
    || ![hero?.x,hero?.z,guardian?.x,guardian?.z,
      focus?.x,focus?.z,previousFocus?.x,previousFocus?.z].every(Number.isFinite))
    return base;
  const viewRightLength = Math.hypot(18, 15);
  const screenX = (p, target) =>
    ((p.x - target.x) * 18 - (p.z - target.z) * 15) / viewRightLength;
  // Conservative physical silhouette reserve, not actor centers. This
  // refuses to zoom when a real pair cannot fit with at least .94 margin.
  const pairExtent = target => Math.max(
    Math.abs(screenX(hero, target)) + 1.10,
    Math.abs(screenX(guardian, target)) + 1.80);
  const physicallySafe = Math.max(pairExtent(focus),
    pairExtent(previousFocus)) / (aspect * .94);
  // More urgent PUBLIC attention earns the bigger stage, bounded so upper
  // model parts and multiple visible terraces remain within the orthographic
  // frame. No animation resource or per-frame object is created.
  const desired = Math.max(base * .78, base * (1 - .35 * clamp(attention, 0, 1)));
  return Math.min(base, Math.max(desired, physicallySafe));
}

/**
 * A genuinely modeled, PUBLIC fossil organ and Pip may share a short,
 * readable landscape stage when the sculpture actually unfolds. Only the
 * camera's scale is considered here. The caller must gate terminal states,
 * real threats, witnessed pickups, gates, objectives and reduced motion.
 *
 * Preserve BOTH endpoints of the smoothly interpolating camera and reserve
 * the full physical actor (1.18 units) and sculptural leaves (1.5 units),
 * rather than treating two tiny actor centers as sufficient. Native portrait
 * remains on its stricter existing camera path.
 */
export function publicFossilPerformanceHalfHeight(aspect, selectedHalfHeight,
  attention, hero, organ, focus, previousFocus=focus) {
  const base=Number.isFinite(selectedHalfHeight)&&selectedHalfHeight>0
    ? selectedHalfHeight : 7.3;
  if (!(Number.isFinite(aspect)&&aspect>=1.1)
    || !(Number.isFinite(attention)&&attention>.35)
    || ![hero?.x,hero?.z,organ?.x,organ?.z,
      focus?.x,focus?.z,previousFocus?.x,previousFocus?.z].every(Number.isFinite))
    return base;
  const viewLength=Math.hypot(18,15);
  const projectedX=(point,target)=>
    ((point.x-target.x)*18-(point.z-target.z)*15)/viewLength;
  const extent=target=>Math.max(
    Math.abs(projectedX(hero,target))+1.18,
    Math.abs(projectedX(organ,target))+1.50);
  const safeHeight=Math.max(extent(focus),extent(previousFocus))/(aspect*.92);
  // Never ask for an aggressive zoom near the activation threshold.
  const emphasis=clamp((attention-.35)/.65,0,1);
  const desired=base*(1-.18*emphasis);
  return Math.min(base,Math.max(desired,safeHeight));
}


/**
 * A publicly modeled tide-organ may share a closer PORTRAIT performance with
 * Pip, but only after genuine near-range public attention. Preserve both
 * actors' entire physical horizontal silhouette through camera easing.
 * The caller excludes guardians, keys, gates, objectives, terminal states,
 * Overview/Detail and reduced motion. This function never reads private AI.
 */
export function publicPortraitFossilPerformanceHalfHeight(aspect, selectedHalfHeight,
  attention, hero, organ, focus, previousFocus=focus) {
  const base=Number.isFinite(selectedHalfHeight)&&selectedHalfHeight>0
    ?selectedHalfHeight:8.05;
  if (!(Number.isFinite(aspect)&&aspect>=.35&&aspect<.60)
    || !(Number.isFinite(attention)&&attention>.45)
    || ![hero?.x,hero?.z,organ?.x,organ?.z,
      focus?.x,focus?.z,previousFocus?.x,previousFocus?.z].every(Number.isFinite))
    return base;
  const length=Math.hypot(18,15);
  const horizontal=(point,target)=>
    ((point.x-target.x)*18-(point.z-target.z)*15)/length;
  const extent=target=>Math.max(
    Math.abs(horizontal(hero,target))+1.18,
    Math.abs(horizontal(organ,target))+1.65);
  // Reserve 10% outside the complete modeled explorer + articulated leaves,
  // at BOTH the current and requested focus. Never crop an existing actor.
  const safe=Math.max(extent(focus),extent(previousFocus))/(aspect*.90);
  const strength=clamp((attention-.45)/.55,0,1);
  const desired=Math.max(6.45,base*(1-.22*strength));
  return Math.min(base,Math.max(desired,safe));
}

export function publicDetailEncounterHalfHeight(aspect, disclosedAttention) {
  if (!(Number.isFinite(aspect) && aspect > 0 && aspect < .9)
    || !(Number.isFinite(disclosedAttention) && disclosedAttention > 0)) return 4.6;
  // The new real hinged tail vanes are wider than the original unarmed
  // guardian mask. Exact-source WebGL at 320x740 measured the complete
  // physical rig right edge at +0.9598 NDC: the strict +0.95 in-frame gate
  // CORRECTLY rejected that crop, even though the actor center was visible.
  // Give a genuinely disclosed ultra-narrow Detail encounter extra *world*
  // span (4.40 vs 4.275), never relax image/tests or scale down the models.
  // Broader portrait and landscape keep their already verified staging.
  const horizontalReserve = aspect < .6 ? 4.40 : 4.275;
  return Math.max(5.7, horizontalReserve / aspect);
}

/** Camera bounds come exclusively from public knowledge. */
export function computePublicView(snapshot, camera, overview = false) {
  const cells = snapshot.cells.length ? snapshot.cells : [{ cell: snapshot.currentCell }];
  const columns = cells.map(({ cell }) => cell % snapshot.width);
  const rows = cells.map(({ cell }) => Math.floor(cell / snapshot.width));
  const knownWidth = Math.max(...columns) - Math.min(...columns) + 1;
  const knownHeight = Math.max(...rows) - Math.min(...rows) + 1;
  const minimumWidth = Math.min(snapshot.width, 7);
  const minimumHeight = Math.min(snapshot.height, 5);
  const widthCells = clamp(overview ? knownWidth + 2 : Math.min(knownWidth + 2, 9), minimumWidth, snapshot.width);
  const heightCells = clamp(overview ? knownHeight + 2 : Math.min(knownHeight + 2, 7), minimumHeight, snapshot.height);
  const requested = Number.isInteger(camera?.centerCell) ? camera.centerCell : snapshot.currentCell;
  const centerCell = cells.some(item => item.cell === requested) ? requested : snapshot.currentCell;
  const startCol = clamp(centerCell % snapshot.width - Math.floor(widthCells / 2), 0, snapshot.width - widthCells);
  const startRow = clamp(Math.floor(centerCell / snapshot.width) - Math.floor(heightCells / 2), 0, snapshot.height - heightCells);
  const currentCol = snapshot.currentCell % snapshot.width;
  const currentRow = Math.floor(snapshot.currentCell / snapshot.width);
  return {
    startCol, startRow, widthCells, heightCells, centerCell,
    mode: overview ? 'overview' : 'local',
    containsCurrentCell: currentCol >= startCol && currentCol < startCol + widthCells && currentRow >= startRow && currentRow < startRow + heightCells,
  };
}

/** Find the observed movement since the previous poll, including turns. */
export function planPublicMotion(previous, next) {
  const snap = () => ({ cells: [next.currentCell], snap: true });
  if (!previous || previous.runToken !== next.runToken) return snap();
  const before = (previous.travelledRoute || []).slice(-MAX_TRAIL);
  const after = (next.travelledRoute || []).slice(-MAX_TRAIL);
  let overlap = 0;
  for (let size = Math.min(before.length, after.length); size > 0; size -= 1) {
    if (before.slice(-size).every((cell, index) => cell === after[index])) { overlap = size; break; }
  }
  if (!overlap) {
    if (previous.currentCell === next.currentCell) return { cells: [next.currentCell], snap: false };
    return snap();
  }
  const path = [previous.currentCell, ...after.slice(overlap)];
  if (path.at(-1) !== next.currentCell) return snap();
  const known = new Map(next.cells.map(cell => [cell.cell, cell]));
  for (let index = 0; index < path.length; index += 1) {
    if (!known.has(path[index])) return snap();
    if (!index || path[index] === path[index - 1]) continue;
    const a = path[index - 1], b = path[index];
    const distance = Math.abs(a % next.width - b % next.width) + Math.abs(Math.floor(a / next.width) - Math.floor(b / next.width));
    if (distance !== 1 || !(known.get(a).neighbors.includes(b) || known.get(b).neighbors.includes(a))) return snap();
  }
  return { cells: path.filter((cell, index) => index === 0 || cell !== path[index - 1]), snap: false };
}

/** Piecewise sampling retains each corridor turn; there is no corner spline. */
export function samplePublicPath(cells, progress, width, height, cellSize = 2.4) {
  const p = clamp(progress, 0, 1) * Math.max(0, cells.length - 1);
  const index = Math.min(Math.floor(p), cells.length - 1);
  const a = cells[Math.max(0, index)] ?? 0;
  const b = cells[Math.min(index + 1, cells.length - 1)] ?? a;
  const t = p - index;
  const ax = (a % width - (width - 1) / 2) * cellSize;
  const az = (Math.floor(a / width) - (height - 1) / 2) * cellSize;
  const bx = (b % width - (width - 1) / 2) * cellSize;
  const bz = (Math.floor(b / width) - (height - 1) / 2) * cellSize;
  return { x: ax + (bx - ax) * t, z: az + (bz - az) * t, heading: Math.atan2(bx - ax, bz - az), cell: a, moving: a !== b };
}

/**
 * Only marks legal, already-disclosed corridors adjacent to the explorer.
 * 'planned' reflects public AI intent, NOT a guarantee of safety or refuge.
 * The renderer performs no pathfinding or undisclosed-map inference.
 */
export function publicWayfinding(snapshot) {
  const {currentCell: current, width, height} = snapshot ?? {};
  if (!Number.isInteger(current) || !Number.isInteger(width) || !Number.isInteger(height)
    || width < 1 || height < 1 || current < 0 || current >= width * height || snapshot.result) return [];
  const known = new Map((Array.isArray(snapshot.cells) ? snapshot.cells : []).map(item => [item.cell, item]));
  const origin = known.get(current);
  if (!origin || origin.blocked || !Array.isArray(origin.neighbors)) return [];
  const planned = Array.isArray(snapshot.plannedRoute) && snapshot.plannedRoute[0] === current
    ? snapshot.plannedRoute[1] : null;
  // The objective first step is derived only from disclosed reciprocal legal edges.
  // It describes a known connection, never an agent command or safe escape.
  const goal = publicObjective(snapshot);
  return [...new Set(origin.neighbors)].filter(next => {
    const cell = known.get(next);
    const distance = Math.abs((next % width) - (current % width))
      + Math.abs(Math.floor(next / width) - Math.floor(current / width));
    const locked = (Array.isArray(snapshot.doors) ? snapshot.doors : []).some(door => !door.open
      && ((door.a === current && door.b === next) || (door.b === current && door.a === next)));
    return Number.isInteger(next) && next >= 0 && next < width * height && distance === 1
      && cell && !cell.blocked && Array.isArray(cell.neighbors) && cell.neighbors.includes(current) && !locked;
  }).slice(0, 4).map(next => ({
    from: current, to: next, kind: next === planned ? 'planned' : 'known',
    ...(next === goal?.firstStep ? {goal: goal.kind} : {}),
  }));
}


/**
 * Pick one *disclosed*, connected landmark to make the scene legible.
 * A known route is NOT a safe route, a guarantee that a key opens an exit,
 * or the autonomous agent's intended next move. Never consult private state.
 */
/**
 * A currently VISIBLE, publicly disclosed pressure mechanism within one
 * actual map step is immediate scene danger. Keep the live mission chip
 * truthful when an existing sealed gate and pressure court overlap.
 * No private solver route, remembered-only trap, nearby unseen cell or
 * interpolated/predicted future position can trigger this cue.
 */
export function publicImmediatePressureCue(snapshot) {
  const {currentCell,width,height}=snapshot ?? {};
  if (snapshot?.result || !Number.isSafeInteger(currentCell)
    || !Number.isSafeInteger(width) || !Number.isSafeInteger(height)
    || width < 2 || height < 2 || currentCell < 0 || currentCell >= width*height
    || !Array.isArray(snapshot?.cells) || !Array.isArray(snapshot?.visibleCells))
    return null;
  const visible=new Set(snapshot.visibleCells);
  if (!visible.has(currentCell)) return null;
  const col=currentCell%width, row=Math.floor(currentCell/width);
  let closest=null;
  for (const item of snapshot.cells) {
    const id=item?.cell;
    if (item?.trap!==true || item.blocked===true
      || !Number.isSafeInteger(id) || id<0 || id>=width*height || !visible.has(id))
      continue;
    const steps=Math.abs(id%width-col)+Math.abs(Math.floor(id/width)-row);
    if (steps>1 || (closest && (steps>closest.steps
      || (steps===closest.steps && id>=closest.cell)))) continue;
    closest={cell:id,steps};
  }
  return closest;
}


/**
 * Carry an already witnessed mechanical pressure warning through Pip's ONE
 * lawful, publicly known withdrawal step. The actual native 320px encounter
 * has a cardinal tick-5 pressure beat then a tick-6 diagonal retreat; losing
 * the imperative to an unrelated gate before the jaws finish was misleading.
 *
 * Do not predict a future threat or change AI: both snapshots disclose the
 * same trap, the movement edge is reciprocally open, and only adjacent to
 * diagonal one-tick departures qualify. No remembered-only/hidden event.
 */
/**
 * A fair FIRST sighting, not an active hit: Pip can already see a revealed
 * pressure device diagonally across the public court (the native tick-4
 * encounter). Warn before stepping cardinally adjacent, while retaining the
 * different immediate-contact/withdrawal cues. No AI intent, future move,
 * private map, route connectivity or collision is inferred from visibility.
 * A closed wall can still separate the two diagonal tiles: this says IN
 * SIGHT, never that the trap is reachable or currently striking.
 */
export function publicVisibleDiagonalPressureCue(snapshot) {
  const {currentCell,width,height}=snapshot??{};
  if (snapshot?.result || !Number.isSafeInteger(currentCell)
    || !Number.isSafeInteger(width) || !Number.isSafeInteger(height)
    || width<2 || height<2 || currentCell<0 || currentCell>=width*height
    || !Array.isArray(snapshot?.cells) || !Array.isArray(snapshot?.visibleCells))
    return null;
  const visible=new Set(snapshot.visibleCells);
  if (!visible.has(currentCell)
    || !snapshot.cells.some(c=>c?.cell===currentCell && c.blocked!==true)) return null;
  const x=currentCell%width,z=Math.floor(currentCell/width);
  let closest=null;
  for (const cell of snapshot.cells) {
    const id=cell?.cell;
    if (cell?.trap!==true || cell.blocked===true
      || !Number.isSafeInteger(id) || id<0 || id>=width*height
      || !visible.has(id) || Math.abs(id%width-x)!==1
      || Math.abs(Math.floor(id/width)-z)!==1) continue;
    if (closest===null || id<closest.cell) closest={cell:id,steps:2,diagonal:true};
  }
  return closest;
}

export function publicPressureWithdrawalCue(before, after) {
  if (!before || !after || before.result || after.result
    || typeof before.runToken !== 'string' || !before.runToken
    || before.runToken !== after.runToken
    || !Number.isSafeInteger(before.tick) || !Number.isSafeInteger(after.tick)
    || after.tick !== before.tick + 1
    || !Number.isSafeInteger(before.width) || before.width < 2
    || !Number.isSafeInteger(before.height) || before.height < 2
    || before.width !== after.width || before.height !== after.height
    || !Array.isArray(before.cells) || !Array.isArray(after.cells)
    || !Array.isArray(before.visibleCells) || !Array.isArray(after.visibleCells)
    || !Array.isArray(before.doors) || !Array.isArray(after.doors)
    || !Number.isSafeInteger(before.currentCell)
    || !Number.isSafeInteger(after.currentCell)
    || before.currentCell < 0 || after.currentCell < 0
    || before.currentCell >= before.width * before.height
    || after.currentCell >= after.width * after.height) return null;
  const observed = publicImmediatePressureCue(before);
  if (!observed || observed.steps !== 1 || publicImmediatePressureCue(after)) return null;
  const from = before.currentCell, to = after.currentCell, trap = observed.cell;
  const gridDistance = (a, b) => ({
    x: Math.abs(a % after.width - b % after.width),
    z: Math.abs(Math.floor(a / after.width) - Math.floor(b / after.width))
  });
  const movement = gridDistance(from, to), withdrawal = gridDistance(to, trap);
  if (movement.x + movement.z !== 1
    || withdrawal.x !== 1 || withdrawal.z !== 1) return null;
  const disclosedEdge = state => {
    const byCell = new Map(state.cells.map(cell => [cell?.cell, cell]));
    const start = byCell.get(from), end = byCell.get(to), hazard = byCell.get(trap);
    return !!start && !!end && !!hazard
      && !start.blocked && !end.blocked && hazard.trap === true
      && !hazard.blocked && state.visibleCells.includes(trap)
      && state.visibleCells.includes(state.currentCell)
      && Array.isArray(start.neighbors) && start.neighbors.includes(to)
      && Array.isArray(end.neighbors) && end.neighbors.includes(from)
      && !state.doors.some(door => !door.open
        && ((door.a === from && door.b === to)
          || (door.b === from && door.a === to)));
  };
  if (!disclosedEdge(before) || !disclosedEdge(after)) return null;
  return {cell:trap,steps:2,withdrawal:true};
}

export function publicObjective(snapshot) {
  const {currentCell, width, height} = snapshot ?? {};
  if (!Number.isInteger(currentCell) || !Number.isInteger(width) || !Number.isInteger(height)
    || width < 1 || height < 1 || currentCell < 0 || currentCell >= width * height || snapshot.result) return null;
  const known = new Map((Array.isArray(snapshot.cells) ? snapshot.cells : [])
    .filter(cell => Number.isInteger(cell.cell) && Array.isArray(cell.neighbors))
    .map(cell => [cell.cell, cell]));
  if (!known.has(currentCell) || known.get(currentCell).blocked) return null;
  const doors = Array.isArray(snapshot.doors) ? snapshot.doors : [];
  const distance = new Map([[currentCell, 0]]);
  const firstStep = new Map();
  const queue = [currentCell];
  for (let i = 0; i < queue.length; i++) {
    const from = queue[i], origin = known.get(from);
    for (const to of origin.neighbors) {
      if (!Number.isInteger(to) || to < 0 || to >= width * height || distance.has(to)) continue;
      const target = known.get(to);
      const adjacent = Math.abs(from % width - to % width)
        + Math.abs(Math.floor(from / width) - Math.floor(to / width)) === 1;
      if (!adjacent || !target || target.blocked || !target.neighbors.includes(from)) continue;
      if (doors.some(door => !door.open
        && ((door.a === from && door.b === to) || (door.a === to && door.b === from)))) continue;
      distance.set(to, distance.get(from) + 1);
      firstStep.set(to, from === currentCell ? to : firstStep.get(from));
      queue.push(to);
    }
  }
  const keys = (Array.isArray(snapshot.keys) ? snapshot.keys : [])
    .filter(key => !key.collected && distance.has(key.cell))
    .sort((a, b) => distance.get(a.cell) - distance.get(b.cell) || a.cell - b.cell);
  if (keys.length) return {kind: 'key', cell: keys[0].cell, steps: distance.get(keys[0].cell), firstStep: firstStep.get(keys[0].cell) ?? null};
  if (Number.isInteger(snapshot.exitCell) && distance.has(snapshot.exitCell))
    return {kind: 'exit', cell: snapshot.exitCell, steps: distance.get(snapshot.exitCell), firstStep: firstStep.get(snapshot.exitCell) ?? null};
  return null;
}


/**
 * Keep a known coastal garden in the composition when Pip stands on its edge.
 * The bias is screen-lateral only and based on nearby DISCLOSED public cells;
 * it reveals no hidden corridors and affects no authoritative AI decision.
 * Values are world-space offsets for the fixed isometric camera.
 */
export function publicStageBias(snapshot) {
  const {currentCell, width, height} = snapshot ?? {};
  if (!Number.isInteger(currentCell) || !Number.isInteger(width) || !Number.isInteger(height)
    || width < 1 || height < 1 || currentCell < 0 || currentCell >= width * height || snapshot.result)
    return {x: 0, z: 0};
  const col = currentCell % width, row = Math.floor(currentCell / width);
  const nearby = (Array.isArray(snapshot.cells) ? snapshot.cells : []).filter(c =>
    Number.isInteger(c.cell) && c.cell >= 0 && c.cell < width * height && !c.blocked
    && Math.abs(c.cell % width - col) + Math.abs(Math.floor(c.cell / width) - row) <= 4);
  if (nearby.length < 2) return {x: 0, z: 0};
  const avgCol = nearby.reduce((sum, c) => sum + c.cell % width, 0) / nearby.length;
  const avgRow = nearby.reduce((sum, c) => sum + Math.floor(c.cell / width), 0) / nearby.length;
  // Camera offset is (15,21,18); its screen-right vector is (18,0,-15).
  const rightX = 18 / Math.hypot(18, 15), rightZ = -15 / Math.hypot(18, 15);
  const lateral = ((avgCol - col) * rightX + (avgRow - row) * rightZ) * 2.4;
  const shift = clamp(lateral * .9, -2.75, 2.75);
  return {x: rightX * shift, z: rightZ * shift};
}

/**
 * Camera-only offset. Callers pass the sanitized/public stage bias and a
 * world-space delta to an already-disclosed reachable landmark. It says
 * nothing about safety, AI intent or hidden geometry. Keep the near-goal
 * hero/landmark framing, but give the known stage room beside open water.
 */
export function composePublicCameraFocus(stageBias, goalDelta, nearGoal = false, aspect = 1) {
  const finite = value => Number.isFinite(value) ? value : 0;
  const stageWeight = nearGoal ? .58 : aspect < .9 ? .23 : 1;
  const goalWeight = nearGoal ? .24 : 0;
  const x = finite(stageBias?.x) * stageWeight + finite(goalDelta?.x) * goalWeight;
  const z = finite(stageBias?.z) * stageWeight + finite(goalDelta?.z) * goalWeight;
  // In close framing the explorer must remain in view: bound both combined
  // pulls rather than separately clipping components into a diagonal drift.
  const limit = nearGoal ? 2.5 : 2.75;
  const scale = Math.min(1, limit / (Math.hypot(x, z) || 1));
  return {x: x * scale, z: z * scale};
}

/**
 * Select a nearby sealed gate that the public snapshot ALREADY exposes.
 * This is a visual obstacle, not a reachable waypoint or safe route. A gate
 * with one known endpoint is rendered by the world, so its camera framing may
 * use the same already-public door record. No undisclosed cell is traversed.
 */
export function publicNearbySealedGate(snapshot) {
  const {currentCell, width, height} = snapshot ?? {};
  if (!Number.isInteger(currentCell) || !Number.isInteger(width) || !Number.isInteger(height)
    || width < 1 || height < 1 || currentCell < 0 || currentCell >= width * height
    || snapshot.result) return null;
  const known = new Set((Array.isArray(snapshot.cells) ? snapshot.cells : [])
    .filter(cell => Number.isInteger(cell.cell) && !cell.blocked)
    .map(cell => cell.cell));
  if (!known.has(currentCell)) return null;
  const gridDistance = (a, b) => Math.abs(a % width - b % width)
    + Math.abs(Math.floor(a / width) - Math.floor(b / width));
  const eligible = (Array.isArray(snapshot.doors) ? snapshot.doors : [])
    .filter(door => !door.open && Number.isInteger(door.a) && Number.isInteger(door.b)
      && door.a >= 0 && door.b >= 0 && door.a < width * height && door.b < width * height
      && gridDistance(door.a, door.b) === 1)
    .map(door => {
      const sides = [door.a, door.b].filter(cell => known.has(cell));
      return sides.length ? {a: door.a, b: door.b,
        steps: Math.min(...sides.map(cell => gridDistance(currentCell, cell)))} : null;
    })
    .filter(gate => gate && gate.steps <= 1)
    .sort((a, b) => a.steps - b.steps || a.a - b.a || a.b - b.b);
  return eligible[0] ?? null;
}


/**
 * Temporary camera-only punctuation for a physically opened known passage.
 * Both endpoints and the actual before/after door records are from PUBLIC
 * authoritative snapshots, never the generator, solver or enemy plans.
 * The gate must have been visibly closed in this SAME run, then opened, with
 * a genuinely known nearby floor cell. This does NOT unlock the gate.
 */
export function publicGateOpeningCameraCue(before, after) {
  if (!before || !after || typeof before.runToken !== 'string'
    || before.runToken !== after.runToken || before.result || after.result
    || !Number.isSafeInteger(before.tick) || !Number.isSafeInteger(after.tick)
    || after.tick <= before.tick || !Number.isSafeInteger(after.width)
    || !Number.isSafeInteger(after.height) || after.width < 1 || after.height < 1
    || !Number.isSafeInteger(after.currentCell) || after.currentCell < 0
    || after.currentCell >= after.width * after.height
    || !Array.isArray(before.doors) || !Array.isArray(after.doors)
    || !Array.isArray(after.cells)) return null;
  const known = new Set(after.cells.filter(cell => Number.isSafeInteger(cell?.cell)
    && !cell.blocked).map(cell => cell.cell));
  if (!known.has(after.currentCell)) return null;
  const edge = (a,b) => (a < b ? a + ':' + b : b + ':' + a);
  const valid = door => Number.isSafeInteger(door?.a) && Number.isSafeInteger(door?.b)
    && door.a >= 0 && door.b >= 0 && door.a !== door.b
    && door.a < after.width * after.height && door.b < after.width * after.height
    && Math.abs(door.a % after.width - door.b % after.width)
      + Math.abs(Math.floor(door.a / after.width) - Math.floor(door.b / after.width)) === 1;
  const previousClosed = new Map(before.doors.filter(door => valid(door) && door.open === false)
    .map(door => [edge(door.a,door.b),door]));
  const distance = cell => Math.abs(cell % after.width - after.currentCell % after.width)
    + Math.abs(Math.floor(cell / after.width) - Math.floor(after.currentCell / after.width));
  // A real opening can happen while autonomous Pip finishes the next public
  // step. Preserve that witnessed portcullis reveal at TWO cells only if
  // both links are already disclosed, reciprocal, and traversable. A nearby
  // but disconnected door never takes over the camera or leaks a hidden route.
  const knownCells = new Map(after.cells.filter(cell => known.has(cell.cell))
    .map(cell => [cell.cell, cell]));
  const linkedTwoSteps = end => {
    const first = knownCells.get(after.currentCell);
    const last = knownCells.get(end);
    if (!Array.isArray(first?.neighbors) || !Array.isArray(last?.neighbors)) return false;
    return first.neighbors.some(mid => {
      const middle = knownCells.get(mid);
      return Array.isArray(middle?.neighbors)
        && middle.neighbors.includes(after.currentCell)
        && middle.neighbors.includes(end)
        && last.neighbors.includes(mid);
    });
  };
  const candidates = after.doors.filter(door => valid(door) && door.open === true
    && previousClosed.has(edge(door.a,door.b)))
    .map(door => {
      const ends=[door.a,door.b].filter(cell => known.has(cell));
      const steps=ends.length ? Math.min(...ends.map(distance)) : Infinity;
      if (steps > 2 || (steps === 2 && !ends.some(end =>
        distance(end) === 2 && linkedTwoSteps(end)))) return null;
      const closed=previousClosed.get(edge(door.a,door.b));
      return {a:door.a,b:door.b,steps,
        keyed:typeof closed.requiredKeyId==='string' && closed.requiredKeyId.length>0
          && Array.isArray(before.inventory) && before.inventory.includes(closed.requiredKeyId)};
    }).filter(Boolean)
    .sort((a,b)=>a.steps-b.steps||a.a-b.a||a.b-b.b);
  return candidates[0] ?? null;
}


/**
 * Stage only a real public CLOSED-to-OPEN gate along its disclosed passage.
 * This is an alternate physical camera azimuth, NOT another objective or an
 * inferred corridor. No allocations in the render loop, no simulation access.
 */
export function setPublicGateOpeningStageOffset(target, cue, width, publicGateToHero = null, viewportAspect = null) {
  if (!target || typeof target.set !== 'function'
    || !Number.isSafeInteger(width) || width < 2
    || !Number.isSafeInteger(cue?.a) || !Number.isSafeInteger(cue?.b)
    || cue.a < 0 || cue.b < 0 || cue.a === cue.b) return false;
  const across = Math.floor(cue.a / width) === Math.floor(cue.b / width)
    && Math.abs(cue.a - cue.b) === 1;
  const along = cue.a % width === cue.b % width
    && Math.abs(cue.a - cue.b) === width;
  if (!across && !along) return false;
  // The original source-bound 1280px Pass108 gate images still hide Pip's
  // legs behind the near parapet even after the tall garden is lowered.
  // Raise the ORIGINAL camera above the physical forecourt during a truly
  // witnessed opening, like a short diorama crane shot. Keep the existing
  // azimuth quadrant for continuity; no model or obstacle is removed.
  // Normal Follow, known CLOSED, reduced-motion and hidden gates never use it.
  // The real Pass110 1280x900 MID image proved that merely raising the
  // camera along the old +X/+Z direction still leaves Pip's torso/feet behind
  // a solid foreground terrace. During an AUTHENTIC opening, the caller may
  // provide the observed gate-to-Pip horizontal displacement. The physical
  // camera moves to an oblique, gate-side view where that foreground wall
  // is BEHIND the actor instead of between the lens and their body.
  //
  // This never uses a guessed future path, private maze, collider, AI state,
  // off-board waypoint, shader cutout or actor relocation. All offsets remain
  // finite; no extra camera, world mesh or frame allocations are required.
  if (publicGateToHero !== null) {
    const x = publicGateToHero?.x, z = publicGateToHero?.z;
    if (!Number.isFinite(x) || !Number.isFinite(z)
      || Math.hypot(x, z) > 7.2) return false;
    // A face-on camera from the gate would hide Pip behind its own physical
    // portcullis. The large tangential component gives a genuine side-on view
    // of the *same* actor/arch; a smaller signed component is on the gate
    // side of Pip, opposite the screenshot's offending foreground parapet.
    const normal = along ? z : x;
    const gateSide = normal < -.05 ? -1 : normal > .05 ? 1 : -1;
    // Pass115: SHA-verified native 1280 MID still places a solid gate post
    // over Pip's lower arm/boot. On a genuinely witnessed LANDSCAPE opening,
    // let the physical lens move more tangentially to the same real arch.
    // Preserve portrait Follow camera and legacy three/four-argument callers.
    const landscapeStage = Number.isFinite(viewportAspect) && viewportAspect >= 1.1;
    const tangent = landscapeStage ? 28 : 24;
    const normalOffset = landscapeStage ? 8 : 11;
    const elevation = landscapeStage ? 31 : 30;
    if (along) target.set(tangent, elevation, gateSide * normalOffset);
    else target.set(gateSide * normalOffset, elevation, tangent);
    return true;
  }
  // Preserve the historical three-argument, source-safe crane contract for
  // callers without an observed hero. Only the actual game supplies the
  // optional disclosed displacement, never untrusted/private state.
  if (along) target.set(6, 34, 25);
  else target.set(25, 34, 6);
  return true;
}

/**
 * Frame Pip AND the authentic opening arch rather than pulling toward
 * unrelated visible stage scenery. The old stage bias put Pip behind the
 * nearest parapet in the verified Pass108 1280px MID image. This pure
 * camera-only offset uses only the caller's public gate-to-hero delta.
 * Invalid numbers fail closed; no private route or hidden cell is inspected.
 */
export function composePublicGateOpeningFocus(gateDelta, aspect = 1) {
  if (!Number.isFinite(gateDelta?.x) || !Number.isFinite(gateDelta?.z)
    || !Number.isFinite(aspect) || aspect <= 0) return {x:0,z:0};
  const weight = aspect < .9 ? .25 : .32;
  const x = gateDelta.x * weight, z = gateDelta.z * weight;
  const limit = aspect < .9 ? 1.2 : 1.7;
  const length = Math.hypot(x,z);
  const scale = length > limit ? limit / length : 1;
  return {x:x*scale,z:z*scale};
}

/**
 * Let Pip and an actually modeled closed gate share the shot. Since a sealed
 * gate is NOT a legal route, it takes no role in publicObjective/AI guidance.
 * The nearby, already-disclosed terrain must occupy more of the frame than
 * empty lagoon. Keep the modeled gate in view, but do not let a fringe gate
 * drag the whole camera away from known walkable stage. Portrait still limits
 * the lateral shift so the hero and obstruction stay legible together.
 */
export function composePublicSealedGateFocus(stageBias, gateDelta, aspect = 1) {
  const finite = value => Number.isFinite(value) ? value : 0;
  const portrait = aspect < .9;
  // Both vectors are derived from disclosed public cells/doors. Preserve
  // coastal floor context, but let the *actually visible* closed obstruction
  // counter the stage pull: stage-heavy framing pushed both Pip and the gate
  // into the left edge of the real pass-18 desktop/portrait captures.
  // This is a camera target only, never an AI route or a traversal hint.
  const stageWeight = portrait ? .44 : .85;
  const gateWeight = portrait ? .30 : .34;
  const x = finite(stageBias?.x) * stageWeight + finite(gateDelta?.x) * gateWeight;
  const z = finite(stageBias?.z) * stageWeight + finite(gateDelta?.z) * gateWeight;
  const limit = portrait ? 1.1 : 2.6;
  const scale = Math.min(1, limit / (Math.hypot(x, z) || 1));
  return {x: x * scale, z: z * scale};
}


/**
 * Camera-only punctuation for Pip presenting the exact carried key to an
 * already-disclosed closed gate. The ordinary sealed-gate camera continues to
 * favour surrounding architecture; this variant puts the small physical
 * glove/lock pairing closer to the middle of the frame on a narrow screen.
 *
 * Callers must first establish publicCarriedGateCue. Neither a door's secret
 * requirements nor a route or game action is inferred by this pure helper.
 */
export function composePublicKeyLockFocus(stageBias, gateDelta, aspect = 1) {
  const finite = value => Number.isFinite(value) ? value : 0;
  const portrait = aspect < .9;
  // Pass39's extra stage pull drove the closed gate off the left edge while
  // leaving the public right arch cropped. Preserve the pass37 hero/gate
  // balance and improve the empty-water rendering independently.
  const stageWeight = portrait ? .35 : .52;
  const gateWeight = portrait ? .49 : .46;
  const x = finite(stageBias?.x) * stageWeight + finite(gateDelta?.x) * gateWeight;
  const z = finite(stageBias?.z) * stageWeight + finite(gateDelta?.z) * gateWeight;
  const limit = portrait ? 1.5 : 2.45;
  const scale = Math.min(1, limit / (Math.hypot(x, z) || 1));
  return {x: x * scale, z: z * scale};
}


/**
 * A *cosmetic* key-in-hand response to the gate immediately beside Pip.
 * This requires three independent, public facts: a disclosed nearby closed
 * door, its exact public requiredKeyId in inventory, and actual visual
 * proximity. It never opens the door, invents a route, or consults hidden map
 * cells. The octagonal key/crest uses the same disclosed authority snapshot.
 */
export function publicCarriedGateCue(snapshot, pose) {
  const gate = publicNearbySealedGate(snapshot);
  if (!gate || !Number.isFinite(pose?.x) || !Number.isFinite(pose?.z)) return null;
  const door = (Array.isArray(snapshot.doors) ? snapshot.doors : []).find(item =>
    !item.open && ((item.a === gate.a && item.b === gate.b)
      || (item.a === gate.b && item.b === gate.a)));
  const keyId = door?.requiredKeyId;
  if (typeof keyId !== 'string' || !keyId || !Array.isArray(snapshot.inventory)
    || !snapshot.inventory.includes(keyId)) return null;
  const cellPosition = cell => ({
    x: (cell % snapshot.width - (snapshot.width - 1) / 2) * 2.4,
    z: (Math.floor(cell / snapshot.width) - (snapshot.height - 1) / 2) * 2.4,
  });
  const a = cellPosition(gate.a), b = cellPosition(gate.b);
  const dx = (a.x + b.x) / 2 - pose.x;
  const dz = (a.z + b.z) / 2 - pose.z;
  const distance = Math.hypot(dx, dz);
  // The key must be visible only at a real nearby lock, never as a remote
  // navigation instruction. Keep reduced motion free to show a static pose.
  if (!Number.isFinite(distance) || distance >= 3.6) return null;
  const strength = clamp((3.6 - distance) / 2.4, 0, 1);
  if (strength < .2) return null;
  return {heading: Math.atan2(dx, dz), strength, a: gate.a, b: gate.b};
}

/**
 * Public-only, non-authoritative HUD context: same already visible matching
 * key and truly CLOSED nearby gate that can provoke Pip's cosmetic gesture.
 * The current disclosed cell is the stable snapshot position; continuous
 * camera interpolation never gives the text access to hidden authority.
 */
export function publicHeldGateStatus(snapshot) {
  const {currentCell, width, height} = snapshot ?? {};
  if (!Number.isInteger(currentCell) || !Number.isInteger(width) || !Number.isInteger(height)
      || width < 1 || height < 1 || currentCell < 0 || currentCell >= width * height)
    return false;
  const pose = {
    x: (currentCell % width - (width - 1) / 2) * 2.4,
    z: (Math.floor(currentCell / width) - (height - 1) / 2) * 2.4,
  };
  return !!publicCarriedGateCue(snapshot, pose);
}

export function drawMinimap(canvas, snapshot, highContrast = false) {
  if (!canvas || !snapshot) return;
  const context = canvas.getContext('2d');
  const ratio = Math.min(globalThis.devicePixelRatio || 1, 2);
  const rect = canvas.getBoundingClientRect();
  if (rect.width < 2 || rect.height < 2) return;
  const width = Math.max(1, Math.round(rect.width * ratio));
  const height = Math.max(1, Math.round(rect.height * ratio));
  if (canvas.width !== width || canvas.height !== height) { canvas.width = width; canvas.height = height; }
  context.clearRect(0, 0, width, height);
  const unit = Math.min((width - 14) / snapshot.width, (height - 14) / snapshot.height);
  const ox = (width - snapshot.width * unit) / 2, oy = (height - snapshot.height * unit) / 2;
  const point = cell => ({ x: ox + (cell % snapshot.width + 0.5) * unit, y: oy + (Math.floor(cell / snapshot.width) + 0.5) * unit });
  const known = new Set(snapshot.cells.map(item => item.cell));
  context.lineWidth = Math.max(1.4 * ratio, unit * 0.55);
  context.lineCap = 'square';
  for (const cell of snapshot.cells) {
    const p = point(cell.cell);
    context.fillStyle = highContrast ? '#ededdf' : cell.visible ? '#b4cabb' : '#577468';
    context.fillRect(p.x - unit * .32, p.y - unit * .32, unit * .64, unit * .64);
    context.strokeStyle = context.fillStyle;
    for (const neighbor of cell.neighbors) {
      if (!known.has(neighbor) || neighbor < cell.cell) continue;
      const q = point(neighbor);
      context.beginPath(); context.moveTo(p.x, p.y); context.lineTo(q.x, q.y); context.stroke();
    }
  }
  for (const key of snapshot.keys.filter(key => !key.collected && known.has(key.cell))) {
    const p = point(key.cell); context.fillStyle = '#ffd480';
    context.beginPath(); context.arc(p.x, p.y, Math.max(2 * ratio, unit * .35), 0, Math.PI * 2); context.fill();
  }
  for (const threat of snapshot.threats) {
    const p = point(threat.cell); context.fillStyle = '#ff8780';
    context.fillRect(p.x - unit * .4, p.y - unit * .4, unit * .8, unit * .8);
  }
  if (snapshot.exitCell !== null) {
    const p = point(snapshot.exitCell); context.strokeStyle = '#ffe5b3'; context.lineWidth = 2 * ratio;
    context.strokeRect(p.x - unit * .4, p.y - unit * .4, unit * .8, unit * .8);
  }
  const current = point(snapshot.currentCell);
  context.fillStyle = '#f5ba61'; context.strokeStyle = '#173a36'; context.lineWidth = 1.8 * ratio;
  context.beginPath(); context.arc(current.x, current.y, Math.max(3 * ratio, unit * .55), 0, Math.PI * 2); context.fill(); context.stroke();
}


// Only a currently visible PUBLISHED pressure mechanism may cause Pip to
// physically brace. Remembered, unseen, blocked, invalid or terminal cells
// cannot. All calculations use the real interpolated PUBLIC position only;
// this is a cosmetic character cue, never an AI order or hidden-map hint.
export function publicObservedPressureReaction(snapshot, hero, cellSize) {
  if (!snapshot || snapshot.result || !Array.isArray(snapshot.cells)
    || !Array.isArray(snapshot.visibleCells)
    || !Number.isSafeInteger(snapshot.width) || snapshot.width < 2
    || !Number.isSafeInteger(snapshot.height) || snapshot.height < 2
    || !(Number.isFinite(cellSize) && cellSize > 0)
    || !(Number.isFinite(hero?.x) && Number.isFinite(hero?.z))) return null;
  const visible = new Set(snapshot.visibleCells);
  let closest = null;
  for (const cell of snapshot.cells) {
    const id = cell?.cell;
    if (cell?.trap !== true || cell.blocked === true
      || !Number.isSafeInteger(id) || id < 0
      || id >= snapshot.width * snapshot.height || !visible.has(id)) continue;
    const x = (id % snapshot.width - (snapshot.width - 1) / 2) * cellSize;
    const z = (Math.floor(id / snapshot.width) - (snapshot.height - 1) / 2) * cellSize;
    const distance = Math.hypot(x - hero.x, z - hero.z);
    if (distance >= cellSize * 1.45 || (closest
      && (distance > closest.distance
        || (distance === closest.distance && id >= closest.cell)))) continue;
    closest = {cell:id, x, z, distance};
  }
  if (!closest) return null;
  // One-cell encounter -> full brace, visible diagonal -> light anticipation.
  const strength = Math.max(0, Math.min(1,
    (1.45 - closest.distance / cellSize) / .45));
  return {...closest, strength};
}
