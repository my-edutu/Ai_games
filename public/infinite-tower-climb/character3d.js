// Procedural expedition climber: original geometry with independently animated articulated limbs.
// No external models or runtime asset licenses are required.
export function createClimber(THREE) {
  const makeMat=(color,metalness=0.12,roughness=0.7,emissive=0x000000)=>new THREE.MeshStandardMaterial({color,metalness,roughness,emissive});
  const cloth=makeMat(0x264653), leather=makeMat(0x754b35), gold=makeMat(0xe6af68,0.65,0.35),
    bone=makeMat(0xd9a87c), black=makeMat(0x172532,0.24,0.58), armor=makeMat(0x466779,0.65,0.32),
    glass=makeMat(0x77e5eb,0.56,0.12,0x053b4b), rope=makeMat(0xcd9860), boot=makeMat(0x26282e);
  const root=new THREE.Group(); root.name='Expedition climber';
  const body=new THREE.Group(); root.add(body);
  const box=(w,h,d,mat,p,x=0,y=0,z=0)=>{
    const obj=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
    obj.position.set(x,y,z);p.add(obj);obj.castShadow=true;obj.receiveShadow=true;return obj;
  };
  const orb=(sx,sy,sz,mat,p,x=0,y=0,z=0)=>{
    const obj=new THREE.Mesh(new THREE.SphereGeometry(1,16,12),mat);
    obj.scale.set(sx,sy,sz);obj.position.set(x,y,z);p.add(obj);obj.castShadow=true;return obj;
  };
  const capsule=(radius,length,mat,p,x=0,y=0,z=0)=>{
    const obj=new THREE.Mesh(new THREE.CapsuleGeometry(radius,length,6,10),mat);
    obj.position.set(x,y,z);p.add(obj);obj.castShadow=true;return obj;
  };
  const tube=(a,b,r,mat,p,segments=7)=>{
    const dir=new THREE.Vector3().subVectors(b,a),o=new THREE.Mesh(new THREE.CylinderGeometry(r,r,dir.length(),segments),mat);
    o.position.copy(a).add(b).multiplyScalar(0.5);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),dir.normalize());p.add(o);o.castShadow=true;return o;
  };
  // Chest, armored undersuit, climbing harness and travel gear.
  capsule(0.31,0.4,cloth,body,0,0.08,0);
  orb(0.33,0.37,0.21,leather,body,0,0.14,0.04);
  box(0.66,0.12,0.48,black,body,0,-0.32,0);
  box(0.69,0.08,0.51,gold,body,0,-0.29,0);
  box(0.12,0.17,0.08,gold,body,0,-0.27,0.31);
  for(const side of [-1,1]){
    tube(new THREE.Vector3(side*0.25,0.45,0.21),new THREE.Vector3(side*0.12,-0.34,0.29),0.055,leather,body);
    box(0.18,0.25,0.13,armor,body,side*0.26,-0.33,0.11);
    box(0.14,0.18,0.1,leather,body,side*0.25,-0.35,-0.09);
  }
  // Pack and tools make a readable silhouette even at broadcast scale.
  box(0.5,0.63,0.23,leather,body,0,0.14,-0.33);
  box(0.54,0.14,0.26,gold,body,0,0.31,-0.34);
  box(0.4,0.11,0.26,black,body,0,-0.13,-0.34);
  const loop=new THREE.Mesh(new THREE.TorusGeometry(0.18,0.045,7,20),rope);
  loop.rotation.x=Math.PI/2;loop.position.set(-0.37,0.12,-0.32);body.add(loop);
  tube(new THREE.Vector3(0.32,0.32,-0.39),new THREE.Vector3(0.4,-0.24,-0.35),0.045,gold,body);
  // Head, hood, protective helmet and glowing visor.
  const neck=capsule(0.13,0.05,bone,body,0,0.6,0.02);
  orb(0.26,0.29,0.24,bone,body,0,0.86,0.02);
  orb(0.28,0.23,0.25,black,body,0,0.99,-0.015);
  orb(0.29,0.12,0.27,armor,body,0,1.13,-0.01);
  box(0.51,0.1,0.3,glass,body,0,0.91,0.19);
  box(0.23,0.04,0.06,gold,body,0,1.12,0.24);
  orb(0.06,0.075,0.05,gold,body,-0.31,0.93,-0.015);
  orb(0.06,0.075,0.05,gold,body,0.31,0.93,-0.015);
  const limbs={arms:[],legs:[]};
  for(const side of [-1,1]){
    const arm=new THREE.Group();arm.position.set(side*0.35,0.36,0);body.add(arm);
    orb(0.19,0.17,0.21,armor,arm,0,0,0);
    capsule(0.125,0.3,cloth,arm,side*0.05,-0.27,0);
    orb(0.125,0.13,0.13,gold,arm,side*0.05,-0.53,0);
    const elbow=new THREE.Group();elbow.name='elbow';elbow.position.set(side*0.05,-0.53,0);arm.add(elbow);
    capsule(0.105,0.25,leather,elbow,side*0.01,-0.16,0.03);
    box(0.22,0.2,0.18,black,elbow,0,-0.45,0.05);
    for(let finger=0;finger<3;finger++)capsule(0.032,0.1,bone,elbow,(finger-1)*0.06,-0.58,0.1);
    const leg=new THREE.Group();leg.position.set(side*0.17,-0.45,0);body.add(leg);
    capsule(0.17,0.45,black,leg,0,-0.31,0);
    orb(0.15,0.15,0.15,gold,leg,0,-0.62,0.09);
    const knee=new THREE.Group();knee.name='knee';knee.position.set(0,-0.62,0);leg.add(knee);
    capsule(0.13,0.36,cloth,knee,0,-0.23,0);
    box(0.31,0.22,0.18,armor,knee,0,-0.07,0.2);
    box(0.29,0.19,0.42,boot,knee,0,-0.52,0.13);
    box(0.3,0.08,0.5,armor,knee,0,-0.63,0.16);
    limbs.arms.push({part:arm,elbow,side});limbs.legs.push({part:leg,knee,side});
  }
  // Head lamp is physically located on helmet; local rim glow.
  const lamp=new THREE.PointLight(0xa5f7ff,1.5,6,2);lamp.position.set(0,1.15,0.37);body.add(lamp);
  let velocityX=0,velocityY=0,velocityZ=0,activity=0,pose='idle';
  const easing=(oldValue,value)=>THREE.MathUtils.lerp(oldValue,value,.19);
  return{
    root,
    get pose(){return pose},
    setMotion(dx,dy,intent='',dz=0){
      velocityX=THREE.MathUtils.clamp(dx,-4,4);
      velocityY=THREE.MathUtils.clamp(dy,-4,4);
      velocityZ=THREE.MathUtils.clamp(dz,-4,4);
      const cmd=String(intent).toLowerCase();
      if(cmd.includes('guardian')||cmd.includes('strik')||cmd.includes('combat'))pose='combat';
      else if(cmd.includes('wall')||cmd.includes('ladder'))pose='climb';
      else if(dy>.045)pose='leap';
      else if(dy<-.06)pose='fall';
      else if(Math.hypot(dx,dz)>.016)pose='run';
      else pose='idle';
    },
    animate(t,reduced=false){
      const pace=THREE.MathUtils.clamp(Math.hypot(velocityX,velocityZ)*12,0,1);
      activity=easing(activity,pace);
      const cyc=reduced?0:t*9.5;
      for(const {part,elbow,side} of limbs.arms){
        const swing=Math.sin(cyc+side*Math.PI/2);
        const x=pose==='climb'?-2.2:pose==='leap'?-1.15:pose==='fall'?-1.5:
          pose==='combat'?-0.9:swing*.69*activity;
        const z=pose==='climb'?side*.48:pose==='fall'?side*.43:
          pose==='combat'?side*.28:side*.075;
        const bend=pose==='combat'?-1.05:pose==='climb'?-1.25:
          pose==='leap'?-1.10:pose==='fall'?-0.2:-0.28-Math.max(0,swing)*.23*activity;
        part.rotation.x=easing(part.rotation.x,x);
        part.rotation.z=easing(part.rotation.z,z);
        elbow.rotation.x=easing(elbow.rotation.x,bend);
      }
      for(const {part,knee,side} of limbs.legs){
        const stride=Math.sin(cyc+side*Math.PI/2);
        const hip=pose==='leap'?side<0?-.56:.65:pose==='climb'?stride*.6:
          pose==='fall'?side*.17:pose==='combat'?-.18:stride*.72*activity;
        const bend=pose==='leap'?side<0?1.05:.46:pose==='climb'?.65+.25*stride:
          pose==='fall'?.2:pose==='combat'?.32:Math.max(0,-stride)*.72*activity;
        part.rotation.x=easing(part.rotation.x,hip);
        part.rotation.z=easing(part.rotation.z,pose==='fall'?side*.13:0);
        knee.rotation.x=easing(knee.rotation.x,bend);
      }
      const magnitude=Math.hypot(velocityX,velocityZ);
      if(magnitude>.012){
        const facing=Math.atan2(velocityX,velocityZ);
        let delta=facing-root.rotation.y;
        while(delta>Math.PI)delta-=Math.PI*2;
        while(delta< -Math.PI)delta+=Math.PI*2;
        root.rotation.y+=delta*.09;
      }
      body.rotation.z=easing(body.rotation.z,THREE.MathUtils.clamp(-velocityX*.18,-.18,.18));
      body.rotation.x=easing(body.rotation.x,pose==='fall'?-.33:pose==='leap'?.16:0);
      body.position.y=reduced?0:Math.sin(t*9.5)*.035*activity;
    }
  };
}
