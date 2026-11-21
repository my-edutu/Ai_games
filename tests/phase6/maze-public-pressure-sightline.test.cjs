'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {pathToFileURL}=require('node:url');

// Load the real installed Three.js scene, not a mocked visual heuristic.
async function loadWorld() {
  const root=path.resolve(__dirname,'../..');
  const temp=fs.mkdtempSync(path.join(os.tmpdir(),'maze-pressure-sightline-'));
  try {
    fs.mkdirSync(path.join(temp,'vendor'));
    fs.writeFileSync(path.join(temp,'package.json'),'{"type":"module"}');
    for (const filename of ['world.js','map-view.mjs','gate-moment.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',filename),path.join(temp,filename));
    for (const filename of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',filename),path.join(temp,'vendor',filename));
    const THREE=await import(pathToFileURL(path.join(temp,'vendor/three.module.js')).href);
    const game=await import(pathToFileURL(path.join(temp,'world.js')).href);
    return {THREE,world:game.createMazeWorld({balanced:true}),
      cleanup:()=>fs.rmSync(temp,{recursive:true,force:true})};
  } catch(error){fs.rmSync(temp,{recursive:true,force:true});throw error;}
}
const cells=[20,38,39,40,41,42,50,70];
function published({pressure=false,privateOnly=false}={}) {
  return {
    runToken:'public-pressure-breathing-room',tick:1,width:9,height:9,
    currentCell:39,visibleCells:[...cells],
    cells:cells.map(cell=>({cell,neighbors:pressure&&cell===39?[40]:pressure&&cell===40?[39]:[],blocked:false,
      trap:pressure&&cell===40,checkpoint:false,clue:false})),
    keys:[],doors:[],inventory:[],threats:[],exitCell:null,result:null,
    ...(privateOnly?{privateTrapCells:[40],privateMap:{40:'secret-hazard'}}:{})
  };
}

test('genuine disclosed pressure stage keeps flanking scenic organs out of its physical sightline',async()=>{
  const {THREE,world,cleanup}=await loadWorld();
  try {
    const ordinary=published();
    const unmodified=JSON.stringify(ordinary);
    world.update(ordinary);
    for(const cell of [20,38,39,41,50,70])
      assert.ok(world.group.getObjectByName('Disclosed fossil tide-organ '+cell),
        'baseline known wall '+cell+' still owns its rooted physical fossil');
    const plainCount=world.stats().tideFossilAlcoves;
    assert.equal(JSON.stringify(ordinary),unmodified,'scene may not mutate public snapshot');

    const pressure=published({pressure:true}),frozen=JSON.stringify(pressure);
    world.update(pressure);
    assert.ok(world.group.getObjectByName('Published tide-shear pressure mast 40'),
      'the real disclosed mechanical hazard and jaws are retained');
    assert.equal(world.stats().responsiveTrapSignals,1);
    for(const cell of [38,39,41,50])
      assert.equal(world.group.getObjectByName('Disclosed fossil tide-organ '+cell),undefined,
        'published one- and two-cell court '+cell+' must not hide the real pressure mechanism');
    for(const cell of [20,70])
      assert.ok(world.group.getObjectByName('Disclosed fossil tide-organ '+cell),
        'distant already-known ruins retain identity beyond the pressure court');
    assert.ok(world.stats().tideFossilAlcoves<plainCount,
      'this is a genuine reduction of foreground stage clutter, not merely a changed color');

    const before=world.stats();
    world.animate(5,{explorerPosition:new THREE.Vector3(0,0,0),reducedMotion:false});
    const after=world.stats();
    for(const key of ['geometryCount','materialCount','textureCount'])
      assert.equal(after[key],before[key],'no GPU class may be allocated by an animation frame');
    assert.equal(JSON.stringify(pressure),frozen,
      'staging must not change navigation, private state, hazard rules or public state');
  }finally{world.dispose();cleanup();}
});

test('private-only trap data cannot change the disclosed 3D sightline',async()=>{
  const {world,cleanup}=await loadWorld();
  try{
    const state=published({privateOnly:true}),frozen=JSON.stringify(state);
    world.update(state);
    for(const cell of [20,38,39,41,50,70])
      assert.ok(world.group.getObjectByName('Disclosed fossil tide-organ '+cell),
        'a secret-only hazard cannot remove scenery or reveal its footprint');
    assert.equal(world.stats().responsiveTrapSignals,0);
    assert.equal(JSON.stringify(state),frozen);
  }finally{world.dispose();cleanup();}
});

test('a real disclosed two-cell pressure nonpassage gets a low solid cutaway; an unknown edge cannot',async()=>{
  const {THREE,world,cleanup}=await loadWorld();
  try {
    // The public hazard is cell 40. Cell 42 is two Manhattan steps away,
    // while cell 43 is three steps away. Their 42/43 edge is a CONFIRMED
    // nonpassage only when both endpoints are published, not a secret route.
    const near=published({pressure:true});
    const nearOriginal=JSON.stringify(near);
    world.update(near);
    const prior=world.stats();
    assert.equal(JSON.stringify(near),nearOriginal);

    const withPublishedEdge={
      ...near,visibleCells:[...near.visibleCells,43],
      cells:[...near.cells,{
        cell:43,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false
      }],
    };
    const edgeOriginal=JSON.stringify(withPublishedEdge);
    world.update(withPublishedEdge);
    const publicCourt=world.stats();
    assert.ok(publicCourt.pressureStageParapets>prior.pressureStageParapets,
      'one genuinely disclosed two-ring NONPASSAGE loses its blocking high wall');
    assert.equal(publicCourt.responsiveTrapSignals,1,
      'the original physical pressure hazard must remain present');
    assert.equal(publicCourt.geometryCount,prior.geometryCount,
      'public two-ring cutaway must use existing pooled GPU geometry');
    // Check the ACTUAL instanced masonry at the known east 42/43 wall:
    // cell 42's +X edge sits at x=6, with piers at z=+/-0.99. A physically
    // lowered post, not a screenshot mask or deleted collider, must be built.
    const matrix=new THREE.Matrix4(),point=new THREE.Vector3(),
      quat=new THREE.Quaternion(),scale=new THREE.Vector3();
    const pierHeights=[];
    world.group.traverse(node=>{
      if(!node.isInstancedMesh || node.geometry?.type!=='ExtrudeGeometry')return;
      for(let i=0;i<node.count;i++){
        node.getMatrixAt(i,matrix);matrix.decompose(point,quat,scale);
        if(Math.abs(point.x-6)<.0001 &&
          Math.abs(Math.abs(point.z)-.99)<.0001 &&
          Math.abs(scale.x-.24)<.0001 && Math.abs(scale.z-.24)<.0001)
          pierHeights.push(scale.y);
      }
    });
    assert.ok(pierHeights.length>=2,'real public pressure-edge piers are retained');
    assert.ok(pierHeights.every(h=>Math.abs(h-.40)<.0001),
      'pressure parapet uses rooted 0.40-unit masonry, not 0.64-unit sightline blockers');
    assert.equal(JSON.stringify(withPublishedEdge),edgeOriginal,
      'the real published map and collision authority are immutable');

    const privateOnly={
      ...withPublishedEdge,runToken:'only-private-pressure',
      cells:withPublishedEdge.cells.map(c=>({...c,trap:false})),
      privateTrapCells:[40],
    };
    world.update(privateOnly);
    assert.equal(world.stats().pressureStageParapets,0,
      'a private-only hazard cannot lower even a fully disclosed nonpassage');
    assert.equal(world.stats().responsiveTrapSignals,0);
  }finally{world.dispose();cleanup();}
});

function apronArt(world,THREE,cell){
  const centerX=(cell%9-4)*2.4,centerZ=(Math.floor(cell/9)-4)*2.4;
  const floorY=(2-Math.floor(Math.floor(cell/9)*3/9))*1.4;
  const matrix=new THREE.Matrix4(),point=new THREE.Vector3(),
    q=new THREE.Quaternion(),scale=new THREE.Vector3();
  const slabs=[],basins=[],grooves=[],petals=[];
  world.group.children[1].traverse(node=>{
    if(!node.isInstancedMesh)return;
    for(let i=0;i<node.count;i++){
      node.getMatrixAt(i,matrix);matrix.decompose(point,q,scale);
      // Both real physical channels are OFFSET by 0.48m from the cell
      // centre. Inspect them BEFORE filtering centred slabs: the old helper
      // accidentally excluded both valid channels and caused CI failure 665.
      // Validate both cardinal orientations, dimensions, actual material and
      // physical surface height, never a mere source-code token.
      // Count ACTUAL 2.18m bronze tracks, not retired 1.82m glass scratches.
      // A trap may connect only through current PUBLIC reciprocal passage.
      if(node.geometry?.type==='BoxGeometry'
        &&Math.abs(point.y-(floorY+.021))<.0001
        &&Math.abs(scale.y-.023)<.0001
        &&node.material.color.getHexString()==='334a46'
        &&((
          Math.abs(point.x-centerX)<.0001
          &&Math.abs(Math.abs(point.z-centerZ)-.63)<.0001
          &&Math.abs(scale.x-2.18)<.0001
          &&Math.abs(scale.z-.22)<.0001
        )||(
          Math.abs(point.z-centerZ)<.0001
          &&Math.abs(Math.abs(point.x-centerX)-.63)<.0001
          &&Math.abs(scale.x-.22)<.0001
          &&Math.abs(scale.z-2.18)<.0001
        ))) grooves.push(Math.abs(point.z-centerZ)>.1
          ? (point.z<centerZ?'z:negative':'z:positive')
          : (point.x<centerX?'x:negative':'x:positive'));
      if(Math.abs(point.x-centerX)>.0001||Math.abs(point.z-centerZ)>.0001)continue;
      if(node.geometry?.type==='ExtrudeGeometry'
        &&Math.abs(point.y-(floorY-.035))<.0001
        &&Math.abs(scale.x-2.31)<.0001&&Math.abs(scale.y-.07)<.0001
        &&Math.abs(scale.z-2.31)<.0001)
        slabs.push(node.material.color.getHexString());
      // In the true public one-cell basin, a 2.39-wide mineral deck
      // REPLACES the old 2.31 tiled apron. Preserve distinct measured
      // assertions rather than weakening the former source contract.
      if(node.geometry?.type==='ExtrudeGeometry'
        &&Math.abs(point.y-(floorY-.035))<.0001
        &&Math.abs(scale.x-2.39)<.0001&&Math.abs(scale.y-.07)<.0001
        &&Math.abs(scale.z-2.39)<.0001)
        basins.push(node.material.color.getHexString());
      if(node.geometry?.type==='ShapeGeometry'
        &&Math.abs(point.y-(floorY+.024))<.0001
        &&Math.abs(scale.x-.82)<.0001&&Math.abs(scale.y-.77)<.0001)
        petals.push(i);
    }
  });
  return {slabs,basins,grooves:grooves.sort(),petals:petals.length};
}

test('published two-cell Tide-Shear court builds one calm connected apron around real moving jaws',async()=>{
  const {THREE,world,cleanup}=await loadWorld();
  const ordinary=published(),known=published({pressure:true});
  const original=JSON.stringify(known);
  try{
    world.update(ordinary);
    const baseline=apronArt(world,THREE,39);
    assert.deepEqual(baseline.slabs,[],
      'cell 39 baseline really uses four smaller floor tiles');
    assert.equal(baseline.petals,5,'baseline has the original busy five-leaf floor relief');
    world.update(known);
    const quiet=apronArt(world,THREE,39);
    assert.deepEqual(quiet.slabs,[],
      'the generic 2.31m apron does not sit over the actual inner basin');
    assert.deepEqual(quiet.basins,['28574f'],
      'the actual PUBLIC one-cell inner court is a broad 2.39m jade deck');
    assert.deepEqual(quiet.grooves,['z:negative','z:positive'],
      'both physically measured 2.18m tracks straddle the E/W-linked public court');
    // Rotate the ACTUAL public trap one cardinal direction. Each source-bound
    // 1.82m conduit must rotate with the visible mechanism, without a private
    // map, per-frame model allocation, or directional guess.
    const northSouth=published();
    northSouth.runToken='public-pressure-rotated-court';
    northSouth.visibleCells=[...northSouth.visibleCells,30];
    northSouth.cells=[...northSouth.cells.map(c=>c.cell===39?{...c,neighbors:[30]}:c),{
      cell:30,neighbors:[39],blocked:false,trap:true,checkpoint:false,clue:false
    }];
    const northSouthFrozen=JSON.stringify(northSouth);
    world.update(northSouth);
    const rotated=apronArt(world,THREE,39);
    assert.deepEqual(rotated.basins,['28574f'],
      'the public N/S-linked pressure court retains its actual physical basin');
    assert.deepEqual(rotated.grooves,['x:negative','x:positive'],
      'both full-size bronze tracks rotate with the real N/S-linked hazard');
    assert.equal(JSON.stringify(northSouth),northSouthFrozen,
      'rotation may not rewrite known public pressure or navigation state');
    world.update(known);
    assert.deepEqual(apronArt(world,THREE,38).slabs,['cead72'],
      'the separately public TWO-cell outer ring retains its quiet ivory shoulder');
    assert.equal(quiet.petals,0,'the disclosed pressure stage leaves real negative space');
    assert.ok(world.group.getObjectByName('Published tide-shear pressure mast 40'),
      'moving hazard is retained at the actual disclosed cell');
    const before=world.stats();
    world.animate(0,{explorerPosition:new THREE.Vector3(0,0,0),reducedMotion:false});
    world.animate(1.5,{explorerPosition:new THREE.Vector3(0,0,0),reducedMotion:true});
    const after=world.stats();
    for(const key of ['geometryCount','materialCount','textureCount','instances'])
      assert.equal(after[key],before[key],'no repeated-frame allocations');
    assert.ok(before.geometryCount<=16&&before.materialCount<=26&&before.textureCount<=3);
    assert.equal(JSON.stringify(known),original,'rendering cannot mutate public authority');
    world.update(published({privateOnly:true}));
    assert.deepEqual(apronArt(world,THREE,39),baseline,
      'undisclosed/private-only traps never alter the ordinary playable paving');
    // Change the actual public run token, not just a destructured fixture
    // option: a new unseen board must remove every prior disclosed floor.
    const nextRun={...published(),runToken:'reset'};
    world.update(nextRun);
    assert.deepEqual(apronArt(world,THREE,39),baseline);
    world.update({...nextRun,cells:[],visibleCells:[]});
    assert.deepEqual(world.stats().renderedCells,[],
      'a new undisclosed run cannot retain the previous pressure apron');
  }finally{world.dispose();cleanup();}
});

test('real disclosed pressure stage removes busy exterior ornaments but never its solid foundations or private map',async()=>{
  const {world,cleanup}=await loadWorld();
  try {
    const ordinary=published();
    const privateOnly=published({privateOnly:true});
    const pressure=published({pressure:true});
    const frozen=JSON.stringify(pressure);
    world.update(ordinary);
    const baseline=world.stats();
    assert.ok(baseline.undercroftButtresses>0,
      'before a public hazard the ordinary 3D exterior must actually be sculpted');
    world.update(pressure);
    const exposed=world.stats();
    assert.ok(exposed.undercroftButtresses<baseline.undercroftButtresses,
      'the real disclosed Tide-Shear loses heavy foreground foundation *decorations*');
    assert.ok(exposed.hangingFacadeGardens<=baseline.hangingFacadeGardens,
      'pressure breathing room cannot gain distracting hanging foliage');
    assert.ok(exposed.closedTideMedallions<=baseline.closedTideMedallions,
      'pressure breathing room cannot gain unrelated sealed tide-clock dials');
    assert.equal(exposed.responsiveTrapJaws,2,
      'the actual connected physical pressure encounter remains rendered');
    assert.deepEqual(exposed.renderedCells,ordinary.cells.map(c=>c.cell),
      'never remove real published land or publicly known collision cells');
    assert.equal(exposed.geometryCount,baseline.geometryCount,
      'retain identical shared GPU geometry classes for strict six-run budget');
    assert.equal(JSON.stringify(pressure),frozen,
      'world composition cannot rewrite the authentic public AI snapshot');
    world.update(privateOnly);
    const hidden=world.stats();
    assert.equal(hidden.undercroftButtresses,baseline.undercroftButtresses,
      'private-only hazards cannot remove sculpture and leak a secret court');
    assert.equal(hidden.hangingFacadeGardens,baseline.hangingFacadeGardens);
    assert.equal(hidden.closedTideMedallions,baseline.closedTideMedallions);
    assert.equal(hidden.responsiveTrapJaws,0);
    world.update({...ordinary,runToken:'new-run',cells:[],visibleCells:[]});
    assert.equal(world.stats().undercroftButtresses,0,'new hidden run must clear old masonry');
  }finally{world.dispose();cleanup();}
});
