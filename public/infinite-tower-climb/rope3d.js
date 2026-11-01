// Original climbing rope with inertia and a piton tether; entirely visual unless
// the gameplay authority elects to use it. Segment geometry is GPU-instanced and reused.
export function createClimbingRope(THREE,scene) {
  const ropeGeo=new THREE.CylinderGeometry(.048,.048,1,6);
  const ropeMaterial=new THREE.MeshStandardMaterial({
    color:0xf9c27a,roughness:.94,metalness:0,emissive:0x38220d,emissiveIntensity:.14
  });
  const SEGMENTS=22;
  const line=new THREE.InstancedMesh(ropeGeo,ropeMaterial,SEGMENTS);
  line.name='Dynamically tensioned safety rope';line.frustumCulled=false;
  line.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
  scene.add(line);
  const piton=new THREE.Group();piton.name='Safety piton and copper anchor';scene.add(piton);
  const metal=new THREE.MeshStandardMaterial({color:0xbbac8d,metalness:.72,roughness:.36});
  const head=new THREE.Mesh(new THREE.SphereGeometry(.16,9,6),metal);
  const shank=new THREE.Mesh(new THREE.CylinderGeometry(.065,.1,.63,8),metal);
  shank.rotation.x=Math.PI/2;shank.position.z=-.26;
  piton.add(head,shank);
  const midpoint=new THREE.Vector3(),axis=new THREE.Vector3(0,1,0),delta=new THREE.Vector3(),dummy=new THREE.Object3D();
  let anchor={x:0,y:0,z:0},last={x:0,y:0,z:0},stiffness=0.3,visibility=0,frame=0;
  function update(dt,player,surface,mode='CLIMBING',options={}){
    if(!player)return;
    frame+=Math.max(0,Math.min(dt||0,.06));
    const climbing=/WALL|JUMP|FALL|MANTLE/.test(mode);
    const desired=climbing?1:.68;
    visibility+=(desired-visibility)*.09;
    const platform=surface||{x:player.x,y:player.y-4,z:player.z-4};
    const tx=Number(platform.x||0),ty=Number(platform.y||0)+.47,tz=Number(platform.z||0)-1.25;
    const follow=Math.min(1,.08+Math.max(0,dt)*7);
    anchor.x+=(tx-anchor.x)*follow;anchor.y+=(ty-anchor.y)*follow;anchor.z+=(tz-anchor.z)*follow;
    piton.position.set(anchor.x,anchor.y,anchor.z);
    const start=new THREE.Vector3(player.x,player.y+.45,player.z-.31);
    const end=new THREE.Vector3(anchor.x,anchor.y,anchor.z);
    const length=start.distanceTo(end),tension=Math.min(1,length/12);
    stiffness+=(tension-stiffness)*.07;
    const sway=options.reducedMotion?0:Math.sin(frame*1.8)*.11;
    let prev=start;
    for(let i=0;i<SEGMENTS;i++){
      const t=(i+1)/SEGMENTS;
      const p=start.clone().lerp(end,t);
      const sag=Math.sin(Math.PI*t)*(1-stiffness)*Math.min(2.2,length*.18);
      p.y-=sag;
      p.z+=Math.sin(Math.PI*t)*(sway+(1-stiffness)*.25);
      midpoint.addVectors(prev,p).multiplyScalar(.5);
      delta.subVectors(p,prev);
      dummy.position.copy(midpoint);
      dummy.quaternion.setFromUnitVectors(axis,delta.clone().normalize());
      dummy.scale.set(.85,Math.max(.0001,delta.length()),.85);
      dummy.updateMatrix();line.setMatrixAt(i,dummy.matrix);
      prev=p;
    }
    line.instanceMatrix.needsUpdate=true;
    line.visible=visibility>.1&&length<80;
    piton.visible=line.visible;
    last={...player};
  }
  return {update,root:line,piton,signature:'instanced-tension-rope-v1'};
}
