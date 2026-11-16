'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const {pathToFileURL} = require('node:url');
const path = require('node:path');
const fs = require('node:fs');
const root = path.resolve(__dirname,'../..');
// Match the EXISTING rigorous installed-Three rig test harness: the browser
// receives /maze/vendor via server routing, not a physical relative file.
const characters = fs.readFileSync(path.join(root,'public/ai-maze-escape/characters.js'),'utf8');
const three = pathToFileURL(path.join(root,'node_modules/three/build/three.module.js')).href;
const production = import('data:text/javascript;base64,'+
  Buffer.from(characters.replace("'./vendor/three.module.js'",JSON.stringify(three)))
    .toString('base64'));

test('one actually witnessed lantern counter moves Thornback through distinct connected full-body load, collapse and reset', async () => {
  const {createWarden,rigPrimitiveResourceStats}=await production;
  const warden=createWarden({balanced:true});
  const find=name=>{
    const joint=warden.group.getObjectByName(name);
    assert.ok(joint,'missing actual modeled articulation: '+name);
    return joint;
  };
  const leftShell=find('flared elytron -1');
  const rightShell=find('flared elytron 1');
  const leftGuard=find('articulated guardian shoulder guard -1');
  const leftVane=find('articulated guardian tail vane -1');
  const mandible=find('hinged guardian lower mandible');
  const body=find('armored body');
  const head=find('warden mask');
  const frontHip=find('leg -1 0');
  const frontKnee=frontHip.getObjectByName('claw knee');
  const rearHip=find('leg 1 2');
  const rearKnee=rearHip.getObjectByName('claw knee');
  assert.ok(frontKnee&&rearKnee,'witnessed surrender requires original rooted knees');
  const initial=rigPrimitiveResourceStats();
  const meshCount=(()=>{let n=0;warden.group.traverse(o=>{if(o.isMesh)n++});return n})();
  const pose=(counterPhase,overrides={})=>{
    warden.update({heading:0,attentionHeading:0,attentionStrength:1,
      encounterBeat:.85,lanternParried:true,counterPhase,
      time:3,delta:0,moving:false,danger:0,reducedMotion:false,...overrides});
    return {
      left:Math.abs(leftShell.rotation.z),
      right:Math.abs(rightShell.rotation.z),
      guard:Math.abs(leftGuard.rotation.x),
      vane:leftVane.rotation.z, jaw:mandible.rotation.x,
      bodyPitch:body.rotation.x,headPitch:head.rotation.x,
      headY:head.position.y,bodyY:body.position.y,
      frontHip:frontHip.rotation.z,frontKnee:frontKnee.rotation.x,
      rearHip:rearHip.rotation.z,rearKnee:rearKnee.rotation.x
    };
  };
  try {
    const loaded=pose(.20);
    const recovery=pose(.83);
    assert.ok(loaded.guard>recovery.guard+.65,
      'real planted shoulder guard must visibly release, not stay frozen');
    assert.ok(loaded.left>recovery.left+.24 && loaded.right>recovery.right+.24,
      'both armored shells must substantially FOLD on an earned counter, not flare as another threat');
    assert.ok(Math.abs(loaded.vane-recovery.vane)>.60,
      'connected rear vanes must reverse their full-body weight silhouette');
    assert.ok(loaded.jaw>recovery.jaw+.35,
      'the actual jaw must clamp around the subdued guardian mask');
    assert.ok(Math.abs(loaded.bodyPitch-recovery.bodyPitch)>.25,
      'the armored body must transfer weight through the earned recovery');
    assert.ok(Math.abs(loaded.headPitch-recovery.headPitch)>.24,
      'the same physical head must follow the body, not leave a HUD-only response');
    assert.ok(recovery.bodyY < loaded.bodyY-.065,
      'subdued Thornback must visibly lower its real armored mass onto its legs');
    assert.ok(Math.abs(recovery.frontHip)>Math.abs(loaded.frontHip)+.14,
      'both original forelegs must fold into the physical collapse, not stay planted in attack');
    assert.ok(Math.abs(recovery.rearHip)>Math.abs(loaded.rearHip)+.14,
      'rear limbs must catch the real body load rather than leaving a floating shell');
    assert.ok(recovery.frontKnee>loaded.frontKnee+.20,
      'original knee must take compression when the guardian surrenders');
    const settled=pose(1);
    const firstSeen=pose(undefined);
    assert.equal(settled.left,firstSeen.left,
      'actual guardian must settle back to trusted disclosed shell after its event');
    assert.equal(settled.frontHip,firstSeen.frontHip,
      'front grounding legs must return to canonical first-seen pose');
    assert.equal(settled.rearKnee,firstSeen.rearKnee,
      'rear grounding knees must return to canonical first-seen pose');
    assert.equal(settled.vane,firstSeen.vane,
      'no ghost tail recoil after the public counter clock ends');
    assert.equal(rigPrimitiveResourceStats().unique,initial.unique,
      'no novel geometries from any animation frame');
    let after=0;warden.group.traverse(o=>{if(o.isMesh)after++});
    assert.equal(after,meshCount,'event animation cannot create more meshes');

    const noEventA=pose(undefined);
    const noEventB=pose(undefined,{time:30});
    assert.equal(noEventA.left,noEventB.left,
      'first-seen already-parried guardian must not manufacture earned collapse');
    assert.equal(noEventA.vane,noEventB.vane,
      'missing witnessed clock must not fabricate a temporal withdrawal');
    const reducedA=pose(.20,{reducedMotion:true});
    const reducedB=pose(.96,{reducedMotion:true,time:40});
    assert.equal(reducedA.left,reducedB.left,
      'reduced motion must keep the disclosed warning static');
    assert.equal(reducedA.vane,reducedB.vane);
    const neutral=pose(undefined,{lanternParried:false,attentionStrength:0,
      attentionHeading:undefined,encounterBeat:undefined,reducedMotion:true});
    assert.equal(leftShell.rotation.z,0,'withdrawn guardian must fully close left shell');
    assert.equal(rightShell.rotation.z,0,'withdrawn guardian must fully close right shell');
    assert.equal(leftGuard.rotation.x,0,'withdrawn guardian must clear public brace');
    assert.equal(leftVane.rotation.z,0,'withdrawn guardian must clear public recoil');
    assert.ok(Number.isFinite(neutral.bodyPitch)&&Number.isFinite(neutral.headPitch));
  } finally {
    warden.dispose();
  }
});
