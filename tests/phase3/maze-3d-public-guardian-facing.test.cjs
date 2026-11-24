'use strict';
const test=require('node:test');
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

test('source-witnessed STATIONARY guardian turns its full connected carapace and face toward Pip without moving a cell',async()=>{
  const {createWarden}=await production;
  for(const balanced of [false,true])for(const reducedMotion of [false,true]){
    const warden=createWarden({balanced});
    const rig=warden.group;
    const mask=rig.getObjectByName('warden mask');
    const body=rig.getObjectByName('armored body');
    assert.ok(mask&&body,'actual original connected mask and carapace required');
    const position=rig.position.clone();
    const before=new Set();rig.traverse(o=>{
      if(o.geometry)before.add(o.geometry);
      if(o.material)before.add(o.material);
    });
    const witnessed={heading:0,attentionHeading:Math.PI,attentionStrength:.85,
      encounterBeat:.5,danger:1,moving:false,time:1,delta:.05,reducedMotion};
    warden.update(witnessed);
    assert.ok(rig.rotation.y>1.3,'first observed moment begins a legible physical turn');
    for(let i=0;i<12;i++)warden.update({...witnessed,time:1+i*.05});
    assert.ok(rig.rotation.y>2.95,'stationary full body faces the true observed opposing actor');
    assert.deepEqual(rig.position,position,'only body facing changes, never gameplay location');
    assert.equal(mask.parent,body,'the brass mask stays attached to real armor');
    // No fake attack or enemy advance: moving guardians honor their real course.
    warden.update({...witnessed,moving:true,heading:.4});
    for(let i=0;i<12;i++)warden.update({...witnessed,moving:true,heading:.4});
    assert.ok(Math.abs(rig.rotation.y-.4)<.03,
      'autonomous locomotion always takes precedence over cosmetic duel facing');
    // No public witness / omitted beat / terminal result may retain a ghost
    // enemy-facing bearing; use reduced motion for precise canonical reset.
    warden.update({...witnessed,attentionStrength:0,reducedMotion:true,heading:0});
    assert.equal(rig.rotation.y,0,'hidden or withdrawn guardian faces only route');
    warden.update({...witnessed,encounterBeat:undefined,reducedMotion:true});
    assert.equal(rig.rotation.y,0,'mere attention without observed beat cannot turn entire body');
    warden.update({...witnessed,result:'capture',reducedMotion:true});
    assert.equal(rig.rotation.y,0,'terminal result suppresses duel-facing memory');
    warden.reset();assert.equal(rig.rotation.y,0,'reuse clears previous heading');
    const after=new Set();rig.traverse(o=>{
      if(o.geometry)after.add(o.geometry);
      if(o.material)after.add(o.material);
    });
    assert.deepEqual(after,before,'per-frame performance must allocate no mesh, material or geometry');
    warden.dispose();assert.equal(rig.children.length,0);
  }
});

test('production guardian bearing remains public-only and the original course and eye reactions survive',()=>{
  const section=source.slice(source.indexOf('export function createWarden'));
  assert.match(section,/const witnessedStand = !s\.win && !s\.lose && !s\.moving/);
  assert.match(section,/Number\.isFinite\(options\.encounterBeat\)/);
  assert.match(section,/Number\.isFinite\(options\.attentionHeading\)/);
  assert.match(section,/face\(group,witnessedStand \? options\.attentionHeading : options\.heading/);
  assert.match(section,/const lookYaw=Math\.max\(-\.58,Math\.min\(\.58,relativeLook\)\)\*alert;/);
  assert.doesNotMatch(section,/privateMaze|hiddenCells|secretSafeRoute/);
});
