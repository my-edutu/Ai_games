'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const root=path.resolve(__dirname,'../..');
const actor=()=>import('../../public/snake-stream/serpent.mjs');
test('RED→GREEN: only physical contiguous public turns affect body, never a portal jump',async()=>{
  const {signedPublicTurn}=await actor(),a={x:0,z:0},b={x:1,z:0};
  assert.equal(signedPublicTurn(a,b,{x:1,z:1}),1);
  assert.equal(signedPublicTurn(a,b,{x:1,z:-1}),-1);
  assert.equal(signedPublicTurn(a,b,{x:2,z:0}),0);
  assert.equal(signedPublicTurn(a,b,{x:9,z:1}),0);
  assert.equal(signedPublicTurn(null,b,{x:1,z:1}),0);
});
test('T2 coherent muscles/camber, safe underside, portal caps and reduced motion stay bounded',async()=>{
  const {sampleSerpentActing}=await actor(),out=new Float32Array(4);
  const sample=(d,fragment,tail,bend,time,neck,reduced)=>
    Array.from(sampleSerpentActing(d,fragment,tail,bend,time,neck,reduced,out));
  const straight=sample(4,3,5,0,0,0,false);
  const left=sample(4,3,5,1,0,0,false),right=sample(4,3,5,-1,0,0,false);
  assert.ok(left[3]>.10&&right[3]<-.10);
  assert.ok(left[0]>straight[0]);
  assert.ok(left[1]-right[1]>.12);
  for(const time of [0,2,90]){
    assert.deepEqual(sample(4,3,5,1,time,0,true),[1,0,0,0]);
    assert.deepEqual(sample(1,0,5,1,time,0,false),[1,0,0,0]);
    assert.deepEqual(sample(5,4,0,1,time,0,false),[1,0,0,0]);
    assert.deepEqual(sample(5,4,5,1,time,1,false),[1,0,0,0]);
  }
  for(let t=0;t<12;t+=.125){
    const pose=sample(5,3,4,1,t,0,false);
    assert.ok(pose[0]>.84&&pose[0]<1.16);
    assert.ok(Math.abs(pose[1])<.16);
    assert.ok(pose[2]>=0&&pose[2]<=.02);
    assert.ok(Math.abs(pose[3])<=.156);
  }
});
test('Actor uses reusable body ring and real director stays optional, fully accessible; original strict overview gate unchanged',()=>{
  const read=p=>fs.readFileSync(path.join(root,p),'utf8');
  const actorSource=read('public/snake-stream/serpent.mjs');
  const app=read('public/snake-stream/app.js'),html=read('public/snake-stream/index.html');
  assert.match(actorSource,/const acting = new Float32Array\(4\)/);
  assert.match(actorSource,/signedPublicTurn\(path\[s-1\],path\[s\],path\[s\+1\]\)/);
  assert.match(actorSource,/radius\*Math\.hypot\(\.88,acting\[3\]\)/);
  assert.match(html,/data-control="cinematic" aria-pressed="false"/);
  assert.match(app,/case 'cinematic': cameraMode = cameraMode === 'cinematic'/);
  assert.match(app,/cameraMode = selectInitialSpectatorCamera\(params, reducedMotion\)/, 'real startup must use the validated camera selector');
  assert.match(read('public/snake-stream/cinematic-director.mjs'), /\['overview', 'follow', 'detail', 'cinematic'\]\.includes\(requested\)/, 'selector must allowlist only approved camera views');
  assert.match(read('tests/browser/snake-stream.spec.cjs'),/expect\(animation\.actualDraws\)\.toBeGreaterThanOrEqual\(17\)/);
});

test('T2 actor maintains grounded face rotation and public feeding joint limits through curved paths',async()=>{
  const THREE=await import('three'),{createSerpent}=await actor();
  const model=createSerpent(THREE),head=model.group.getObjectByName('Expressive head');
  const jaw=model.group.getObjectByName('Attached lower jaw pivot');
  const path=Object.freeze([{x:0,z:0},{x:-1,z:0},{x:-1,z:1},{x:-1,z:2}].map(Object.freeze));
  const frozen=JSON.stringify(path),before=model.stats();
  try{
    for(let i=0;i<48;i++)model.update([path],{detail:'low',time:i/60,delta:1/60,direction:{x:1,z:0},
      runToken:'turn',food:{x:1.6,z:0.25},danger:0});
    assert.ok(Math.abs(head.children[0].rotation.z)<=.1050001,'avoid ground-intersecting skull roll');
    assert.ok(jaw.rotation.x>=0&&jaw.rotation.x<=.1050001,'public feeding safely articulates existing mouth');
    model.update([path],{detail:'low',time:1,delta:1/60,direction:{x:1,z:0},
      runToken:'turn',food:{x:1.6,z:0.25},reducedMotion:true});
    assert.equal(head.children[0].rotation.z,0,'reduced motion must never bank the skull');
    assert.equal(JSON.stringify(path),frozen,'public route remains immutable');
    for(const key of ['geometries','materials','textures','bufferBytes'])
      assert.equal(model.stats()[key],before[key],'no new GPU resource: '+key);
  }finally{model.dispose();}
});
