import { angleFor, SCALE } from './coordinates.mjs';
import { observedTraversalKinetics } from './traversal-kinetics.mjs';
import { observedSceneHierarchy } from './scene-hierarchy.mjs';

// An original source-synchronised atmospheric volume surrounding the real
// climbing lane, not a screen-space weather filter. Every instance is inside
// one bounded draw and derived from a public fixed-step snapshot. No random
// source, extra render loop, authoritative changes, or licensed assets.
const MAX_MOTES = 96;
const TAU = Math.PI * 2;
const STYLES = Object.freeze({
  foundry: { tint: 0xffae73, rise: 1.9, slant: 0.2, height: 1.9, width: 0.075, opacity: .65 },
  ruins: { tint: 0xd5e9ac, rise: 0.28, slant: 0.24, height: .70, width: 0.10, opacity: .38 },
  storm: { tint: 0xb0dff1, rise: -8.0, slant: 1.2, height: 3.5, width: 0.055, opacity: .43 },
  clockwork: { tint: 0xffd79c, rise: .55, slant: .34, height: .95, width: 0.085, opacity: .43 },
  void: { tint: 0xd6b8ff, rise: .25, slant: -.30, height: 1.1, width: .12, opacity: .58 },
});
const valid = Number.isFinite;
function fract(value) { return value - Math.floor(value); }
function hash(value) { return fract(Math.sin(value * 127.13 + 78.9) * 43758.5453); }
function positiveMod(value, divisor) { return ((value % divisor) + divisor) % divisor; }

export function createTowerAtmosphere(THREE) {
  const geometry = new THREE.TetrahedronGeometry(1, 0);
  const material = new THREE.MeshBasicMaterial({
    color: 0xffffff, transparent: true, opacity: .48,
    depthTest: true, depthWrite: false, fog: true, toneMapped: false,
  });
  const motes = new THREE.InstancedMesh(geometry, material, MAX_MOTES);
  motes.name = 'SourceBoundBiomeAtmosphere';
  motes.count = 0;
  motes.visible = false;
  motes.castShadow = false;
  motes.receiveShadow = false;
  motes.frustumCulled = false;
  motes.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  const group = new THREE.Group();
  group.name = 'OriginalBiomeAtmosphereVolume';
  group.add(motes);
  const dummy = new THREE.Object3D();
  const tone = new THREE.Color();
  let currentTheme = '', lastSourceTick = null, lastFloor = null;
  let hierarchyKind = 'ascent', hierarchyFocus = 0;
  let disposed = false;
  function clear() {
    motes.count = 0;
    motes.visible = false;
    lastSourceTick = null;
    lastFloor = null;
    hierarchyKind = 'ascent'; hierarchyFocus = 0;
  }
  function update(snapshot, options = {}) {
    if (disposed || options.stale || options.reducedMotion ||
      snapshot?.lifecycle !== 'running' || !snapshot.player ||
      snapshot.player.health <= 0 || !STYLES[snapshot.theme] ||
      !Number.isSafeInteger(snapshot.tick) || snapshot.tick < 0 ||
      !Number.isSafeInteger(snapshot.floor) || snapshot.floor < 0 ||
      typeof snapshot.runToken !== 'string' || !snapshot.runToken ||
      ![snapshot.player.x, snapshot.player.y, snapshot.worldWidth,
        snapshot.chunkBaseY].every(valid) || snapshot.worldWidth <= 0) {
      clear();
      return;
    }
    const style = STYLES[snapshot.theme];
    const count = options.quality === 'high' ? MAX_MOTES : 40;
    const frame = snapshot.tick / 20;
    const heroAngle = angleFor(snapshot.player.x, snapshot.worldWidth);
    const heroHeight = (snapshot.player.y - snapshot.chunkBaseY) / SCALE;
    const kinetics = observedTraversalKinetics(snapshot);
    const hierarchy = observedSceneHierarchy(snapshot);
    hierarchyKind = hierarchy.kind; hierarchyFocus = hierarchy.focus;
    const guardianWarning = snapshot.enemies?.some(enemy => enemy.active && enemy.telegraph) === true;
    // A physically layered weather stream responds to witnessed health and
    // velocity instead of floating at a constant, game-independent tempo.
    // No new draw pass, random source, collider, HUD or fictional danger.
    const cap = snapshot.player.maxHealth;
    const ratio = valid(cap) && cap > 0 && valid(snapshot.player.health) ?
      Math.max(0, Math.min(1, snapshot.player.health / cap)) : 1;
    const pressure = Math.max(0, Math.min(1, (.55 - ratio) / .35));
    const lateral = valid(snapshot.player.vx) ?
      Math.max(-1, Math.min(1, snapshot.player.vx / 10000)) : 0;
    // A physical ascent/descent stretches nearby air, but a REAL guardian
    // windup dims everything: danger and body silhouettes always win.
    material.opacity = style.opacity * (guardianWarning ? .28 : .62) *
      (1 - .32 * pressure) * (1 + kinetics.airflow * .09) *
      (1 - .64 * hierarchy.focus);
    if (currentTheme !== snapshot.theme) {
      tone.set(style.tint);
      for (let i = 0; i < MAX_MOTES; i++) {
        const luminance = .72 + hash(i * 17 + 3) * .28;
        motes.setColorAt(i, tone.clone().multiplyScalar(luminance));
      }
      motes.instanceColor.needsUpdate = true;
      currentTheme = snapshot.theme;
    }
    for (let i = 0; i < count; i++) {
      // World-space weather between the tower and the moving exterior camera.
      // All source/playback variability comes from source floor/tick/position.
      // A ring of subtly independent shafts creates visible parallax on orbit.
      const seed = i * 19.17 + snapshot.floor * 11.73;
      // Protect a physically threatened landing/combat lane from bright
      // airborne streaks. World-anchored distant motes retain the scale cue.
      const nearWake = i % 4 === 0 && kinetics.airflow > .08 &&
        !guardianWarning && hierarchy.focus < .7;
      const bearing = heroAngle + (hash(seed + 2) - .5) *
        (nearWake ? 1.04 : 2.15 - .38 * pressure);
      const angle = bearing + frame * style.slant * .008 +
        (lateral + kinetics.shear * .32) * .055 * (i % 2 ? 1 : .65);
      // Near wake follows the actual direction of a source-observed flight;
      // the other three quarters remain distant world-volume landmarks.
      // All particles stay outside the real 27.18-unit traversable shell.
      const radius = nearWake ? 30.15 + hash(seed + 5) * 2.9 :
        (i % 3 === 0 ? 30.2 + hash(seed + 5) * 9 :
          39 + hash(seed + 5) * 13) - pressure * .9;
      // CRITICAL: anchor each mote to the WORLD, not heroHeight + a cycling
      // relative offset. Otherwise the entire weather field rides upward with
      // the climber, deleting vertical motion parallax and the sense of scale.
      // The world lattice repeats only at the 46-unit outer observation edge.
      const worldPhase = hash(seed + 9) * 46 +
        frame * (style.rise + lateral * .17);
      const height = positiveMod(worldPhase - heroHeight + 23, 46) - 23;
      const diameter = style.width * (.55 + hash(seed + 12) * 1.05) *
        (nearWake ? .80 : 1);
      const length = style.height * (.52 + hash(seed + 18)) *
        (nearWake ? 1 + kinetics.airflow * 1.75 : 1 + kinetics.airflow * .16);
      dummy.position.set(Math.sin(angle) * radius, heroHeight + height,
        Math.cos(angle) * radius);
      dummy.rotation.set(style.slant * .15, bearing,
        -style.slant * .18 - lateral * .09 +
        (nearWake ? (kinetics.ascent - kinetics.descent) * .18 : 0));
      dummy.scale.set(diameter, length, diameter);
      dummy.updateMatrix();
      motes.setMatrixAt(i, dummy.matrix);
    }
    motes.count = count;
    motes.instanceMatrix.needsUpdate = true;
    motes.visible = true;
    lastSourceTick = snapshot.tick;
    lastFloor = snapshot.floor;
  }
  function diagnostics() {
    return {
      sourceBound: true, theme: currentTheme || null, instances: motes.count,
      visible: motes.visible, lastSourceTick, lastFloor, drawCallsIfVisible: motes.visible ? 1 : 0,
      reducedMotionPolicy: 'hide atmospheric motion',
      motionSource: 'public fixed-step tick, biome, fixed world-height lattice and actual vertical velocity; no new simulation RNG',
      verticalParallax: 'world-anchored repeating exterior strata; source-vy only stretches near wake',
      encounterHierarchy: { kind: hierarchyKind, focus: hierarchyFocus,
        sourceOwned: true, addedDrawCalls: 0 },
      physicalDevicePerformance: 'NOT MEASURED',
    };
  }
  function dispose() {
    if (disposed) return;
    clear(); disposed = true;
    geometry.dispose();
    material.dispose();
    group.clear();
  }
  return { group, update, clear, diagnostics, dispose };
}
