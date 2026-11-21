'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const {pathToFileURL} = require('node:url');
const source = fs.readFileSync(path.resolve(__dirname,'../../public/ai-maze-escape/world.js'),'utf8');
const three = pathToFileURL(path.resolve(__dirname,'../../node_modules/three/build/three.module.js')).href;
const moment = pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/gate-moment.mjs')).href;
const mapView = pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href;
const modulePromise = import('data:text/javascript;base64,' + Buffer.from(source
  .replace("'./vendor/three.module.js'",JSON.stringify(three))
  .replace("'./gate-moment.mjs'",JSON.stringify(moment))
  .replace("'./map-view.mjs'",JSON.stringify(mapView))).toString('base64'));
const publicFrame = cells => ({
  runToken:'pressure-ledge',tick:1,width:7,height:9,currentCell:24,
  cells,visibleCells:cells.map(c=>c.cell),discoveredCells:cells.map(c=>c.cell),
  keys:[],doors:[],inventory:[],threats:[],exitCell:null
});
const blocked={cell:25,blocked:true,neighbors:[]};
const trap={cell:24,trap:true,blocked:false,neighbors:[]};

test('physical pressure court cuts opaque public masonry without inventing traversability',async()=>{
  const {createMazeWorld,cellPosition,cellHeight}=await modulePromise;
  const {Matrix4,Vector3,Quaternion}=await import(three);
  const world=createMazeWorld({balanced:true});
  const budget=world.stats();
  const center=cellPosition(25,7,9);
  const matrix=new Matrix4(),p=new Vector3(),q=new Quaternion(),scale=new Vector3();
  function centralHeight() {
    let top=-Infinity;
    // Actual THREE instanced public terrain, not an authored counter.
    for(const batch of world.group.children[1].children){
      if(!batch.isInstancedMesh)continue;
      for(let i=0;i<batch.count;i++){
        batch.getMatrixAt(i,matrix);matrix.decompose(p,q,scale);
        if(Math.abs(p.x-center.x)<.55 && Math.abs(p.z-center.z)<.58 && p.y>.02)
          top=Math.max(top,p.y+scale.y/2);
      }
    }
    // Terrain instances contain the public terrace altitude already; compare
    // local masonry height, not absolute world Y on the middle court.
    return top-cellHeight(25,7,9);
  }
  const ordinary=publicFrame([{cell:24,neighbors:[]},blocked]);
  const original=JSON.stringify(ordinary);
  world.update(ordinary);
  const tall=centralHeight();
  assert.ok(tall>1.5,'without any publicly known trap the original tall blocked pavilion remains');
  assert.equal(world.stats().pressureStageParapets,0);

  const disclosed=publicFrame([trap,blocked]), unchanged=JSON.stringify(disclosed);
  world.update(disclosed);
  assert.ok(centralHeight()<.90,'the raised solid tide-ledge replaces tall opaque obstruction');
  assert.ok(world.stats().pressureStageParapets>=1,
    'real blocked/nonpassage edge uses a continuous physical low stone barrier');
  assert.equal(world.stats().responsiveTrapJaws,2,'the real pressure stage remains installed');
  assert.deepEqual(world.stats().renderedCells,[24,25]);
  assert.equal(disclosed.cells[1].blocked,true,'the renderer cannot make the actual blocked cell passable');

  world.update({...disclosed,cells:[blocked,trap]});
  assert.ok(world.stats().pressureStageParapets>=1,
    'cutaway is independent of the order of published known cells');
  assert.ok(centralHeight()<.90);
  world.update(ordinary);
  assert.ok(centralHeight()>1.5,'without a public trap there is no advance visual hint');
  assert.equal(world.stats().pressureStageParapets,0);
  assert.equal(JSON.stringify(ordinary),original);
  assert.equal(JSON.stringify(disclosed),unchanged);
  for(const [key,prop] of [['geometryCount','geometries'],['materialCount','materials'],['textureCount','textures']])
    assert.equal(world.stats()[key],budget[key],prop+' budget remains unchanged across disclosure and reset');
  world.dispose();
  assert.equal(world.stats().geometryCount,0);
  assert.equal(world.stats().materialCount,0);
  assert.equal(world.stats().textureCount,0);
});
