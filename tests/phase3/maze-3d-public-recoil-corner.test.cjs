'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const root=path.resolve(__dirname,'../..');
const helper=path.join(root,'public/ai-maze-escape/public-recoil-route.mjs');
const world=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const snapshot=()=>{
  const edges=[[93,92],[92,91],[91,74]];
  return {lifecycle:'running',result:null,runToken:'maze-run',tick:8,
    width:17,height:17,currentCell:93,visibleCells:[93,92,91,74],
    cells:[93,92,91,74].map(cell=>({cell,blocked:false,trap:false,
      neighbors:edges.flatMap(([a,b])=>a===cell?[b]:b===cell?[a]:[])})),
    doors:[],keys:[],exitCell:200,
    threats:[{id:'thornback',cell:74,lanternParried:true}]};
};
const witness=()=>({runToken:'maze-run',id:'thornback',cell:74,tick:8});
test('the true published L-corner gets one ordered, original physical court',async()=>{
  const {publicWitnessedGuardianRecoilRoute:route}=await import(pathToFileURL(helper).href);
  assert.deepEqual([...route(snapshot(),witness())],[
    [93,{axis:'x',step:0}],[92,{axis:'x',step:1}],
    [91,{axis:'z',step:2}],[74,{axis:'z',step:3}]]);
  const reverse=snapshot();reverse.cells.reverse();reverse.visibleCells.reverse();
  assert.deepEqual([...route(reverse,witness())],[...route(snapshot(),witness())]);
});
test('no public path exists across undisclosed, locked, one-way or hazardous terrain',async()=>{
  const {publicWitnessedGuardianRecoilRoute:route}=await import(pathToFileURL(helper).href);
  const mutations=[
    s=>{s.visibleCells=[93,91,74]},
    s=>{s.doors=[{a:92,b:91,open:false}]},
    s=>{s.cells.find(c=>c.cell===91).neighbors=[]},
    s=>{s.cells.find(c=>c.cell===92).trap=true},
    s=>{s.cells.find(c=>c.cell===91).blocked=true},
    s=>{s.currentCell=74},
    s=>{s.height=15},
    s=>{s.runToken='another-run'},
    s=>{s.threats[0].cell=91},
    s=>{s.threats[0].lanternParried=false},
    s=>{s.result={reason:'capture'}},
    s=>{s.lifecycle='intermission'}
  ];
  for(const mutate of mutations){
    const s=snapshot();mutate(s);assert.equal(route(s,witness()).size,0);
  }
  assert.equal(route(snapshot(),null).size,0);
  assert.equal(route(snapshot(),{...witness(),tick:9}).size,0);
});
test('the production hinge stage and world witness have strict authentic source gates',()=>{
  for(const part of [
    'publicGuardianCounterMoment(snapshot,s)',
    'const guardianRecoilRoute=publicWitnessedGuardianRecoilRoute(s,observedEarnedCounter)',
    'guardianRecoilRoute.has(c.cell)',
    '#guardian-earned-corner:',
    'const witnessedRecoilCorner=publicThreat',
    'const onRecoilTile=witnessedRecoilCorner && recoilRoute.has(signal.cell)',
    '(onLane||onRecoilTile)&&earnedParry?guardianCounterPhase:undefined',
    'PUBLIC_GUARDIAN_COUNTER_SECONDS'
  ])assert.ok(world.includes(part),part);
  assert.ok(!world.includes('(t-observedEarnedCounter.start)/1.15'));
});

test('the published fourth corner gets the full two-second physical ripple without altering the three original straight beats',async()=>{
  const {publicGuardianEarnedResonance:r}=await import(pathToFileURL(path.join(root,'public/ai-maze-escape/gate-moment.mjs')).href);
  assert.ok(r(.80,3,false).glow>0,'the real retreat endpoint participates');
  assert.equal(r(1,3,false).glow,0,'the earned event cannot linger after 2s');
  assert.equal(r(.80,4,false).glow,0,'no fifth unseen cell or imagined shortcut');
  assert.ok(r(.80,2,false).glow>=0,'the existing 3-tile contract is preserved');
});
