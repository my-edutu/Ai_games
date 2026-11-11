'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Exercise the REAL installed production Three.js world, not mocked props,
// screenshots or a cosmetic marker that could pass without an animated scene.
async function actualWorld() {
  const root=path.resolve(__dirname,'../..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-tide-shear-'));
  try {
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for (const file of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(temp,file));
    for (const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(temp,'vendor',file));
    const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    const source=await import(pathToFileURL(path.join(temp,'world.js')).href);
    return {THREE,source,world:source.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  } catch (error) {fs.rmSync(temp,{recursive:true,force:true});throw error;}
}
const cell=(trap=true)=>({cell:4,neighbors:[],blocked:false,trap,checkpoint:false,clue:false});
const published=(overrides={})=>({
  runToken:'public-tide-shear-hazard',tick:1,width:3,height:3,currentCell:4,
  cells:[cell()],visibleCells:[4],keys:[],doors:[],inventory:[],
  threats:[],exitCell:null,result:null,...overrides
});
const jaws=world=>[-1,1].map(side=>world.group.getObjectByName(
  'Disclosed tide-shear hinged jaw 4 '+side));

test('published trap owns TWO connected sculpted 3D jaws that respond to actual public Pip proximity',async()=>{
  const {THREE,source,world,cleanup}=await actualWorld();
  try {
    const state=published(),original=JSON.stringify(state);
    world.update(state);
    const parts=jaws(world),parent=world.group.getObjectByName('Disclosed tide-shear pressure hazard 4');
    assert.ok(parent,'the hazard must be in the real world stage');
    assert.ok(parts.every(Boolean),'both side hinges physically exist');
    assert.equal(world.stats().responsiveTrapJaws,2);
    for (const [i,jaw] of parts.entries()) {
      assert.equal(jaw.parent,parent,'real joints belong to the disclosed hazard cell');
      assert.ok(jaw.children.filter(x=>x.isMesh).length>=5,
        'each visible jaw has an authored carved plate, contrasting inner face, rim and tooth');
      assert.ok(Math.abs(jaw.position.x)> .6 && Math.abs(jaw.position.x)< .8,
        'hinges stay on actual cell margins, not across the central playable route');
      // The older .12Z expected value belonged to the pre-Pass279 rear
      // hinge. The full connected PAIR physically moved forward to .44Z
      // and lower to -.035Y to clear the authored pressure action.
      // Assert precise true 3D placement; never weaken the no-crop/privacy gate.
      assert.equal(jaw.position.z,.44,
        'the real complete pressure hinge is forward-seated at the current source-defined 0.44Z rail');
      assert.equal(jaw.position.y,-.035,
        'both physical jaw pivots remain below the current pressure deck, not a floating cutout');
      const vane=jaw.getObjectByName('Published tide-shear warning vane');
      const fang=jaw.getObjectByName('Published tide-shear warning fang');
      assert.ok(vane?.isMesh && fang?.isMesh,
        'the ACTUAL hinge must own a readable tall colored physical hazard silhouette');
      assert.equal(vane.parent,jaw,'signal follows the real hinge, not a HUD or a floating marker');
      assert.ok(vane.position.y>1 && fang.position.y>vane.position.y,
        'original signal must remain tall enough to stand apart from same-color miniature masonry');
      const blade=jaw.getObjectByName('Published tide-shear front blade');
      const inlay=jaw.getObjectByName('Published tide-shear forward danger inlay');
      const talon=jaw.getObjectByName('Published tide-shear hooked ceramic talon');
      const brace=jaw.getObjectByName('Published tide-shear inward brace');
      assert.ok(blade?.isMesh && inlay?.isMesh && talon?.isMesh && brace?.isMesh,
        'the actual pressure hinge must own one complete broad ivory/bronze danger claw');
      assert.ok([blade,inlay,talon,brace].every(part=>part.parent===jaw),
        'a joined talon follows the true moving pressure joint, not an invented HUD event');
      assert.ok(blade.scale.x>=.34 && blade.scale.y>=.84 && inlay.scale.y>=.60,
        'the primary danger face is substantial enough to be meaningful in real portrait output');
      assert.ok(brace.scale.x>=.60 && talon.position.y>blade.position.y,
        'connected diagonal shoulder ends in a distinct swept tooth');
      assert.notEqual(blade.material,inlay.material,
        'the claw has an ivory silhouette and a separate contrasting real danger face');
      assert.ok(Math.abs(blade.position.x)+blade.scale.x/2<.80,
        'inward claw geometry stays inside the actual published tile-margin hinge');
    }
    const pos=source.cellPosition(4,3,3),ground=source.cellHeight(4,3,3);
    const hero=new THREE.Vector3(pos.x,ground,pos.z);
    const resources=world.stats();
    world.animate(0,{gateTime:0,reducedMotion:false,explorerPosition:hero});
    assert.ok(parts[0].rotation.z<-.19 && parts[0].rotation.z>-.21
      && parts[1].rotation.z>.19 && parts[1].rotation.z<.21,
      'first witnessed contact must warn through the hinge before the ivory floor opens');
    world.animate(.35,{gateTime:.35,reducedMotion:false,explorerPosition:hero});
    assert.ok(parts.every(jaw=>Math.abs(jaw.rotation.z)>.20
      && Math.abs(jaw.rotation.z)<.66),
      'middle beat opens both real jaws only as their floor shutters move');
    world.animate(1.25,{gateTime:1.25,reducedMotion:false,explorerPosition:hero});
    assert.ok(parts[0].rotation.z<-.60 && parts[1].rotation.z>.60,
      'continued witnessed contact completes the physical INWARD jaw shear');
    world.animate(0,{gateTime:0,reducedMotion:false,explorerPosition:hero});
    assert.equal(parts[0].rotation.z,-parts[1].rotation.z,
      'same public pose yields symmetrical deterministic positions');
    // The genuine native capture shows autonomous Pip adjacent to the
    // published trap, not standing on it. Require a physical signal at one
    // whole public tile of separation, without altering any engine hazard.
    world.animate(1.25,{gateTime:1.25,reducedMotion:false,
      explorerPosition:new THREE.Vector3(pos.x+source.CELL_SIZE,ground,pos.z)});
    assert.ok(parts.every(jaw=>Math.abs(jaw.rotation.z)>.60),
      'sustained one-cell public contact keeps both completed physical jaws visible');
    world.animate(1.25,{gateTime:1.25,reducedMotion:false,
      explorerPosition:new THREE.Vector3(pos.x+40,ground,pos.z+40)});
    assert.ok(parts.every(jaw=>Math.abs(Math.abs(jaw.rotation.z)-.06)<1e-9),
      'withdrawal returns to a small closed/resting gesture without imagined pursuit');
    world.animate(1.25,{gateTime:1.25,reducedMotion:true,explorerPosition:hero});
    assert.ok(parts.every(jaw=>Math.abs(Math.abs(jaw.rotation.z)-.24)<1e-9),
      'reduced motion uses stable recognizable physical pose with zero oscillation');
    assert.equal(world.stats().geometryCount,resources.geometryCount,
      'no geometry allocations in proximity animation');
    assert.equal(world.stats().materialCount,resources.materialCount,
      'no material allocations during animations');
    assert.ok(resources.geometryCount<=16 && resources.materialCount<=26
      && resources.textureCount<=3,'existing balanced Three resource budget stays intact');
    assert.equal(JSON.stringify(state),original,'visual mechanism never writes to sanitized public engine state');
  } finally {world.dispose();cleanup();}
});

test('real public pressure court has joined mineral deck and two actual Three conduits, not private trap hints',async()=>{
  const {THREE,source,world,cleanup}=await actualWorld();
  try {
    const neighbor={cell:5,neighbors:[4],blocked:false,trap:false,checkpoint:false,clue:false};
    const state=published({cells:[{...cell(),neighbors:[5]},neighbor],visibleCells:[4,5]});
    const untouched=JSON.stringify(state),pos=source.cellPosition(5,3,3);
    const pieces=()=>{
      let deck=0,grooves=0;
      const matrix=new THREE.Matrix4(),p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();
      world.group.traverse(node=>{
        if(!node.isInstancedMesh)return;
        for(let i=0;i<node.count;i++){
          node.getMatrixAt(i,matrix);matrix.decompose(p,q,s);
          if(Math.abs(p.x-pos.x)>.001 || Math.abs(p.z-pos.z)>.70)continue;
          const color=node.material.color?.getHexString();
          if(color==='28574f'&&Math.abs(s.x-2.39)<.01&&Math.abs(s.z-2.39)<.01)deck++;
          if(color==='334a46'&&Math.abs(s.x-2.18)<.01&&Math.abs(s.z-.22)<.01&&Math.abs(s.y-.023)<.01)grooves++;
        }
      });
      return {deck,grooves};
    };
    world.update(state);
    assert.ok(pieces().deck>=1,'public trap has a physically joined dark-jade deck');
    assert.equal(pieces().grooves,2,'exactly two full-size bronze pressure rails face the real reciprocal public trap');
    assert.equal(JSON.stringify(state),untouched,'public state stays immutable');
    const budget=world.stats();
    world.animate(1,{explorerPosition:new THREE.Vector3(pos.x,source.cellHeight(5,3,3),pos.z)});
    assert.equal(world.stats().geometryCount,budget.geometryCount,'no animated geometry allocations');
    assert.equal(world.stats().materialCount,budget.materialCount,'no animated material allocations');
    world.update(published({cells:[{...cell(false),neighbors:[5]},neighbor],
      visibleCells:[4,5],privateTrapCells:[4],hiddenDanger:{cell:4}}));
    assert.equal(pieces().deck,0,'private trap data cannot create a predictive public basin');
  } finally{world.dispose();cleanup();}
});

test('no private trap, remembered-only cue or previous run may animate a hidden hazard',async()=>{
  const {THREE,source,world,cleanup}=await actualWorld();
  try {
    const pos=source.cellPosition(4,3,3),hero=new THREE.Vector3(pos.x,0,pos.z);
    world.update(published({visibleCells:[]}));
    assert.ok(jaws(world).every(Boolean),'known remembered hazard remains legitimate stage art');
    world.animate(1,{explorerPosition:hero});
    assert.ok(jaws(world).every(jaw=>Math.abs(Math.abs(jaw.rotation.z)-.06)<1e-9),
      'remembered but currently invisible hazard cannot stage a fresh event');
    world.update(published({visibleCells:[4]}));
    world.animate(1,{explorerPosition:hero});
    assert.ok(jaws(world).every(jaw=>Math.abs(Math.abs(jaw.rotation.z)-.20)<1e-8),
      'newly re-visible near contact earns only an honest relay warning first');
    world.animate(2.25,{explorerPosition:hero});
    assert.ok(jaws(world).every(jaw=>Math.abs(jaw.rotation.z)>.60),
      'only continued public contact completes the full jaw stroke');
    world.update(published({cells:[cell(false)],privateTrapCells:[4],
      hiddenDanger:{cell:4},privateRoute:[4,5,8]}));
    assert.ok(jaws(world).every(jaw=>!jaw),
      'unknown private fields must never create a trap or hazard action');
    assert.equal(world.stats().responsiveTrapJaws,0);
    world.update(published());
    assert.equal(world.stats().responsiveTrapJaws,2);
    world.update(published({runToken:'new-run',cells:[],visibleCells:[],
      privateTrapCells:[4]}));
    assert.equal(world.stats().responsiveTrapJaws,0,'new run clears prior disclosed hazard objects');
    assert.ok(jaws(world).every(jaw=>!jaw),'no stale public presentation meshes remain');
  } finally {world.dispose();cleanup();}
});
