'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Exercise the installed production Three.js mechanism, not mocked meshes.
async function loadWorld(){
  const root=path.resolve(__dirname,'../..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-pressure-reduced-contact-'));
  try{
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','map-view.mjs','gate-moment.mjs','characters.js'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(temp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(temp,'vendor',file));
    const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    const source=await import(pathToFileURL(path.join(temp,'world.js')).href);
    const characters=await import(pathToFileURL(path.join(temp,'characters.js')).href);
    return {THREE,source,characters,world:source.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  }catch(error){fs.rmSync(temp,{recursive:true,force:true});throw error}
}
const state=(overrides={})=>({
  runToken:'reduced-public-pressure',tick:1,width:3,height:3,currentCell:4,
  cells:[{cell:4,neighbors:[],blocked:false,trap:true,checkpoint:false,clue:false}],
  visibleCells:[4],keys:[],doors:[],inventory:[],threats:[],exitCell:null,result:null,
  ...overrides
});
const close=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<1e-8,
  label+': expected '+expected+', got '+actual);

test('reduced-motion pressure is a true public contact state, not every known visible trap firing',async()=>{
  const {THREE,source,characters,world,cleanup}=await loadWorld();
  try{
    const published=state(),untouched=JSON.stringify(published);
    world.update(published);
    const centre=source.cellPosition(4,3,3),step=source.CELL_SIZE;
    const far=new THREE.Vector3(centre.x+40,0,centre.z+40);
    const diagonal=new THREE.Vector3(centre.x+step,0,centre.z+step);
    const near=new THREE.Vector3(centre.x+step,0,centre.z);
    const relays=[-1,1].map(side=>world.group.getObjectByName('Published tide-shear staged relay 4 '+side));
    const shutters=[-1,1].map(side=>world.group.getObjectByName('Published tide-shear floor shutter '+side));
    const jaws=[-1,1].map(side=>world.group.getObjectByName('Disclosed tide-shear hinged jaw 4 '+side));
    const leaves=[-1,1].map(side=>world.group.getObjectByName('Published tide-shear diaphragm '+side));
    const carriage=world.group.getObjectByName('Published tide-shear rising carriage');
    assert.ok(relays.every(Boolean)&&shutters.every(Boolean)&&jaws.every(Boolean)&&leaves.every(Boolean)&&carriage,
      'the actual paired 3D pressure mechanism is present');
    const budget=world.stats();
    const rest=(label)=>{
      close(carriage.position.y,.16,label+' piston rest');
      for(let i=0;i<2;i++){
        const side=i===0?-1:1;
        close(relays[i].rotation.z,-side*.05,label+' relay rest');
        close(relays[i].position.y,.28,label+' relay height');
        close(Math.abs(leaves[i].rotation.z),.08,label+' diaphragm rest');
        close(shutters[i].position.x,side*.52,label+' shutter closed');
        close(Math.abs(shutters[i].rotation.z),.03,label+' shutter resting tilt');
        close(Math.abs(jaws[i].rotation.z),.06,label+' jaw closed');
      }
    };
    const pip=characters.createExplorer({balanced:true});
    try{
      const face=pip.group.getObjectByName('curious head');
      const torso=pip.group.getObjectByName('breathing torso');
      assert.ok(face&&torso,'actual full-body Pip character joints exist');
      const act=(progress,strength=1)=>{
        pip.update({time:0,reducedMotion:true,pressureHeading:0,
          pressureStrength:strength,pressureProgress:progress});
        return {torsoY:torso.position.y,headX:face.rotation.x};
      };
      world.animate(1,{explorerPosition:far,reducedMotion:true});
      rest('visible but far:');
      close(world.publicPressureProgress(4),0,'visible distant physical signal');
      const neutral=act(world.publicPressureProgress(4));
      world.animate(2,{explorerPosition:diagonal,reducedMotion:true});
      rest('visible diagonal, not yet contact:');
      close(world.publicPressureProgress(4),0,'visible diagonal mechanism is closed');
      const diagonalPip=act(world.publicPressureProgress(4),.7);
      close(diagonalPip.torsoY,neutral.torsoY,'Pip cannot falsely brace at closed diagonal mechanism');
      close(diagonalPip.headX,neutral.headX,'Pip gaze remains truthful without physical contact');
      world.animate(3,{explorerPosition:near,reducedMotion:true});
      close(world.publicPressureProgress(4),1,'true public contact publishes static physical pose');
      const contactPip=act(world.publicPressureProgress(4));
      assert.ok(contactPip.torsoY < neutral.torsoY-.05
        && contactPip.headX > neutral.headX+.10,
        'real near contact must physically plant Pip and lift its head');
      close(carriage.position.y,.29,'true visible one-cell contact lifts static piston');
    for(let i=0;i<2;i++){
      const side=i===0?-1:1;
      close(relays[i].rotation.z,-side*.40,'true near warning relay');
      close(relays[i].position.y,.32,'true near relay height');
      close(Math.abs(leaves[i].rotation.z),.34,'true near ceramic diaphragm');
      close(shutters[i].position.x,side*.61,'true near shutter spread');
      close(Math.abs(shutters[i].rotation.z),.24,'true near stationary shutter');
      close(Math.abs(jaws[i].rotation.z),.24,'true near paired warning jaws');
    }
      world.animate(4,{explorerPosition:far,reducedMotion:true});
      rest('retreat:');
      close(world.publicPressureProgress(4),0,'retreat immediately resets Pip mechanical cue');
      close(act(world.publicPressureProgress(4)).torsoY,neutral.torsoY,'Pip released after retreat');
      world.update(state({visibleCells:[]}));
      world.animate(5,{explorerPosition:near,reducedMotion:true});
      rest('remembered-only hazard:');
      close(world.publicPressureProgress(4),0,'hidden pressure cannot cue Pip');
      world.update(state({result:{reason:'capture'}}));
      world.animate(6,{explorerPosition:near,reducedMotion:true});
      rest('terminal hazard:');
      close(world.publicPressureProgress(4),0,'terminal pressure cannot cue Pip');
    } finally {pip.dispose();}
    for(const metric of ['geometryCount','materialCount','textureCount'])
      assert.equal(world.stats()[metric],budget[metric],
        'render-frame contact cannot allocate new GPU resources');
    assert.equal(JSON.stringify(published),untouched,
      'presentation must never mutate engine snapshot or public knowledge');
    world.update(state({runToken:'other-run',cells:[],visibleCells:[],privateTrapCells:[4]}));
    assert.equal(world.stats().responsiveTrapSignals,0,'reset drops the old mechanism');
  }finally{world.dispose();cleanup()}
});
