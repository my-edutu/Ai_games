'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const source = fs.readFileSync(path.resolve(__dirname,
  '../../public/ai-maze-escape/scene.js'), 'utf8');
const helpers = import('../../public/ai-maze-escape/public-lantern-encounter.mjs');
const court = () => ({
  runToken:'real-two-sided-light',width:5,height:5,currentCell:6,
  lifecycle:'running',result:null,visibleCells:[6,7,8],
  cells:[{cell:6,blocked:false,neighbors:[7]},
    {cell:7,blocked:false,neighbors:[6,8]},
    {cell:8,blocked:false,neighbors:[7]}],
  doors:[],threats:[{id:'thornback',cell:8}]
});
test('Pass372 physical counterlight is earned ONLY by a real currently open public Pip–Thornback stage',async()=>{
  const {publicGuardianTheatreLightStrength: light}=await helpers;
  const s=court(), pristine=JSON.stringify(s);
  const notice=light(s,8,.8,0),brace=light(s,8,.8,.5),release=light(s,8,.8,1);
  assert.ok(notice>.35 && brace>notice && release>brace,
    'both real actors earn a legible held then brighter shell-release counterlight');
  assert.equal(light(s,8,.8,1),release,'source beat is exactly deterministic');
  assert.equal(light(s,8,.65,.5),0,'a distant/nonwitnessed warning cannot stage both actors');
  for(const stale of [NaN,Infinity,-1,undefined])assert.equal(light(s,8,.8,stale),0);
  assert.equal(light({...s,visibleCells:[6,8]},8,.8,.5),0,
    'never illuminate an undetected intermediate corridor');
  assert.equal(light({...s,visibleCells:[6,7]},8,.8,.5),0,
    'hidden guardian cannot light the scene');
  assert.equal(light({...s,doors:[{a:7,b:8,open:false}]},8,.8,.5),0,
    'closed gate keeps the theatre dark despite nearby enemy');
  assert.equal(light({...s,cells:s.cells.map(c=>c.cell===7
    ? {...c,neighbors:[6]} : c)},8,.8,.5),0,'one-way route is not a public passage');
  assert.equal(light({...s,lifecycle:'ended'},8,.8,.5),0,'stopped run cleans up light');
  assert.equal(light({...s,result:{reason:'capture'}},8,.8,.5),0,'terminal clears light');
  assert.equal(light({...s,threats:[]},8,.8,.5),0,'an invented opponent cannot light stage');
  assert.equal(light({...s,privateMaze:{threats:[{cell:7}],route:[6,7,8]}},
    8,.8,.5),brace,'private metadata must have no visual influence');
  assert.equal(JSON.stringify(s),pristine,'scene lighting never mutates authoritative public state');
});
test('Pass372 counterlight is one retained real renderer light with current-source gating and diagnostic',()=>{
  assert.match(source,/const guardianTheatreLight = new THREE\.PointLight\('#8ce8da', 0, 5\.4, 1\.6\)/);
  assert.match(source,/guardianTheatreLight\.castShadow = false/);
  assert.match(source,/!result && closestThreatModel\?\.parent\s+&& closestThreat \? publicGuardianTheatreLightStrength\(/);
  assert.match(source,/guardianTheatreLight\.position\.set\(closestThreat\.x/);
  assert.match(source,/witnessedGuardianTheatreLightIntensity: guardianTheatreLight\.intensity/);
  assert.match(source,/lanternLight\.position\.copy\(lanternFocusOrigin\)/,
    'the existing physical wrist lantern remains the warm half of the duet');
  assert.equal((source.match(/new THREE\.PointLight\(/g)||[]).length,2,
    'single original lantern plus one retained counterlight: no per-frame light creation');
  assert.doesNotMatch(source,/privateMaze.*guardianTheatreLight|secret.*guardianTheatreLight/i);
});
