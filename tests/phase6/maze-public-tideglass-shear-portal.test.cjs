'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

async function build(){
  const root=path.resolve(__dirname,'../..');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-tideglass-yoke-'));
  try{
    fs.mkdirSync(path.join(tmp,'vendor'));
    fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','map-view.mjs','gate-moment.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(tmp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(tmp,'vendor',file));
    const THREE=await import(pathToFileURL(path.join(tmp,'vendor/three.module.js')).href);
    const source=await import(pathToFileURL(path.join(tmp,'world.js')).href);
    return {THREE,source,world:source.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(tmp,{recursive:true,force:true})};
  }catch(error){fs.rmSync(tmp,{recursive:true,force:true});throw error}
}
const published=(overrides={})=>({
  runToken:'public-tideglass-yoke',tick:1,width:3,height:3,currentCell:4,
  cells:[{cell:4,neighbors:[],blocked:false,trap:true,checkpoint:false,clue:false}],
  visibleCells:[4],keys:[],doors:[],inventory:[],threats:[],exitCell:null,result:null,
  ...overrides
});
const near=(value,expected,label)=>assert.ok(Math.abs(value-expected)<1e-7,
  label+': '+value+' vs '+expected);

test('actual public pressure tile has a joined tall Tideglass working shear-portal, not loose fragments',async()=>{
  const {THREE,source,world,cleanup}=await build();
  try{
    const s=published(),sourceText=JSON.stringify(s);
    world.update(s);
    const hazard=world.group.getObjectByName('Disclosed tide-shear pressure hazard 4');
    const gantry=world.group.getObjectByName('Published tide-shear pressure counterbalance arch 4');
    assert.ok(hazard?.isGroup&&gantry?.isGroup&&gantry.parent===hazard);
    const pylons=[-1,1].map(side=>gantry.getObjectByName('Published Tideglass shear-portal anchored pylon '+side));
    assert.ok(pylons.every(item=>item?.isMesh&&item.parent===gantry));
    assert.ok(pylons.every(p=>p.scale.y>=1.60&&Math.abs(p.position.x)>=.90),
      'both physically tall load towers stay to the sides of the active jaw corridor');
    const yoke=gantry.getObjectByName('Published Tideglass shear-portal connected yoke');
    const bridge=gantry.getObjectByName('Published tide-shear spanning load bridge');
    const wheel=gantry.getObjectByName('Published tide-shear bronze pressure governor');
    const cable=gantry.getObjectByName('Published tide-shear connected descending cable');
    const weight=gantry.getObjectByName('Published tide-shear hanging counterweight');
    assert.ok(yoke?.isMesh&&yoke.parent===bridge&&bridge?.parent===gantry);
    assert.ok(wheel?.isGroup&&cable?.isGroup&&weight?.isGroup);
    assert.ok(yoke.scale.x>=2.10&&yoke.scale.y>=.20&&bridge.position.y>=1.65,
      'one architectural yoke spans the true blades, not a miniature ornament');
    assert.ok(gantry.children.filter(c=>c.isMesh).length>=10,
      'joined stone footings, pylons and mineral cladding really exist as 3D meshes');
    assert.ok(pylons.every(p=>p.position.y+p.scale.y/2>=bridge.position.y-yoke.scale.y/2),
      'the moving load beam physically overlaps and rests on both supporting pylons');
    const portalBounds=new THREE.Box3().setFromObject(gantry);
    const center=new THREE.Vector3();
    hazard.getWorldPosition(center);
    assert.ok(Math.abs(portalBounds.min.x-center.x)<=1.20+1e-6
      &&Math.abs(portalBounds.max.x-center.x)<=1.20+1e-6,
      'both full architectural wings remain inside the original true 2.4m pressure tile');
    assert.ok(portalBounds.max.y-portalBounds.min.y>1.70,
      'portal has actual tall full-body 3D silhouette, not floating floor scratches');
    const budget=world.stats();
    assert.ok(budget.geometryCount<100,'original strict six-run geometry limit is never relaxed');
    const pos=source.cellPosition(4,3,3);
    const hero=new THREE.Vector3(pos.x,0,pos.z),far=new THREE.Vector3(pos.x+40,0,pos.z+40);
    const contact={explorerPosition:hero,reducedMotion:false,stepDurationMs:360};
    world.animate(0,contact);
    near(bridge.rotation.z,0,'the actual warning precedes mechanical beam release');
    assert.ok(wheel.rotation.z<-.5,'true public treadle turns the attached governor');
    world.animate(.36,contact);
    near(bridge.rotation.z,.11,'the full observed shutter stroke tilts the load yoke');
    near(weight.position.y,.38,'the actual released counterweight visibly descends');
    near(cable.scale.y,1.92,'the cable follows the same source-driven pressure beat');
    world.animate(.37,{...contact,explorerPosition:far});
    near(bridge.rotation.z,0,'withdrawal restores the rooted load yoke');
    near(weight.position.y,.66,'withdrawal returns suspended counterweight');
    near(cable.scale.y,1,'withdrawal restores physical cable length');
    for(const k of ['geometryCount','materialCount','textureCount'])
      assert.equal(world.stats()[k],budget[k],k+' reused across real pressure motion');
    assert.equal(JSON.stringify(s),sourceText,'no private gameplay mutation or fictitious hazard');
  }finally{world.dispose();cleanup()}
});

test('hidden, remembered-only, reduced-motion and new-run states cannot fake a working portal',async()=>{
  const {THREE,source,world,cleanup}=await build();
  try{
    const pos=source.cellPosition(4,3,3),hero=new THREE.Vector3(pos.x,0,pos.z);
    world.update(published({visibleCells:[]}));
    const gantry=world.group.getObjectByName('Published tide-shear pressure counterbalance arch 4');
    const bridge=gantry.getObjectByName('Published tide-shear spanning load bridge');
    const weight=gantry.getObjectByName('Published tide-shear hanging counterweight');
    world.animate(1,{explorerPosition:hero,reducedMotion:false});
    near(bridge.rotation.z,0,'remembered-only pressure cannot actuate a moving bridge');
    near(weight.position.y,.66,'remembered-only weight remains grounded at rest');
    world.animate(2,{explorerPosition:hero,reducedMotion:true});
    near(bridge.rotation.z,0,'even reduced motion cannot leak hidden danger');
    world.update(published({visibleCells:[4]}));
    world.animate(3,{explorerPosition:hero,reducedMotion:true});
    near(bridge.rotation.z,.11*.55,'earned visible reduced-motion static posture');
    world.update(published({runToken:'next',cells:[],visibleCells:[],
      privateTrapCells:[4],privateRoute:[4,5]}));
    assert.equal(world.group.getObjectByName('Published tide-shear pressure counterbalance arch 4'),undefined,
      'private-only and previous-run hazard art must be entirely removed');
    assert.equal(world.stats().responsiveTrapSignals,0);
  }finally{world.dispose();cleanup()}
});
