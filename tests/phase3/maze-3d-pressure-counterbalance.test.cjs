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

test("Pass278 side-coupled powertrain clears Pip's center while retaining a truthful physical pressure cycle",async()=>{
  const {createMazeWorld}=await mod;
  const {Vector3,Box3}=await import(three);
  const world=createMazeWorld({balanced:true});
  const unchanged=JSON.stringify(published), initial=world.stats();
  try{
    world.update(published);
    const trap=world.group.getObjectByName('Disclosed tide-shear pressure hazard 24');
    const arch=trap?.getObjectByName('Published tide-shear pressure counterbalance arch 24');
    const wheel=arch?.getObjectByName('Published tide-shear bronze pressure governor');
    const cable=arch?.getObjectByName('Published tide-shear connected descending cable');
    const weight=arch?.getObjectByName('Published tide-shear hanging counterweight');
    const yoke=arch?.getObjectByName('Published Tideglass shear-portal connected yoke');
    assert.ok(wheel?.isGroup && cable?.isGroup && weight?.isGroup && yoke?.isMesh,
      'the complete same physical source-driven counterbalance still exists');
    assert.ok(wheel.position.x>=.70 && wheel.position.x<=.80,
      'move the real governor out of Pip’s central camera sightline, not just its highlight');
    assert.equal(cable.position.x,wheel.position.x,'wheel and cable share the mounted power axle');
    assert.equal(weight.position.x,wheel.position.x,'the physical descending load stays under the same shaft');
    const center=trap.getWorldPosition(new Vector3());
    const far=new Vector3(center.x+25,0,center.z+25);
    const contact=new Vector3(center.x,0,center.z);
    const originalPositions=[wheel.position.x,cable.position.x,weight.position.x];
    const budget=world.stats();
    for(const [t,p,reduced] of [[1,far,false],[2,contact,false],[3.4,contact,false],
       [4,far,false],[5,contact,true],[6,far,false]]){
      world.animate(t,{explorerPosition:p,reducedMotion:reduced});
      world.group.updateMatrixWorld(true);
      assert.deepEqual([wheel.position.x,cable.position.x,weight.position.x],originalPositions,
        'the side transmission never drifts or teleports across event stages');
      const extent=new Box3().setFromObject(arch);
      assert.ok(extent.min.x>center.x-1.2 && extent.max.x<center.x+1.2
        &&extent.min.z>center.z-1.2 && extent.max.z<center.z+1.2,
        'the ENTIRE side-mounted transmission stays inside the strict published trap footprint');
      assert.ok(wheel.getWorldPosition(new Vector3()).x>center.x+.55,
        'the active governor remains physically beside rather than across the hero');
      for(const key of ['geometryCount','materialCount','textureCount'])
        assert.equal(world.stats()[key],budget[key],'no GPU resources allocated during action: '+key);
      if(t===3.4)assert.ok(wheel.rotation.z<-.65 && weight.position.y<.33,
        'real publicly witnessed contact still rotates the side gear and drops its load');
      if(t===4||t===6)assert.equal(weight.position.y,.60,
        'withdrawal restores the same physical hanging load');
    }
    assert.equal(JSON.stringify(published),unchanged,'no AI/private/collision rule changed');
    world.update({...published,runToken:'replayed-run',tick:0,cells:[],
      visibleCells:[],discoveredCells:[]});
    assert.equal(world.group.getObjectByName('Published tide-shear bronze pressure governor'),undefined,
      'hidden or reset world cannot retain the old power bay');
    for(const key of ['geometryCount','materialCount','textureCount'])
      assert.equal(world.stats()[key],initial[key],'reset preserves original GPU class budget');
  }finally{
    world.dispose();
    for(const key of ['geometryCount','materialCount','textureCount'])
      assert.equal(world.stats()[key],0,'full release: '+key);
  }
});

test('Pass259 pairs two broad connected ivory shears instead of a heap of red trim',async()=>{
  const {createMazeWorld}=await mod;
  const {Box3,Vector3}=await import(three);
  const world=createMazeWorld({balanced:true}),initial=world.stats(),source=JSON.stringify(published);
  try {
    world.update(published);
    const trap=world.group.getObjectByName('Disclosed tide-shear pressure hazard 24');
    const origin=trap.getWorldPosition(new Vector3());
    const jaws=[-1,1].map(side=>trap.getObjectByName('Disclosed tide-shear hinged jaw 24 '+side));
    assert.equal(jaws.length,2);
    for(const jaw of jaws){
      assert.ok(jaw?.isGroup,'the source-visible two-sided pressure mechanism exists');
      const blade=jaw.getObjectByName('Published tide-shear front blade');
      const inlay=jaw.getObjectByName('Published tide-shear forward danger inlay');
      const spine=jaw.getObjectByName('Published tide-shear inward brace');
      assert.ok(blade?.isMesh&&inlay?.isMesh&&spine?.isMesh);
      assert.equal(blade.parent,jaw,'no detached floating teeth');
      assert.ok(blade.scale.y>=1.10&&inlay.scale.y>=.90,
        'both cutting faces must be broad, readable physical actor-scale forms');
      assert.ok(jaw.children.filter(child=>child.isMesh).length<=9,
        'old decorative clutter must be replaced, not layered under more models');
    }
    const far=new Vector3(origin.x+25,0,origin.z+25),contact=new Vector3(origin.x,0,origin.z);
    for(const [time,position] of [[1,far],[2,contact],[3.4,contact],[4,far]]){
      world.animate(time,{explorerPosition:position,reducedMotion:false});
      trap.updateMatrixWorld(true);
      for(const jaw of jaws){
        const bounds=new Box3().setFromObject(jaw);
        assert.ok(bounds.min.x>origin.x-1.2&&bounds.max.x<origin.x+1.2
          &&bounds.min.z>origin.z-1.2&&bounds.max.z<origin.z+1.2,
          'complete live cutting face stays within the public tile at t='+time);
      }
      if(time===3.4) assert.ok(jaws[1].rotation.z>.60&&jaws[0].rotation.z<-.60,
        'both real jaw hinges shear inward on the existing source pressure stroke');
    }
    assert.equal(JSON.stringify(published),source,'no private world-state changes');
    for(const key of ['geometryCount','materialCount','textureCount'])
      assert.equal(world.stats()[key],initial[key],key+' must stay in the pooled strict budget');
  }finally {world.dispose();}
});

test('Pass261 pressure court is one rooted two-cheek machine, not loose warning fragments',async()=>{
  const {createMazeWorld}=await mod;
  const {Vector3,Box3}=await import(three);
  const world=createMazeWorld({balanced:true});
  const baseline=world.stats(),original=JSON.stringify(published);
  try {
    world.update(published);
    const trap=world.group.getObjectByName('Disclosed tide-shear pressure hazard 24');
    const plinth=trap?.getObjectByName('Published tide-shear continuous stone machine plinth');
    const cheeks=trap?.children.filter(child=>child.name==='Published tide-shear rooted ivory guide cheek')||[];
    const mast=trap?.getObjectByName('Published tide-shear pressure mast 24');
    const left=trap?.getObjectByName('Disclosed tide-shear hinged jaw 24 -1');
    const right=trap?.getObjectByName('Disclosed tide-shear hinged jaw 24 1');
    const plate=trap?.getObjectByName('Published tide-shear depressible treadle 24');
    assert.ok(plinth?.isMesh && plinth.scale.x>=2.0 && plinth.scale.z>=2.0,
      'a real machine-scale connected stone base must ground the moving parts');
    assert.equal(cheeks.length,2,'one opposed pair of guides replaces disconnected hazard markers');
    assert.ok(cheeks.every(cheek=>cheek.isMesh && cheek.parent===trap
      && cheek.scale.z>=1.70 && cheek.position.y<.30),
      'both continuous low cheek guides frame the mechanism without a fake wall');
    assert.ok(mast?.isGroup&&Math.abs(mast.scale.x-.82)<1e-12,
      'rear governor must not overprint the two front cutting silhouettes');
    assert.ok(left?.isGroup&&right?.isGroup&&plate?.isGroup);
    // Pass280 strict contract: Pass279 moved the ACTUAL left/right jaw pivot
    // assemblies into the forward guide bay, not the autonomous hazard cell.
    // Previous Pass261 .12Z assertion described an obsolete geometry stage.
    // Require BOTH authored pivot origins exactly, including equal-depth,
    // opposite-X roots and the lowered Y clearance; never weaken footprint,
    // contact, six-reset budgets, or camera/privacy acceptance.
    assert.ok(Math.abs(left.position.z-.44)<1e-12&&Math.abs(right.position.z-.44)<1e-12
      &&Math.abs(left.position.y+.035)<1e-12&&Math.abs(right.position.y+.035)<1e-12
      &&Math.abs(left.position.x+.68)<1e-12&&Math.abs(right.position.x-.68)<1e-12,
      'both true coupled jaws share the lower front guide stage, with mirrored rooted pivots');
    const origin=trap.getWorldPosition(new Vector3());
    const outside=new Vector3(origin.x+40,0,origin.z+40);
    const contact=new Vector3(origin.x,0,origin.z);
    const initialCounts=world.stats();
    for(const [time,position,motion] of [
      [1,outside,false],[2,contact,false],[3.4,contact,false],[4,outside,false],[5,contact,true]
    ]){
      world.animate(time,{explorerPosition:position,reducedMotion:motion});
      world.group.updateMatrixWorld(true);
      for(const part of [plinth,...cheeks]){
        const box=new Box3().setFromObject(part);
        assert.ok(box.min.x>origin.x-1.2 && box.max.x<origin.x+1.2
          && box.min.z>origin.z-1.2 && box.max.z<origin.z+1.2,
          'machine foundation never leaks out of the publicly disclosed tile');
      }
      for(const key of ['geometryCount','materialCount','textureCount'])
        assert.equal(world.stats()[key],initialCounts[key],
          'repose/replay must not create GPU resource classes: '+key);
    }
    assert.ok(Math.abs(left.rotation.z+.24)<1e-9 && Math.abs(right.rotation.z-.24)<1e-9,
      'reduced-motion contact retains true source driven symmetrical shears');
    assert.equal(JSON.stringify(published),original,'presentation must not mutate public/AI authority');
    world.update({...published,runToken:'unseen-next-run',tick:0,cells:[],
      visibleCells:[],discoveredCells:[]});
    assert.equal(world.group.getObjectByName('Published tide-shear continuous stone machine plinth'),undefined,
      'no private or old-run pressure court survives a reset');
    for(const key of ['geometryCount','materialCount','textureCount'])
      assert.equal(world.stats()[key],baseline[key],'reset returns original shared resource budget');
  }finally{world.dispose();}
});


test('Pass262 makes the two real foreground cutters dominant while quieting moving secondary apparatus',async()=>{
  const {createMazeWorld}=await mod;
  const {Vector3,Box3}=await import(three);
  const world=createMazeWorld({balanced:true}),before=world.stats();
  const serialized=JSON.stringify(published);
  try {
    world.update(published);
    const trap=world.group.getObjectByName('Disclosed tide-shear pressure hazard 24');
    const wheel=trap.getObjectByName('Published tide-shear bronze pressure governor');
    const carriage=trap.getObjectByName('Published tide-shear rising carriage');
    const shutters=[-1,1].map(side=>trap.getObjectByName('Published tide-shear floor shutter '+side));
    const jaws=[-1,1].map(side=>trap.getObjectByName('Disclosed tide-shear hinged jaw 24 '+side));
    assert.ok(wheel?.isGroup&&carriage?.isGroup&&shutters.every(Boolean)&&jaws.every(Boolean));
    assert.equal(wheel.children.filter(child=>child.isMesh).length,5,
      'governor has one joined rim, one dark center and just two purposeful readable spokes');
    assert.equal(wheel.children.filter(child=>child.material.color.getHexString()==='bf6449').length,0,
      'a rotating governor must not compete with the TRUE red contact edges');
    assert.ok(carriage.children.filter(child=>child.isMesh).every(child=>child.material.color.getHexString()!=='bf6449'),
      'the rear piston does not masquerade as a second dangerous blade');
    for(const jaw of jaws){
      const blade=jaw.getObjectByName('Published tide-shear front blade');
      const lip=jaw.getObjectByName('Published tide-shear forward danger inlay');
      assert.ok(blade?.isMesh&&lip?.isMesh&&lip.parent===jaw&&blade.parent===jaw);
      assert.ok(blade.scale.y>=1.12&&lip.scale.y>=1.0&&lip.scale.x>=.17,
        'the only broad coral contact stripe follows a true, actor-scale ivory shear');
      assert.notEqual(blade.material,lip.material);
    }
    const origin=trap.getWorldPosition(new Vector3());
    const contact=new Vector3(origin.x,0,origin.z),away=new Vector3(origin.x+30,0,origin.z+30);
    const resource=world.stats();
    for(const [t,hero] of [[1,away],[2,contact],[3.4,contact],[4,away]]){
      world.animate(t,{explorerPosition:hero,reducedMotion:false});
      world.group.updateMatrixWorld(true);
      for(const jaw of jaws){
        const bound=new Box3().setFromObject(jaw);
        assert.ok(bound.min.x>origin.x-1.2&&bound.max.x<origin.x+1.2&&bound.min.z>origin.z-1.2&&bound.max.z<origin.z+1.2,
          'full physical silhouette remains inside disclosed tile, no camera crop trick');
      }
      for(const key of ['geometryCount','materialCount','textureCount'])assert.equal(world.stats()[key],resource[key]);
    }
    assert.equal(JSON.stringify(published),serialized,'scene cannot rewrite public authority');
    world.update({...published,runToken:'new-run',cells:[],visibleCells:[],discoveredCells:[]});
    assert.equal(world.group.getObjectByName('Published tide-shear bronze pressure governor'),undefined,
      'reset cannot leak a previously visible cutter');
    for(const key of ['geometryCount','materialCount','textureCount'])assert.equal(world.stats()[key],before[key]);
  }finally{world.dispose();}
});
