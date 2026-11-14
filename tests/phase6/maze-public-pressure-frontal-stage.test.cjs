'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const scene=fs.readFileSync(path.resolve(__dirname,
  '../../public/ai-maze-escape/scene.js'),'utf8');

test('authentic pressure jaw pair gets an actual distinct near-frontal 3D stage, not just a color or overlay',()=>{
  const match=scene.match(/const pressurePortraitCameraOffset = new THREE\.Vector3\(([-.\d]+),\s*([-.\d]+),\s*([-.\d]+)\)/);
  assert.ok(match,'render camera must own a real reusable 3D stage vector');
  const front=match.slice(1).map(Number), follow=[15,21,18];
  const xSeparation=([x,,z])=>Math.abs(z/Math.hypot(x,z));
  assert.ok(front[1]>16 && front[2]>20,'real 3D perspective, not a UI pan or flat overhead view');
  assert.ok(xSeparation(front)>xSeparation(follow)*1.25,
    'the opposed physical x-axis jaw faces must separate at least 25% more than the old oblique camera');
  // Pass290: the original near-frontal REAL 3D camera remains the authentic
  // published warning stage, but the observed close-contact frame now selects
  // its own eased, stage-driven quarter angle for a better Pip/jaw silhouette.
  // Require BOTH real camera stages to be live and bound to one public event;
  // this is stronger than matching a retired constant-only selection.
  assert.match(scene,/pressurePortraitStage \? pressureStageCameraOffset/,
    'rendering must select the actual live multi-beat pressure stage');
  assert.match(scene,/pressureStageCameraOffset\.copy\(pressurePortraitCameraOffset\)\s*\.lerp\(pressureContactCameraOffset, pressureContactWeight\)/,
    'published warning still starts at the original distinct near-frontal 3D camera');
  assert.match(scene,/publicPressureContactOrbitWeight\(\s*pressureProgress, pressurePortraitStage/,
    'only authentic published pressure progress may advance the second camera angle');
  assert.match(scene,/pressureContactCameraOffset\.x = publicPressureActorCounterflankX\(/,
    'contact framing must respond to the true actor side, not a fixed right post occlusion');
  assert.match(scene,/pose\.x, publicPressureTrap\?\.x, CELL_SIZE/,
    'camera counter-flank may use only the visible Pip/jaw physical relationship');
  assert.match(scene,/cameraOffset\.lerp\(openingStageView/,
    'the shared original smooth camera transition must remain in use');
  assert.match(scene,/pressureReframeEnvelope\.union\(/,
    'the existing strict real-mesh safety pass must remain active');
});

test('pressure frontal shot requires disclosed public action and never steals other encounters',()=>{
  assert.match(scene,/const pressurePortraitStage = pressureCameraBeat/,
    'public camera-beat authority is mandatory');
  assert.match(scene,/cameraMode === 'follow' && !settings\.reducedMotion/,
    'manual cameras and reduced-motion mode retain their prior framing');
  assert.match(scene,/!result && aspect >= \.35 && aspect < \.60/,
    'only portrait gameplay, never terminal or desktop, can rotate');
  assert.match(scene,/!cameraGate && !closestThreat\?\.strength && !showPickup/,
    'real gate, guardian and pickup stages outrank pressure');
  assert.match(scene,/s\.cells\.some\(c =>\s*c\.cell === publicPressureTrap\.cell && c\.trap === true && !c\.blocked\)/,
    'published nonblocked trap cell must be validated');
  assert.match(scene,/s\.visibleCells\.includes\(publicPressureTrap\.cell\)/,
    'unseen private hazards cannot select camera');
  assert.match(scene,/\|\| !!verifiedRetreatTrap/,
    'only strict previously witnessed retreat may retain the stage');
  assert.match(scene,/publicPhysicalPressureHorizontalReframe\(/,
    'unchanged strict connected-silhouette optical pan still protects 320/390');
});
