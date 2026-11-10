'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');

const load = () => import('../../public/ai-maze-escape/public-lantern-encounter.mjs');
const scene = fs.readFileSync(path.resolve(__dirname,
  '../../public/ai-maze-escape/scene.js'), 'utf8');

function corridor() {
  return {
    width: 5, height: 5, currentCell: 6, runToken: 'observed-corridor',
    lifecycle: 'running', result: null,
    visibleCells: [6, 7, 8], threats: [{id: 'thornback', cell: 8}], doors: [],
    cells: [
      {cell: 6, blocked: false, neighbors: [7]},
      {cell: 7, blocked: false, neighbors: [6, 8]},
      {cell: 8, blocked: false, neighbors: [7]},
    ],
  };
}

test('two-step continuous public corridor stages the actual pair before adjacency, not a false projected beam', async () => {
  const {publicGuardianOpenSightline: open, publicLanternWarning: warning,
    publicLanternEncounter: beam} = await load();
  const s = corridor(), unchanged = structuredClone(s);
  assert.equal(warning(s, 8), true, 'current visible threat earns local warning');
  assert.equal(open(s, 8), 2, 'two reciprocal open public edges earn a shared acting stage');
  assert.equal(beam(s, 8), false, 'do not project a lantern beam across two cells');
  const adjacent = {...s, visibleCells: [6, 7],
    threats: [{id: 'thornback', cell: 7}]};
  assert.equal(open(adjacent, 7), 1);
  assert.equal(beam(adjacent, 7), true, 'single existing public open link still works');
  assert.deepEqual(s, unchanged, 'presentation helper must never mutate authoritative public state');
});

test('unknown, blocked, one-way and closed passages never impersonate a visible face-to-face encounter', async () => {
  const {publicGuardianOpenSightline: open, publicLanternWarning: warning} = await load();
  const s = corridor();
  const hiddenMid = {...s, visibleCells: [6, 8]};
  assert.equal(warning(hiddenMid, 8), true, 'nearby local caution remains possible');
  assert.equal(open(hiddenMid, 8), 0, 'undiscovered middle tile is not a disclosed sightline');
  const missingMid = {...s, cells: s.cells.filter(cell => cell.cell !== 7)};
  assert.equal(open(missingMid, 8), 0);
  const blockedMid = {...s, cells: s.cells.map(c => c.cell === 7 ? {...c, blocked: true} : c)};
  assert.equal(open(blockedMid, 8), 0);
  const oneWay = {...s, cells: s.cells.map(c => c.cell === 7 ? {...c, neighbors: [8]} : c)};
  assert.equal(open(oneWay, 8), 0);
  assert.equal(open({...s, doors: [{a:7, b:8, open:false}]}, 8), 0);
  assert.equal(open({...s, doors: [{a:7, b:8, open:true}]}, 8), 2);
  assert.equal(open({...s, visibleCells: [6, 7]}, 8), 0,
    'an unseen guardian never receives a visible camera stage');
  assert.equal(open({...s, lifecycle:'ended'}, 8), 0);
  assert.equal(open({...s, result:{reason:'capture'}}, 8), 0);
});

test('diagonal proximity and private-only route hints cannot invent a public corridor', async () => {
  const {publicGuardianOpenSightline: open, publicLanternWarning: warning} = await load();
  const s = corridor();
  const diagonal = {...s, visibleCells:[6,7,12],
    threats:[{id:'thornback',cell:12}],
    cells:[...s.cells,{cell:12,blocked:false,neighbors:[7]}]};
  assert.equal(warning(diagonal,12),true,'diagonal public presence may warn locally');
  assert.equal(open(diagonal,12),0,'diagonal angle is not an unobstructed cardinal corridor');
  const spoofed = structuredClone(s);
  spoofed.privateMaze = {cells:[{cell:9,neighbors:[8]}], path:[6,7,8]};
  spoofed.secretSafeRoute = [6,7,8];
  assert.equal(open(spoofed,8),2,'private data cannot extend or influence the public stage');
  assert.equal(open({...s,visibleCells:[6,8],privateMaze:spoofed.privateMaze},8),0);
});

test('real production scene separates local caution from witnessed pair staging', () => {
  assert.match(scene,/publicGuardianOpenSightline\(s,entry\.cell\)/,
    'actual open corridor must gate the connected Pip/Thornback performance');
  assert.match(scene,/closestWarning\?\.strength > \.35/,
    'a public nearby warning stays on Pip lantern behind a sealed passage');
  assert.match(scene,/lanternBeam\.visible\s*=\s*false\s*;/,
    'the stricter adjacent-only original beam remains the default');
  assert.match(scene,/publicLanternEncounter\(\s*s\s*,\s*closestThreat\.cell\s*\)/,
    'light beam still needs the actual one-link public reciprocal disclosure');
  assert.match(scene,/guardianEncounterBeat:closestThreat\?\.encounterBeat/,
    'same real witnessed clock continues to govern the two physical characters');
  assert.doesNotMatch(scene,/privateMaze.*closestThreat|privateMaze.*encounterBeat/i);
});
