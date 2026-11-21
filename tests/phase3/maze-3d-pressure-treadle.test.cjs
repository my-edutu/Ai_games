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
const published={runToken:'treadle-public',tick:4,width:7,height:9,currentCell:24,
  cells:[{cell:24,neighbors:[],trap:true,blocked:false}],
  visibleCells:[24],discoveredCells:[24],doors:[],keys:[],inventory:[],threats:[],exitCell:null};
test('one actual public treadle presses before inward jaws and restores after real withdrawal',async()=>{
  const {createMazeWorld,CELL_SIZE}=await mod;
  const {Vector3,Box3}=await import(three);
  const world=createMazeWorld({balanced:true}),budget=world.stats(),unchanged=JSON.stringify(published);
  world.update(published);
  const trap=world.group.getObjectByName('Disclosed tide-shear pressure hazard 24');
  const plate=trap?.getObjectByName('Published tide-shear depressible treadle 24');
  const jaw=trap?.getObjectByName('Disclosed tide-shear hinged jaw 24 1');
  const transmission=trap?.getObjectByName('Published tide-shear floor-to-jaw transmission 24');
  const left=trap?.getObjectByName('Published tide-shear sliding drive bar 24 -1');
  const right=trap?.getObjectByName('Published tide-shear sliding drive bar 24 1');
  assert.ok(plate?.isGroup && jaw?.isGroup,'real modeled pressure geometry must exist');
  assert.ok(transmission?.isGroup && left?.isGroup && right?.isGroup,
    'the true treadle must be connected to both jaw roots by a modeled drive train');
  assert.equal(left.parent,transmission);assert.equal(right.parent,transmission);
  assert.equal(plate.parent,trap);
  assert.ok(plate.children.length>=5,'large solid treadle replaces fake decorative corners');
  // World matrices must be current BEFORE Box3.setFromObject; unlike
  // getWorldPosition it does not traverse and refresh every parent transform.
  // Otherwise the already translated 2.4m grid cell is measured twice.
  world.group.updateMatrixWorld(true);
  const bounds=new Box3().setFromObject(plate),origin=trap.getWorldPosition(new Vector3());
  assert.ok(bounds.min.x>origin.x-1.2 && bounds.max.x<origin.x+1.2
    && bounds.min.z>origin.z-1.2 && bounds.max.z<origin.z+1.2,
    'complete moving treadle stays inside original disclosed cell: '+JSON.stringify({
      minX:bounds.min.x-origin.x,maxX:bounds.max.x-origin.x,
      minZ:bounds.min.z-origin.z,maxZ:bounds.max.z-origin.z}));
  const driveBounds=new Box3().setFromObject(transmission);
  assert.ok(driveBounds.min.x>origin.x-1.2 && driveBounds.max.x<origin.x+1.2
    && driveBounds.min.z>origin.z-1.2 && driveBounds.max.z<origin.z+1.2,
    'the complete physical transmission remains INSIDE the published trap tile');
  const far=new Vector3(origin.x+30,0,origin.z+30);
  const diagonal=new Vector3(origin.x+CELL_SIZE,0,origin.z+CELL_SIZE);
  const contact=new Vector3(origin.x,0,origin.z);
  world.animate(1,{explorerPosition:far,reducedMotion:false});
  assert.ok(Math.abs(left.position.z)<1e-12,'the physically reset left drive bar must remain at zero travel');assert.ok(Math.abs(right.position.z)<1e-12,'the physically reset right drive bar must remain at zero travel');
  assert.equal(plate.position.y,.035);assert.ok(Math.abs(plate.rotation.x)<1e-12,'unactuated published treadle must be physically flat');
  world.animate(1.2,{explorerPosition:diagonal,reducedMotion:false});
  assert.equal(plate.position.y,.035,'public diagonal sight cannot falsely press floor');
  assert.ok(Math.abs(left.position.z)<1e-12,'mere sighting must not actuate either drive rod');
  assert.ok(Math.abs(right.position.z)<1e-12,'diagonal sighting cannot predict contact');
  assert.ok(Math.abs(plate.rotation.x)<1e-12,'unactuated published treadle must be physically flat');
  world.animate(2,{explorerPosition:contact,reducedMotion:false});
  world.animate(3.4,{explorerPosition:contact,reducedMotion:false});
  assert.ok(plate.position.y<.01,'real adjacent contact must visibly depress the treadle');
  assert.ok(plate.rotation.x<-.10,'physical plate tips during earned shutter beat');
  assert.ok(left.position.z<-.24 && right.position.z<-.24,
    'both physical rods transmit the earned floor stroke toward the jaw roots');
  assert.ok(left.rotation.x<-.10 && right.rotation.x<-.10,
    'both linked drives tip in step with the already observed shutter release');
  world.group.updateMatrixWorld(true);
  const swept=new Box3().setFromObject(transmission);
  assert.ok(swept.min.x>origin.x-1.2 && swept.max.x<origin.x+1.2
    && swept.min.z>origin.z-1.2 && swept.max.z<origin.z+1.2,
    'fully depressed moving transmission cannot exceed its real known cell');
  assert.ok(jaw.rotation.z>.60,'same public clock closes the REAL inward jaw');
  world.animate(4,{explorerPosition:far,reducedMotion:false});
  assert.equal(plate.position.y,.035);
  assert.ok(Math.abs(left.position.z)<1e-12,'the physically reset left drive bar must remain at zero travel');assert.ok(Math.abs(right.position.z)<1e-12,'the physically reset right drive bar must remain at zero travel');
  assert.ok(Math.abs(left.rotation.x)<1e-12 && Math.abs(right.rotation.x)<1e-12,
    'withdrawal restores BOTH connected rods to flat rest');
  // A withdrawn Three.js Euler can be -0; signed zero has the same resting
  // physical pose. Keep the zero-angle requirement without Object.is(-0,0).
  assert.ok(Math.abs(plate.rotation.x)<1e-12,'the treadle fully un-tilts after withdrawal');
  world.animate(5,{explorerPosition:contact,reducedMotion:true});
  assert.ok(plate.position.y>.001&&plate.position.y<.004,'reduced-motion contact stays held');
  assert.ok(Math.abs(plate.rotation.x+.054)<1e-8);
  assert.ok(left.position.z<-.15 && left.position.z>-.16,
    'reduced motion uses one static, earned, intermediate transmission pose');
  assert.equal(right.position.z,left.position.z);
  for(const key of ['geometryCount','materialCount','textureCount'])
    assert.equal(world.stats()[key],budget[key],'no new pooled resource class: '+key);
  assert.equal(JSON.stringify(published),unchanged);
  world.update({...published,visibleCells:[]});
  world.animate(6,{explorerPosition:contact,reducedMotion:false});
  assert.equal(plate.position.y,.035,'remembered-only hazard stays closed');
  assert.ok(Math.abs(left.position.z)<1e-12,'the physically reset left drive bar must remain at zero travel');assert.ok(Math.abs(right.position.z)<1e-12,'the physically reset right drive bar must remain at zero travel');
  assert.ok(Math.abs(left.rotation.x)<1e-12 && Math.abs(right.rotation.x)<1e-12,
    'remembered-only pressure cannot leave drive rods in a threatening pose');
  // Like withdrawal, invisibility can yield -0 from an absolute Three.js Euler.
  // Both signs are the same physical rest pose; the private hazard must NEVER
  // inherit a visible tilted treadle, including under reduced motion.
  assert.ok(Math.abs(plate.rotation.x)<1e-12,'hidden-only treadle has no residual tilt');
  world.animate(6.2,{explorerPosition:contact,reducedMotion:true});
  assert.equal(plate.position.y,.035,'reduced-motion remembered-only trap cannot depress');
  assert.ok(Math.abs(left.position.z)<1e-12,'the physically reset left drive bar must remain at zero travel');assert.ok(Math.abs(right.position.z)<1e-12,'the physically reset right drive bar must remain at zero travel');
  assert.ok(Math.abs(plate.rotation.x)<1e-12,'reduced-motion hidden trap cannot tilt');
  world.update({...published,runToken:'new',tick:0,cells:[],visibleCells:[],discoveredCells:[]});
  assert.equal(world.group.getObjectByName('Published tide-shear depressible treadle 24'),undefined);
  assert.equal(world.group.getObjectByName('Published tide-shear floor-to-jaw transmission 24'),undefined);
  world.dispose();
  for(const key of ['geometryCount','materialCount','textureCount'])
    assert.equal(world.stats()[key],0,'dispose releases '+key);
});
