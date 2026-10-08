'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const root=path.resolve(__dirname,'../..');
const read=file=>fs.readFileSync(path.join(root,file),'utf8');

test('v3 uses a first-party CSS route and accessible, authoritative arena telemetry',()=>{
  const html=read('public/ai-battle-royale/index.html');
  const css=read('public/ai-battle-royale/ux-v3.css');
  const app=read('public/ai-battle-royale/app.js');
  const server=read('scripts/serve-battle-royale-stream.cjs');
  assert.match(html,/data-ux-revision="3"/);
  assert.match(html,/\/battle\/ux-v3\.css/);
  assert.match(server,/\/battle\/ux-v3\.css/);
  assert.match(server,/'ux-v3\.css'/);
  for(const token of ['--royal-cyan','--royal-violet','--royal-magenta','--royal-lime','--royal-amber'])assert.ok(css.includes(token));
  for(const id of ['arena-biome','arena-counter','arena-contenders','arena-storm','arena-director']){
    assert.match(html,new RegExp('id="'+id+'"'));
    assert.match(app,new RegExp("'#"+id+"'"));
  }
  assert.match(app,/function updateArenaChips\(/);
  assert.match(app,/snapshot\.goal\.survivors/);
  assert.match(app,/snapshot\.zone\.phase/);
  assert.match(css,/clean-feed \.arena-topline/);
  assert.match(css,/data-high-contrast="true"/);
});

test('3D environment uses original cacheable, biome-specific static geometry',()=>{
  const renderer=read('public/ai-battle-royale/arena3d.js');
  for(const fn of ['districtDetails','surroundingTerrain','terrainDetails','environmentProps','biomeWeather'])
    assert.match(renderer,new RegExp('function '+fn+'\\('));
  assert.match(renderer,/worldStatic\(/);
  assert.match(renderer,/worldDynamic\(/);
  assert.match(renderer,/STATIC_DRAW/);
  assert.match(renderer,/quality==='low'/);
  assert.match(renderer,/reducedMotion/);
  assert.doesNotMatch(renderer,/Math\.random\(|fetch\(|WebSocket\(/);
});
