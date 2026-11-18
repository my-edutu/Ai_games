'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const gate=pathToFileURL(path.join(root,'public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.join(root,'public/ai-maze-escape/map-view.mjs')).href;
const load=()=>import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(three))
  .replace("'./gate-moment.mjs'",JSON.stringify(gate))
  .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));

const disclosed=()=>({
  runToken:'genuine-visible-guardian',lifecycle:'running',result:null,
  width:5,height:5,currentCell:6,visibleCells:[6,7,8],
  cells:[{cell:6,blocked:false,neighbors:[7]},
    {cell:7,blocked:false,neighbors:[6,8]},
    {cell:8,blocked:false,neighbors:[7]}],
  doors:[],keys:[],inventory:[],traps:[],exitCell:null,
  threats:[{id:'thornback',cell:8,lanternParried:false}]
});

test('a genuine earned Pip counter physically withdraws both original guardian sentinel towers and attached fans, never inventing a win',async()=>{
  const {createMazeWorld}=await load();
  const s=disclosed(),beforeInput=JSON.stringify(s);
  const world=createMazeWorld({balanced:true});
  try {
    world.update(s);
    const attached=()=>[6,8].map((cell,i)=>{
      const side=i===0?-1:1;
      const shaft=world.group.getObjectByName(
        'Published guardian Tideglass joined sentinel shaft '+cell+' '+side);
      const crown=world.group.getObjectByName(
        'Published guardian Tideglass sentinel crown '+cell+' '+side);
      const fan=world.group.getObjectByName(
        'Published guardian Tideglass rooted shell-fan hinge '+cell+' '+side);
      assert.ok(shaft&&crown&&fan,'source-visible original stone/shell mechanism exists at real actor endpoint');
      const lift=shaft.parent;
      assert.equal(crown.parent,lift,'connected crown travels with rooted physical shaft');
      assert.equal(fan.parent,lift,'connected complete shell fan travels with rooted physical shaft');
      assert.ok(lift.parent,'lowering a rooted mechanism does not relocate the source cell');
      return lift;
    });
    let lifts=attached();
    const pose=()=>lifts.map(lift=>lift.position.y);
    const cue={guardianCell:8,guardianBeat:0,reducedMotion:false};
    const initialStats=world.stats();
    world.animate(0,cue);
    assert.deepEqual(pose(),[.04,.04],'both sentinel standards begin physically neutral');
    world.animate(.5,{...cue,guardianBeat:.5});
    assert.ok(pose().every(y=>y>.42),'real defensive brace visibly raises both original full-size standards');
    world.animate(.9,{...cue,guardianBeat:1});
    assert.ok(pose().every(y=>y>.03 && y<.06),'ordinary shell release lowers structures to rest');
    // A caller claiming parry without a matching current published guardian
    // flag is NOT an earned win; never retreat a scenery object on hearsay.
    world.animate(1,{...cue,guardianBeat:1,guardianParried:true,guardianCounterPhase:.95});
    assert.ok(pose().every(y=>y>.03),'a hidden/unauthorized parry cannot retract the stage');
    const parried={...s,threats:[{...s.threats[0],lanternParried:true}]};
    world.update(parried);
    lifts=attached();
    world.animate(1.1,{...cue,guardianBeat:1,guardianParried:false,guardianCounterPhase:.95});
    assert.ok(pose().every(y=>y>.03),'first-seen already-parried guardian cannot earn a fresh counter');
    world.animate(1.2,{...cue,guardianBeat:1,guardianParried:true,guardianCounterPhase:.95});
    assert.ok(pose().every(y=>y<-.75),
      'genuine earned counter collapses full original linked 3D towers below the repeated foreground stage');
    assert.ok(world.stats().geometryCount===initialStats.geometryCount
      && world.stats().materialCount===initialStats.materialCount,
      'no new GPU material or geometry classes are allocated by the win');
    world.animate(1.3,{...cue,guardianBeat:1,guardianParried:false,guardianCounterPhase:.95});
    assert.ok(pose().every(y=>y>.03),
      'withdrawal does not persist after the real event permission disappears');
    world.animate(1.4,{...cue,guardianBeat:1,guardianParried:true,guardianCounterPhase:.95,reducedMotion:true});
    assert.deepEqual(pose(),[.04,.04],'reduced-motion keeps all linked towers stationary');
    world.animate(1.5,{...cue,guardianCell:999,guardianBeat:1,guardianParried:true,guardianCounterPhase:.95});
    assert.deepEqual(pose(),[.04,.04],'unknown guardian cannot retain an old event');
    world.update({...parried,visibleCells:[6,7]});
    assert.equal(world.group.getObjectByName('Published guardian Tideglass joined sentinel shaft 8 1'),undefined,
      'hidden guardian removes the corresponding authored stage entirely');
    for(let i=0;i<6;i++){
      world.update({...s,runToken:'fresh-run-'+i});
      assert.ok(world.stats().geometryCount<100,'do not loosen existing six-reset geometry budget');
    }
    assert.equal(JSON.stringify(s),beforeInput,'source authority, collision and private AI remain untouched');
  }finally{
    world.dispose();
    assert.equal(world.stats().geometryCount,0,'scene teardown releases all geometries');
    assert.equal(world.stats().materialCount,0,'scene teardown releases all materials');
  }
});
