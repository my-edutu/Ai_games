'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const root=path.resolve(__dirname,'../..');
const url=name=>pathToFileURL(path.join(root,'public/ai-maze-escape',name)).href;
const source=()=>({
  lifecycle:'running',runToken:'public-guardian-check',tick:5,width:5,height:5,
  currentCell:11,result:null,intent:{mode:'evading-threat'},
  visibleCells:[11,12,13],
  cells:[
    {cell:11,blocked:false,neighbors:[12]},
    {cell:12,blocked:false,neighbors:[11,13]},
    {cell:13,blocked:false,neighbors:[12]}
  ],doors:[],threats:[{id:'thornback',cell:13,lanternParried:false}]
});

test('the live HUD warning matches the actual public lantern line without a source fixture dependency',async()=>{
  const view=await import(url('map-view.mjs'));
  const lantern=await import(url('public-lantern-encounter.mjs'));
  const cases=[
    ['real two-edge open court',s=>s,true],
    ['real one-edge open court',s=>({...s,threats:[{id:'thornback',cell:12,lanternParried:false}]}),true],
    ['known sealed passage',s=>({...s,doors:[{a:12,b:13,open:false}]}),false],
    ['missing reciprocal passage',s=>({...s,cells:s.cells.map(c=>c.cell===12?{...c,neighbors:[11]}:c)}),false],
    ['middle tile unseen',s=>({...s,visibleCells:[11,13]}),false],
    ['guardian not visibly disclosed',s=>({...s,visibleCells:[11,12]}),false],
    ['lantern counter already parried',s=>({...s,threats:[{id:'thornback',cell:13,lanternParried:true}]}),false],
    ['diagonal but not an open straight corridor',s=>({...s,threats:[{id:'thornback',cell:17,lanternParried:false}],visibleCells:[11,12,17]}),false],
    ['AI still evading but encounter ended',s=>({...s,lifecycle:'result'}),false],
    ['unknown map height',s=>({...s,height:null}),false]
  ];
  for(const [label,change,expected] of cases) {
    const state=change(source());
    const guardian=state.threats[0];
    const original=JSON.stringify(state);
    assert.equal(view.publicLiveGuardianWarning(state),expected,label);
    if(expected)
      assert.ok(lantern.publicGuardianOpenSightline(state,guardian.cell)>0,label+' uses real public sightline');
    assert.equal(JSON.stringify(state),original,label+' must not alter game authority');
  }
});
