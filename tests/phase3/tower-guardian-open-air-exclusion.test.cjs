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
    assert.ok(bars.filter(b=>b.width>5.5 && b.y<=4.75).length>=5,
      'live locked threshold has a short dense crossing barrier at hero height');
    assert.ok(bars.filter(b=>b.height>=13.9 && Math.abs(b.x)>2.8).length>=2,
      'actual 14m high source exclusion is still represented by connected edge pylons');
    assert.ok(bars.filter(b=>b.height>6 && Math.abs(b.z)>.2).length>=2,
      'high-voltage X braces visibly deny an invented airborne bypass without a screen-wide mesh');
    assert.equal(JSON.stringify(source),original,'visual scene cannot mutate source authority');
    const taller={...source,tick:281,guardianSealHeight:180000};
    assert.equal(passage.lock(taller,anchor),true);
    bars=entries(seal);
    assert.ok(bars.some(b=>b.height>=17.9 && Math.abs(b.x)>2.8),
      'source-driven increased vertical exclusion height is visible without recreating geometry');
    assert.ok(bars.filter(b=>b.height>9&&Math.abs(b.z)>.2).length>=2,
      'angled high-voltage braces extend as source height changes');
    assert.ok(seal.count<=19,'resource budget stays bounded after source height changes');
    assert.equal(passage.diagnostics().physicallyWalkableThreshold.sourceSimulationSealActive,true);
    const defeated={...taller,tick:282,enemies:[{...guardian,active:false,health:0}]};
    assert.equal(passage.unlock(defeated,anchor),true);
    assert.equal(seal.visible,false,'only genuine source defeat visually retracts the high seal');
    passage.clear();
    assert.equal(passage.diagnostics().active,false,'restart/recovery retire the gate');
  } finally { passage.dispose(); }
});
