import test from 'node:test';
import assert from 'node:assert/strict';
import { createGame, stepGame, validateWorld, buildBroadcastView, selectAudioState, selectQualityTier, healthSnapshot, applyViewerInfluence } from '../dist/index.js';

test('world layout validates with no hard failures',()=>{const g=createGame({seed:2026});assert.deepEqual(validateWorld(g).filter(i=>i.severity==='error'),[]);});
test('broadcast view exposes progress and bounded AI intent without audit ids',()=>{let g=createGame({seed:2});for(let i=0;i<60;i++)g=stepGame(g,1/30);const v=buildBroadcastView(g);assert.ok(v.progress.primary.includes('DAY'));assert.ok(v.survivorIntents.length<=6);assert.equal(JSON.stringify(v).includes('externalId'),false);});
test('audio state uses bounded semantic intensity',()=>{const g=createGame({seed:3});const a=selectAudioState(g);assert.ok(['calm','tension','crisis','failure','recovery'].includes(a.mode));assert.ok(a.maxVoices<=24);});
test('quality degradation preserves critical cue policy',()=>{assert.equal(selectQualityTier({zombieCount:500,hordePressure:1,frameMs:30}).name,'low');assert.equal(selectQualityTier({zombieCount:40,hordePressure:.2,frameMs:9}).name,'high');});
test('health snapshot detects non-finite authority',()=>{const g=createGame({seed:4});assert.equal(healthSnapshot(g).status,'healthy');g.zombies[0].x=Infinity;assert.equal(healthSnapshot(g).status,'quarantine');});
test('viewer influence is idempotent and type-cooldown bounded',()=>{const g=createGame({seed:5});const a=applyViewerInfluence(g,{id:'a',type:'supply-drop',magnitude:12});const b=applyViewerInfluence(a,{id:'b',type:'supply-drop',magnitude:12});assert.ok(b.resources.food-a.resources.food<=6);});
