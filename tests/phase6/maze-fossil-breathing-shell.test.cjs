'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const { pathToFileURL } = require('node:url');

// Inspect the INSTALLED production Three geometry; no mocks, fabricated pixels,
// lowered framing thresholds, extra game authority or hidden maze reads.
const root = path.resolve(__dirname, '../..');
const source = fs.readFileSync(path.join(root, 'public/ai-maze-escape/world.js'), 'utf8');
const url = name => pathToFileURL(path.join(root, 'public/ai-maze-escape', name)).href;
const threeUrl = pathToFileURL(path.join(root, 'node_modules/three/build/three.module.js')).href;
const loaded = import('data:text/javascript;base64,' + Buffer.from(source
  .replace("'./vendor/three.module.js'", JSON.stringify(threeUrl))
  .replace("'./gate-moment.mjs'", JSON.stringify(url('gate-moment.mjs')))
  .replace("'./map-view.mjs'", JSON.stringify(url('map-view.mjs')))).toString('base64'));
const cell = (id, extra={}) => ({
  cell:id, neighbors:[11], blocked:false, trap:false, checkpoint:false, clue:false, ...extra
});
const published = (cells=[cell(10)], extra={}) => ({
  runToken:'breathing-shell-public-run', width:7, height:7, tick:1, currentCell:10,
  cells, visibleCells:cells.map(c=>c.cell), doors:[], keys:[], inventory:[],
  threats:[], exitCell:null, result:null, ...extra
});

test('authentic known-wall organ has a connected ivory shell and approaches Pip physically', async () => {
  const {createMazeWorld,cellPosition,cellHeight} = await loaded;
  const {Vector3} = await import(threeUrl);
  const world=createMazeWorld({balanced:true});
  try {
    const s=published(), frozen=JSON.stringify(s), budget=world.stats();
    world.update(s);
    const organ=world.group.getObjectByName('Disclosed fossil tide-organ 10');
    const shell=world.group.getObjectByName('Disclosed fossil tide-organ breathing shell 10');
    assert.ok(organ?.isGroup && shell?.isGroup && shell.parent===organ,
      'the physical shell is a child of the grounded known-wall organ');
    assert.equal(world.stats().responsiveFossilOrgans, 1);
    assert.ok(shell.children.filter(x=>x.isMesh && x.geometry.type==='TorusGeometry').length===2,
      'two installed concentric ceramic rings, not a screen HUD decoration');
    assert.ok(shell.children.some(x=>x.isMesh && x.geometry.type==='IcosahedronGeometry'),
      'real sculpted sea-glass center is part of the installed object');
    const mantles=[-1,1].map(side=>{
      const mantle=world.group.getObjectByName('Disclosed fossil breathing shell mantle 10 '+side);
      assert.ok(mantle?.isGroup && mantle.parent===shell,
        'both broad shell mantles are rooted in the ring, not sprites');
      const face=mantle.children.find(x=>x.isMesh && x.geometry.type==='ExtrudeGeometry');
      assert.ok(face && face.scale.x>=.46 && face.scale.y>=.30,
        'the real broadened stone fluke must have gameplay-size physical width');
      return mantle;
    });
    const pos=cellPosition(10,7,7),height=cellHeight(10,7,7);
    assert.ok(organ.position.z<pos.z-.98 && organ.position.z>pos.z-1.2,
      'the shell remains rooted on the verified impassable north side');
    world.animate(2, {explorerPosition:new Vector3(150,0,150)});
    const far={y:shell.position.y,scale:shell.scale.x,angle:shell.rotation.z,
      mantleAngles:mantles.map(m=>Math.abs(m.rotation.z))};
    world.animate(2, {explorerPosition:new Vector3(pos.x,height,pos.z)});
    assert.ok(mantles.every((m,i)=>Math.abs(m.rotation.z)>far.mantleAngles[i]+.3),
      'both actual attached fluke hinges must spread only with publicly observed Pip');
    assert.ok(Math.abs(mantles[0].rotation.z+mantles[1].rotation.z)<1e-9,
      'the physical hinge action is symmetric and deterministic');
    assert.ok(shell.position.y>far.y+.1 && shell.scale.x>far.scale+.15,
      'public Pip arrival makes the real shell bloom and rise');
    assert.ok(shell.rotation.z>far.angle+.1,
      'actual connected ring tilts rather than only changing HUD text');
    world.animate(2, {reducedMotion:true,explorerPosition:new Vector3(pos.x,height,pos.z)});
    const settled={y:shell.position.y,scale:shell.scale.x,angle:shell.rotation.z,
      mantleAngles:mantles.map(m=>m.rotation.z)};
    world.animate(20, {reducedMotion:true,explorerPosition:new Vector3(150,0,150)});
    assert.deepEqual(mantles.map(m=>m.rotation.z),settled.mantleAngles,
      'reduced-motion fluke hinges must remain fixed even when public Pip retreats');
    assert.equal(shell.position.y,settled.y);
    assert.equal(shell.scale.x,settled.scale);
    assert.equal(shell.rotation.z,settled.angle,
      'reduced motion has a deterministic static pose, even on withdrawal');
    world.animate(2, {explorerPosition:new Vector3(150,0,150)});
    assert.equal(shell.position.y,far.y);
    assert.equal(shell.scale.x,far.scale);
    assert.equal(shell.rotation.z,far.angle,
      'withdrawing removes the publicly triggered gesture');
    assert.deepEqual(mantles.map(m=>Math.abs(m.rotation.z)),far.mantleAngles,
      'withdrawal must reset both original physical mantles without ghost AI cues');
    assert.equal(JSON.stringify(s), frozen, 'no mutation of public gameplay authority');
    assert.equal(world.stats().geometryCount,budget.geometryCount);
    assert.equal(world.stats().materialCount,budget.materialCount);
    assert.equal(world.stats().textureCount,budget.textureCount);
    world.update(published([],{runToken:'next-empty-run'}));
    assert.equal(world.group.getObjectByName('Disclosed fossil tide-organ breathing shell 10'),undefined);
    assert.equal(world.stats().responsiveFossilOrgans,0);
  } finally {world.dispose();}
});

test('hidden/private markers, hazards and actual gates cannot create a breathing landmark', async () => {
  const {createMazeWorld}=await loaded;
  const world=createMazeWorld({balanced:true});
  try {
    const forbidden=[
      published([],{privateMazeCells:[10],privateRoute:[10],hiddenExitCell:10}),
      published([cell(10,{blocked:true})]),
      published([cell(10,{trap:true})]),
      published([cell(10)],{keys:[{id:'key',cell:10,collected:false}]}),
      published([cell(10),cell(11,{neighbors:[10]})],{doors:[{a:10,b:11,open:false}]})
    ];
    for(const s of forbidden){
      world.update(s);
      assert.equal(world.group.getObjectByName('Disclosed fossil tide-organ breathing shell 10'),undefined,
        'no hidden route, hazard, blocked tile or known gate can fabricate the object');
    }
    world.update(published([cell(10)],{
      hiddenExitCell:10,privateRoute:[10,44],privateThreatCell:10
    }));
    assert.ok(world.group.getObjectByName('Disclosed fossil tide-organ breathing shell 10'),
      'only the already published safe wall-side scene makes this model visible');
  } finally {world.dispose();}
});
