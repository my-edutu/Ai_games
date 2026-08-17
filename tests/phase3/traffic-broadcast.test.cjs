'use strict';
const test=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs');const path=require('node:path');const traffic=require('../../dist/games/ai-city-traffic/src/index.js');

test('Phase 3 exports privacy-safe presentation and audio controllers',()=>{
  for(const name of ['buildTrafficRenderSnapshot','TrafficPresentationController','TrafficAudioDirector'])assert.equal(typeof traffic[name],'function',name);
});

test('render snapshots expose flow geometry and never expose authority secrets',()=>{
  const seed='private-seed-must-not-leak',runtime=traffic.TrafficRuntime.create({width:5,height:4,runTicks:600,spawnEveryTicks:1,maxVehicles:180},seed);for(let i=0;i<120;i++)runtime.step();
  const snapshot=traffic.buildTrafficRenderSnapshot(runtime.state),text=JSON.stringify(snapshot);
  assert.equal(snapshot.schemaVersion,1);assert.ok(snapshot.city.lanes.length>0);assert.ok(snapshot.vehicles.length>0);assert.ok(snapshot.hud.mobilityScore>=0);assert.ok(snapshot.hud.congestionPermille>=0&&snapshot.hud.congestionPermille<=1000);
  for(const secret of [seed,runtime.state.seed,runtime.state.runId,'viewerRef','rateWindows','pendingDemand'])assert.equal(text.includes(secret),false,secret);
  assert.equal(Object.hasOwn(snapshot,'seed'),false);assert.equal(Object.hasOwn(snapshot,'runId'),false);assert.equal(Object.hasOwn(snapshot,'vehiclesById'),false);
  assert.ok(snapshot.vehicles.every(vehicle=>!vehicle.token.startsWith('vehicle-')));
});

test('presentation controller is authority-isolated, monotonic, and bounded',()=>{
  const runtime=traffic.TrafficRuntime.create({width:4,height:4,runTicks:500,spawnEveryTicks:1,maxVehicles:120},'presentation-isolation'),controller=new traffic.TrafficPresentationController({replayCapacity:12,maxEntities:150,muted:false});
  for(let i=0;i<40;i++){runtime.step();const authorityAfterStep=runtime.checksum(),events=runtime.events.slice(-8),snapshot=traffic.buildTrafficRenderSnapshot(runtime.state),accepted=controller.accept(snapshot,events);assert.equal(accepted.accepted,true);assert.equal(runtime.checksum(),authorityAfterStep);}
  const authority=runtime.checksum(),stale=structuredClone(traffic.buildTrafficRenderSnapshot(runtime.state));stale.tick=Math.max(0,stale.tick-2);assert.equal(controller.accept(stale,[]).accepted,false);assert.equal(runtime.checksum(),authority);
  assert.ok(controller.replayWindow(99).length<=12);const mobile=controller.frame(390,844,{reducedMotion:true});assert.equal(mobile.layout,'mobile');assert.equal(mobile.options.reducedMotion,true);assert.ok(mobile.snapshot.vehicles.length<=150);
});

test('semantic audio is prioritized, bounded, and has visual alternatives',()=>{
  const runtime=traffic.TrafficRuntime.create({width:4,height:4,runTicks:300,incidentEveryTicks:40,incidentDurationTicks:20},'audio-cues'),director=new traffic.TrafficAudioDirector({voiceLimit:3,muted:false});for(let i=0;i<220;i++)runtime.step();
  const cues=director.route(runtime.events,runtime.state);assert.ok(cues.length<=3);assert.ok(cues.every(cue=>cue.caption&&cue.priority>=1));assert.equal(director.mix(runtime.state).masterGainPermille<=900,true);
  const muted=new traffic.TrafficAudioDirector({voiceLimit:3,muted:true});assert.deepEqual(muted.route(runtime.events,runtime.state),[]);
});

test('renderer failure enters intentional recovery and rebuilds from accepted truth',()=>{
  const runtime=traffic.TrafficRuntime.create({width:4,height:4,runTicks:300},'recovery-scene'),controller=new traffic.TrafficPresentationController({replayCapacity:20,maxEntities:200,muted:false});for(let i=0;i<20;i++){const events=runtime.step();controller.accept(traffic.buildTrafficRenderSnapshot(runtime.state),events)}
  controller.failOutput('synthetic renderer fault');assert.equal(controller.frame().scene,'recovery');assert.equal(controller.frame().publicStatus,'Restoring city view');const restored=controller.rebuildFromLatest();assert.equal(restored.recovered,true);assert.equal(controller.frame().scene,'normal');
});

test('browser source assets are dependency-free, bounded, and accessibility-aware',()=>{
  const root=path.resolve(__dirname,'../..'),files=['index.html','styles.css','app.js'].map(name=>path.join(root,'public','ai-city-traffic',name));for(const file of files)assert.ok(fs.existsSync(file)&&fs.statSync(file).size>256,file);
  const html=fs.readFileSync(files[0],'utf8'),css=fs.readFileSync(files[1],'utf8'),js=fs.readFileSync(files[2],'utf8');assert.match(html,/aria-live/);assert.match(html,/AI City Traffic Experiment/);assert.match(css,/prefers-reduced-motion/);assert.match(js,/MAX_TRAIL=240/);assert.doesNotMatch(js,/innerHTML/);assert.match(js,/textContent/);assert.match(js,/traffic\/state/);
});
