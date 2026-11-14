'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

async function productionWorld(){
  const root=path.resolve(__dirname,'../..');
  const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-pressure-deck-'));
  try{
    fs.mkdirSync(path.join(tmp,'vendor'));
    fs.writeFileSync(path.join(tmp,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','map-view.mjs','gate-moment.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(tmp,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(tmp,'vendor',file));
    const THREE=await import(pathToFileURL(path.join(tmp,'vendor/three.module.js')).href);
    const game=await import(pathToFileURL(path.join(tmp,'world.js')).href);
    return {THREE,game,world:game.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(tmp,{recursive:true,force:true})};
  }catch(error){fs.rmSync(tmp,{recursive:true,force:true});throw error}
}
const state=(overrides={})=>({
  runToken:'public-wide-pressure-deck',tick:1,width:3,height:3,currentCell:4,
  cells:[{cell:4,neighbors:[],blocked:false,trap:true,checkpoint:false,clue:false}],
  visibleCells:[4],keys:[],doors:[],inventory:[],threats:[],exitCell:null,result:null,
  ...overrides
});
const shutter=(world,side)=>world.group.getObjectByName('Published tide-shear floor shutter '+side);
const close=(actual,expected,label)=>assert.ok(Math.abs(actual-expected)<1e-8,
  label+': '+actual+' vs '+expected);

test('an actual published pressure hazard has broad paired moving ivory decks, not two tiny loose tiles',async()=>{
  const {THREE,game,world,cleanup}=await productionWorld();
  try{
    const publicSnapshot=state(),frozen=JSON.stringify(publicSnapshot);
    world.update(publicSnapshot);
    const pressure=world.group.getObjectByName('Disclosed tide-shear pressure hazard 4');
    assert.ok(pressure?.isGroup,'genuine published trap has a 3D home');
    const sections=[-1,1].map(side=>({side,group:shutter(world,side)}));
    const envelopes=sections.map(({side,group})=>{
      assert.ok(group?.isGroup && group.parent===pressure,
        'both moving floor sections are rooted in one publicly known trap');
      assert.equal(group.children.filter(x=>x.isMesh).length,4,
        'mechanical deck remains the original bounded four-part system');
      const ivory=group.getObjectByName('Published tide-shear ivory moving face');
      assert.ok(ivory?.isMesh && ivory.parent===group,
        'one broad connected ivory face actually travels with each hinge');
      assert.ok(ivory.scale.x>=.60 && ivory.scale.z>=1.10,
        'the whole floor deck, not a tiny ceramic fleck, must perform on mobile');
      assert.ok(group.children.some(x=>x.isMesh && x.material!==ivory.material
        && x.scale.z>=1.25), 'a deep continuous metal load bed backs the moving face');
      assert.ok(Math.abs(group.position.x+(-side*.52))<1e-8);
      assert.ok(Math.abs(group.position.z+.02)<1e-8);
      const outer=Math.abs(group.position.x+ivory.position.x)+ivory.scale.x/2;
      const depth=Math.abs(group.position.z+ivory.position.z)+ivory.scale.z/2;
      assert.ok(outer<1.20 && depth<1.20,
        'both original resting half-decks stay inside their true 2.4m trap tile');
      return {side,group,ivory};
    });
    const pos=game.cellPosition(4,3,3),hero=new THREE.Vector3(pos.x,0,pos.z);
    const far=new THREE.Vector3(pos.x+40,0,pos.z+40);
    const budget=world.stats();
    world.animate(0,{gateTime:0,explorerPosition:far,reducedMotion:false});
    for(const {side,group} of envelopes){
      close(group.position.x,side*.52,'rested x');
      close(group.rotation.z,-side*.03,'rested tilt');
    }
    world.animate(0,{gateTime:0,explorerPosition:hero,reducedMotion:false});
    for(const {side,group} of envelopes)
      close(group.rotation.z,-side*.03,'warning must precede opening');
    world.animate(1.25,{gateTime:1.25,explorerPosition:hero,reducedMotion:false});
    for(const {side,group} of envelopes){
      close(group.position.x,side*.70,'true pressure spreads deck root');
      close(group.rotation.z,-side*1.11,'true pressure lifts each broad door');
    }
    world.animate(2,{gateTime:2,explorerPosition:far,reducedMotion:false});
    for(const {side,group} of envelopes){
      close(group.position.x,side*.52,'withdrawal retracts mechanical deck');
      close(group.rotation.z,-side*.03,'withdrawal closes deck');
    }
    world.update(state({visibleCells:[]}));
    world.animate(3,{gateTime:3,explorerPosition:hero,reducedMotion:true});
    for(const {side,group} of envelopes)
      close(group.rotation.z,-side*.03,'remembered-only pressure must remain closed');
    world.update(state({visibleCells:[4]}));
    world.animate(4,{gateTime:4,explorerPosition:hero,reducedMotion:true});
    for(const {side,group} of envelopes)
      close(group.rotation.z,-side*.24,'reduced-motion only earns still pose on true contact');
    for(const k of ['geometryCount','materialCount','textureCount'])
      assert.equal(world.stats()[k],budget[k],k+' unchanged across real motion');
    assert.equal(JSON.stringify(publicSnapshot),frozen,
      'presentation cannot mutate source-authoritative public gameplay');
    world.update(state({runToken:'next',cells:[],visibleCells:[],privateTrapCells:[4]}));
    assert.equal(world.stats().responsiveTrapSignals,0,'reset releases deck and public trap');
    assert.ok(!shutter(world,-1),'unpublished next-run trap cannot persist as an old mesh');
  }finally{world.dispose();cleanup()}
});
