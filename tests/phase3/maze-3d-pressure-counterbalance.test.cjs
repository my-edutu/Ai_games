'use strict';
const test=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {pathToFileURL}=require('node:url');
const source=fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const three=pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const moment=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href;
const map=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href;
const mod=import('data:text/javascript;base64,'+Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(three))
  .replace("'./gate-moment.mjs'",JSON.stringify(moment))
  .replace("'./map-view.mjs'",JSON.stringify(map))).toString('base64'));
const published={runToken:'counterbalance-public',tick:4,width:7,height:9,currentCell:24,
  cells:[{cell:24,neighbors:[],trap:true,blocked:false}],
  visibleCells:[24],discoveredCells:[24],doors:[],keys:[],inventory:[],threats:[],exitCell:null};
test('a real published pressure stroke turns one connected physical tideglass arch; hidden and reduced runs remain truthful',async()=>{
  const {createMazeWorld,CELL_SIZE}=await mod;
  const {Vector3,Box3}=await import(three);
  const world=createMazeWorld({balanced:true}),initial=world.stats(),original=JSON.stringify(published);
  try{
    world.update(published);
    const trap=world.group.getObjectByName('Disclosed tide-shear pressure hazard 24');
    const arch=trap?.getObjectByName('Published tide-shear pressure counterbalance arch 24');
    const bridge=arch?.getObjectByName('Published tide-shear spanning load bridge');
    const wheel=arch?.getObjectByName('Published tide-shear bronze pressure governor');
    const cable=arch?.getObjectByName('Published tide-shear connected descending cable');
    const weight=arch?.getObjectByName('Published tide-shear hanging counterweight');
    const treadle=trap?.getObjectByName('Published tide-shear depressible treadle 24');
    const jaw=trap?.getObjectByName('Disclosed tide-shear hinged jaw 24 1');
    assert.ok(arch?.isGroup&&bridge?.isGroup&&wheel?.isGroup&&cable?.isGroup&&weight?.isGroup
      &&treadle?.isGroup&&jaw?.isGroup,'entire original mechanism and new load-bearing theatre must be present');
    assert.equal(arch.parent,trap);
    assert.ok(arch.children.length>=9,'the stage must use two rooted pylons, floor braces, bridge, governor and weight');
    const origin=trap.getWorldPosition(new Vector3());
    const far=new Vector3(origin.x+30,0,origin.z+30);
    const diagonal=new Vector3(origin.x+CELL_SIZE,0,origin.z+CELL_SIZE);
    const contact=new Vector3(origin.x,0,origin.z);
    world.animate(1,{explorerPosition:far,reducedMotion:false});
    assert.ok(Math.abs(wheel.rotation.z)<1e-12 && Math.abs(bridge.rotation.z)<1e-12);
    assert.equal(weight.position.y,.60);assert.equal(cable.scale.y,1);
    world.animate(1.2,{explorerPosition:diagonal,reducedMotion:false});
    assert.ok(Math.abs(wheel.rotation.z)<1e-12 && Math.abs(bridge.rotation.z)<1e-12,
      'diagonal sighting alone cannot animate the moving mechanism');
    world.animate(2,{explorerPosition:contact,reducedMotion:false});
    world.animate(3.4,{explorerPosition:contact,reducedMotion:false});
    assert.ok(treadle.position.y<.01,'the authoritative published approach depresses the real plate');
    assert.ok(wheel.rotation.z<-.65 && bridge.rotation.z>.10,'the same real near-contact turns the whole arch');
    assert.ok(weight.position.y<.33 && cable.scale.y>1.80,'the hanging weight and cable release in concert');
    assert.ok(jaw.rotation.z>.60,'the physical jaw completes its real inward stroke');
    world.group.updateMatrixWorld(true);
    const bounds=new Box3().setFromObject(arch);
    assert.ok(bounds.min.x>origin.x-1.2&&bounds.max.x<origin.x+1.2
      &&bounds.min.z>origin.z-1.2&&bounds.max.z<origin.z+1.2,
      'the COMPLETE moving counterbalance stays inside the published trap cell '+JSON.stringify({
        minX:bounds.min.x-origin.x,maxX:bounds.max.x-origin.x,
        minZ:bounds.min.z-origin.z,maxZ:bounds.max.z-origin.z}));
    world.animate(4,{explorerPosition:far,reducedMotion:false});
    assert.ok(Math.abs(wheel.rotation.z)<1e-12&&Math.abs(bridge.rotation.z)<1e-12);
    assert.equal(weight.position.y,.60);assert.equal(cable.scale.y,1);
    world.animate(5,{explorerPosition:contact,reducedMotion:true});
    assert.ok(wheel.rotation.z<-.4&&wheel.rotation.z>-.45,'true reduced-motion contact uses one static governor pose');
    assert.ok(bridge.rotation.z>.05&&bridge.rotation.z<.07);
    assert.ok(weight.position.y>.44&&weight.position.y<.46);
    world.update({...published,visibleCells:[]});
    world.animate(6,{explorerPosition:contact,reducedMotion:true});
    assert.ok(Math.abs(wheel.rotation.z)<1e-12&&Math.abs(bridge.rotation.z)<1e-12,
      'remembered-only pressure must not trigger visible machinery');
    assert.equal(weight.position.y,.60);assert.equal(cable.scale.y,1);
    assert.equal(JSON.stringify(published),original,'public state and AI/collision authority must never change');
    for(const k of ['geometryCount','materialCount','textureCount'])
      assert.equal(world.stats()[k],initial[k],'reuse shared material/shape budgets: '+k);
    world.update({...published,runToken:'new-run',tick:0,cells:[],visibleCells:[],discoveredCells:[]});
    assert.equal(world.group.getObjectByName('Published tide-shear pressure counterbalance arch 24'),undefined,
      'a new run cannot leak the previous discovered hazard');
  }finally{
    world.dispose();
    for(const k of ['geometryCount','materialCount','textureCount'])
      assert.equal(world.stats()[k],0,'fully release: '+k);
  }
});
