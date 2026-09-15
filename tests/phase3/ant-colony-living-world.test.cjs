'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const root=path.resolve(__dirname,'../..');
const app=fs.readFileSync(path.join(root,'public/ai-ant-colony/app.js'),'utf8');
const css=fs.readFileSync(path.join(root,'public/ai-ant-colony/styles.css'),'utf8');

test('ant browser renderer exposes layered living-world primitives instead of a flat diagram',()=>{
  for(const token of ['WORLD_LAYERS','drawSurfaceBiome','drawSoilStrata','drawRoots','drawAtmosphere','worldToScreen']){
    assert.ok(app.includes(token),`missing living-world primitive: ${token}`);
  }
});

test('ants use natural morphology, deterministic movement and explicit LOD tiers',()=>{
  for(const token of ['ANT_LOD','drawAntNear','drawAntMid','drawAntFar','drawAntennae','drawMandibles','antMotion']){
    assert.ok(app.includes(token),`missing ant rendering primitive: ${token}`);
  }
  assert.match(app,/legs\s*=\s*6|LEG_COUNT\s*=\s*6/);
});

test('queen brood excavation and contextual pheromones have in-world presentation systems',()=>{
  for(const token of ['drawQueenChamber','drawBroodStages','drawExcavation','drawDigParticles','pheromoneMode','drawPheromoneRoute']){
    assert.ok(app.includes(token),`missing colony presentation primitive: ${token}`);
  }
});

test('documentary camera and environment presentation are bounded presentation-only systems',()=>{
  for(const token of ['SHOT_DWELL_MS','SHOT_COOLDOWN_MS','selectDocumentaryShot','dayPhase','seasonPalette','weatherMaterial']){
    assert.ok(app.includes(token),`missing documentary/environment primitive: ${token}`);
  }
  assert.ok(!/snapshot\.[A-Za-z0-9_.]+\s*=/.test(app),'browser presentation must not mutate authoritative snapshot');
});

test('broadcast CSS prioritizes the world and supports compact HUD mode',()=>{
  assert.ok(css.includes('--world-ui-ratio'));
  assert.ok(css.includes('.compact-hud'));
  assert.ok(css.includes('.world-stage'));
});
