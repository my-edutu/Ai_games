import * as THREE from '/tower/vendor/three.module.js';

// All model geometry is authored here. +Y up, +Z face, soles at Y=0.
// Only the articulated child rig is animated; scene placement remains host-owned.
const clamp = THREE.MathUtils.clamp;
const mix = THREE.MathUtils.lerp;

function roundedShape(w, h, r = Math.min(w, h) * .22) {
  const s = new THREE.Shape(), x = -w / 2, y = -h / 2;
  s.moveTo(x + r, y); s.lineTo(x + w - r, y);
  s.quadraticCurveTo(x + w, y, x + w, y + r); s.lineTo(x + w, y + h - r);
  s.quadraticCurveTo(x + w, y + h, x + w - r, y + h); s.lineTo(x + r, y + h);
  s.quadraticCurveTo(x, y + h, x, y + h - r); s.lineTo(x, y + r);
  s.quadraticCurveTo(x, y, x + r, y);
  return s;
}

// Join coincident surface normals across the rounded shell's six patches. The
// shell stays geometrically rounded rather than depending on a painted edge.
function smoothShellNormals(geometry) {
  geometry.computeVertexNormals();
  const positions=geometry.attributes.position,normals=geometry.attributes.normal,shared=new Map();
  const keyAt=i=>`${Math.round(positions.getX(i)*1e5)},${Math.round(positions.getY(i)*1e5)},${Math.round(positions.getZ(i)*1e5)}`;
  for(let i=0;i<positions.count;i++){
    const key=keyAt(i),sum=shared.get(key)??new THREE.Vector3();
    sum.x+=normals.getX(i);sum.y+=normals.getY(i);sum.z+=normals.getZ(i);shared.set(key,sum);
  }
  for(const sum of shared.values())sum.normalize();
  for(let i=0;i<positions.count;i++){const normal=shared.get(keyAt(i));normals.setXYZ(i,normal.x,normal.y,normal.z);}
  return geometry;
}

function workshop(name) {
  const group = new THREE.Group(); group.name = name;
  const geometrySet = new Set(), materialSet = new Set();
  let disposed = false;
  const geo = value => { geometrySet.add(value); return value; };
  const mat = (color, metalness = .2, roughness = .42, emissive = 0, intensity = 0) => {
    const m = new THREE.MeshStandardMaterial({color, metalness, roughness, emissive, emissiveIntensity:intensity});
    materialSet.add(m); return m;
  };
  const node = (parent, name, x = 0, y = 0, z = 0) => {
    const n = new THREE.Bone(); n.name = name; n.position.set(x,y,z); parent.add(n); return n;
  };
  const mesh = (parent, geometry, material, x=0,y=0,z=0, rx=0,ry=0,rz=0) => {
    const m = new THREE.Mesh(geometry, material); m.position.set(x,y,z); m.rotation.set(rx,ry,rz);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  };
  const plate = (parent, w,h,d, material,x=0,y=0,z=0,r=.08) => {
    const b = Math.min(r,d*.35,w*.18,h*.18);
    const g = geo(new THREE.ExtrudeGeometry(roundedShape(w-b*2,h-b*2,r),{
      depth:Math.max(.001,d-b*2), bevelEnabled:true, bevelSegments:2,steps:1,bevelSize:b,bevelThickness:b,curveSegments:5
    }));
    g.translate(0,0,-d/2+b);
    return mesh(parent,g,material,x,y,z);
  };
  // Broad ceramic shells use continuous fillets and a shallow crown. This
  // replaces faceted extrusion caps only where the large surface needs volume.
  const shell = (parent,w,h,d,material,x=0,y=0,z=0,r=.12,crown=.025,taper=.08) => {
    r=Math.min(r,w*.45,h*.45,d*.45);
    const g=geo(new THREE.BoxGeometry(w,h,d,8,8,8)),positions=g.attributes.position;
    const point=new THREE.Vector3(),core=new THREE.Vector3(),direction=new THREE.Vector3();
    for(let i=0;i<positions.count;i++){
      point.fromBufferAttribute(positions,i);
      core.set(clamp(point.x,-w/2+r,w/2-r),clamp(point.y,-h/2+r,h/2-r),clamp(point.z,-d/2+r,d/2-r));
      direction.copy(point).sub(core).normalize();point.copy(core).addScaledVector(direction,r);
      const normalizedY=point.y/(h/2),normalizedX=point.x/(w/2);
      if(point.z>0)point.z+=crown*(1-normalizedX*normalizedX)*(1-normalizedY*normalizedY);
      point.x*=1-taper*Math.max(0,-normalizedY);
      positions.setXYZ(i,point.x,point.y,point.z);
    }
    smoothShellNormals(g);
    return mesh(parent,g,material,x,y,z);
  };
  const contour = (parent,points,d,material,x=0,y=0,z=0,b=.04) => {
    const shape = new THREE.Shape(points.map(([a,c])=>new THREE.Vector2(a,c)));
    const g=geo(new THREE.ExtrudeGeometry(shape,{depth:d-b*2,bevelEnabled:true,bevelSize:b,bevelThickness:b,bevelSegments:2,curveSegments:3}));
    g.translate(0,0,-d/2+b);return mesh(parent,g,material,x,y,z);
  };
  const barrel = (parent, top,bottom,h,material,x=0,y=0,z=0,rx=0,rz=0,segments=16) => mesh(parent,geo(new THREE.CylinderGeometry(top,bottom,h,segments)),material,x,y,z,rx,0,rz);
  const ring = (parent,r,tube,material,x=0,y=0,z=0,rx=0,ry=0) => mesh(parent,geo(new THREE.TorusGeometry(r,tube,6,20)),material,x,y,z,rx,ry);
  const lens = (parent,r,depth,material,x=0,y=0,z=0) => barrel(parent,r,r,depth,material,x,y,z,Math.PI/2);
  const lathe = (parent,profile,material,x=0,y=0,z=0) => mesh(parent,geo(new THREE.LatheGeometry(profile.map(([r,h])=>new THREE.Vector2(r,h)),20)),material,x,y,z);
  const bolt = (parent,material,x,y,z,r=.035) => lens(parent,r,.022,material,x,y,z);

  // Collapse static pieces on each rigid joint by material. Fingers, panel seams,
  // vents and bolts remain actual geometry without a draw call per detail.
  function consolidate(parent) {
    for(const child of [...parent.children]) if(child.isGroup||child.isBone) {
      consolidate(child);
      if(child.userData.staticAssembly){
        child.updateMatrix();
        for(const part of [...child.children]){part.applyMatrix4(child.matrix);parent.add(part);}
        parent.remove(child);
      }
    }
    const byMaterial = new Map();
    for(const child of [...parent.children]) if(child.isMesh) {
      child.updateMatrix();
      const list=byMaterial.get(child.material)??[];list.push(child);byMaterial.set(child.material,list);
    }
    for(const [material,meshes] of byMaterial) {
      if(meshes.length < 2) continue;
      const positions=[],normals=[],uvs=[];
      for(const m of meshes){
        const g=(m.geometry.index?m.geometry.toNonIndexed():m.geometry.clone());g.applyMatrix4(m.matrix);
        positions.push(...g.attributes.position.array);normals.push(...g.attributes.normal.array);
        if(g.attributes.uv)uvs.push(...g.attributes.uv.array);else for(let j=0;j<g.attributes.position.count*2;j++)uvs.push(0);
        g.dispose();parent.remove(m);
      }
      const merged=geo(new THREE.BufferGeometry());
      merged.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
      merged.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
      merged.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
      const m=mesh(parent,merged,material);m.name=`${parent.name}-details`;
    }
  }
  function finish(animate) {
    consolidate(group);
    group.updateMatrixWorld(true);
    const bones=[],sources=[],batches=new Map();
    group.traverse(object=>{if(object.isBone)bones.push(object);if(object.isMesh)sources.push(object);});
    const boneIndex=new Map(bones.map((bone,index)=>[bone,index]));
    const skeleton=new THREE.Skeleton(bones);
    for(const source of sources){
      const geometry=(source.geometry.index?source.geometry.toNonIndexed():source.geometry.clone());
      geometry.applyMatrix4(source.matrixWorld);
      let batch=batches.get(source.material);
      if(!batch){batch={positions:[],normals:[],uvs:[],indices:[],weights:[]};batches.set(source.material,batch);}
      const joint=boneIndex.get(source.parent);
      if(joint===undefined)throw new Error('Character part must be attached to an articulated bone');
      batch.positions.push(...geometry.attributes.position.array);
      batch.normals.push(...geometry.attributes.normal.array);
      if(geometry.attributes.uv)batch.uvs.push(...geometry.attributes.uv.array);
      else for(let i=0;i<geometry.attributes.position.count*2;i++)batch.uvs.push(0);
      for(let i=0;i<geometry.attributes.position.count;i++){
        batch.indices.push(joint,0,0,0);batch.weights.push(255,0,0,0);
      }
      geometry.dispose();source.removeFromParent();
    }
    for(const [material,batch] of batches){
      const geometry=geo(new THREE.BufferGeometry());
      geometry.setAttribute('position',new THREE.Float32BufferAttribute(batch.positions,3));
      geometry.setAttribute('normal',new THREE.Float32BufferAttribute(batch.normals,3));
      geometry.setAttribute('uv',new THREE.Float32BufferAttribute(batch.uvs,2));
      // Fourteen bounded rigid bones fit byte indices. Normalized byte weights
      // keep the additional skin attributes at eight bytes per vertex.
      geometry.setAttribute('skinIndex',new THREE.Uint8BufferAttribute(batch.indices,4));
      geometry.setAttribute('skinWeight',new THREE.Uint8BufferAttribute(batch.weights,4,true));
      const mesh=new THREE.SkinnedMesh(geometry,material);
      mesh.name=`${name}-material-batch`;mesh.castShadow=true;mesh.receiveShadow=true;
      // Rigid bone weights preserve the hard-surface panel shapes exactly.
      // The host may pose/scale the root freely; attached binding cancels it.
      mesh.frustumCulled=false;group.add(mesh);mesh.bind(skeleton);
    }
    const live=new Set();group.traverse(o=>{if(o.isMesh)live.add(o.geometry);});
    for(const g of geometrySet) if(!live.has(g)){g.dispose();geometrySet.delete(g);}
    return {group,animate(state,dt,time,options={}){if(!disposed)animate(state??{},clamp(Number(dt)||0,0,.1),Number(time)||0,options);},dispose(){
      if(disposed)return;disposed=true;
      skeleton.dispose();
      for(const g of geometrySet)g.dispose();for(const m of materialSet)m.dispose();
      geometrySet.clear();materialSet.clear();group.clear();
    }};
  }
  return {group,mat,node,plate,shell,contour,barrel,ring,lens,lathe,bolt,finish};
}

function robotHand(w,parent,palette,x,y,z,scale=1,claw=false) {
  const hand=w.node(parent,'hand',x,y,z);hand.scale.setScalar(scale);hand.userData.staticAssembly=true;
  w.plate(hand,.24,.23,.18,palette.armor,0,-.08,0,.05);
  for(let finger=0;finger<3;finger++){
    const f=w.node(hand,`finger-${finger}`,(finger-1)*.072,-.19,.035);f.userData.staticAssembly=true;
    w.plate(f,.058,.105,.075,palette.dark,0,-.035,.015,.016);
    w.plate(f,.06,.08,.07,palette.armor,0,-.105,claw?.045:.025,.015);
  }
  const thumb=w.plate(hand,.075,.15,.095,palette.armor,-.153,-.1,.035,.02);thumb.rotation.z=-.45;
  return hand;
}

function makeLimb(w,parent,palette,side,{heavy=false,leg=false}={}) {
  const width=heavy?.39:.25;
  const upper=w.node(parent,leg?`${side}-hip`:`${side}-shoulder`,side*(leg?.29:.66),leg?1.0:1.79,0);
  w.barrel(upper,width*.48,width*.48,width+.08,palette.dark,0,0,0,0,Math.PI/2);
  if(heavy)w.ring(upper,width*.38,.035,palette.metal,side*(width*.6),0,0,0,Math.PI/2);
  w.plate(upper,width,leg?.37:.34,width*.95,palette.armor,0,-.18,0,.06);
  w.plate(upper,width*.7,.12,.045,palette.color,0,-.14,width*.5,.025);
  const lower=w.node(upper,leg?`${side}-knee`:`${side}-elbow`,0,leg?-.4:-.38,0);
  w.barrel(lower,width*.43,width*.43,width+.04,palette.dark,0,0,0,0,Math.PI/2);
  if(leg){
    w.plate(lower,width+.06,.35,width+.06,palette.color,0,-.17,.015,.055);
    w.plate(lower,width*.7,.21,.065,palette.armor,0,-.15,width*.58,.035);
    const foot=w.node(lower,`${side}-ankle`,0,-.39,.055);
    const bootWidth=width+(heavy?.17:.23);
    w.plate(foot,bootWidth,.19,heavy?.58:.64,palette.dark,0,-.11,.07,.055);
    if(heavy)w.plate(foot,bootWidth-.02,.16,.54,palette.armor,0,-.055,.1,.06);
    else w.shell(foot,bootWidth-.02,.18,.6,palette.armor,0,-.065,.1,.073,0,.02);
    w.plate(foot,bootWidth-.09,.04,.18,palette.color,0,.025,heavy?.22:.25,.015);
    if(heavy)for(const zz of [.1,.2])w.plate(foot,bootWidth-.06,.022,.027,palette.dark,0,-.035,zz,.008);
    return {upper,lower,foot};
  }
  w.plate(lower,width+.05,.29,width+.045,palette.color,0,-.17,.015,.06);
  w.plate(lower,width*.75,.19,.055,palette.armor,0,-.16,width*.6,.025);
  robotHand(w,lower,palette,0,-.39,.015,heavy?1.25:1.23);
  return {upper,lower};
}

function solveLedgeReach(shoulder, tip) {
  const upperLength = .38, lowerLength = Math.hypot(.802, .108);
  const dx = tip.x - shoulder.x, dy = tip.y - shoulder.y, dz = tip.z - shoulder.z;
  const distance = Math.hypot(dx, dy, dz);
  if (!Number.isFinite(distance) || distance < Math.abs(lowerLength - upperLength) + .01 ||
    distance > upperLength + lowerLength - .01 || tip.y < shoulder.y - .08) return null;
  const direction = { x: dx / distance, y: dy / distance, z: dz / distance };
  const along = (upperLength ** 2 + distance ** 2 - lowerLength ** 2) / (2 * distance);
  const perpendicular = Math.sqrt(Math.max(0, upperLength ** 2 - along ** 2));
  // Fold the elbow away from the tower, retaining a readable contact silhouette.
  let bx = -direction.x * direction.z, by = -direction.y * direction.z,
    bz = 1 - direction.z * direction.z;
  let length = Math.hypot(bx, by, bz);
  if (length < .0001) {
    bx = 1 - direction.x * direction.x;
    by = -direction.x * direction.y;
    bz = -direction.x * direction.z;
    length = Math.hypot(bx, by, bz);
  }
  if (length < .0001) return null;
  const elbow = {
    x: shoulder.x + direction.x * along + bx / length * perpendicular,
    y: shoulder.y + direction.y * along + by / length * perpendicular,
    z: shoulder.z + direction.z * along + bz / length * perpendicular,
  };
  return { elbow, tip: { x: tip.x, y: tip.y, z: tip.z } };
}

export function createClimber() {
  const w=workshop('expedition-climber');
  const p={color:w.mat(0x1858be,.26,.25),armor:w.mat(0xf2efe2,.08,.25),dark:w.mat(0x111e2b,.08,.76),metal:w.mat(0x697b8d,.66,.42)};
  const copper=w.mat(0xbb7143,.72,.29),packDark=w.mat(0x513e32,.18,.67);
  const face=w.mat(0x06121c,.22,.18),eye=w.mat(0xa1fff0,.2,.25,0x7be9eb,1.6),shine=w.mat(0x234359,.4,.24);
  const body=w.node(w.group,'articulated-body');
  w.lathe(body,[[.26,.99],[.36,1.08],[.44,1.48],[.43,1.7],[.32,1.86]],p.dark).scale.z=.52;
  w.shell(body,1.02,.78,.5,p.armor,0,1.49,.035,.15,.035,.22);
  smoothShellNormals(w.contour(body,[[-.23,-.25],[.23,-.25],[.33,.19],[0,.29],[-.33,.19]],.09,p.color,0,1.49,.305,.025).geometry);
  w.plate(body,.2,.21,.04,p.metal,0,1.59,.38,.025);
  w.plate(body,.11,.12,.025,eye,0,1.61,.41,.018);
  // Straps follow the torso edges, leaving the chest badge unobstructed.
  for(const side of [-1,1]){
    const strap=w.plate(body,.08,.57,.06,packDark,side*.32,1.52,.29,.02);strap.rotation.z=side*-.12;
    w.plate(body,.11,.09,.07,copper,side*.34,1.38,.335,.018);
  }
  w.plate(body,.64,.21,.41,p.color,0,1.035,0,.055);
  w.plate(body,.2,.13,.05,p.metal,0,1.025,.24,.025);
  // Copper survey pack, roll-top cylinder, cooling fins and a coiled sensor lead.
  const pack=w.node(body,'survey-pack',0,1.51,-.39);pack.userData.staticAssembly=true;
  w.contour(pack,[[-.37,-.35],[.37,-.35],[.39,.23],[.28,.36],[-.28,.36],[-.39,.23]],.39,copper,0,0,0,.045);
  w.plate(pack,.55,.45,.06,packDark,0,-.035,-.225,.045);
  for(let i=0;i<4;i++)w.plate(pack,.4,.025,.045,p.metal,0,-.16+i*.085,-.27,.008);
  w.barrel(pack,.115,.115,.66,p.armor,0,.32,-.04,0,Math.PI/2);
  for(const side of [-1,1]){
    w.barrel(pack,.13,.13,.055,p.color,side*.26,.32,-.04,0,Math.PI/2);
    w.plate(pack,.07,.6,.05,p.dark,side*.26,-.025,-.24,.018);
  }
  const legs=[makeLimb(w,body,p,-1,{leg:true}),makeLimb(w,body,p,1,{leg:true})];
  const arms=[makeLimb(w,body,p,-1),makeLimb(w,body,p,1)];
  for(let i=0;i<2;i++){
    const arm=arms[i];
    w.contour(arm.upper,[[-.16,-.05],[.16,-.05],[.19,.09],[.09,.18],[-.11,.18]],.33,p.color,0,.02,0,.035);

  }
  w.barrel(body,.2,.22,.19,p.dark,0,1.93,0);

  const head=w.node(body,'expressive-helmet',0,2.31,.025);
  w.shell(head,1.28,.8,.74,p.armor,0,.03,0,.18,.025,.09);
  w.plate(head,.12,.68,.07,p.color,0,.01,-.36,.025);
  // The visor follows the ceramic crown instead of reading as a flat panel
  // stuck to its front. Large continuous surfaces carry the material finish.
  w.shell(head,1.045,.45,.14,p.color,0,-.018,.345,.062,.012,.02);
  w.shell(head,.96,.37,.12,face,0,-.012,.417,.052,.014,.01);
  const eyes=[w.node(head,'left-eye',-.225,0,.51),w.node(head,'right-eye',.225,0,.51)];
  for(const e of eyes){w.plate(e,.18,.235,.025,eye,0,0,0,.045);w.plate(e,.033,.05,.01,p.armor,-.025,.055,.018,.01);}
  w.plate(head,.41,.022,.018,shine,0,.139,.501,.008);
  w.plate(head,.25,.045,.035,p.metal,0,-.274,.34,.016);
  for(const side of [-1,1]){
    w.barrel(head,.19,.19,.11,p.color,side*.61,.015,0,0,Math.PI/2);
    w.barrel(head,.13,.13,.13,p.metal,side*.64,.015,0,0,Math.PI/2);
    w.plate(head,.12,.045,.025,p.dark,side*.43,-.21,.388,.014);
  }
  // Asymmetric radio fin is a recognizable expedition silhouette.
  w.barrel(head,.018,.025,.19,p.metal,.43,.355,-.06,0,-.15,8);
  w.plate(head,.07,.07,.065,eye,.446,.455,-.06,.02);
  // A dedicated knuckle insert makes the real attack readable without a flash.
  const fistLight=w.mat(0x3abdd9,.3,.32,0x2898cb,.12);
  w.plate(arms[1].lower,.24,.075,.04,fistLight,0,-.445,.125,.018);
  let phase=0,attackAge=1,wasAttacking=false,landingAge=1,previousState='standing',reachSide=null,lastPoseTime=null,ledgeLegBlend=0;
  // Remember only the last *solved* finger grip, not the AI's intended route.
  // Reusable bone-local quaternions avoid allocations in the render hot path.
  let heldGripRun=null,heldGripPlatform=null,heldGripTick=-1;
  // Remember one physically validated sole load for the very next upward
  // source tick. A cosmetic compression must never become a second landing,
  // survive an interrupted run or affect authoritative actor placement.
  let deckLoadRun=null,deckLoadPlatform=null,deckLoadTick=-1,deckLoadCompression=0;
  const gripArmPose=arms.map(()=>({upper:new THREE.Quaternion(),lower:new THREE.Quaternion()}));
  const rest=body.position.y;
  const ledgeWorld=new THREE.Vector3(), ledgeElbow=new THREE.Vector3(),
    ledgeAim=new THREE.Vector3(), ledgeInverse=new THREE.Quaternion();
  const armRest=new THREE.Vector3(0,-1,0), fingertipRest=new THREE.Vector3(0,-.802,.108).normalize();
  // The actual plate-bottom of the modeled boot (plate center -.11, height .19).
  // Reuse these probes on the narrow contact frame; no new meshes or effects.
  const deckSoleWorld=new THREE.Vector3(), deckWorldScale=new THREE.Vector3();
  return w.finish((state,dt,time,{reducedMotion=false,viewAzimuth}={})=>{
    const vx=Number(state.vx??state.velocity?.x)||0,vy=Number(state.vy??state.velocity?.y)||0;
    const speed=clamp(Math.abs(vx)/4300,0,1),dead=state.state==='dead'||state.health===0;
    const airborne=state.state==='airborne',dash=state.state==='dashing',hurt=state.state==='hurt';
    // Intent, not visual randomness, drives this bounded defensive silhouette.
    const bracing=state.intentMode==='bracing-telegraph';
    const defending=bracing||['evading-projectile','evading-hazard','evading-telegraph'].includes(state.intentMode);
    const attacking=Boolean(state.attacking)&&!dead&&!hurt;
    // World-facing traversal, never follow-camera framing, owns boot stance.
    // Camera azimuth may expose the reaching hand but cannot swap the physical
    // push-off leg during a real upper-rim crossing.
    const physicalPushIndex=((state.facing??Math.sign(vx))||1)>0?1:0;
    // The workshop caps its animation step at 100ms to prevent giant gait and
    // camera-induced limb jumps. That cap must NOT keep an obsolete 260ms punch
    // alive over multiple seconds of slow rendering after authority has stopped
    // attacking. Preserve the first real observed strike pose, then catch up
    // its recovery from the presentation clock when the attack flag is gone.
    const poseGap=lastPoseTime===null||time<lastPoseTime?0:time-lastPoseTime;
    lastPoseTime=time;
    if(attacking&&!wasAttacking)attackAge=0;
    wasAttacking=attacking;
    if(dead||hurt)attackAge=1;
    else attackAge=Math.min(1,attackAge+(!attacking&&poseGap>.26?poseGap:dt));
    if(state.state==='standing'&&(previousState==='airborne'||previousState==='dashing'))landingAge=0;
    else {
      // Keep the first true landing-compression frame, but retire its 200ms
      // follow-through when the next GPU submission arrives much later. The
      // model's 100ms gait cap must not stretch contact into multiple seconds.
      // At ordinary cadence retain precisely the original contact envelope.
      const contactDelta=state.state==='standing'&&poseGap>.2?poseGap:dt;
      landingAge=Math.min(1,landingAge+contactDelta);
    }
    previousState=state.state;
    phase+=dt*(5+speed*8)*speed;
    const gait=Math.sin(phase),counter=Math.sin(phase+Math.PI);
    body.position.y=rest;body.rotation.set(0,0,0);head.rotation.set(0,0,0);
    for(let i=0;i<2;i++){
      const step=i?counter:gait,leg=legs[i],arm=arms[i];
      leg.upper.rotation.set(step*.66*speed,0,0);leg.lower.rotation.set(Math.max(0,-step)*.85*speed,0,0);leg.foot.rotation.x=-Math.max(0,step)*.2*speed;
      arm.upper.rotation.set(-step*.6*speed,0,(i?1:-1)*.09);arm.lower.rotation.set(-.18-Math.max(0,step)*.24*speed,0,0);
    }
    if(!airborne&&!dash&&!hurt&&!dead){
      body.position.y+=reducedMotion?0:Math.abs(gait)*.045*speed;
      body.rotation.x=speed*.07;
      head.rotation.x=-speed*.05;
      if(speed<.05&&!reducedMotion){head.rotation.y=Math.sin(time*.75)*.075;arms[0].lower.rotation.x-=.035*Math.sin(time*1.5);}
      // Low-health detours are gameplay decisions, not a permanent animation
      // cycle. A restrained leading reach and forward balance make the real
      // in-world rescue pickup legible even with the optional HUD hidden.
      if(state.intentMode==='collecting-resource'&&!hurt&&!dead&&speed>.08){
        body.rotation.x+=.08;
        arms[0].upper.rotation.x=mix(arms[0].upper.rotation.x,-.85,.48);
        arms[0].lower.rotation.x=mix(arms[0].lower.rotation.x,-.75,.45);
      }
      // Shield the visor and tuck the knees while the real AI reacts to danger.
      if(defending&&!attacking){
        // A real early charge grounds both boots and raises the forearms.
        // When the actual shot is near, the separate evasive jump takes over.
        body.position.y-=bracing?.12:.065;
        body.rotation.x=bracing?-.16:-.13;
        head.rotation.x=bracing?.24:.18;
        for(let i=0;i<2;i++){
          legs[i].upper.rotation.x=bracing?-.48:-.33;
          legs[i].lower.rotation.x=bracing?.72:.6;
          arms[i].upper.rotation.set(bracing?-1.38:-1.18,0,(i?1:-1)*.44);
          arms[i].lower.rotation.x=-.82;
        }
      }
    }
    if(airborne){
      const rising=vy>0;
      const travelSide=((state.facing??Math.sign(vx))||1)>0?1:-1;
      const hasView=Number.isFinite(viewAzimuth),rearView=hasView?clamp(-Math.cos(viewAzimuth),0,1):0;
      if(hasView){
        // A forward reach needs the outside arm in a front-oblique view, but
        // the near arm when the camera looks past the pack. The dead zone
        // keeps a small camera drift from swapping arms at exact profile.
        const projectedSide=Math.sin(viewAzimuth)*Math.cos(viewAzimuth);
        if(Math.abs(projectedSide)>.08)reachSide=projectedSide<0?1:-1;
        else reachSide??=Math.sign(Math.sin(viewAzimuth))||travelSide;
      }else reachSide=travelSide;
      const leadSide=reachSide,leadIndex=leadSide>0?1:0;
      const reach=arms[leadIndex],balance=arms[1-leadIndex];
      const frontLeg=legs[1-physicalPushIndex],backLeg=legs[physicalPushIndex];
      body.rotation.x=rising?-.08:.12;
      // Open the arm further in a rear view so the palm clears the helmet and
      // pack. The actual rise still owns the pose; view only exposes its action.
      reach.upper.rotation.set(rising?-2-.38*rearView:-.95,0,leadSide*(rising?.08+.5*rearView:.48));
      reach.lower.rotation.x=rising?.06-.02*rearView:-.28;
      balance.upper.rotation.set(rising?.48:-.28,0,-leadSide*(rising?.38:.67));
      balance.lower.rotation.x=rising?-.95:-.55;
      frontLeg.upper.rotation.x=rising?-.8:-.68;
      backLeg.upper.rotation.x=rising?.3:.2;
      frontLeg.lower.rotation.x=rising?1.3:.8;
      backLeg.lower.rotation.x=rising?.42:.62;
      frontLeg.foot.rotation.x=rising?-.15:-.2;
      backLeg.foot.rotation.x=rising?.05:-.12;
      head.rotation.x=rising?-.29:.28;
      head.rotation.y=-((state.facing??Math.sign(vx))||1)*.22;
      if(defending&&!attacking&&!dead&&!hurt){
        // A defensive jump must not read as a free-floating ledge reach.
        // Actual physical fingertip contact can still override this pose.
        body.rotation.x=-.18;head.rotation.x=.11;
        for(let i=0;i<2;i++){
          arms[i].upper.rotation.set(-1.25,0,(i?1:-1)*.3);
          arms[i].lower.rotation.x=-.78;
          legs[i].upper.rotation.x=-.83;legs[i].lower.rotation.x=1.12;
        }
      }
    }
    // The platformer's physics remains unchanged. Only a nearby genuine deck
    // can pull the raised fingertip into physical contact during an ascent.
    const touch=state.ledgeTarget;
    let genuineLedgeGrip=false;
    if(airborne&&vy>0&&!attacking&&!dead&&!hurt&&touch &&
      [touch.x,touch.y,touch.z].every(Number.isFinite)){
      ledgeWorld.set(touch.x,touch.y,touch.z);
      body.updateWorldMatrix(true,false);
      body.worldToLocal(ledgeWorld);
      const arm=arms[ledgeWorld.x>=0?1:0];
      const reach=solveLedgeReach(arm.upper.position,ledgeWorld);
      if(reach){
        genuineLedgeGrip=true;
        ledgeElbow.set(reach.elbow.x,reach.elbow.y,reach.elbow.z).sub(arm.upper.position).normalize();
        arm.upper.quaternion.setFromUnitVectors(armRest,ledgeElbow);
        ledgeInverse.copy(arm.upper.quaternion).invert();
        ledgeAim.copy(ledgeWorld).sub(arm.upper.position).applyQuaternion(ledgeInverse)
          .sub(arm.lower.position).normalize();
        arm.lower.quaternion.setFromUnitVectors(fingertipRest,ledgeAim);
      }
    }
    // A real raised-hand grip must not leave a long trailing boot apparently
    // planted on the lower deck. Fold both boots into a compact suspended pose
    // only while the shipped two-link solver actually reaches the deck, not
    // when mere intent points toward one. Bounded smoothing prevents a new
    // one-frame snap at the first or last contact tick. No root/physics change.
    ledgeLegBlend=mix(ledgeLegBlend,genuineLedgeGrip?1:0,clamp(dt*12,0,1));
    if(ledgeLegBlend>.0001&&airborne){
      for(let i=0;i<2;i++){
        const leg=legs[i];
        leg.upper.rotation.x=mix(leg.upper.rotation.x,i?-1.16:-.95,ledgeLegBlend);
        leg.lower.rotation.x=mix(leg.lower.rotation.x,i?1.95:1.75,ledgeLegBlend);
        leg.foot.rotation.x=mix(leg.foot.rotation.x,i?-.48:-.38,ledgeLegBlend);
      }
    }
    // A validated deck crossing is not an endless finger-hang. The precise
    // early contact keeps its true IK pose; the subsequent rising snapshots
    // drive a short torso/arm/boot push-off and fade to the ordinary airborne
    // silhouette as the actual jump clears the real platform. No pose hint
    // moves the character root or creates an authoritative grab.
    const mantle=state.ledgeMantle;
    if(airborne&&vy>0&&!attacking&&!dead&&!hurt&&mantle
      &&Number.isFinite(mantle.progress)&&Number.isFinite(mantle.weight)){
      const progress=clamp(mantle.progress,0,1),weight=clamp(mantle.weight,0,1);
      const push=THREE.MathUtils.smoothstep(progress,.18,.8);
      const leadIndex=reachSide>0?1:0,otherIndex=1-leadIndex;
      if(!genuineLedgeGrip){
        body.rotation.x=mix(body.rotation.x,.2+.34*push,weight);
        arms[leadIndex].upper.rotation.x=mix(arms[leadIndex].upper.rotation.x,-1.85+1.28*push,weight);
        arms[leadIndex].lower.rotation.x=mix(arms[leadIndex].lower.rotation.x,-.3+.16*push,weight);
      }
      // The camera-facing lead arm can be the opposite of the *physical*
      // arm selected by the two-link IK solver. While it is gripping, do not
      // overwrite either forearm: a desktop oblique angle previously displaced
      // the genuine fingertip 0.111 world units off the real upper rim.
      if(!genuineLedgeGrip){
        arms[otherIndex].upper.rotation.x=mix(arms[otherIndex].upper.rotation.x,-1.1+.52*push,weight);
        arms[otherIndex].lower.rotation.x=mix(arms[otherIndex].lower.rotation.x,-.75+.28*push,weight);
      }
      // The same real contact also owns the suspended legs: do not flatten
      // the tucked boots with a competing cosmetic vault pose until the
      // physical fingertip releases the authentic upper rim.
      if(!genuineLedgeGrip)for(let i=0;i<2;i++){
        const leg=legs[i],front=i!==physicalPushIndex;
        leg.upper.rotation.x=mix(leg.upper.rotation.x,front?-.98+.7*push:-1.12+.85*push,weight);
        leg.lower.rotation.x=mix(leg.lower.rotation.x,front?1.55-.5*push:1.72-.92*push,weight);
        leg.foot.rotation.x=mix(leg.foot.rotation.x,front?-.33+.17*push:-.45+.24*push,weight);
      }
    }
    // Transfer weight through one real boot ONLY when the modeled sole has
    // actually reached the intended platform's upper walking surface. The
    // autonomous leap is never stopped, slowed or moved by this cosmetic pose:
    // local body compression and ankle leveling are bounded to a measured
    // <= 22cm sole-height window, the true deck ring and the matching platform.
    let loadedThisFrame=false;
    const surface=state.ledgeSurface;
    if(airborne&&vy>0&&!genuineLedgeGrip&&!attacking&&!dead&&!hurt&&mantle
      &&surface&&typeof state.runToken==='string'&&state.runToken
      &&Number.isSafeInteger(state.tick)&&typeof state.ledgePlatformId==='string'
      &&surface.platformId===state.ledgePlatformId
      &&[surface.y,surface.innerRadius,surface.outerRadius].every(Number.isFinite)
      &&surface.innerRadius<surface.outerRadius){
      const leg=legs[physicalPushIndex];
      leg.foot.updateWorldMatrix(true,false);
      deckSoleWorld.set(0,-.205,.07);
      leg.foot.localToWorld(deckSoleWorld);
      const clearance=deckSoleWorld.y-surface.y;
      const radius=Math.hypot(deckSoleWorld.x,deckSoleWorld.z);
      if(clearance>=-.06&&clearance<=.22&&radius>=surface.innerRadius&&radius<=surface.outerRadius){
        // Weight falls onto the lead sole, not onto a fabricated standing
        // state. Level the boot as the hips absorb the load and the leg pushes
        // away in the following true rising frame.
        const weight=1-THREE.MathUtils.smoothstep(clearance,-.02,.22);
        const beforeLoadY=body.position.y;
        body.rotation.x+=.075*weight;
        body.position.y-=.035*weight;
        const level=-(body.rotation.x+leg.upper.rotation.x+leg.lower.rotation.x);
        // The first genuine load has to flatten the actual *entire* sole.
        // Partial rotation leveled the center-point probe but left a heel or
        // toe hovering >10cm in the real skinned-rig test. Keep the pre-load
        // approach animation intact; a foot is level only while its center
        // is actually within the matched source deck contact window.
        leg.foot.rotation.x=level;
        // Re-measure after posing: mesh-space heel/toe contact, not ankle
        // clearance alone, determines the compression against actual stone.
        leg.foot.updateWorldMatrix(true,false);
        deckSoleWorld.set(0,-.205,.07);
        leg.foot.localToWorld(deckSoleWorld);
        leg.foot.getWorldScale(deckWorldScale);
        // Rotation changes the modeled heel/toe height as well as pitch:
        // permit one bounded contact-window correction (22cm max), rather
        // than leaving the leveled boot suspended above the real platform.
        body.position.y-=clamp((deckSoleWorld.y-surface.y)/Math.max(.01,deckWorldScale.y),-.22,.22);
        // A lead-sole plant must not rotate the *other* boot through the same
        // solid stone. At genuine t300 its trailing toe was 14cm below Y6
        // while the newly leveled lead sole was correctly bearing weight.
        // Correct only a toe genuinely over this deck, without moving its hip,
        // fabricating a second planted foot or altering authoritative motion.
        const trailing=legs[1-physicalPushIndex];
        trailing.foot.updateWorldMatrix(true,false);
        deckSoleWorld.set(0,-.205,.31);
        trailing.foot.localToWorld(deckSoleWorld);
        const trailingRadius=Math.hypot(deckSoleWorld.x,deckSoleWorld.z);
        if(trailingRadius>=surface.innerRadius&&trailingRadius<=surface.outerRadius
          &&deckSoleWorld.y<surface.y-.025){
          trailing.foot.rotation.x=-(body.rotation.x+trailing.upper.rotation.x+trailing.lower.rotation.x);
        }
        const compression=beforeLoadY-body.position.y;
        if(compression>.03){
          loadedThisFrame=true;
          deckLoadRun=state.runToken;
          deckLoadPlatform=state.ledgePlatformId;
          deckLoadTick=state.tick;
          deckLoadCompression=clamp(compression,0,.24);
        }
      }
    }
    // The first source tick of a genuine deck departure should retain an
    // observable push-off even after an overloaded renderer skipped the exact
    // load frame. Derive this small cosmetic recovery from the immutable
    // source-matched mantle and the real deck clearance; held stills and live
    // frames must not disagree merely due to submission cadence.
    let releaseCompression=0;
    if(airborne&&vy>0&&!genuineLedgeGrip&&!attacking&&!dead&&!hurt
      &&mantle&&Number.isFinite(mantle.progress)&&Number.isFinite(mantle.weight)
      &&mantle.progress>=.6&&mantle.progress<=.9&&mantle.weight>0
      &&surface&&typeof state.runToken==='string'&&state.runToken
      &&Number.isSafeInteger(state.tick)
      &&typeof state.ledgePlatformId==='string'
      &&surface.platformId===state.ledgePlatformId
      &&[surface.y,surface.innerRadius,surface.outerRadius].every(Number.isFinite)
      &&surface.innerRadius<surface.outerRadius){
      const risingAboveDeck=w.group.position.y-surface.y;
      const rootRadius=Math.hypot(w.group.position.x,w.group.position.z);
      if(risingAboveDeck>=.4&&risingAboveDeck<=1.3
        &&rootRadius>=surface.innerRadius&&rootRadius<=surface.outerRadius){
        releaseCompression=.055*clamp(1-Math.abs(risingAboveDeck-.85)/.5,0,1);
      }
    }
    // If the actual contact frame WAS rendered, its measured sole load gives
    // a stronger first-tick handoff. It must retire after one authentic source
    // tick and never carry across runs, other decks, death or a later jump.
    if(!loadedThisFrame && deckLoadRun!==null){
      const truePushOff=state.runToken===deckLoadRun
        && state.ledgePlatformId===deckLoadPlatform
        && Number.isSafeInteger(state.tick)
        && state.tick===deckLoadTick+1
        && airborne&&vy>0&&!attacking&&!dead&&!hurt
        && mantle&&Number.isFinite(mantle.progress)&&Number.isFinite(mantle.weight)
        && mantle.weight>0;
      if(truePushOff)releaseCompression=Math.max(releaseCompression,Math.min(.12,deckLoadCompression*.5));
      deckLoadRun=null;
      deckLoadPlatform=null;
      deckLoadTick=-1;
      deckLoadCompression=0;
    }
    if(releaseCompression>0)body.position.y-=releaseCompression;
    // Contact t300, load transfer t301, and toe-off t302 must read as one
    // adjacent skinned-leg action, not a single corrected still followed by an
    // instantly curled airborne knee. The source's real platform and upward
    // world-space clearance own this brief cosmetic extension: it is entirely
    // independent of which frames a slow renderer actually submitted.
    // At >2.18 world units above the physical deck the ordinary airborne pose
    // is fully restored; no fake collision, standing state, root or AI change.
    if(airborne&&vy>0&&!genuineLedgeGrip&&!attacking&&!dead&&!hurt
      &&mantle&&Number.isFinite(mantle.progress)&&Number.isFinite(mantle.weight)
      &&mantle.progress>=.6&&mantle.progress<=1&&mantle.weight>0
      &&surface&&typeof state.runToken==='string'&&state.runToken
      &&Number.isSafeInteger(state.tick)
      &&typeof state.ledgePlatformId==='string'
      &&surface.platformId===state.ledgePlatformId
      &&[surface.y,surface.innerRadius,surface.outerRadius].every(Number.isFinite)
      &&surface.innerRadius<surface.outerRadius){
      const rise=w.group.position.y-surface.y;
      const radius=Math.hypot(w.group.position.x,w.group.position.z);
      if(rise>=.45&&rise<=2.18
        &&radius>=surface.innerRadius&&radius<=surface.outerRadius){
        const toeOff=THREE.MathUtils.smoothstep(rise,.45,.83)
          *(1-THREE.MathUtils.smoothstep(rise,1.27,2.18))
          *THREE.MathUtils.smoothstep(mantle.progress,.6,.73);
        if(toeOff>0){
          const pushing=legs[physicalPushIndex];
          pushing.upper.rotation.x=mix(pushing.upper.rotation.x,-.18,toeOff*.8);
          pushing.lower.rotation.x=mix(pushing.lower.rotation.x,.12,toeOff*.88);
          pushing.foot.rotation.x=mix(pushing.foot.rotation.x,.1,toeOff*.7);
        }
      }
    }
    // The first airborne tick after a real fingertip release previously snapped
    // BOTH arms from a solved grip straight to camera-directed generic mantle.
    // Preserve the last physically solved arm orientations for a short,
    // snapshot-progress-driven handoff: a release is NOT a second fake grip.
    // This is presentation-only and never changes actor position, authority or IK.
    if(genuineLedgeGrip && typeof state.runToken==='string' && state.runToken
      && typeof state.ledgePlatformId==='string' && state.ledgePlatformId
      && Number.isSafeInteger(state.tick)){
      heldGripRun=state.runToken;
      heldGripPlatform=state.ledgePlatformId;
      heldGripTick=state.tick;
      for(let i=0;i<2;i++){
        gripArmPose[i].upper.copy(arms[i].upper.quaternion);
        gripArmPose[i].lower.copy(arms[i].lower.quaternion);
      }
    }else if(heldGripRun!==null){
      const sameLedge=state.runToken===heldGripRun
        && state.ledgePlatformId===heldGripPlatform
        && Number.isSafeInteger(state.tick)
        && state.tick>=heldGripTick && state.tick-heldGripTick<=4;
      const releaseValid=sameLedge&&airborne&&vy>0&&!attacking&&!dead&&!hurt
        && mantle&&Number.isFinite(mantle.progress)&&Number.isFinite(mantle.weight)
        && mantle.weight>0;
      if(releaseValid){
        const hold=1-THREE.MathUtils.smoothstep(clamp(mantle.progress,0,1),.26,.8);
        if(hold>.0001)for(let i=0;i<2;i++){
          arms[i].upper.quaternion.slerp(gripArmPose[i].upper,hold);
          arms[i].lower.quaternion.slerp(gripArmPose[i].lower,hold);
        }
        else heldGripRun=null;
      }else heldGripRun=null;
    }
    if(state.state==='standing'&&landingAge<.2){
      const plant=1-THREE.MathUtils.smoothstep(landingAge,0,.2);
      body.position.y-=.06*plant;
      body.rotation.x+=.1*plant;
      head.rotation.x+=.14*plant;
      for(const leg of legs){
        leg.upper.rotation.x=mix(leg.upper.rotation.x,-.42,plant);
        leg.lower.rotation.x=mix(leg.lower.rotation.x,.82,plant);
        leg.foot.rotation.x=mix(leg.foot.rotation.x,-.4,plant);
      }
      for(let i=0;i<2;i++)arms[i].upper.rotation.z+=(i?1:-1)*.22*plant;
    }
    // Optional target deltas are host-provided snapshot facts; the pose never
    // infers a landing or changes a simulation position.
    if(Number.isFinite(state.targetDy)&&!hurt&&!dead){
      head.rotation.x=clamp(-Math.atan2(state.targetDy,Math.max(10000,Math.abs(state.targetDx??0))),-.34,.34);
    }
    if(dash){body.rotation.x=.65;head.rotation.x=-.4;for(let i=0;i<2;i++){
      arms[i].upper.rotation.x=1.15;arms[i].lower.rotation.x=-.6;legs[i].upper.rotation.x=i?.5:-.75;legs[i].lower.rotation.x=i?.95:.25;
    }}
    // The authoritative strike is immediate. A 25ms coil, 45ms thrust and
    // 190ms recovery layer over locomotion, preserving the actual air/leg pose.
    let attackWeight=0;
    if(attackAge<.26){
      const coil=1-clamp(attackAge/.025,0,1);
      const extension=clamp((attackAge-.025)/.045,0,1);
      const recovery=1-THREE.MathUtils.smoothstep(attackAge,.11,.26);
      attackWeight=(1-coil)*recovery;
      const arm=arms[1],guard=arms[0];
      arm.upper.rotation.x=mix(arm.upper.rotation.x,mix(.45,-1.62,extension),Math.max(coil,attackWeight));
      arm.lower.rotation.x=mix(arm.lower.rotation.x,mix(-1.05,-.06,extension),Math.max(coil,attackWeight));
      arm.upper.rotation.z=mix(arm.upper.rotation.z,-.12,attackWeight);
      guard.upper.rotation.x=mix(guard.upper.rotation.x,-.45,attackWeight);
      guard.lower.rotation.x=mix(guard.lower.rotation.x,-1.05,attackWeight);
      body.rotation.y+=.2*attackWeight-.08*coil;
      body.rotation.x+=.08*attackWeight;
      head.rotation.y-=.12*attackWeight;
    }
    fistLight.emissiveIntensity=dead?.02:.12+attackWeight*1.4;
    if(hurt){body.rotation.z=-.22;body.rotation.x=-.19;head.rotation.z=.13;for(const arm of arms){arm.upper.rotation.x=-.75;arm.lower.rotation.x=-.6;}}
    if(dead){body.rotation.z=-.85;body.position.y=.04;head.rotation.z=.25;for(let i=0;i<2;i++){arms[i].upper.rotation.z=(i?1:-1)*.48;arms[i].lower.rotation.x=-.35;legs[i].upper.rotation.x=i?.15:-.3;legs[i].lower.rotation.x=.45;}}
    // Gaze uses the same snapshot destination as the head. It stays inside the
    // visor and resets when no target is supplied; no invented scanning target.
    const gazeX=!dead&&!hurt&&Number.isFinite(state.targetDx)?clamp(state.targetDx/140000,-.042,.042):0;
    const gazeY=!dead&&!hurt&&Number.isFinite(state.targetDy)?clamp(state.targetDy/200000,-.02,.02):0;
    // Slow blink is cosmetic. Strike focus, air alertness and damage remain
    // readable with reduced motion, without a new flash or material batch.
    const blink=!reducedMotion&&!dead&&time%5.7>5.53;
    for(let i=0;i<eyes.length;i++){
      const e=eyes[i],alert=airborne?(vy>0?1.08:1.2):1;
      e.position.x=(i?1:-1)*.225+gazeX;e.position.y=gazeY;
      e.scale.x=dead?1:hurt?1.12:dash?.94:1;
      e.scale.y=dead?.22:hurt?.48:attackWeight>.05?mix(alert,.58,attackWeight):dash?.64:blink?.12:alert;
      e.rotation.z=dead?-.23:hurt?.15:(i?1:-1)*(attackWeight>.05?.13*attackWeight:airborne?.055:0);
    }
    eye.emissiveIntensity=dead?.18:hurt?.65:1.6;
  });
}

export function createEnemy(kind='sentinel') {
  const guardian=kind==='guardian',shooter=kind==='shooter';
  const w=workshop(`${kind}-automaton`);
  // Iron, oxide paint and worn cutting edges distinguish the hostile machinery
  // from the explorer's bright ceramic. Role readability also survives grayscale.
  const p={color:w.mat(shooter?0x465263:guardian?0x673d32:0x813c30,.4,.43),armor:w.mat(guardian?0x756754:shooter?0x515d66:0x454c50,.68,.37),dark:w.mat(0x141c23,.3,.68),metal:w.mat(0x929c9d,.78,.28)};
  const trim=w.mat(0xb56b3c,.62,.38),glow=w.mat(0xff682c,.12,.35,0xff3d0e,1.05),black=w.mat(0x090e13,.36,.24);
  const rig=w.node(w.group,'articulated-enemy');
  // Guardian is authored at double native height, retaining substantial limb mass.
  if(guardian)rig.scale.setScalar(2);
  w.lathe(rig,[[.31,.97],[.42,1.14],[.53,1.43],[.55,1.72],[.39,1.94]],p.dark).scale.z=.5;
  w.contour(rig,[[-.34,-.32],[.34,-.32],[.59,.19],[.43,.4],[-.43,.4],[-.59,.19]],.64,p.armor,0,1.5,0,.045);
  w.contour(rig,[[-.24,-.24],[.24,-.24],[.41,.2],[0,.33],[-.41,.2]],.09,p.color,0,1.49,.385,.02);
  // A furnace grille reads as machinery, rather than a second friendly eye.
  w.contour(rig,[[-.2,-.14],[.2,-.14],[.25,.12],[-.25,.12]],.075,black,0,1.55,.45,.016);
  for(let i=0;i<3;i++)w.plate(rig,.055,.16,.025,glow,(i-1)*.115,1.55,.501,.009);
  w.plate(rig,.47,.045,.045,p.metal,0,1.705,.47,.011);
  w.plate(rig,.7,.2,.49,p.color,0,1.035,0,.05);
  for(const side of [-1,1]){
    w.plate(rig,.12,.29,.12,p.metal,side*.34,1.26,.37,.025);
    w.bolt(rig,trim,side*.36,1.75,.37,.035);
  }
  const legs=[makeLimb(w,rig,p,-1,{leg:true,heavy:true}),makeLimb(w,rig,p,1,{leg:true,heavy:true})];
  const arms=[makeLimb(w,rig,p,-1,{heavy:true}),makeLimb(w,rig,p,1,{heavy:true})];
  for(let i=0;i<2;i++){
    const side=i?1:-1;
    w.contour(arms[i].upper,[[-.25,-.1],[.25,-.1],[.33,.16],[.16,.29],[-.22,.29]],.5,p.color,0,.045,0,.035);
    w.plate(arms[i].upper,.39,.07,.08,p.metal,0,.18,.27,.017);
    w.bolt(arms[i].upper,p.metal,side*.13,.035,.28,.05);
  }
  const head=w.node(rig,'armored-head',0,2.27,.035);
  if(guardian)head.scale.x=1.12;
  w.barrel(rig,.24,.27,.18,p.dark,0,1.97,0);
  w.contour(head,[[-.31,-.31],[.31,-.31],[.45,-.13],[.44,.18],[.27,.35],[-.27,.35],[-.44,.18],[-.45,-.13]],.61,p.armor,0,0,0,.035);
  w.plate(head,.79,.245,.12,black,0,.01,.33,.03);
  const eyeNodes=[w.node(head,'left-warning-eye',-.2,.015,.415),w.node(head,'right-warning-eye',.2,.015,.415)];
  for(let i=0;i<eyeNodes.length;i++){
    const eye=eyeNodes[i];eye.rotation.z=(i?1:-1)*.22;
    w.contour(eye,[[-.12,.04],[.12,.025],[.095,-.035],[-.1,-.04]],.028,glow,0,0,0,.009);
  }
  w.contour(head,[[-.45,.17],[-.11,.065],[0,.09],[.11,.065],[.45,.17],[.4,.29],[0,.18],[-.4,.29]],.12,p.color,0,0,.385,.015);
  w.contour(head,[[-.29,-.2],[0,-.34],[.29,-.2],[.34,-.1],[-.34,-.1]],.12,p.color,0,0,.355,.02);
  w.plate(head,.065,.24,.05,p.metal,0,-.045,.43,.012);
  for(let i=0;i<3;i++)w.plate(head,.035,.085,.025,black,(i-1)*.11,-.19,.433,.007);
  // One low armored ridge avoids the old paired ear-like fins. The guarded
  // head, broad shoulders and asymmetric equipment carry the hostile silhouette.
  if(!guardian&&!shooter){
    const ridge=w.contour(head,[[-.2,-.08],[.23,-.08],[.17,.22],[-.08,.34],[-.23,.18]],.12,p.color,0,.15,-.1,.015);
    ridge.rotation.y=Math.PI/2;
  }
  for(const side of [-1,1]){
    w.barrel(rig,.105,.105,.53,p.dark,side*.39,1.6,-.4);
    w.barrel(rig,.13,.13,.09,p.metal,side*.39,1.89,-.4);
    w.ring(rig,.105,.025,trim,side*.39,1.84,-.4,Math.PI/2);
  }
  let weapon,shield;
  if(shooter){
    // Shoulder range finder and a separate receiver/barrel assembly.
    w.contour(head,[[-.13,-.16],[.13,-.16],[.18,.22],[-.05,.32],[-.17,.18]],.31,p.color,.4,.18,-.015,.025);
    w.lens(head,.095,.12,black,.43,.29,.22);w.lens(head,.06,.025,glow,.43,.29,.29);
    weapon=w.node(arms[1].lower,'pulse-cannon',0,-.15,.2);weapon.rotation.x=Math.PI/2;weapon.userData.staticAssembly=true;
    w.plate(weapon,.4,.32,.67,p.color,0,0,.12,.045);
    w.barrel(weapon,.145,.185,.62,p.metal,0,0,.52,Math.PI/2);
    w.barrel(weapon,.205,.205,.16,p.dark,0,0,.86,Math.PI/2);
    w.lens(weapon,.135,.025,black,0,0,.955);w.lens(weapon,.075,.03,glow,0,0,.972);
    for(const side of [-1,1])for(let i=0;i<3;i++)w.plate(weapon,.04,.13,.07,trim,side*.21,0,i*.13,.01);
    w.plate(rig,.42,.53,.31,p.color,0,1.51,-.47,.055);
    for(let i=0;i<3;i++)w.plate(rig,.26,.045,.05,trim,0,1.36+i*.13,-.64,.012);
  }else{
    // A broad dark shield with a cutting rim, and a heavy flanged maul. The
    // oxide chevron replaces a pale cross so the guard cannot read as a medic.
    shield=w.node(arms[0].lower,'rampart-shield',-.13,-.12,.2);shield.userData.staticAssembly=true;
    w.contour(shield,[[-.32,-.52],[0,-.67],[.32,-.52],[.39,.43],[.22,.57],[-.22,.57],[-.39,.43]],.18,p.metal,0,0,0,.03);
    w.contour(shield,[[-.25,-.46],[0,-.56],[.25,-.46],[.31,.35],[.17,.46],[-.17,.46],[-.31,.35]],.09,p.color,0,0,.13,.025);
    w.contour(shield,[[-.25,.27],[0,.11],[.25,.27],[.25,.13],[0,-.055],[-.25,.13]],.055,trim,0,0,.21,.01);
    w.contour(shield,[[-.11,.02],[0,-.39],[.11,.02],[0,-.055]],.055,black,0,0,.21,.01);
    for(const side of [-1,1])for(const yy of [-.32,.34])w.bolt(shield,p.armor,side*.22,yy,.21,.035);
    // The guards hold the shaft across the palm, with the striking head
    // clearly above the gripping hand. The old head sat inside the knuckles
    // and read as a box fist. Reuse the same rigid pieces and material batches.
    weapon=w.node(arms[1].lower,'impact-hammer',0,-.56,.045);weapon.userData.staticAssembly=true;
    weapon.rotation.x=Math.PI/2;
    if(guardian)weapon.rotation.z=-.18;
    const hammerHeadY=.76,hammerAxisZ=0;
    w.barrel(weapon,.055,.055,1.08,p.metal,0,.24,hammerAxisZ);
    w.barrel(weapon,.09,.09,.22,p.dark,0,-.015,hammerAxisZ);
    w.contour(weapon,[[-.37,-.19],[.37,-.19],[.44,-.08],[.44,.1],[.32,.21],[-.32,.21],[-.44,.1],[-.44,-.08]],.4,p.color,0,hammerHeadY,hammerAxisZ,.035);
    for(const side of [-1,1])w.plate(weapon,.12,.43,.46,p.metal,side*.35,hammerHeadY,hammerAxisZ,.025);
    w.plate(weapon,.26,.09,.045,glow,0,hammerHeadY,hammerAxisZ+.23,.018);
  }
  // The same guardian HP that turns the tower's bronze capstan also opens
  // these two actual shoulder-shell hinges. The glow beneath is original
  // skinned geometry, not a screen-space health bar or invented hit effect.
  // Exactly two extra rigid bones share the existing seven material batches.
  const guardianArmorSeals=[];
  if(guardian){
    for(const side of [-1,1]){
      const arm=arms[side<0?0:1].upper;
      const seal=w.node(arm,`guardian-armor-seal-${side}`,side*.07,.11,-.02);
      // Keep the cap-side silhouette low. Damage opens the outer shoulder
      // sideways to reveal its hidden hot ceramic underframe, rather than
      // spawning unbounded fragments or changing the guardian's hitbox.
      w.plate(arm,.30,.19,.06,glow,side*.07,.10,.16,.025);
      w.contour(seal,[[-.44,-.14],[.44,-.14],[.56,.2],[.18,.34],[-.48,.26]],.7,p.armor,0,0,0,.04);
      w.plate(seal,.35,.045,.08,trim,0,.2,.37,.013);
      seal.rotation.z=side*-.1;
      guardianArmorSeals.push({side,seal});
      for(let i=0;i<3;i++)w.plate(rig,.19,.37,.1,p.color,side*(.17+i*.18),1.05-i*.015,.32,.025).rotation.z=side*-.17;
    }
    w.contour(head,[[-.3,-.04],[.3,-.04],[.26,.32],[0,.48],[-.26,.32]],.21,p.color,0,.02,-.1,.02);
    weapon.scale.set(1.25,1.12,1.15);shield.scale.set(1.2,1.15,1.1);
  }
  const materialRest=[p.color,p.armor,p.dark,p.metal,trim,glow,black].map(material=>({material,color:material.color.clone()}));
  let phase=0,telegraphBlend=0,shotAge=1,wasFiring=false,deathAge=0,wasDead=false;
  let previousHealth=null,hurtAge=1,wasHurt=false;
  return w.finish((state,dt,time,{reducedMotion=false})=>{
    const vx=Number(state.vx??state.velocity?.x)||0,speed=clamp(Math.abs(vx)/3000,0,1);
    const dead=state.health===0||state.state==='dead'||state.active===false;
    const telegraph=Boolean(state.telegraph)&&!dead;
    const firing=Boolean(state.firing)&&!dead;
    const health=Number(state.health),hurt=state.state==='hurt'&&!dead;
    // HP is an authoritative field from the immutable game snapshot. The
    // staged reveal is persistent across presentation frames and therefore
    // legible even when a short hit flash would be missed by software GL.
    // Death takes priority; a restore with full HP closes both shells.
    const guardianExposure=guardian
      ? dead ? 1 : Number.isFinite(health)&&Number.isFinite(state.maxHealth)&&state.maxHealth>0
        ? THREE.MathUtils.smoothstep(1-clamp(health/state.maxHealth,0,1),.09,.82) : 0
      : 0;
    const tookDamage=!dead&&Number.isFinite(health)&&previousHealth!==null&&health<previousHealth;
    if(tookDamage||(hurt&&!wasHurt))hurtAge=0;
    else hurtAge=Math.min(1,hurtAge+dt);
    if(dead)hurtAge=1;
    if(Number.isFinite(health))previousHealth=health;
    wasHurt=hurt;
    const hurtWeight=hurt?1:1-THREE.MathUtils.smoothstep(hurtAge,.025,.24);
    if(firing&&!wasFiring)shotAge=0;
    wasFiring=firing;
    shotAge=dead?1:Math.min(1,shotAge+dt);
    if(dead){deathAge=wasDead?Math.min(.5,deathAge+dt):dt;}else deathAge=0;
    wasDead=dead;
    const collapse=THREE.MathUtils.smoothstep(deathAge,0,.4);
    for(const {material,color} of materialRest)material.color.copy(color).multiplyScalar(1-collapse*.45);
    if(guardian){
      // Real attrition changes the shape of the adversary, not simply the
      // numbers above its head. Hinge motion has a capped visual easing only;
      // reduced motion jumps to the truthful HP-correlated static silhouette.
      const hingeBlend=reducedMotion?1:1-Math.exp(-dt*10);
      for(const {side,seal} of guardianArmorSeals){
        seal.rotation.z=mix(seal.rotation.z,side*(-.1-.66*guardianExposure),hingeBlend);
        seal.rotation.x=mix(seal.rotation.x,-.37*guardianExposure,hingeBlend);
        seal.position.x=mix(seal.position.x,side*(.07+.16*guardianExposure),hingeBlend);
        seal.position.y=mix(seal.position.y,.11+.1*guardianExposure,hingeBlend);
      }
      // Underplate and forge-eyes share this very restrained emissive channel.
      // No additional dynamic lights, transparency or per-frame allocations.
      if(!dead)p.armor.color.lerp(glow.color,.14*guardianExposure);
    }
    telegraphBlend=mix(telegraphBlend,telegraph?1:0,Math.min(1,dt*12));
    phase+=dt*7*speed;
    rig.position.y=0;rig.rotation.set(0,0,0);head.rotation.set(shooter?.065:guardian?.14:.11,0,0);
    if (guardian) {
      // At a cap, tuck the actual skinned crest below the visible underside
      // instead of cutting the tower or shrinking the guardian everywhere.
      // 5.6 is this original rig's native height; its armored core stays tall.
      const bodyHeight = Number.isFinite(state.halfHeight) ? state.halfHeight * 2 / 10000 : 3.6;
      const available = Number.isFinite(state.canopyClearance) ? state.canopyClearance : Infinity;
      const tuck = clamp((bodyHeight - available + .14) / (2 * bodyHeight / 5.6), 0, .43);
      const blend = reducedMotion ? 1 : Math.min(1, dt * 15);
      head.position.y = mix(head.position.y, 2.27 - tuck, blend);
    }
    for(let i=0;i<2;i++){
      const leg=legs[i],arm=arms[i],step=Math.sin(phase+i*Math.PI);
      const brace=(i?1:-1)*.045;
      leg.upper.rotation.set(step*.4*speed,0,brace);leg.lower.rotation.x=Math.max(0,-step)*.55*speed;leg.foot.rotation.set(0,0,-brace);
      arm.upper.rotation.set(-step*.27*speed,0,(i?1:-1)*.14);arm.lower.rotation.x=-.22;
    }
    if(!reducedMotion&&!dead)rig.position.y=Math.abs(Math.sin(phase))*.025*speed;
    if(shooter){
      // The barrel has a purposeful +Z aim in the resting guard. Its receiver
      // stays on the articulated forearm; no detached cosmetic gun animation.
      arms[1].upper.rotation.x=-.72-telegraphBlend*.24;
      arms[1].lower.rotation.x=-.85+telegraphBlend*.12;
      arms[0].upper.rotation.x=-.32-telegraphBlend*.22;
      arms[0].lower.rotation.x=-1.0;head.rotation.x-=telegraphBlend*.08;
      rig.rotation.x=-telegraphBlend*.07;
    }else{
      // Guarding is a steady stance, never a free-running attack. Shield and
      // maul project forward even at rest; only true telegraph lifts the weapon.
      arms[0].upper.rotation.x=-.62-telegraphBlend*.26;
      arms[0].lower.rotation.x=.3-telegraphBlend*.1;
      arms[1].upper.rotation.x=-.44-telegraphBlend*1.81;
      arms[1].lower.rotation.x=-.8+telegraphBlend*.45;
      rig.rotation.x=-telegraphBlend*.13;head.rotation.x+=telegraphBlend*.08;
    }
    // The guardian commits its weight through BOTH boots while the authoritative
    // eight-tick charge runs down. This is a progressive physical windup, not a
    // free-running animation on a loop or a cosmetic prediction of a hit.
    // Reduced-motion visitors still see a clear braced/raised-weapon silhouette
    // without an additional oscillation or camera shake.
    if(guardian&&telegraph){
      const remaining=Number.isFinite(state.telegraphTicksRemaining)
        ? clamp(state.telegraphTicksRemaining,1,8):8;
      const commitment=1-(remaining-1)/7;
      const weight=telegraphBlend*(.35+.65*commitment);
      rig.position.y-=.10*weight;
      rig.rotation.x-=.12*weight;
      head.rotation.x+=.07*weight;
      for(let i=0;i<2;i++){
        legs[i].upper.rotation.x-=.33*weight;
        legs[i].lower.rotation.x+=.44*weight;
        legs[i].foot.rotation.x-=.11*weight;
      }
      // Separate the shielding arm from the maul shoulder. Both remain
      // attached to the same original articulated rig and draw batches.
      arms[0].upper.rotation.z-=.22*weight;
      arms[0].lower.rotation.x-=.28*weight;
      arms[1].upper.rotation.x-=.34*weight;
      arms[1].lower.rotation.x+=.24*weight;
    }
    // This impulse follows a real shot/attack edge, rather than free-running
    // combat choreography. The sustained telegraph remains a separate channel.
    const recoil=shotAge<.36?Math.exp(-shotAge*12):0;
    if(recoil>.005){
      if(shooter){
        arms[1].upper.rotation.x-=recoil*.44;
        arms[1].lower.rotation.x-=recoil*.2;
        rig.rotation.x-=recoil*.17;head.rotation.x+=recoil*.12;
      }else{
        const strike=recoil;
        arms[1].upper.rotation.x=mix(arms[1].upper.rotation.x,-.65,strike);
        arms[1].lower.rotation.x=mix(arms[1].lower.rotation.x,.12,strike);
        rig.rotation.x+=strike*.28;head.rotation.x-=strike*.12;
      }
    }
    // A health decrease is an authoritative event even though enemy snapshots
    // omit a hurt state. One bounded recoil recovers without replaying on every
    // poll of the same low health; a restore/revival starts from the new health.
    if(hurtWeight>0){
      rig.rotation.x=mix(rig.rotation.x,-.12,hurtWeight);rig.rotation.z=-.16*hurtWeight;
      head.rotation.x=mix(head.rotation.x,-.16,hurtWeight);head.rotation.z=.21*hurtWeight;
      for(const arm of arms){
        arm.upper.rotation.x=mix(arm.upper.rotation.x,-.55,hurtWeight);
        arm.lower.rotation.x=mix(arm.lower.rotation.x,-.45,hurtWeight);
      }
    }
    glow.emissiveIntensity=dead?mix(1.05,.035,collapse):Math.max(telegraph?2.2:1.05,1.05+recoil*.65+(guardian?.55*guardianExposure:0));
    for(const e of eyeNodes)e.scale.y=dead?mix(1,.15,collapse):hurtWeight>0?mix(1,.38,hurtWeight):telegraph?1.3:1;
    if(dead){
      // Fold and tip into a visibly inert silhouette before the host retires it.
      // Height compensation is internal to the rig and keeps the host immutable.
      rig.rotation.z=-1.22*collapse;rig.rotation.x=.18*collapse;
      rig.position.y=.38*collapse*(guardian?2:1);head.rotation.z=.35*collapse;
      for(let i=0;i<2;i++){
        arms[i].upper.rotation.set(.65*collapse,0,(i?1:-1)*.3*collapse);
        arms[i].lower.rotation.x=-.16*collapse;
        legs[i].upper.rotation.x=(i?-.3:.18)*collapse;
        legs[i].lower.rotation.x=1.1*collapse;
      }
    }
  });
}
