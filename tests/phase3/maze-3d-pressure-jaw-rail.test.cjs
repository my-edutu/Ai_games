'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
// Test the installed production Three.js model with the real public-state
// interface. No mocked world, synthetic collision, relaxed camera or budget.
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const moment=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href;
const mod=import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(three))
  .replace("'./gate-moment.mjs'",JSON.stringify(moment))
  .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));
const disclosed={runToken:'paired-rail-public',tick:4,width:7,height:9,currentCell:24,
  cells:[{cell:24,neighbors:[],trap:true,blocked:false}],
  visibleCells:[24],discoveredCells:[24],doors:[],keys:[],inventory:[],threats:[],exitCell:null};
test('both real pressure blades close their guide rails only after witnessed floor motion and reset on withdrawal',async()=>{
  const {createMazeWorld}=await mod;
  const {Vector3,Box3}=await import(three);
  const world=createMazeWorld({balanced:true}),original=JSON.stringify(disclosed);
  try{
    world.update(disclosed);
    const hazard=world.group.getObjectByName('Disclosed tide-shear pressure hazard 24');
    const jaws=[-1,1].map(side=>hazard.getObjectByName('Disclosed tide-shear hinged jaw 24 '+side));
    const guides=hazard.children.filter(child=>child.name==='Published tide-shear rooted ivory guide cheek');
    assert.equal(jaws.length,2);assert.ok(jaws.every(jaw=>jaw?.isGroup));
    assert.equal(guides.length,2,'two anchored guides still support the sliding jaw roots');
    // Pass279: verify a genuine physical re-staging of the existing paired
    // full-body cutters, not a color swap or HTML mask. Lower, forward-rooted
    // blades need real clearance while preserving their side guide rails.
    for (const jaw of jaws) {
      assert.ok(jaw.position.z>=.42 && jaw.position.z<=.46
        &&jaw.position.y<0,
        'both true mobile-foreground shears are rooted below the front deck, leaving Pip the central stage');
      assert.ok(jaw.getObjectByName('Published tide-shear front blade')?.isMesh
        &&jaw.getObjectByName('Published tide-shear forward danger inlay')?.isMesh,
        'the original moving ivory cutting faces and coral contact edges remain attached');
    }
    const origin=hazard.getWorldPosition(new Vector3());
    const far=new Vector3(origin.x+30,0,origin.z+30);
    const near=new Vector3(origin.x,0,origin.z);
    const assertRail=(distance,label)=>{
      assert.ok(Math.abs(jaws[0].position.x+distance)<1e-9,label+' left root');
      assert.ok(Math.abs(jaws[1].position.x-distance)<1e-9,label+' right root');
      assert.equal(jaws[0].position.x,-jaws[1].position.x,label+' pair must be symmetric');
    };
    const budgets=world.stats();
    world.animate(1,{explorerPosition:far,reducedMotion:false});
    assertRail(.68,'at rest');
    world.animate(1.2,{explorerPosition:new Vector3(origin.x+2.4,0,origin.z+2.4),reducedMotion:false});
    assertRail(.68,'public diagonal warning is not physical pressure');
    world.animate(2,{explorerPosition:near,reducedMotion:false});
    assertRail(.68,'initial real warning precedes shear');
    world.animate(3.4,{explorerPosition:near,reducedMotion:false});
    assertRail(.56,'after real contact the two blades slide inward 12cm');
    assert.ok(jaws[0].rotation.z<-.60&&jaws[1].rotation.z>.60,
      'the original linked inward hinge stroke accompanies the NEW travel');
    world.group.updateMatrixWorld(true);
    for(const jaw of jaws){
      const bounds=new Box3().setFromObject(jaw);
      assert.ok(bounds.min.x>origin.x-1.2&&bounds.max.x<origin.x+1.2
        &&bounds.min.z>origin.z-1.2&&bounds.max.z<origin.z+1.2,
        'full swept jaw silhouette stays inside the published trap tile');
    }
    world.animate(4,{explorerPosition:far,reducedMotion:false});
    assertRail(.68,'withdrawal instantly resets rails');
    world.animate(5,{explorerPosition:near,reducedMotion:true});
    assertRail(.62,'reduced motion uses one static earned half-travel');
    world.update({...disclosed,visibleCells:[]});
    world.animate(6,{explorerPosition:near,reducedMotion:true});
    assertRail(.68,'remembered-only pressure cannot reveal hidden action');
    assert.equal(JSON.stringify(disclosed),original,'the model must not modify any public state');
    for(const key of ['geometryCount','materialCount','textureCount'])
      assert.equal(world.stats()[key],budgets[key],'no frame or reset resource allocations: '+key);
    world.update({...disclosed,runToken:'new-run',tick:0,cells:[],visibleCells:[],discoveredCells:[]});
    assert.equal(world.group.getObjectByName('Disclosed tide-shear pressure hazard 24'),undefined,
      'old pressure geometry never survives run reset');
  }finally{
    world.dispose();
    for(const key of ['geometryCount','materialCount','textureCount'])
      assert.equal(world.stats()[key],0,'all resources released: '+key);
  }
});
