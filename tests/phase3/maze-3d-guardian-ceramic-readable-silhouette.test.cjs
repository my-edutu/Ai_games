'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');

const root=path.resolve(__dirname,'../..');
const source=fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three=pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const production=import('data:text/javascript;base64,'+Buffer.from(
  source.replace("'./vendor/three.module.js'",JSON.stringify(three))
).toString('base64'));

test('actual joined 3D guardian palette has separate, material-reused carapace and face',async()=>{
  const {createWarden}=await production;
  for(const balanced of [false,true]){
    const warden=createWarden({balanced});
    const mask=warden.group.getObjectByName('warden mask');
    const body=warden.group.getObjectByName('armored body');
    const left=warden.group.getObjectByName('articulated guardian shoulder guard -1');
    const right=warden.group.getObjectByName('articulated guardian shoulder guard 1');
    assert.ok(mask&&body&&left&&right);
    assert.equal(mask.parent,body,'the entire face must still follow the physical body');
    assert.equal(left.parent,body);
    assert.equal(right.parent,body);
    const palette=new Set(), geometryBefore=new Set(), materialBefore=new Set();
    warden.group.traverse(node=>{
      if(node.geometry)geometryBefore.add(node.geometry);
      if(node.material){
        const materials=Array.isArray(node.material)?node.material:[node.material];
        for(const material of materials){materialBefore.add(material);if(material.color)palette.add(material.color.getHexString())}
      }
    });
    assert.ok(palette.has('25446b'),'the physically rendered indigo shell remains part of the actual rig');
    assert.ok(palette.has('b7e4ef'),'the sea-glass mask reuses the real 3D frond finish');
    const cue={heading:0,attentionHeading:.5,attentionStrength:.8,danger:1,
      moving:false,time:1,delta:0,reducedMotion:false};
    warden.update({...cue,encounterBeat:0});
    assert.equal(left.rotation.y,0);
    assert.equal(right.rotation.y,0);
    warden.update({...cue,encounterBeat:.5});
    assert.ok(left.rotation.y<-.3 && right.rotation.y>.3,
      'paired genuine 3D bronze shields must clear the face while the guardian plants');
    warden.update({...cue,encounterBeat:1});
    assert.ok(Math.abs(left.rotation.y)<.1 && Math.abs(right.rotation.y)<.1,
      'witnessed shell release clears the center of the original mask');
    warden.update({...cue,attentionStrength:0,attentionHeading:undefined,encounterBeat:1});
    assert.equal(left.rotation.y,0);
    assert.equal(right.rotation.y,0);
    warden.update({...cue,encounterBeat:1,result:'capture'});
    assert.equal(left.rotation.y,0);
    assert.equal(right.rotation.y,0);
    warden.reset();
    assert.equal(left.rotation.y,0);
    assert.equal(right.rotation.y,0);
    const geometryAfter=new Set(),materialAfter=new Set();
    warden.group.traverse(node=>{
      if(node.geometry)geometryAfter.add(node.geometry);
      if(node.material){
        for(const material of Array.isArray(node.material)?node.material:[node.material])materialAfter.add(material);
      }
    });
    assert.deepEqual(geometryAfter,geometryBefore,'the warning pose allocates no geometry');
    assert.deepEqual(materialAfter,materialBefore,'the warning pose allocates no material');
    warden.dispose();
    assert.equal(warden.group.children.length,0);
  }
});

test('reduced-motion public brace holds an honest stationary physical shield pose',async()=>{
  const {createWarden}=await production;
  const warden=createWarden({balanced:true});
  const left=warden.group.getObjectByName('articulated guardian shoulder guard -1');
  const cue={heading:0,attentionHeading:.5,attentionStrength:.8,danger:1,
    moving:false,time:1,delta:0,reducedMotion:true,encounterBeat:.5};
  warden.update(cue);const seen=left.rotation.y;
  warden.update({...cue,time:100});assert.equal(left.rotation.y,seen,'reduced motion never pulses');
  warden.update({...cue,attentionStrength:0,attentionHeading:undefined});
  assert.equal(left.rotation.y,0,'hidden guardian clears source-public defensive pose');
  warden.dispose();
});

test('new actor-material staging consumes no private data and changes no gameplay controls',()=>{
  assert.match(source,/ball\(head,frondGlass,\[0,\.035,\.015\]/);
  assert.match(source,/guard\.rotation\.y=defensiveSweep>0\?side\*defensiveSweep\*\.68:0/);
  assert.doesNotMatch(source.slice(source.indexOf('export function createWarden')),/privateMaze|hiddenCells|secretRoute/);
});
