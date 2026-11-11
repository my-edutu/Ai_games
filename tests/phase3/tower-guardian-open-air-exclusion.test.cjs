'use strict';
// P0 source-authentic guardian film: the former 14m prison grid repeatedly
// obscured actual skinned combat in desktop and 390x844 portrait at 14–24s.
// This protects an *open-air visual exclusion envelope*, not game authority.
const test = require('node:test');
const assert = require('node:assert/strict');
const THREE = require('three');

test('source-locked upper-cap exclusion retains real lock while clearing airborne sightlines', async () => {
  const { createTowerGuardianPassage } = await import('../../public/infinite-tower-climb/visuals/guardian-passage.mjs');
  const cap = { id:'f8:cap', x:115200, y:3212000, width:249600, height:12000 };
  const guardian = { id:'f8:guardian', kind:'guardian', active:true, health:5, maxHealth:8,
    x:175000, y:3242000, halfHeight:18000 };
  const source = { runToken:'film-authentic-lock', floor:8, tick:280,
    lifecycle:'running', guardianExitX:cap.x+Math.floor(cap.width*.76),
    guardianSealHeight:140000, worldWidth:480000, chunkBaseY:2880000,
    player:{health:4}, platforms:[cap], enemies:[guardian] };
  const original = JSON.stringify(source);
  const anchor = { x:0,y:36,z:27.78,angle:0 };
  const passage = createTowerGuardianPassage(THREE);
  const matrix = new THREE.Matrix4(), position = new THREE.Vector3();
  const rotation = new THREE.Quaternion(), scale = new THREE.Vector3();
  const entries = seal => {
    const result = [];
    for(let i=0;i<seal.count;i++) {
      seal.getMatrixAt(i,matrix);
      matrix.decompose(position,rotation,scale);
      const z = new THREE.Euler().setFromQuaternion(rotation).z;
      result.push({x:position.x,y:position.y,width:scale.x,height:scale.y,z});
    }
    return result;
  };
  try {
    const seal = passage.group.getObjectByName('SourceLockedGuardianVerticalEnergyLattice');
    assert.ok(seal?.isInstancedMesh && seal.material.transparent);
    assert.equal(passage.lock(source, anchor),true);
    assert.equal(seal.visible,true);
    assert.equal(passage.diagnostics().stage,'guardian-locked');
    assert.ok(seal.count<=19,'no full-height 17-rung glowing prison grid on the filmed hero/guardian');
    let bars = entries(seal);
    const overhead = bars.filter(b=>b.width>5.5 && b.y>5 && b.y<13.5 && Math.abs(b.z)<.01);
    assert.equal(overhead.length,0,'open-air space above a physically barred doorway must not be a solid-screen grate');
    const lowerBars = bars.map((b,i)=>({...b,index:i}))
      .filter(b=>b.width>5.5 && b.y<=4.75);
    assert.equal(lowerBars.length,5,
      'the physical doorway retains five lower exclusion conductors rather than a visually passable adult-height opening');
    assert.ok(seal.instanceColor,
      'quiet lower conductors must have genuine per-instance visual hierarchy on the existing draw');
    const instanceTint = new THREE.Color();
    const energyLevels = lowerBars.map(b=>{
      seal.getColorAt(b.index,instanceTint);
      return instanceTint.r;
    });
    assert.equal(energyLevels.filter(level=>level>.9).length,3,
      'only three lower rails remain bright enough to read as the active gate, not a five-rung neon screen');
    assert.equal(energyLevels.filter(level=>level>.15 && level<.35).length,2,
      'two physical exclusion rails are recessed rather than adding visual clutter');
    passage.group.updateMatrixWorld(true);
    const sealWorld=new THREE.Vector3();seal.getWorldPosition(sealWorld);
    assert.ok(sealWorld.distanceTo(new THREE.Vector3(anchor.x,anchor.y,anchor.z))<.001,
      'live energized source lock shares the exterior bronze gate plane, not the inner fight plane');
    const threshold=passage.group.getObjectByName('ObservedWalkableGuardianThreshold');
    const deckWorld=new THREE.Vector3();threshold.getWorldPosition(deckWorld);
    assert.ok(Math.abs(Math.hypot(deckWorld.x,deckWorld.z)-25)<.02,
      'the earned inner walkable arch remains at genuine cap-deck radius');
    assert.ok(bars.filter(b=>b.width>.20&&b.width<.30&&Math.abs(b.x)>2.8).length>=4,
      'side-channel electrical couplers retain the actual locked appearance without crossing the combat centre');
    assert.ok(bars.filter(b=>b.height>=13.9 && Math.abs(b.x)>2.8).length>=2,
      'actual 14m high source exclusion is still represented by connected edge pylons');
    const highBraces = bars.filter(b=>b.height>6 && Math.abs(b.z)>.2);
    assert.equal(highBraces.length,2,
      'source-height energized side-channel stays visibly connected on both outer pylons');
    assert.ok(highBraces.every(b =>
      Math.abs(b.x) - Math.abs(Math.sin(b.z)) * b.height/2 >= 1.05),
      'the actual entire high brace silhouettes leave a central airborne duel window');
    assert.ok(highBraces[0].x * highBraces[1].x < 0,
      'the energized braces stay split across the live arch, not crossed over the climber');
    const calmOpacity=seal.material.opacity;
    const warning={...source,tick:281,enemies:[{...guardian,
      telegraph:true,telegraphTicksRemaining:5}]};
    assert.equal(passage.lock(warning,anchor),true);
    assert.ok(seal.material.opacity>calmOpacity+.12,
      'only a genuine live guardian telegraph should energize the field more strongly');
    assert.ok(entries(seal).every(b=>Number.isFinite(b.x) && Number.isFinite(b.y)),
      'a warning must never move or corrupt the actual source-sized gate frame');
    const ordinary={...source,tick:282};
    assert.equal(passage.lock(ordinary,anchor),true);
    assert.ok(Math.abs(seal.material.opacity-calmOpacity)<1e-9,
      'after a real warning expires, the gate returns to unobtrusive standby');
    assert.equal(JSON.stringify(source),original,'visual scene cannot mutate source authority');
    const taller={...source,tick:283,guardianSealHeight:180000};
    assert.equal(passage.lock(taller,anchor),true);
    bars=entries(seal);
    assert.ok(bars.some(b=>b.height>=17.9 && Math.abs(b.x)>2.8),
      'source-driven increased vertical exclusion height is visible without recreating geometry');
    assert.ok(bars.filter(b=>b.height>9&&Math.abs(b.x)>2.2).length>=2,
      'source-height side-channel braces extend without spanning the duel centre');
    assert.ok(bars.filter(b=>b.height>9&&Math.abs(b.x)>2.2).every(b=>
      Math.abs(b.x)-Math.abs(Math.sin(b.z))*b.height/2>=1.05),
      'even at 18m the high energized stays do not re-form the giant mid-air X');
    assert.ok(seal.count<=19,'resource budget stays bounded after source height changes');
    assert.equal(passage.diagnostics().physicallyWalkableThreshold.sourceSimulationSealActive,true);
    const defeated={...taller,tick:284,enemies:[{...guardian,active:false,health:0}]};
    assert.equal(passage.unlock(defeated,anchor),true);
    assert.equal(seal.visible,false,'only genuine source defeat visually retracts the high seal');
    passage.clear();
    assert.equal(passage.diagnostics().active,false,'restart/recovery retire the gate');
  } finally { passage.dispose(); }
});
