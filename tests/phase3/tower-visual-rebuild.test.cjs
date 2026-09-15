'use strict';
const test=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const read=p=>fs.readFileSync(path.join(ROOT,p),'utf8');

test('tower public renderer is world-first 2.5d presentation rather than primitive debug canvas',()=>{
  const js=read('public/infinite-tower-climb/app.js'),css=read('public/infinite-tower-climb/styles.css');
  for(const marker of ['PALETTES','drawTowerDepth','drawPlatform','drawHazard','drawClimber','drawEnemy','drawForeground','routeCue','MAX_PARTICLES=96','AudioContext'])assert.ok(js.includes(marker),`missing ${marker}`);
  assert.ok(!js.includes("ctx.roundRect(x-rw,y-rh,rw*2,rh*2,5)"),'placeholder climber rectangle returned');
  assert.ok(css.includes('.arena-wrap{position:absolute;inset:0'),'game world no longer owns full viewport');
  assert.ok(css.includes('body.clean-feed .top,body.clean-feed .side,body.clean-feed .caption,body.clean-feed .checkpoint-pill{display:none}'),'clean broadcast feed regressed');
});

test('tower renderer keeps visual systems bounded and authority-read-only',()=>{
  const js=read('public/infinite-tower-climb/app.js');
  assert.ok(js.includes('while(particles.length+count>MAX_PARTICLES)particles.shift()'),'particle pool is not bounded');
  assert.ok(!js.includes('innerHTML'),'unsafe DOM rendering introduced');
  assert.ok(js.includes('window.__TOWER_PUBLIC_STATE__=s'),'browser evidence state hook missing');
  assert.ok(js.includes("fetch(`/tower/state"),'renderer must consume public presentation state');
});

test('camera source includes hazard and guardian broadcast framing with reduced-motion safety',()=>{
  const source=read('games/infinite-tower-climb/src/presentation/camera.ts');
  assert.ok(source.includes("e.kind==='guardian'"));
  assert.ok(source.includes('snapshot.hazards.filter'));
  assert.ok(source.includes('targetX'));
  assert.ok(source.includes('reduced?1'));
  assert.ok(source.includes('impulse:danger'));
});

test('22-skill art-direction pass gives sectors unique architecture rather than palette swaps',()=>{
  const js=read('public/infinite-tower-climb/app.js');
  for(const marker of ['drawThemeArchitecture','drawFoundryMachinery','drawRuinsGrowth','drawStormCoils','drawClockworkGears','drawVoidFractures'])assert.ok(js.includes(marker),`missing theme architecture ${marker}`);
  assert.ok(js.includes('MILESTONE_FLOORS'),'milestone architecture contract missing');
});

test('public broadcast hides internal run identity and exposes bounded visual diagnostics',()=>{
  const js=read('public/infinite-tower-climb/app.js'),html=read('public/infinite-tower-climb/index.html');
  assert.ok(!js.includes("setText('run-token'"),'internal run token must not be written to the public HUD');
  assert.ok(!html.includes('data-testid="run-token"'),'internal run token must not have a public HUD slot');
  assert.ok(html.includes('data-testid="milestone"'),'public HUD should use the slot for a meaningful ascent milestone');
  for(const marker of ['__TOWER_RENDER_DIAGNOSTICS__','playerVisible','platformsVisible','hazardsVisible','guardiansVisible','frameMsP95'])assert.ok(js.includes(marker),`missing render diagnostic ${marker}`);
});

test('portrait mobile keeps climber vitals and AI intent readable instead of hiding the vital panel',()=>{
  const css=read('public/infinite-tower-climb/styles.css');
  assert.ok(css.includes('@media(max-width:760px) and (orientation:portrait)'),'portrait-specific broadcast layout contract missing');
  assert.ok(css.includes('body:not(.clean-feed) .side .vital-panel{display:block}'),'portrait mode must restore health and stamina');
  assert.ok(css.includes('body:not(.clean-feed) .side .intent-panel{display:block}'),'portrait mode must retain AI intent');
});
