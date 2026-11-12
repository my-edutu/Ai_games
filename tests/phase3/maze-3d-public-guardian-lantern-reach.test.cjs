'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const helper=()=>import('../../public/ai-maze-escape/public-lantern-encounter.mjs');
const scene=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/scene.js'),'utf8');
const corridor=()=>({
  width:5,height:5,currentCell:6,runToken:'witnessed-lamp',lifecycle:'running',
  result:null,visibleCells:[6,7,8],threats:[{cell:8}],doors:[],
  cells:[{cell:6,blocked:false,neighbors:[7]},
    {cell:7,blocked:false,neighbors:[6,8]},
    {cell:8,blocked:false,neighbors:[7]}],
});
test('a two-link genuinely witnessed open guardian court earns existing physical lantern range, not a false ray',async()=>{
  const {publicGuardianLanternReach:reach,publicGuardianOpenSightline:open,
    publicLanternEncounter:adjacentBeam}=await helper();
  const s=corridor(),before=structuredClone(s);
  assert.equal(open(s,8),2);
  assert.equal(reach(s,8,2.4),6.96);
  assert.equal(adjacentBeam(s,8),false,'the strict no-two-cell beam remains intact');
  assert.deepEqual(s,before,'lighting presentation cannot mutate public game state');
  const single={...s,threats:[{cell:7}]};
  assert.equal(open(single,7),1);
  assert.equal(reach(single,7,2.4),4,'adjacent existing light/beam behavior stays');
  assert.equal(adjacentBeam(single,7),true);
});
test('unknown, blocked, one-way, sealed, diagonal, ended and invalid witnesses never extend the lantern',async()=>{
  const {publicGuardianLanternReach:reach,publicGuardianOpenSightline:open}=await helper();
  const s=corridor(), unchanged=(view,cell=8)=>assert.equal(reach(view,cell,2.4),4);
  const bad=[
    {...s,visibleCells:[6,8]},
    {...s,cells:s.cells.filter(c=>c.cell!==7)},
    {...s,cells:s.cells.map(c=>c.cell===7?{...c,blocked:true}:c)},
    {...s,cells:s.cells.map(c=>c.cell===7?{...c,neighbors:[8]}:c)},
    {...s,doors:[{a:7,b:8,open:false}]},
    {...s,visibleCells:[6,7]},
    {...s,threats:[]},
    {...s,lifecycle:'ended'},
    {...s,result:{reason:'capture'}},
    {...s,visibleCells:[6,7,12],threats:[{cell:12}],
      cells:[...s.cells,{cell:12,blocked:false,neighbors:[7]}]},
  ];
  for(const v of bad){unchanged(v,v.threats[0]?.cell??8);}
  assert.equal(open({...s,doors:[{a:7,b:8,open:true}]},8),2);
  assert.equal(reach({...s,doors:[{a:7,b:8,open:true}]},8,2.4),6.96);
  assert.equal(reach(s,8,NaN),4);assert.equal(reach(s,8,-2),4);
  assert.equal(reach(s,8,2.4,8),8,'never reduce an explicitly wider physical light');
  assert.equal(reach(s,8,2.4,-1),6.96);
});
test('real scene uses its single attached lamp and retains the strict one-edge beam',()=>{
  assert.match(scene,/lanternLight\.position\.copy\(lanternFocusOrigin\)/);
  assert.match(scene,/lanternLight\.distance\s*=\s*!result && explorerLantern/);
  assert.match(scene,/publicGuardianLanternReach\(s,closestThreat\.cell,CELL_SIZE,4\)/);
  assert.match(scene,/publicLanternEncounter\(s,closestThreat\.cell\)/,
    'existing only-adjacent physical beam stays unchanged');
  assert.match(scene,/publicLanternRadiusWorld:\s*lanternLight\.distance/);
  assert.match(scene,/import \{ publicGuardianLanternReach \} from '\.\/public-lantern-encounter\.mjs';/,
    'the new light-reach helper is separately imported so the original public-only lantern wiring contract stays untouched');
  assert.doesNotMatch(scene,/privateMaze.*lanternLight|secretSafeRoute.*lanternLight/i);
});
