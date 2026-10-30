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

export function createClimber() {
  const w=workshop('expedition-climber');
  const p={color:w.mat(0x1858be,.26,.25),armor:w.mat(0xf2efe2,.12,.27),dark:w.mat(0x111e2b,.08,.76),metal:w.mat(0x697b8d,.66,.42)};
  const copper=w.mat(0xbb7143,.72,.29),packDark=w.mat(0x513e32,.18,.67);
  const face=w.mat(0x06121c,.4,.16),eye=w.mat(0xa1fff0,.2,.25,0x7be9eb,1.6),shine=w.mat(0x234359,.4,.24);
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
  w.plate(head,1.02,.43,.13,p.color,0,-.018,.345,.1);
  w.plate(head,.94,.355,.11,face,0,-.012,.423,.09);
  const eyes=[w.node(head,'left-eye',-.225,0,.49),w.node(head,'right-eye',.225,0,.49)];
  for(const e of eyes){w.plate(e,.18,.235,.025,eye,0,0,0,.045);w.plate(e,.033,.05,.01,p.armor,-.025,.055,.018,.01);}
  w.plate(head,.41,.027,.018,shine,0,.13,.489,.01);
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
  let phase=0,attackAge=1,wasAttacking=false,landingAge=1,previousState='standing';
  const rest=body.position.y;
  return w.finish((state,dt,time,{reducedMotion=false})=>{
    const vx=Number(state.vx??state.velocity?.x)||0,vy=Number(state.vy??state.velocity?.y)||0;
    const speed=clamp(Math.abs(vx)/4300,0,1),dead=state.state==='dead'||state.health===0;
    const airborne=state.state==='airborne',dash=state.state==='dashing',hurt=state.state==='hurt';
    const attacking=Boolean(state.attacking)&&!dead&&!hurt;
    if(attacking&&!wasAttacking)attackAge=0;
    wasAttacking=attacking;
    if(dead||hurt)attackAge=1;
    else attackAge=Math.min(1,attackAge+dt);
    if(state.state==='standing'&&(previousState==='airborne'||previousState==='dashing'))landingAge=0;
    else landingAge=Math.min(1,landingAge+dt);
    previousState=state.state;
    phase+=dt*(5+speed*8)*speed;
    const gait=Math.sin(phase),counter=Math.sin(phase+Math.PI);
    body.position.y=rest;body.rotation.set(0,0,0);head.rotation.set(0,0,0);
    for(let i=0;i<2;i++){
      const step=i?counter:gait,leg=legs[i],arm=arms[i];
      leg.upper.rotation.set(step*.66*speed,0,0);leg.lower.rotation.set(Math.max(0,-step)*.85*speed,0,0);leg.foot.rotation.x=-Math.max(0,step)*.2*speed;
      arm.upper.rotation.set(-step*.6*speed,0,(i?1:-1)*.09);arm.lower.rotation.x=-.18-Math.max(0,step)*.24*speed;
    }
    if(!airborne&&!dash&&!hurt&&!dead){
      body.position.y+=reducedMotion?0:Math.abs(gait)*.045*speed;
      body.rotation.x=speed*.07;
      head.rotation.x=-speed*.05;
      if(speed<.05&&!reducedMotion){head.rotation.y=Math.sin(time*.75)*.075;arms[0].lower.rotation.x-=.035*Math.sin(time*1.5);}
    }
    if(airborne){
      const rising=vy>0;
      body.rotation.x=rising?-.08:.12;
      // One hand reaches while the opposite arm balances the pack. Distinct
      // leading/trailing limbs remain legible when the hero is phone-sized.
      arms[1].upper.rotation.set(rising?-2.3:-.95,0,rising?.18:.48);
      arms[1].lower.rotation.x=rising?.04:-.28;
      arms[0].upper.rotation.set(rising?.48:-.28,0,rising?-.38:-.67);
      arms[0].lower.rotation.x=rising?-.95:-.55;
      legs[0].upper.rotation.x=rising?-.8:-.68;
      legs[1].upper.rotation.x=rising?.3:.2;
      legs[0].lower.rotation.x=rising?1.3:.8;
      legs[1].lower.rotation.x=rising?.42:.62;
      legs[0].foot.rotation.x=rising?-.15:-.2;
      legs[1].foot.rotation.x=rising?.05:-.12;
      head.rotation.x=rising?-.29:.28;
      head.rotation.y=-((state.facing??Math.sign(vx))||1)*.22;
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
    // Slow blink is cosmetic; damage is conveyed by pose, never strobing.
    const blink=!reducedMotion&&!dead&&time%5.7>5.53;
    for(const e of eyes){e.scale.y=dead?.22:blink?.12:hurt?.48:airborne?(vy>0?1.08:.83):1;e.rotation.z=dead?-.23:hurt?.15:airborne?(e===eyes[0]?-.06:.06):0;}
    eye.emissiveIntensity=dead?.18:hurt?.65:1.6;
  });
}

export function createEnemy(kind='sentinel') {
  const guardian=kind==='guardian',shooter=kind==='shooter';
  const w=workshop(`${kind}-automaton`);
  const p={color:w.mat(shooter?0x65506e:guardian?0x6e5743:0x52606d,.6,.4),armor:w.mat(guardian?0xb4a589:shooter?0xa4adb5:0xc7bda5,.55,.42),dark:w.mat(0x202a32,.65,.36),metal:w.mat(0x77828b,.8,.3)};
  const trim=w.mat(0xcf7139,.65,.33),glow=w.mat(0xff953c,.1,.4,0xff5b18,.85),black=w.mat(0x101920,.4,.27);
  const rig=w.node(w.group,'articulated-enemy');
  // Guardian is authored at double native height, retaining substantial limb mass.
  if(guardian)rig.scale.setScalar(2);
  w.lathe(rig,[[.31,.97],[.42,1.14],[.53,1.43],[.55,1.72],[.39,1.94]],p.dark).scale.z=.5;
  w.contour(rig,[[-.36,-.32],[.36,-.32],[.55,.15],[.4,.38],[-.4,.38],[-.55,.15]],.64,p.armor,0,1.5,0,.045);
  w.contour(rig,[[-.24,-.2],[.24,-.2],[.37,.19],[0,.3],[-.37,.19]],.09,p.color,0,1.49,.385,.02);
  // Recessed furnace eye on chest has a machined rim and segmented grille.
  w.lens(rig,.17,.09,p.dark,0,1.55,.45);w.ring(rig,.14,.025,trim,0,1.55,.505);
  w.lens(rig,.115,.025,glow,0,1.55,.51);
  for(let i=0;i<3;i++)w.plate(rig,.21,.022,.025,p.dark,0,1.48+i*.065,.533,.005);
  w.plate(rig,.7,.2,.49,p.color,0,1.035,0,.05);
  for(const side of [-1,1]){
    w.plate(rig,.12,.29,.12,p.metal,side*.34,1.26,.37,.025);
    w.bolt(rig,trim,side*.36,1.75,.37,.035);
  }
  const legs=[makeLimb(w,rig,p,-1,{leg:true,heavy:true}),makeLimb(w,rig,p,1,{leg:true,heavy:true})];
  const arms=[makeLimb(w,rig,p,-1,{heavy:true}),makeLimb(w,rig,p,1,{heavy:true})];
  for(let i=0;i<2;i++){
    const side=i?1:-1;
    w.contour(arms[i].upper,[[-.24,-.08],[.24,-.08],[.28,.13],[.17,.27],[-.18,.27]],.5,p.color,0,.045,0,.045);
    w.plate(arms[i].upper,.35,.1,.08,trim,0,.14,.27,.02);
    w.bolt(arms[i].upper,p.metal,side*.13,.035,.28,.05);
  }
  const head=w.node(rig,'armored-head',0,2.29,0);
  w.barrel(rig,.24,.27,.18,p.dark,0,1.97,0);
  w.contour(head,[[-.36,-.29],[.36,-.29],[.46,-.05],[.4,.24],[.19,.36],[-.19,.36],[-.4,.24],[-.46,-.05]],.6,p.color,0,0,0,.045);
  w.plate(head,.78,.2,.12,black,0,.02,.33,.035);
  const eyeNodes=[w.node(head,'left-warning-eye',-.18,.02,.405),w.node(head,'right-warning-eye',.18,.02,.405)];
  for(const eye of eyeNodes)w.plate(eye,.18,.08,.035,glow,0,0,0,.02);
  w.contour(head,[[-.34,.12],[0,.04],[.34,.12],[.31,.2],[0,.14],[-.31,.2]],.12,p.armor,0,.01,.38,.015);
  w.contour(head,[[-.28,-.24],[.28,-.24],[.35,-.08],[-.35,-.08]],.12,p.armor,0,0,.35,.025);
  for(let i=0;i<4;i++)w.plate(head,.035,.105,.025,black,(i-1.5)*.1,-.17,.425,.008);
  // Crown fins and external machinery make a readable non-spherical silhouette.
  for(const side of [-1,1]){
    const fin=w.contour(head,[[-.08,-.1],[.08,-.1],[.11,.25],[-.03,.19]],.14,trim,side*.31,.19,-.03,.015);fin.rotation.z=side*-.24;
    w.barrel(rig,.105,.105,.53,p.dark,side*.39,1.6,-.4);
    w.barrel(rig,.13,.13,.09,p.metal,side*.39,1.89,-.4);
    w.ring(rig,.105,.025,trim,side*.39,1.84,-.4,Math.PI/2);
  }
  let weapon,shield;
  if(shooter){
    // Shoulder range finder and a separate receiver/barrel assembly.
    w.plate(head,.25,.29,.28,p.metal,.43,.03,.04,.04);
    w.lens(head,.09,.12,black,.43,.04,.22);w.lens(head,.055,.025,glow,.43,.04,.29);
    weapon=w.node(arms[1].lower,'pulse-cannon',0,-.15,.2);weapon.rotation.x=Math.PI/2;weapon.userData.staticAssembly=true;
    w.plate(weapon,.4,.32,.63,p.color,0,0,.12,.055);
    w.barrel(weapon,.16,.19,.52,p.metal,0,0,.48,Math.PI/2);
    w.barrel(weapon,.2,.2,.12,p.dark,0,0,.76,Math.PI/2);
    w.lens(weapon,.13,.025,black,0,0,.83);w.lens(weapon,.075,.03,glow,0,0,.847);
    for(const side of [-1,1])for(let i=0;i<3;i++)w.plate(weapon,.04,.13,.07,trim,side*.21,0,i*.13,.01);
    w.plate(rig,.42,.53,.31,p.color,0,1.51,-.47,.055);
    for(let i=0;i<3;i++)w.plate(rig,.26,.045,.05,trim,0,1.36+i*.13,-.64,.012);
  }else{
    // Shield is a layered architectural object, hammer head a flanged casting.
    shield=w.node(arms[0].lower,'rampart-shield',-.13,-.12,.2);shield.userData.staticAssembly=true;
    w.contour(shield,[[-.32,-.52],[0,-.67],[.32,-.52],[.39,.43],[.22,.57],[-.22,.57],[-.39,.43]],.18,p.metal,0,0,0,.03);
    w.contour(shield,[[-.25,-.46],[0,-.56],[.25,-.46],[.31,.35],[.17,.46],[-.17,.46],[-.31,.35]],.09,p.color,0,0,.13,.025);
    w.plate(shield,.08,.76,.06,trim,0,.02,.21,.018);
    w.plate(shield,.46,.08,.06,p.armor,0,.12,.205,.018);
    for(const side of [-1,1])for(const yy of [-.32,.34])w.bolt(shield,p.armor,side*.22,yy,.21,.035);
    weapon=w.node(arms[1].lower,'impact-hammer',0,-.36,.09);weapon.userData.staticAssembly=true;
    w.barrel(weapon,.055,.055,.67,p.metal,0,0,.12);
    w.barrel(weapon,.09,.09,.18,p.dark,0,.05,.12);
    w.contour(weapon,[[-.37,-.19],[.37,-.19],[.44,-.08],[.44,.1],[.32,.21],[-.32,.21],[-.44,.1],[-.44,-.08]],.4,p.color,0,-.37,.12,.035);
    for(const side of [-1,1])w.plate(weapon,.12,.4,.46,p.metal,side*.35,-.37,.12,.03);
    w.plate(weapon,.23,.2,.045,glow,0,-.37,.35,.025);
  }
  if(guardian){
    for(const side of [-1,1]){
      const pauldron=w.contour(arms[side<0?0:1].upper,[[-.28,-.13],[.28,-.13],[.36,.2],[.15,.4],[-.25,.3]],.64,p.armor,side*.06,.11,-.02,.045);
      pauldron.rotation.z=side*-.1;
      for(let i=0;i<3;i++)w.plate(rig,.19,.37,.1,p.color,side*(.17+i*.18),1.05-i*.015,.32,.025).rotation.z=side*-.17;
    }
    w.contour(head,[[-.13,-.02],[.13,-.02],[.09,.35],[0,.45],[-.09,.35]],.19,p.armor,0,.02,-.1,.02);
    weapon.scale.set(1.25,1.12,1.15);shield.scale.set(1.2,1.15,1.1);
  }
  const materialRest=[p.color,p.armor,p.dark,p.metal,trim,glow,black].map(material=>({material,color:material.color.clone()}));
  let phase=0,telegraphBlend=0,shotAge=1,wasFiring=false,deathAge=0,wasDead=false;
  return w.finish((state,dt,time,{reducedMotion=false})=>{
    const vx=Number(state.vx??state.velocity?.x)||0,speed=clamp(Math.abs(vx)/3000,0,1);
    const dead=state.health===0||state.state==='dead'||state.active===false;
    const telegraph=Boolean(state.telegraph)&&!dead;
    const firing=Boolean(state.firing)&&!dead;
    if(firing&&!wasFiring)shotAge=0;
    wasFiring=firing;
    shotAge=dead?1:Math.min(1,shotAge+dt);
    if(dead){deathAge=wasDead?Math.min(.5,deathAge+dt):dt;}else deathAge=0;
    wasDead=dead;
    const collapse=THREE.MathUtils.smoothstep(deathAge,0,.4);
    for(const {material,color} of materialRest)material.color.copy(color).multiplyScalar(1-collapse*.45);
    telegraphBlend=mix(telegraphBlend,telegraph?1:0,Math.min(1,dt*12));
    phase+=dt*7*speed;
    rig.position.y=0;rig.rotation.set(0,0,0);head.rotation.set(0,0,0);
    for(let i=0;i<2;i++){
      const leg=legs[i],arm=arms[i],step=Math.sin(phase+i*Math.PI);
      leg.upper.rotation.set(step*.4*speed,0,0);leg.lower.rotation.x=Math.max(0,-step)*.55*speed;leg.foot.rotation.x=0;
      arm.upper.rotation.set(-step*.27*speed,0,(i?1:-1)*.14);arm.lower.rotation.x=-.22;
    }
    if(!reducedMotion&&!dead)rig.position.y=Math.abs(Math.sin(phase))*.025*speed;
    if(shooter){
      arms[1].upper.rotation.x=-.55-telegraphBlend*.24;
      arms[1].lower.rotation.x=-.95-telegraphBlend*.16;
      arms[0].upper.rotation.x=-telegraphBlend*.4;head.rotation.x=-telegraphBlend*.08;
      rig.rotation.x=-telegraphBlend*.07;
    }else{
      arms[0].upper.rotation.x=-.28-telegraphBlend*.4;
      arms[0].lower.rotation.x=-.38;
      arms[1].upper.rotation.x=-telegraphBlend*2.25;
      arms[1].lower.rotation.x=-.3-telegraphBlend*.35;
      rig.rotation.x=-telegraphBlend*.13;head.rotation.x=telegraphBlend*.08;
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
    glow.emissiveIntensity=dead?mix(.85,.035,collapse):Math.max(telegraph?2.2:.85,.85+recoil*.65);
    for(const e of eyeNodes)e.scale.y=dead?mix(1,.15,collapse):telegraph?1.5:1;
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
