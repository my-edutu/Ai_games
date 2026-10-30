'use strict';
(function () {
  const THREE = window.THREE;
  if (!THREE) return;
  const clamp = (value, min, max) => Math.max(min, Math.min(max, value));
  const lerp = (from, to, amount) => from + (to - from) * amount;
  const angleLerp = (from, to, amount) => from + Math.atan2(Math.sin(to - from), Math.cos(to - from)) * amount;

  /** A presentation-only clockwork companion. No state or puzzle outcome is owned here. */
  function create() {
    const geometries = new Map(), materials = new Set(), textures = new Set(), instances = new Set();
    const group = new THREE.Group();
    group.name = 'ARCHIVIST / A-07';
    group.position.set(0, 1.85, 1.8);
    group.userData.target = new THREE.Vector3(0, 1.85, 1.8);
    group.userData.character = 'archivist';
    const chassis = new THREE.Group();
    group.add(chassis);
    let disposed = false, reducedMotion = false, characterState = 'scanning';
    let lastRun = null, lastSequence = -1, reactionUntil = 0, reaction = null;
    let lastFocus = null, focusAge = 0, heading = 0, hasPresented = false;
    const target = group.position.clone(), focus = new THREE.Vector3(), headingVector = new THREE.Vector3();

    function geometry(key, factory) {
      if (!geometries.has(key)) geometries.set(key, factory());
      return geometries.get(key);
    }
    function grain(kind) {
      const size = 128, pixels = new Uint8Array(size * size * 4);
      for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
        const i=(y*size+x)*4;
        const noise = Math.sin(x*12.9898+y*78.233)*43758.5453;
        const n = noise-Math.floor(noise);
        const scratch = kind==='metal' ? Math.sin(y*.7)*6+Math.sin(y*2.3)*4 : Math.sin(x*.35)*Math.sin(y*.38)*5;
        const value = clamp(Math.round(237+n*15+scratch), 0, 255);
        pixels[i]=pixels[i+1]=pixels[i+2]=value; pixels[i+3]=255;
      }
      const texture = new THREE.DataTexture(pixels,size,size);
      texture.colorSpace=THREE.SRGBColorSpace;
      texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
      texture.magFilter=THREE.LinearFilter; texture.minFilter=THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps=true; texture.needsUpdate=true; textures.add(texture);
      return texture;
    }
    function nameplateTexture() {
      const glyphs={A:['01110','10001','10001','11111','10001','10001','10001'],R:['11110','10001','10001','11110','10100','10010','10001'],C:['01111','10000','10000','10000','10000','10000','01111'],H:['10001','10001','10001','11111','10001','10001','10001'],I:['11111','00100','00100','00100','00100','00100','11111'],V:['10001','10001','10001','10001','10001','01010','00100'],S:['01111','10000','10000','01110','00001','00001','11110'],T:['11111','00100','00100','00100','00100','00100','00100'],'0':['01110','10001','10011','10101','11001','10001','01110'],'7':['11111','00001','00010','00100','01000','01000','01000'],'-':['00000','00000','00000','11111','00000','00000','00000']};
      const width=256,height=128,pixels=new Uint8Array(width*height*4);
      for(let y=0;y<height;y++) for(let x=0;x<width;x++) {const i=(y*width+x)*4,edge=x<6||x>249||y<6||y>121;pixels[i]=edge?91:191;pixels[i+1]=edge?66:153;pixels[i+2]=edge?39:91;pixels[i+3]=255;}
      function line(text,y,scale) {
        const start=Math.floor((width-text.length*6*scale+scale)/2);
        for(let index=0;index<text.length;index++){const glyph=glyphs[text[index]];if(!glyph)continue;for(let row=0;row<7;row++)for(let col=0;col<5;col++)if(glyph[row][col]==='1')for(let dy=0;dy<scale;dy++)for(let dx=0;dx<scale;dx++){const xx=start+index*6*scale+col*scale+dx,yy=height-1-(y+row*scale+dy),i=(yy*width+xx)*4;pixels[i]=25;pixels[i+1]=30;pixels[i+2]=28;}}
      }
      line('ARCHIVIST',24,3);line('A-07',62,5);
      const texture=new THREE.DataTexture(pixels,width,height);texture.colorSpace=THREE.SRGBColorSpace;texture.needsUpdate=true;texture.magFilter=THREE.LinearFilter;textures.add(texture);return texture;
    }
    const brushed=grain('metal'),ceramicGrain=grain('ceramic');
    function material(parameters) {const value=new THREE.MeshStandardMaterial(parameters);materials.add(value);return value;}
    const palette={
      enamel:material({color:0xddd8be,metalness:.16,roughness:.42,map:ceramicGrain}),
      brass:material({color:0xbf914a,metalness:.62,roughness:.37,map:brushed}),
      edge:material({color:0xe8bf72,metalness:.58,roughness:.29,map:brushed}),
      dark:material({color:0x182d31,metalness:.47,roughness:.43}),
      rubber:material({color:0x141a1b,metalness:.03,roughness:.85}),
      leather:material({color:0x613923,metalness:.04,roughness:.8,map:ceramicGrain}),
      paper:material({color:0xd8c9a2,metalness:0,roughness:.89,map:ceramicGrain}),
      eye:material({color:0x8ddbd2,emissive:0x58b9b4,emissiveIntensity:.75,metalness:.18,roughness:.22}),
      pupil:material({color:0x091b22,metalness:.56,roughness:.16}),
      red:material({color:0xe7a46b,emissive:0xc66e38,emissiveIntensity:.35,metalness:.12,roughness:.35}),
      badge:material({map:nameplateTexture(),metalness:.45,roughness:.5}),
    };
    function mesh(parent,geo,mat,pos=[0,0,0],scale=[1,1,1],rotation=[0,0,0]) {
      const value=new THREE.Mesh(geo,mat);value.position.set(...pos);value.scale.set(...scale);value.rotation.set(...rotation);value.castShadow=true;value.receiveShadow=true;parent.add(value);return value;
    }
    function batchRigidDecorations(parent,moving=new Set()) {
      // Only direct children share a batch; animated subtrees keep their own pivots.
      const batches=new Map();
      for(const part of parent.children) {
        if(!part.isMesh||part.isInstancedMesh||moving.has(part))continue;
        const key=`${part.material.id}:${part.castShadow}:${part.receiveShadow}`;
        if(!batches.has(key))batches.set(key,[]);
        batches.get(key).push(part);
      }
      for(const parts of batches.values()) {
        if(parts.length<2)continue;
        const count=parts.reduce((total,part)=>total+part.geometry.attributes.position.count,0);
        const positions=new Float32Array(count*3),normals=new Float32Array(count*3),uvs=new Float32Array(count*2),indices=[];
        const vertex=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
        let offset=0;
        for(const part of parts) {
          part.updateMatrix();
          const source=part.geometry,attributes=source.attributes;
          normalMatrix.getNormalMatrix(part.matrix);
          for(let i=0;i<attributes.position.count;i++) {
            vertex.fromBufferAttribute(attributes.position,i).applyMatrix4(part.matrix).toArray(positions,(offset+i)*3);
            vertex.fromBufferAttribute(attributes.normal,i).applyNormalMatrix(normalMatrix).toArray(normals,(offset+i)*3);
          }
          uvs.set(attributes.uv.array,offset*2);
          const index=source.index,indexCount=index?index.count:attributes.position.count;
          for(let i=0;i<indexCount;i++)indices.push(offset+(index?index.getX(i):i));
          offset+=attributes.position.count;
        }
        const merged=geometry(`rigid-batch-${geometries.size}`,()=>new THREE.BufferGeometry());
        merged.setAttribute('position',new THREE.BufferAttribute(positions,3));
        merged.setAttribute('normal',new THREE.BufferAttribute(normals,3));
        merged.setAttribute('uv',new THREE.BufferAttribute(uvs,2));
        merged.setIndex(indices);merged.computeBoundingBox();merged.computeBoundingSphere();
        // Keep the first child's ordering and shadow policy. Source geometries remain
        // owned by the cache because the articulated parts can still share them.
        const first=parts[0];first.geometry=merged;
        first.position.set(0,0,0);first.quaternion.identity();first.scale.set(1,1,1);first.updateMatrix();
        for(let i=1;i<parts.length;i++)parent.remove(parts[i]);
      }
    }
    const sphere=geometry('sphere',()=>new THREE.SphereGeometry(1,20,12));
    const sphereSmall=geometry('small-sphere',()=>new THREE.SphereGeometry(1,12,8));
    const box=geometry('box',()=>new THREE.BoxGeometry(1,1,1));
    const cylinder=geometry('cylinder',()=>new THREE.CylinderGeometry(1,1,1,20));
    const torus=(radius,tube)=>geometry(`torus-${radius}-${tube}`,()=>new THREE.TorusGeometry(radius,tube,6,32));
    const link=(parent,a,b,radius,mat)=>{
      const start=new THREE.Vector3(...a),end=new THREE.Vector3(...b),difference=end.clone().sub(start);
      const value=mesh(parent,cylinder,mat,start.clone().add(end).multiplyScalar(.5).toArray(),[radius,difference.length(),radius]);
      value.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),difference.normalize());return value;
    };

    // Ceramic pressure vessel with brass collars and a recessed instrument breastplate.
    const vesselProfile=[[.09,-.42],[.22,-.38],[.31,-.24],[.34,.02],[.33,.18],[.27,.28],[.13,.32]].map(([x,y])=>new THREE.Vector2(x,y));
    mesh(chassis,geometry('body-vessel',()=>new THREE.LatheGeometry(vesselProfile,32)),palette.enamel);
    mesh(chassis,torus(.3,.025),palette.brass,[0,-.19,0],[1,1,1],[Math.PI/2,0,0]);
    mesh(chassis,torus(.31,.025),palette.brass,[0,.15,0],[1,1,1],[Math.PI/2,0,0]);
    mesh(chassis,cylinder,palette.dark,[0,.34,0],[.115,.12,.115]);
    mesh(chassis,torus(.115,.018),palette.edge,[0,.39,0],[1,1,1],[Math.PI/2,0,0]);
    mesh(chassis,sphere,palette.dark,[0,-.01,.29],[.215,.22,.075]);
    mesh(chassis,geometry('badge-plane',()=>new THREE.PlaneGeometry(.29,.145)),palette.badge,[0,.045,.365]);
    for(let row=0;row<3;row++)mesh(chassis,box,palette.brass,[0,-.075-row*.037,.362],[.15,.012,.012]);
    mesh(chassis,sphereSmall,palette.red,[-.13,.16,.3],[.019,.019,.018]);

    // Rivet heads use one instanced draw, rather than one draw per fastener.
    const rivets=new THREE.InstancedMesh(sphereSmall,palette.edge,18);
    instances.add(rivets);
    const dummy=new THREE.Object3D();
    for(let i=0;i<18;i++){const angle=i*Math.PI*2/9;dummy.position.set(Math.sin(angle)*.315,i<9?.15:-.19,Math.cos(angle)*.315);dummy.scale.setScalar(.013);dummy.updateMatrix();rivets.setMatrixAt(i,dummy.matrix);}
    rivets.castShadow=true;chassis.add(rivets);

    const head=new THREE.Group();head.position.set(0,.52,.015);chassis.add(head);
    mesh(head,sphere,palette.enamel,[0,.02,-.035],[.295,.245,.25]);
    mesh(head,cylinder,palette.dark,[0,0,.185],[.226,.12,.226],[Math.PI/2,0,0]);
    mesh(head,torus(.224,.026),palette.brass,[0,0,.249]);
    mesh(head,torus(.177,.012),palette.edge,[0,0,.266]);
    const eye=mesh(head,sphere,palette.eye,[0,0,.254],[.174,.174,.046]);
    const iris=mesh(head,sphere,palette.pupil,[0,0,.296],[.075,.075,.022]);
    mesh(head,sphereSmall,palette.enamel,[-.05,.061,.308],[.024,.024,.008]);
    const brow=mesh(head,geometry('brow-arc',()=>new THREE.TorusGeometry(.232,.022,6,20,Math.PI*.9)),palette.brass,[0,.009,.264],[1,1,1],[0,0,.16]);
    for(const side of[-1,1]) {
      mesh(head,cylinder,palette.brass,[side*.285,.01,-.03],[.067,.057,.067],[0,0,Math.PI/2]);
      mesh(head,cylinder,palette.dark,[side*.318,.01,-.03],[.039,.015,.039],[0,0,Math.PI/2]);
    }
    link(head,[-.12,.22,-.06],[-.17,.37,-.09],.013,palette.brass);
    const antenna=mesh(head,sphereSmall,palette.red,[-.17,.38,-.09],[.03,.03,.03]);

    // The field satchel and scroll cases give the character a role and a recognizable back view.
    mesh(chassis,box,palette.leather,[0,-.035,-.335],[.48,.43,.19]);
    mesh(chassis,box,palette.brass,[0,.13,-.444],[.11,.06,.018]);
    for(const side of[-1,1]) {
      mesh(chassis,box,palette.dark,[side*.19,.02,-.45],[.025,.41,.025]);
      mesh(chassis,cylinder,palette.paper,[side*.24,.15,-.35],[.057,.53,.057]);
      mesh(chassis,torus(.058,.01),palette.leather,[side*.24,.15,-.35],[1,1,1],[Math.PI/2,0,0]);
    }

    // Each shoulder, elbow, wrist and finger has its own real pivot.
    const arms=[];
    for(const side of[-1,1]) {
      const shoulder=new THREE.Group();shoulder.position.set(side*.36,.13,0);chassis.add(shoulder);
      mesh(shoulder,sphereSmall,palette.brass,[0,0,0],[.095,.095,.095]);
      mesh(shoulder,cylinder,palette.enamel,[side*.07,-.15,0],[.063,.27,.063],[0,0,side*.4]);
      const elbow=new THREE.Group();elbow.position.set(side*.12,-.28,0);shoulder.add(elbow);
      mesh(elbow,sphereSmall,palette.dark,[0,0,0],[.071,.071,.071]);
      mesh(elbow,cylinder,palette.brass,[0,-.12,0],[.038,.23,.038]);
      mesh(elbow,cylinder,palette.enamel,[0,-.10,.008],[.06,.14,.06]);
      const wrist=new THREE.Group();wrist.position.set(0,-.24,0);elbow.add(wrist);
      mesh(wrist,sphereSmall,palette.brass,[0,0,0],[.067,.061,.045]);
      const fingers=[];
      for(let i=0;i<3;i++) {
        const finger=new THREE.Group();finger.position.set((i-1)*.042,-.036,0);wrist.add(finger);
        const fingerShape=new THREE.Shape();fingerShape.moveTo(-.013,0);fingerShape.lineTo(.013,0);fingerShape.lineTo(.016,-.075);fingerShape.lineTo(.008,-.115);fingerShape.lineTo(-.012,-.115);fingerShape.lineTo(-.007,-.072);fingerShape.closePath();
        mesh(finger,geometry('finger',()=>new THREE.ExtrudeGeometry(fingerShape,{depth:.023,bevelEnabled:true,bevelThickness:.004,bevelSize:.004,bevelSegments:1,steps:1})),palette.brass,[0,0,-.01]);
        fingers.push(finger);
      }
      arms.push({shoulder,elbow,wrist,fingers,side});
    }

    // A gyroscopic lower chassis signals that this companion flies, rather than slides on the floor.
    mesh(chassis,cylinder,palette.dark,[0,-.405,0],[.2,.12,.2]);
    mesh(chassis,torus(.23,.026),palette.brass,[0,-.43,0],[1,1,1],[Math.PI/2,0,0]);
    const flywheel=new THREE.Group();flywheel.position.set(0,-.49,0);chassis.add(flywheel);
    mesh(flywheel,torus(.21,.016),palette.edge,[0,0,0],[1,1,1],[Math.PI/2,0,0]);
    for(let i=0;i<3;i++){const angle=i*Math.PI*2/3;const blade=mesh(flywheel,box,palette.brass,[Math.sin(angle)*.115,0,Math.cos(angle)*.115],[.08,.012,.17],[0,angle+.35,0]);blade.castShadow=false;}
    const thruster=mesh(chassis,geometry('thruster',()=>new THREE.CylinderGeometry(.12,.07,.13,20)),palette.eye,[0,-.56,0]);
    mesh(chassis,torus(.13,.02),palette.dark,[0,-.52,0],[1,1,1],[Math.PI/2,0,0]);

    // Soft underbody light, bounded to the companion; no extra scene lights are required.
    const glowMaterial=new THREE.MeshBasicMaterial({color:0x78c8be,transparent:true,opacity:.12,depthWrite:false,side:THREE.DoubleSide});materials.add(glowMaterial);
    const glow=mesh(chassis,geometry('glow',()=>new THREE.ConeGeometry(.18,.28,20,1,true)),glowMaterial,[0,-.69,0],[1,1,1],[Math.PI,0,0]);glow.castShadow=false;glow.receiveShadow=false;glow.visible=false;

    batchRigidDecorations(chassis,new Set([thruster,glow]));
    batchRigidDecorations(head,new Set([eye,iris,brow,antenna]));
    batchRigidDecorations(flywheel);

    let meshCount=0,triangleCount=0;
    group.traverse(object=>{if(object.isMesh){meshCount++;const count=object.geometry.index?.count??object.geometry.attributes.position.count;triangleCount+=Math.floor(count/3)*(object.isInstancedMesh?object.count:1);}});

    function safeTarget(state,focusVector) {
      if (state?.avatar?.mode==='celebrating') {target.set(0,1.85,-5.1);return;}
      if (state?.scene==='recovery'||state?.avatar?.mode==='recovering') {target.set(0,1.85,1.8);return;}
      if (!focusVector || !Number.isFinite(focusVector.x+focusVector.y+focusVector.z)) {target.set(0,1.85,1.8);return;}
      focus.copy(focusVector);
      // Approach from the room interior; keep the lens clear of the prop and inspection camera.
      let x=focus.x, z=focus.z+.85;
      if(focus.x<-4.8)x+=1.1;
      else if(focus.x>4.8)x-=1.1;
      else x+=focus.x<0?-.62:.62;
      if(focus.z<-5.6)z=focus.z+1.0;
      // The entire lower chassis clears desks and pedestals throughout travel.
      const y=clamp(focus.y+.55,1.85,3.7);
      target.set(clamp(x,-5.05,5.05),y,clamp(z,-5.5,2.5));
    }

    function update(deltaMs,timeMs,state,focusVector) {
      if(disposed)return;
      const dt=clamp(Number(deltaMs)||16,0,100),time=Number(timeMs)||0;
      const newRun=state?.runToken!==lastRun;
      if(newRun){lastRun=state?.runToken;lastSequence=-1;reaction=null;reactionUntil=0;lastFocus=null;focusAge=0;}
      if(state?.focusObjectId!==lastFocus){lastFocus=state?.focusObjectId;focusAge=0;}else focusAge+=dt;
      for(const event of state?.events||[]) {
        if(!Number.isFinite(event.seq)||event.seq<=lastSequence)continue;
        lastSequence=event.seq;
        if(event.type==='puzzle-solved'||event.type==='items-combined'){reaction='solving';reactionUntil=time+1200;}
        else if(event.type==='escape'){reaction='celebrating';reactionUntil=time+2600;}
        else if(event.type==='clue-discovered'){reaction='inspecting';reactionUntil=time+1000;}
      }
      safeTarget(state,focusVector);
      const movement=group.position.distanceTo(target);
      const scene=state?.scene,mode=state?.avatar?.mode;
      if(scene==='recovery'||mode==='recovering') characterState='recovering';
      else if(mode==='celebrating'||(scene==='result'&&state?.progress?.permille===1000))characterState='celebrating';
      else if(scene==='danger')characterState='alert';
      else if(reaction&&time<reactionUntil)characterState=reaction;
      else if(movement>.2&&!reducedMotion)characterState='travelling';
      else if(focusVector&&mode!=='waiting')characterState='inspecting';
      else characterState=mode==='waiting'?'waiting':'scanning';

      const amount=reducedMotion?1:1-Math.exp(-dt*.0018);
      group.position.lerp(target,amount);
      group.userData.target.copy(target);
      headingVector.set(0,0,1);
      if(focusVector&&Number.isFinite(focusVector.x+focusVector.z))headingVector.set(focusVector.x-group.position.x,0,focusVector.z-group.position.z);
      // First presentation and reduced motion select the correct pose immediately.
      const turnAmount=reducedMotion||!hasPresented?1:1-Math.exp(-dt*.005);
      const wantedHeading=Math.atan2(headingVector.x,headingVector.z);
      heading=angleLerp(heading,wantedHeading,turnAmount);group.rotation.y=heading;
      const phase=reducedMotion?0:time*.001,poseAmount=reducedMotion||!hasPresented?1:1-Math.exp(-dt*.006);
      const inspecting=characterState==='inspecting'||characterState==='solving';
      const celebrating=characterState==='celebrating',alert=characterState==='alert',recovering=characterState==='recovering';
      chassis.position.y=reducedMotion?0:Math.sin(phase*2.1)*.025;
      chassis.rotation.z=reducedMotion?0:Math.sin(phase*1.1)*.018;
      chassis.rotation.x=lerp(chassis.rotation.x,characterState==='travelling'?.09:0,poseAmount);
      head.rotation.y=lerp(head.rotation.y,inspecting?Math.sin(phase*1.2)*.08:(reducedMotion?0:Math.sin(phase*.62)*.2),poseAmount);
      head.rotation.x=lerp(head.rotation.x,recovering?.16:celebrating?-.12:inspecting?.16:0,poseAmount);
      brow.rotation.z=lerp(brow.rotation.z,alert?.36:inspecting?.24:.16,poseAmount);
      const pupilSize=alert?.68:inspecting?.78:celebrating?1.15:1;
      iris.scale.set(.075*pupilSize,.075*pupilSize,.022);
      eye.scale.y=recovering?.09:.174;
      for(const arm of arms) {
        const active=inspecting&&(arm.side===1||characterState==='solving');
        arm.shoulder.rotation.z=lerp(arm.shoulder.rotation.z,celebrating?arm.side*-1.45:alert?arm.side*.24:arm.side*.1,poseAmount);
        arm.shoulder.rotation.x=lerp(arm.shoulder.rotation.x,active?-.8:celebrating?-.25:.12,poseAmount);
        arm.elbow.rotation.x=lerp(arm.elbow.rotation.x,active?-.75:alert?-.52:-.16,poseAmount);
        arm.wrist.rotation.x=lerp(arm.wrist.rotation.x,active?.25:0,poseAmount);
        arm.wrist.rotation.z=active&&!reducedMotion?Math.sin(phase*2.4)*.09:0;
        for(let i=0;i<arm.fingers.length;i++)arm.fingers[i].rotation.x=lerp(arm.fingers[i].rotation.x,active?-.35-(i%2)*.15:celebrating?-.05:-.16,poseAmount);
      }
      flywheel.rotation.y=reducedMotion?0:phase*1.7;
      const coreColor=alert?0xe5a164:celebrating?0xb6dda7:recovering?0x8c9a99:0x8ddbd2;
      palette.eye.color.setHex(coreColor);palette.eye.emissive.setHex(alert?0xa75c2d:celebrating?0x84ad70:0x58b9b4);
      palette.eye.emissiveIntensity=recovering?.22:.75;
      antenna.scale.setScalar(alert?1.12:1);antenna.scale.multiplyScalar(.03);
      thruster.scale.y=reducedMotion?1:1+Math.sin(phase*4)*.05;
      glowMaterial.opacity=recovering?.04:characterState==='travelling'?.16:.1;
      group.userData.animationState=characterState;hasPresented=true;
    }
    function dispose() {
      if(disposed)return;disposed=true;group.removeFromParent();
      for(const value of instances)value.dispose();
      for(const value of geometries.values())value.dispose();
      for(const value of materials)value.dispose();
      for(const value of textures)value.dispose();
    }
    return {
      group,update,dispose,
      setReducedMotion(value){reducedMotion=Boolean(value);},
      diagnostics(){return{identity:'archivist-a07',state:characterState,meshCount,triangles:triangleCount,geometryCount:geometries.size,materialCount:materials.size,textureCount:textures.size,articulatedJoints:17,reducedMotion,disposed};},
    };
  }
  window.EscapeArchivist=Object.freeze({create});
})();
