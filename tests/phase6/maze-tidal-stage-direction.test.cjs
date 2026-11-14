'use strict';

const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const os=require('node:os');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

// Use the actual released Three module and exact production source; no mocks,
// source transforms or hidden-state access to fake a beautiful physical world.
async function realWorld() {
  const root=path.resolve(__dirname,'../..');
  const dir=fs.mkdtempSync(path.join(os.tmpdir(),'maze-tidal-stage-'));
  try {
    fs.mkdirSync(path.join(dir,'vendor'));
    fs.writeFileSync(path.join(dir,'package.json'),'{"type":"module"}');
    for(const file of ['world.js','gate-moment.mjs','map-view.mjs'])
      fs.copyFileSync(path.join(root,'public/ai-maze-escape',file),path.join(dir,file));
    for(const file of ['three.module.js','three.core.js'])
      fs.copyFileSync(path.join(root,'node_modules/three/build',file),path.join(dir,'vendor',file));
    const m=await import(pathToFileURL(path.join(dir,'world.js')).href);
    return {m,cleanup:()=>fs.rmSync(dir,{recursive:true,force:true})};
  }catch(error){fs.rmSync(dir,{recursive:true,force:true});throw error}
}

function publicSnapshot(withKnown=true) {
  const width=5,height=5;
  const cells=withKnown?Array.from({length:width*height},(_,cell)=>({
    cell,neighbors:[],blocked:false,trap:false,checkpoint:false,clue:false
  })):[];
  return {runToken:'tidal-garden-source-bound',tick:1,width,height,cells,
    visibleCells:cells.map(c=>c.cell),doors:[],keys:[],inventory:[],exitCell:null};
}

test('architectural transformation is genuine batched 3D on disclosed solid walls only',async()=>{
  const {m,cleanup}=await realWorld();
  const empty=m.createMazeWorld({balanced:true});
  const stage=m.createMazeWorld({balanced:true});
  const again=m.createMazeWorld({balanced:true});
  const snapshot=publicSnapshot(), frozen=JSON.parse(JSON.stringify(snapshot));
  try {
    empty.update(publicSnapshot(false));
    const none=empty.stats();
    assert.equal(none.sculptedMosaicWalls,0);
    assert.equal(none.tidePennants,0);
    assert.equal(none.perimeterCascades,0);
    assert.deepEqual(none.renderedCells,[],'undisclosed tiles must not appear');
    stage.update(snapshot);
    again.update({...snapshot,unpublishedMazeSeed:'MUST_NOT_APPEAR',
      privateThreatLocations:[0,1,2],hiddenPath:[1,4,24]});
    const a=stage.stats(), b=again.stats();
    assert.ok(a.sculptedMosaicWalls>3,'physical carved ceramic facade needs visible coverage');
    assert.ok(a.tidePennants>0,'wall-anchored 3D cloth silhouettes should exist');
    assert.ok(a.perimeterCascades>0,'public-board water curtains should be actually modeled');
    assert.ok(a.tidalObservatories>0,'disclosed observatory must have roofline');
    assert.ok(a.instances>none.instances,'scenery uses actual Three instanced meshes');
    for(const key of ['renderedCells','sculptedMosaicWalls','tidePennants','perimeterCascades',
      'tidalObservatories','instances','geometryCount','materialCount','textureCount'])
      assert.deepEqual(a[key],b[key],key+' must depend only on the public world');
    assert.ok(a.geometryCount<=16 && a.materialCount<=26 && a.textureCount<=3,
      'keep geometric and texture budgets for CPU-balanced WebGL');
    assert.deepEqual(snapshot,frozen,'decorating the world cannot mutate game authority');
  }finally{empty.dispose();stage.dispose();again.dispose();cleanup()}
});

test('changing a private route cannot create new public scenic openings',async()=>{
  const {m,cleanup}=await realWorld();
  const world=m.createMazeWorld({balanced:true});
  const snapshot=publicSnapshot();
  try {
    world.update(snapshot);const before=world.stats();
    world.update({...snapshot,tick:2,hiddenMazeRoute:[11,3,5],
      privateWardenNextCell:7,secretGoalCell:24});
    const after=world.stats();
    for(const key of ['renderedCells','sculptedMosaicWalls','tidePennants',
      'perimeterCascades','tidalObservatories','instances'])
      assert.deepEqual(after[key],before[key],key+' changed on hidden-state-only update');
  }finally{world.dispose();cleanup()}
});


test('publicly blocked cells gain three deterministic physical ruin silhouettes without revealing private map state',async()=>{
  const {m,cleanup}=await realWorld();
  const stage=m.createMazeWorld({balanced:true});
  const identical=m.createMazeWorld({balanced:true});
  const source=publicSnapshot();
  source.cells.forEach(c=>{c.blocked=c.cell%2===0});
  const frozen=JSON.parse(JSON.stringify(source));
  try {
    stage.update(source);
    identical.update({...source,secretExitCell:22,hiddenMazeRoute:[2,4,6],
      privateWardenTarget:0,unpublishedMazeSeed:'must-not-leak'});
    const a=stage.stats(), b=identical.stats();
    assert.ok(a.collapsedPavilions>0,'a complete modeled roofless pavilion must appear on truly blocked cells');
    assert.ok(a.shellBasins>0,'a distinctly modeled tidal shell basin must appear on truly blocked cells');
    for(const key of ['collapsedPavilions','shellBasins','geometryCount','materialCount',
      'textureCount','instances','renderedCells'])
      assert.deepEqual(a[key],b[key],key+' must ignore private route, threat and seed');
    assert.ok(a.geometryCount<=16 && a.materialCount<=26 && a.textureCount<=3,
      'the new three-way authored architecture reuses existing GPU resources');
    assert.deepEqual(source,frozen,'scenery must never change authoritative public data');
    const unblocked={...source,cells:source.cells.map(c=>({...c,blocked:false}))};
    stage.update(unblocked);
    assert.equal(stage.stats().collapsedPavilions,0,'a formerly blocked site may not retain a phantom pavilion');
    assert.equal(stage.stats().shellBasins,0,'a formerly blocked site may not retain a phantom basin');
    stage.update({...source,runToken:'next-disclosed-run',cells:[],visibleCells:[]});
    assert.equal(stage.stats().collapsedPavilions,0,'an undisclosed new run must clear all old ruins');
    assert.equal(stage.stats().shellBasins,0,'no hidden island or courtyard is rendered before discovery');
  }finally{stage.dispose();identical.dispose();cleanup()}
});


test('offshore watch ruins are real dimension-only instanced 3D, never a leaked public maze extension',async()=>{
  const {m,cleanup}=await realWorld();
  const stage=m.createMazeWorld({balanced:true});
  const again=m.createMazeWorld({balanced:true});
  const empty=publicSnapshot(false);
  try {
    stage.update(empty);
    const name='Dimension-only submerged broken tide-watch spires';
    const inspect=(world)=>{
      const monument=world.group.getObjectByName(name);
      assert.ok(monument,'actual waterline architecture should be attached to the Three scene');
      assert.ok(monument.children.length>=4,'distinct material/geometry silhouettes are physical GPU batches');
      const positions=[];
      for (const child of monument.children) {
        assert.ok(child.isInstancedMesh,'each offshore part must share an instanced production mesh');
        assert.ok(child.count>=1,'no unbounded or empty draw call');
        for (let i=0;i<child.count;i++) {
          const offset=i*16, values=child.instanceMatrix.array;
          positions.push([values[offset+12],values[offset+13],values[offset+14]]);
        }
      }
      return positions.sort((a,b)=>a[0]-b[0]||a[2]-b[2]||a[1]-b[1]);
    };
    const initial=inspect(stage);
    assert.ok(initial.length>=24,'two developed ruins require more than decorative flat sprites');
    const extent=empty.width*2.4/2;
    assert.ok(initial.every(([x,y,z])=>Number.isFinite(x)&&Number.isFinite(y)&&Number.isFinite(z)
      &&x < -extent-1 &&z < -extent-1),
    'all actual offshore fragments remain detached beyond the playable public board');
    assert.deepEqual(stage.stats().renderedCells,[],'offshore history may not reveal unknown cells');
    again.update({...empty,runToken:'different-private-seed',unpublishedMazeSeed:'secret',
      privateWardenNextCell:18,hiddenMazeRoute:[7,18,24],secretExitCell:21});
    assert.deepEqual(inspect(again),initial,'private maze state cannot position scenic ruins');
    stage.update({...empty,runToken:'new-run',cells:[],visibleCells:[]});
    assert.deepEqual(inspect(stage),initial,'new runs do not leak old land or change public-dimension sea');
    assert.deepEqual(stage.stats().renderedCells,[]);
  }finally{stage.dispose();again.dispose();cleanup()}
});

test('on-camera shell-fan tesserae are real disclosed-floor geometry and never encode hidden routes',async()=>{
  const {m,cleanup}=await realWorld();
  const floor=m.createMazeWorld({balanced:true});
  const privateTwin=m.createMazeWorld({balanced:true});
  const empty=m.createMazeWorld({balanced:true});
  const snapshot=publicSnapshot(), original=JSON.stringify(snapshot);
  const colors=new Set(['5d968e','eed5a0','cead72']);
  function fans(world) {
    // Only the actual revealed board. The dimension-only lagoon and private
    // state are excluded rather than silently blessed as known geometry.
    const terrain=world.group.children[1], poses=[];
    terrain.traverse(node=>{
      if(!node.isInstancedMesh || node.geometry.type!=='ShapeGeometry'
        || !colors.has(node.material.color.getHexString()))return;
      for(let i=0;i<node.count;i++){
        const values=node.instanceMatrix.array, offset=i*16;
        poses.push([node.material.color.getHexString(),
          values[offset+12],values[offset+13],values[offset+14]]);
      }
    });
    return poses.sort((a,b)=>JSON.stringify(a).localeCompare(JSON.stringify(b)));
  }
  try {
    empty.update({...snapshot,cells:[],visibleCells:[]});
    assert.deepEqual(fans(empty),[],'unseen tiles cannot gain a shell-fan floor');
    floor.update(snapshot);
    privateTwin.update({...snapshot,hiddenMazeRoute:[7,12,20],
      privateWardenTarget:4,secretExitCell:24,unpublishedMazeSeed:'do-not-render'});
    const a=fans(floor), b=fans(privateTwin);
    assert.ok(a.length>=25,'authored relief must cover actual camera-facing known terrain');
    assert.equal(a.length%5,0,'each shell is five real connected surface petals');
    assert.ok(new Set(a.map(entry=>entry[0])).size>=2,
      'public height districts must have materially different shell motifs');
    const knownCenters=new Set(snapshot.cells.map(c=>{
      const p=m.cellPosition(c.cell,snapshot.width,snapshot.height);
      const height=m.cellHeight(c.cell,snapshot.width,snapshot.height);
      return [p.x,p.z,height+.024].map(v=>v.toFixed(3)).join(':');
    }));
    for(const [,x,y,z] of a)
      assert.ok(knownCenters.has([x,z,y].map(v=>v.toFixed(3)).join(':')),
        'a physical shell must be at the center of an already public tile');
    assert.deepEqual(b,a,'unpublished map, threat and seed cannot affect appearance');
    assert.deepEqual(JSON.stringify(snapshot),original,'world must not mutate game data');
    const budget=floor.stats();
    assert.ok(budget.geometryCount<=16 && budget.materialCount<=26
      && budget.textureCount<=3,'reuse existing production GPU resources');
    floor.animate(100,{reducedMotion:true});
    floor.animate(101,{reducedMotion:false});
    assert.deepEqual(fans(floor),a,'no per-frame decorative geometry changes');
    floor.update({...snapshot,runToken:'next-run',cells:[],visibleCells:[]});
    assert.deepEqual(fans(floor),[],'shells clear when a new run has no public map');
  }finally{floor.dispose();privateTwin.dispose();empty.dispose();cleanup()}
});


test('distant broken colonnade remains disconnected dimension-only original 3D, even with zero discovered cells',async()=>{
  const {m,cleanup}=await realWorld();
  const a=m.createMazeWorld({balanced:true}), b=m.createMazeWorld({balanced:true});
  const zero=publicSnapshot(false), original=JSON.stringify(zero);
  const name='Dimension-only detached drowned colonnade';
  const observe=world=>{
    const group=world.group.getObjectByName(name);
    assert.ok(group?.isGroup,'genuine Three background monument, not a CSS or map overlay');
    assert.equal(group.children.length,4,'four reusable instanced material/geometry batches only');
    const out=[];
    for(const child of group.children){
      assert.ok(child.isInstancedMesh,'no unbounded decorative mesh per individual stone');
      assert.ok(child.count>=10 && child.count<=20);
      for(let i=0;i<child.count;i++){
        const v=child.instanceMatrix.array, k=i*16;
        const x=v[k+12],y=v[k+13],z=v[k+14];
        assert.ok([x,y,z].every(Number.isFinite));
        if(child.name==='Disconnected submerged stone footings'){
          const halfHeight=v[k+5]/2,waterSurface=-1.7;
          assert.ok(y-halfHeight<waterSurface-.1 && y+halfHeight>waterSurface+.2,
            'every offshore stone footing is physically immersed rather than floating');
        }
        // The theater is behind the -X or -Z shore, detached by water.
        const ex=zero.width*m.CELL_SIZE/2,ez=zero.height*m.CELL_SIZE/2;
        assert.ok(x < -ex-4.6 || z < -ez-4.6,'never a false board passage or hidden tile');
        out.push([child.name,x,y,z]);
      }
    }
    return out;
  };
  try{
    a.update(zero);
    b.update({...zero,unpublishedMazeSeed:'secret',hiddenMazeRoute:[1,7,15],
      privateThreatLocations:[2,9],secretExitCell:23,runToken:'another-run'});
    const originalPoses=observe(a);
    assert.deepEqual(observe(b),originalPoses,'unpublished game facts never place decorative geography');
    assert.deepEqual(a.stats().renderedCells,[],'no unknown land is revealed');
    assert.deepEqual(zero,JSON.parse(original),'cosmetic 3D must not edit public authority');
    const budget=a.stats();
    assert.ok(budget.geometryCount<=16 && budget.materialCount<=26 && budget.textureCount<=3,
      'only previously shared GPU resources are used');
    a.animate(10,{reducedMotion:true});
    a.animate(11,{reducedMotion:false});
    assert.deepEqual(observe(a),originalPoses,'no animation-frame allocation or positional leaking');
    a.update({...zero,runToken:'fresh-run',cells:[],visibleCells:[]});
    assert.deepEqual(observe(a),originalPoses,'identical public dimensions make identical backstage scenery');
  }finally{a.dispose();b.dispose();cleanup();}
});


test('Pass129 disclosed terrace undercroft is real submerged 3D, deterministic and not a hidden route',async()=>{
  const {m,cleanup}=await realWorld();
  const a=m.createMazeWorld({balanced:true});
  const b=m.createMazeWorld({balanced:true});
  const center=12, base=publicSnapshot(false), only={
    ...base,cells:[{cell:center,neighbors:[],blocked:false,trap:false,
      checkpoint:false,clue:false}],visibleCells:[center]
  };
  const original=JSON.stringify(only);
  try {
    a.update(base);
    assert.equal(a.stats().undercroftButtresses,0,
      'undisclosed stage cannot have architecturally decorated gameplay terrain');
    a.update(only);
    b.update({...only,hiddenMazeRoute:[6,7,8],
      privateThreatLocations:[20],unpublishedMazeSeed:'secret',secretExitCell:22});
    assert.equal(a.stats().undercroftButtresses,2,
      'a single observed walkable island has exactly east and south exposed undercroft faces');
    assert.equal(b.stats().undercroftButtresses,2,
      'no private maze input may alter public stone carving');
    // Inspect installed Three meshes and their actual matrices, not a marker
    // count or a source regex. Both observed sides have two rooted ribs and
    // two distinct sea-glass insets, genuinely attached to the public tile.
    const origin=m.cellPosition(center,only.width,only.height);
    const faceMatrices=world=>{
      const out=[];
      world.group.children[1].traverse(node=>{
        if(!node.isInstancedMesh||node.geometry.type!=='ExtrudeGeometry')return;
        const values=node.instanceMatrix.array;
        for(let i=0;i<node.count;i++){
          const k=i*16, x=values[k+12]-origin.x, y=values[k+13],
            z=values[k+14]-origin.z, physicalHeight=Math.abs(values[k+5]);
          // The two REAL layers have distinct centers: the rooted dark
          // stone at 1.235 and its outboard glass inset at 1.235 + .078.
          // Do not accidentally test only the first four physical ribs.
          const onEast=(Math.abs(x-1.235)<.003 || Math.abs(x-1.313)<.003)
            && Math.abs(Math.abs(z)-.70)<.003;
          const onSouth=(Math.abs(z-1.235)<.003 || Math.abs(z-1.313)<.003)
            && Math.abs(Math.abs(x)-.70)<.003;
          if(onEast || onSouth) {
            if (Math.abs(physicalHeight-(m.cellHeight(center,only.width,only.height)+1.50))<.01)
              assert.ok(y-physicalHeight/2 < -1.7,
                'each real stone rib must embed below the lagoon water surface, not float');
            out.push([node.material.color.getHexString(),x,y,z,physicalHeight]);
          }
        }
      });
      return out.sort((p,q)=>JSON.stringify(p).localeCompare(JSON.stringify(q)));
    };
    const physical=faceMatrices(a);
    assert.equal(physical.length,8,
      'two public shores must have four rooted stone ribs AND four distinct, physically outboard glass insets');
    assert.equal(physical.filter(p=>Math.abs(p[4]-
      (m.cellHeight(center,only.width,only.height)+1.20))<.01).length,4,
      'all four genuine sea-glass insets are modeled separately from the four main stone uprights');
    assert.equal(physical.filter(p=>Math.abs(p[4]-
      (m.cellHeight(center,only.width,only.height)+1.50))<.01).length,4,
      'all four thick physical stone uprights extend into the authentic waterline');
    assert.deepEqual(faceMatrices(b),physical,
      'published stage relief must be pixel-stable against private seed/plan changes');
    assert.ok(a.stats().geometryCount<=16 && a.stats().materialCount<=26
      && a.stats().textureCount<=3,'no additional GPU geometry/material/texture class');
    assert.equal(JSON.stringify(only),original,'architectural rendering may not mutate public authority');
    a.update({...only,runToken:'next-run',cells:[],visibleCells:[]});
    assert.equal(a.stats().undercroftButtresses,0,
      'unrevealed next-run terrain must not retain the old undercroft');
  }finally{a.dispose();b.dispose();cleanup()}
});
