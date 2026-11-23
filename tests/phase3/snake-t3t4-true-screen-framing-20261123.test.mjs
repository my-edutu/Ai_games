import test from 'node:test';
import assert from 'node:assert/strict';
import { createPresentationCameraAnchor, cameraHeadFrustumMargin } from '../../public/snake-stream/camera.mjs';

const follow = (x,z,{aspect=16/9,offset={x:1.5,y:6.5,z:7},gpuPressure=true,mode='follow',runToken='r',discontinuity=false,reducedMotion=false}={})=>({
  mode,runToken,discontinuity,reducedMotion,aspect,gpuPressure,head:{x,z},target:{x,y:.4,z},offset,width:28,height:16,
});

test('a diagonal public head cannot exit the true perspective camera even while per-axis dead-zone tests still say HOLD',()=>{
  const aspect=16/9,offset={x:1.5,y:6.5,z:7};
  const camera=createPresentationCameraAnchor();
  camera.resolve(follow(0,0,{aspect,offset}));
  // Each axis remains under the 3.0-unit hold AND the diagonal distance
  // remains below the original 3.25-unit teleport detector. Nonetheless
  // approaching the camera diagonally shortens the 3D depth so the face
  // leaves the VERTICAL screen-safe field at 36-degree real lens.
  const publicHead={x:1.3,z:2.95};
  const result=camera.resolve(follow(publicHead.x,publicHead.z,{aspect,offset}));
  const margin=cameraHeadFrustumMargin({head:publicHead,target:result.target,offset:result.offset,aspect});
  assert.equal(result.reset,true,'reframe on actual perspective danger, not the old axis-only world threshold');
  assert.ok(margin >= 0,`head and eyes remain visible: true projected margin ${margin}`);
});

test('390x844 portrait does not crop actual public head or lie about a portal cut under fence pressure',()=>{
  const aspect=390/844,offset={x:1.2,y:6,z:6.7};
  const camera=createPresentationCameraAnchor();
  camera.resolve(follow(0,0,{aspect,offset}));
  const result=camera.resolve(follow(.85,0,{aspect,offset}));
  const margin=cameraHeadFrustumMargin({head:{x:.85,z:0},target:result.target,offset:result.offset,aspect});
  assert.equal(result.reset,true);
  assert.ok(margin >= 0,'wide-eyed serpent must stay inside portrait 36-degree face-safe field');
  const portal=camera.resolve(follow(9,3,{aspect,offset,discontinuity:true}));
  assert.equal(portal.snap,true);
  assert.ok(cameraHeadFrustumMargin({head:{x:9,z:3},target:portal.target,offset:portal.offset,aspect})>=0);
});

test('full real game head trace reuses camera view without blindly ignoring head near projected screen boundary',()=>{
  const anchor=createPresentationCameraAnchor(),offset={x:1.5,y:6.5,z:7};
  let changes=0,maxProjectedOverflow=-Infinity;
  for(let i=0;i<=500;i++){
    // All real public motions; both the forward and turning stretches exercise framing.
    const x=-11+i*.047,z=Math.sin(i*.017)*1.8;
    const shot=anchor.resolve(follow(x,z,{offset}));
    changes+=Number(shot.reset);
    const margin=cameraHeadFrustumMargin({head:{x,z},target:shot.target,offset:shot.offset,aspect:16/9});
    maxProjectedOverflow=Math.max(maxProjectedOverflow,-margin);
  }
  assert.ok(changes<=20,`a 500-tick public head trace should not rebuild >20 static camera photographs, observed ${changes}`);
  assert.ok(maxProjectedOverflow<=0,'every character head must be inside the actual projected screen-safe zone');
});

test('true perspective holding is never used on normal GPU, restarts, portals or accessible reduced-motion cuts',()=>{
  const normal=createPresentationCameraAnchor();normal.resolve(follow(0,0,{gpuPressure:false}));
  assert.equal(normal.resolve(follow(3.2,0,{gpuPressure:false})).reset,true);
  const broken=createPresentationCameraAnchor();broken.resolve(follow(0,0));
  const portal=broken.resolve(follow(8,0,{discontinuity:true}));
  assert.equal(portal.snap,true);
  const resumed=broken.resolve(follow(0,0,{runToken:'new'}));
  assert.equal(resumed.snap,true);
  const accessible=createPresentationCameraAnchor();accessible.resolve(follow(0,0,{reducedMotion:true}));
  assert.equal(accessible.resolve(follow(4.2,0,{reducedMotion:true})).snap,true);
});
