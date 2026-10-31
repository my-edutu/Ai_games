import * as THREE from 'three';
import {mergeGeometryEntries} from './static-batching.js';
import {samplePerformance,characterSurface} from './character-performance.js';
const clamp=THREE.MathUtils.clamp, mix=THREE.MathUtils.lerp;
const smooth=t=>{t=clamp(t,0,1);return t*t*(3-2*t)};

function roundedGeometry(w,h,d,r=.05){
 const x=w/2-r,y=h/2-r,s=new THREE.Shape();
 s.moveTo(-x,-h/2);s.lineTo(x,-h/2);s.quadraticCurveTo(w/2,-h/2,w/2,-y);s.lineTo(w/2,y);s.quadraticCurveTo(w/2,h/2,x,h/2);s.lineTo(-x,h/2);s.quadraticCurveTo(-w/2,h/2,-w/2,y);s.lineTo(-w/2,-y);s.quadraticCurveTo(-w/2,-h/2,-x,-h/2);
 const refined=w>=.60&&h>=.32,bevel=Math.min(r*.45,d*.24),g=new THREE.ExtrudeGeometry(s,{depth:d-bevel*2,bevelEnabled:true,bevelThickness:bevel,bevelSize:bevel,bevelSegments:refined?4:2,curveSegments:refined?8:3,steps:1});
 g.translate(0,0,-d/2+bevel);return g;
}
function leafGeometry(){const s=new THREE.Shape();s.moveTo(0,0);s.bezierCurveTo(.1,.12,.39,.14,.49,.02);s.bezierCurveTo(.3,-.13,.1,-.13,0,0);return new THREE.ExtrudeGeometry(s,{depth:.025,bevelEnabled:true,bevelThickness:.015,bevelSize:.015,bevelSegments:1,curveSegments:5})}

// One rigid bone weight per part keeps the armor seams crisp. All articulated
// parts share nine material draws instead of submitting a mesh for each detail.
function skinAssemblies(root,bones){
 root.updateMatrixWorld(true);
 const groups=new Map(),originals=new Set(),meshes=[],indexOf=new Map(bones.map((b,i)=>[b,i]));
 root.traverse(o=>{
  if(!o.isMesh)return;let bone=o.parent;while(bone&&!indexOf.has(bone))bone=bone.parent;if(!bone)return;
  const g=o.geometry.clone(),n=g.attributes.position.count,indices=new Uint16Array(n*4),weights=new Float32Array(n*4);
  for(let i=0;i<n;i++){indices[i*4]=indexOf.get(bone);weights[i*4]=1}
  g.setAttribute('skinIndex',new THREE.BufferAttribute(indices,4));g.setAttribute('skinWeight',new THREE.BufferAttribute(weights,4));
  if(!groups.has(o.material))groups.set(o.material,[]);groups.get(o.material).push({geometry:g,matrix:o.matrixWorld.clone()});originals.add(o.geometry);meshes.push(o);
 });
 const skeleton=new THREE.Skeleton(bones);
 for(const [material,entries] of groups){const g=mergeGeometryEntries(entries);entries.forEach(e=>e.geometry.dispose());const mesh=new THREE.SkinnedMesh(g,material);mesh.name='explorer:'+material.name;mesh.castShadow=true;mesh.receiveShadow=true;mesh.frustumCulled=false;root.add(mesh);mesh.bind(skeleton,new THREE.Matrix4())}
 meshes.forEach(o=>o.removeFromParent());originals.forEach(g=>g.dispose());return skeleton;
}

/** Original field cartographer: enamel jacket, ceramic hood, copper atlas pack. */
export function createCharacter(){
 const root=new THREE.Group();root.name='field-cartographer';
 const mat=(name,color,roughness,metalness=0,extra={})=>{const m=new THREE.MeshStandardMaterial({color,roughness,metalness,...extra});m.name=name;return m};
 const m={ceramic:mat('glazed-ivory','#f0e5c7',.38,.12),enamel:mat('turquoise-enamel','#247e75',.32,.38),copper:mat('brushed-copper','#c3914d',.34,.68),cloth:mat('woven-underlayer','#365350',.96),rubber:mat('rubber-and-seams','#172f34',.91),scarf:mat('terracotta-scarf','#c3694b',.92),glass:mat('ink-glass','#12333e',.16,.4),light:mat('warm-face-light','#ffe9b4',.35,.1,{emissive:'#ffcc7b',emissiveIntensity:.42}),paper:mat('folded-atlas','#e4d4ab',.95)};
 // Two shared 64px micro-surfaces, not a texture per mesh or per frame.
 for(const [kind,targets] of [['cloth',[m.cloth,m.scarf]],['copper',[m.copper]]]){
  const texture=new THREE.DataTexture(characterSurface(kind),64,64);texture.wrapS=texture.wrapT=THREE.RepeatWrapping;
  texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;texture.generateMipmaps=true;texture.needsUpdate=true;
  for(const material of targets){material.roughnessMap=texture;material.bumpMap=texture;material.bumpScale=kind==='cloth'?.012:.006}
 }
 const bones=[];
 const joint=(name,parent,x=0,y=0,z=0)=>{const b=new THREE.Bone();b.name=name;b.position.set(x,y,z);parent.add(b);bones.push(b);return b};
 const piece=(parent,g,m,x=0,y=0,z=0)=>{const o=new THREE.Mesh(g,m);o.position.set(x,y,z);parent.add(o);return o};
 const plate=(parent,w,h,d,r,m,x=0,y=0,z=0)=>piece(parent,roundedGeometry(w,h,d,r),m,x,y,z);
 const sphere=(parent,r,m,x=0,y=0,z=0,sx=1,sy=1,sz=1)=>{const o=piece(parent,new THREE.SphereGeometry(r,16,10),m,x,y,z);o.scale.set(sx,sy,sz);return o};
 const cyl=(parent,a,b,h,m,x=0,y=0,z=0,n=12)=>piece(parent,new THREE.CylinderGeometry(a,b,h,n),m,x,y,z);
 const body=joint('body',root),chest=joint('chest',body,0,1.1,0);
 plate(chest,.67,.62,.43,.10,m.enamel);plate(chest,.51,.46,.07,.08,m.ceramic,0,.025,.248);plate(chest,.40,.055,.08,.018,m.copper,0,-.20,.26);
 plate(chest,.13,.19,.035,.025,m.copper,.105,.035,.298);const compass=cyl(chest,.063,.063,.035,m.glass,.105,.035,.331,16);compass.rotation.x=Math.PI/2;plate(chest,.024,.085,.025,.008,m.light,.105,.035,.358).rotation.z=-.4;
 for(const x of [-.24,.24]){plate(chest,.063,.45,.035,.018,m.cloth,x,.02,.252).rotation.z=x*-.35;plate(chest,.1,.085,.04,.016,m.copper,x,-.12,.279)}
 plate(body,.55,.22,.36,.065,m.cloth,0,.76,0);plate(body,.61,.11,.39,.03,m.rubber,0,.84,0);plate(body,.15,.13,.06,.025,m.copper,0,.84,.225);plate(body,.075,.06,.025,.013,m.enamel,0,.84,.264);
 cyl(chest,.21,.24,.13,m.rubber,0,.36,0);cyl(chest,.28,.26,.105,m.scarf,0,.405,0);plate(chest,.13,.15,.13,.035,m.scarf,-.22,.36,.12);
 const scarf=joint('scarf',chest,-.18,.37,-.24),scarfMid=joint('scarf-mid',scarf,0,-.18,0),scarfTip=joint('scarf-tip',scarfMid,0,-.18,0);
 for(const [segment,length,tip] of [[scarf,.18,false],[scarfMid,.18,false],[scarfTip,.18,true]]){
  const shape=new THREE.Shape();shape.moveTo(-.10,0);shape.lineTo(.10,0);shape.lineTo(.105,-length);if(tip)shape.lineTo(.02,-length+.065);shape.lineTo(-.10,-length);shape.closePath();
  piece(segment,new THREE.ExtrudeGeometry(shape,{depth:.026,bevelEnabled:false}),m.scarf);
  for(const x of [-.079,.079])plate(segment,.012,length-.018,.012,.003,m.paper,x,-length/2,.032);
 }

 const pack=joint('atlas-pack',chest,0,-.025,-.34);
 plate(pack,.55,.51,.27,.07,m.cloth);plate(pack,.48,.40,.055,.055,m.enamel,0,.005,-.166);
 for(const x of [-.18,.18]){plate(pack,.045,.43,.04,.012,m.copper,x,.005,-.21);plate(pack,.085,.075,.045,.016,m.rubber,x,-.11,-.239)}
 plate(pack,.20,.21,.08,.025,m.copper,0,.005,-.205);plate(pack,.14,.14,.03,.015,m.light,0,.005,-.258);
 for(let i=0;i<3;i++)plate(pack,.13,.018,.035,.006,m.rubber,0,-.028+i*.035,-.28);
 cyl(pack,.105,.105,.57,m.paper,0,.29,0,12).rotation.z=Math.PI/2;
 for(const x of [-.18,.18])cyl(pack,.113,.113,.06,m.copper,x,.29,0).rotation.z=Math.PI/2;
 cyl(pack,.08,.095,.29,m.copper,.32,-.02,-.02);cyl(pack,.06,.06,.05,m.rubber,.32,.15,-.02);
 const head=joint('head',chest,0,.66,.005);
 plate(head,.76,.63,.55,.145,m.ceramic);plate(head,.665,.405,.075,.11,m.copper,0,-.012,.305);plate(head,.60,.345,.065,.095,m.glass,0,-.012,.35);
 plate(head,.36,.095,.22,.025,m.enamel,0,.32,-.08);plate(head,.075,.04,.29,.013,m.copper,-.08,.38,-.04);
 for(const side of [-1,1]){cyl(head,.135,.135,.09,m.rubber,side*.414,-.012,-.02,16).rotation.z=Math.PI/2;cyl(head,.105,.12,.11,m.enamel,side*.449,-.012,-.02,16).rotation.z=Math.PI/2;cyl(head,.041,.041,.12,m.copper,side*.468,-.012,-.02,12).rotation.z=Math.PI/2;plate(head,.07,.10,.025,.018,m.enamel,side*.27,-.255,.24).rotation.z=side*-.3}
 const eyes=[],brows=[];
 for(const side of [-1,1]){const eye=joint('eye-'+side,head,side*.135,.005,.396);plate(eye,.072,.126,.02,.03,m.light);const brow=joint('brow-'+side,head,side*.135,.106,.393);plate(brow,.105,.02,.02,.008,m.copper);eyes.push(eye);brows.push(brow)}
 const mouth=joint('mouth',head,0,-.105,.400);
 piece(mouth,new THREE.TubeGeometry(new THREE.QuadraticBezierCurve3(new THREE.Vector3(-.065,.012,0),new THREE.Vector3(0,-.030,.008),new THREE.Vector3(.065,.012,0)),10,.010,5,false),m.light);
 // Brow seal, chin vents and a folded hood seam give the face readable planes.
 plate(head,.49,.035,.028,.01,m.ceramic,0,.201,.375);
 for(let i=-1;i<=1;i++)plate(head,.042,.016,.018,.004,m.rubber,i*.07,-.275,.283);
 for(const x of [-.20,.20])plate(head,.022,.28,.024,.006,m.copper,x,.03,-.292);

 const arms=[],legs=[],digits=[],thumbs=[];
 for(const side of [-1,1]){
  const shoulder=joint('shoulder-'+side,chest,side*.405,.18,0);sphere(shoulder,.12,m.rubber);plate(shoulder,.26,.20,.30,.065,m.ceramic,side*.045,.005,0);plate(shoulder,.16,.24,.18,.045,m.enamel,0,-.19,0);plate(shoulder,.07,.17,.035,.017,m.copper,side*.045,-.19,.108);
  const elbow=joint('elbow-'+side,shoulder,0,-.32,0);cyl(elbow,.09,.09,.19,m.rubber).rotation.z=Math.PI/2;plate(elbow,.18,.225,.19,.05,m.ceramic,0,-.13,0);plate(elbow,.14,.10,.035,.025,m.enamel,0,-.12,.113);
  const hand=joint('wrist-'+side,elbow,0,-.267,0);cyl(hand,.098,.09,.07,m.copper);plate(hand,.17,.16,.14,.045,m.rubber,0,-.105,.01);plate(hand,.15,.09,.06,.025,m.ceramic,0,-.085,.088);sphere(hand,.055,m.rubber,-side*.095,-.08,.045,.7,1.3,1);
  for(let i=0;i<3;i++){
   const finger=joint(`finger-${side}-${i}`,hand,-.058+i*.058,-.147,.055);
   sphere(finger,.027,m.copper,0,0,.012,1,1,.8);
   plate(finger,.047,.063,.060,.014,m.rubber,0,-.037,0);
   const tip=joint(`finger-tip-${side}-${i}`,finger,0,-.066,0);
   plate(tip,.044,.061,.057,.017,m.ceramic,0,-.024,0);digits.push({finger,tip,index:i});
  }
  const thumb=joint(`thumb-${side}`,hand,-side*.10,-.067,.044);thumb.rotation.z=-side*.25;
  plate(thumb,.058,.098,.069,.025,m.rubber,0,-.041,.010);plate(thumb,.046,.046,.025,.014,m.ceramic,0,-.069,.048);thumbs.push({thumb,side});
  arms.push({shoulder,elbow,hand,side});
  const hip=joint('hip-'+side,body,side*.195,.78,0);sphere(hip,.12,m.rubber);plate(hip,.21,.27,.235,.06,m.cloth,0,-.17,0);plate(hip,.16,.20,.05,.035,m.enamel,0,-.17,.13);
  const knee=joint('knee-'+side,hip,0,-.32,0);cyl(knee,.09,.09,.22,m.rubber).rotation.z=Math.PI/2;plate(knee,.20,.13,.09,.045,m.copper,0,-.015,.115);plate(knee,.20,.235,.21,.055,m.ceramic,0,-.16,0);plate(knee,.085,.15,.03,.019,m.enamel,0,-.15,.128);
  const ankle=joint('ankle-'+side,knee,0,-.30,0);cyl(ankle,.10,.11,.08,m.rubber);plate(ankle,.29,.16,.40,.055,m.enamel,0,-.055,.075);plate(ankle,.30,.065,.43,.025,m.rubber,0,-.135,.075);plate(ankle,.275,.10,.16,.04,m.ceramic,0,-.052,.245);plate(ankle,.17,.045,.055,.012,m.copper,0,.025,.14);for(let tread=0;tread<3;tread++)plate(ankle,.27,.023,.028,.006,m.copper,0,-.17,-.065+tread*.13);legs.push({hip,knee,ankle,side});
 }
 // A seed-shaped survey lantern with folded leaf fins and a single compass lens.
 const drone=joint('seed-lantern',root,-.92,1.88,-.5);sphere(drone,.22,m.copper,0,0,0,.86,1.16,.77);cyl(drone,.15,.19,.12,m.enamel,0,.18,0);piece(drone,new THREE.OctahedronGeometry(.12),m.light,0,-.015,.164);plate(drone,.20,.12,.035,.04,m.glass,0,.045,.19);
 const lanternEye=joint('lantern-eye',drone,0,.046,.219);sphere(lanternEye,.038,m.light,0,0,0,1,.85,.5);
 const lanternLid=joint('lantern-lid',drone,0,.107,.225);plate(lanternLid,.18,.045,.028,.016,m.enamel);
 const fins=[];for(const side of [-1,1]){const fin=joint('lantern-fin-'+side,drone,side*.16,.05,0);const leaf=piece(fin,leafGeometry(),m.enamel);leaf.rotation.y=side>0?0:Math.PI;leaf.rotation.x=-.5;leaf.scale.setScalar(.65);fins.push(fin)}cyl(drone,.025,.04,.13,m.copper,0,.3,0,8);
 const skeleton=skinAssemblies(root,bones);
 const data=new Uint8Array(32*32*4);for(let y=0;y<32;y++)for(let x=0;x<32;x++){const i=(y*32+x)*4,r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);data[i]=data[i+1]=data[i+2]=255;data[i+3]=Math.round(Math.max(0,1-r)**1.8*255)}
 const texture=new THREE.DataTexture(data,32,32);texture.magFilter=THREE.LinearFilter;texture.needsUpdate=true;
 const shadowMaterial=new THREE.MeshBasicMaterial({color:'#163e3d',transparent:true,opacity:.32,map:texture,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1});
 const shadow=new THREE.Mesh(new THREE.PlaneGeometry(1.7,1.15),shadowMaterial);shadow.rotation.x=-Math.PI/2;shadow.renderOrder=2;root.add(shadow);
 const ringMaterial=new THREE.MeshBasicMaterial({color:'#d8b263',transparent:true,opacity:0,depthWrite:false,side:THREE.DoubleSide});const ring=new THREE.Mesh(new THREE.RingGeometry(.40,.45,32),ringMaterial);ring.rotation.x=-Math.PI/2;ring.renderOrder=3;root.add(ring);
 return {root,dispose(){skeleton.dispose()},animate(action,time,reduced,motion={}){
  const performance=samplePerformance(action,time,reduced,motion);
  time=Number.isFinite(time)?time:0;
  const stride=time*(action==='run'?13:9),moving=action==='walk'||action==='run',gait=moving&&!reduced?Math.sin(stride):0;
  const landing=motion.landAge>=0&&motion.landAge<.30?Math.sin(Math.PI*clamp(motion.landAge/.30,0,1)):0;
  body.position.y=moving&&!reduced?-.018+Math.abs(Math.cos(stride))*.036:0;body.rotation.set(0,0,action==='hit'?-.24:0);chest.rotation.set(moving?.12:.025,0,moving&&!reduced?gait*.035:0);head.rotation.set(moving?-.07:0,0,action==='wait'?-.12:0);pack.rotation.x=reduced?0:moving?-.08+Math.sin(stride-.45)*.035:-.025;scarf.rotation.set(reduced?-.2:moving?-.65-Math.sin(stride-.6)*.15:-.22,0,-.12);
  for(let i=0;i<2;i++){const a=arms[i],l=legs[i],p=i?-gait:gait;a.shoulder.rotation.set(moving?p*.55:-.08,0,a.side*.13);a.elbow.rotation.x=moving?-.35-Math.max(0,-p)*.45:-.18;a.hand.rotation.set(.08,0,a.side*-.08);l.hip.rotation.x=moving?-p*.56:-.035;l.knee.rotation.x=moving?Math.max(0,p)*.86+.10:.07;l.ankle.rotation.x=moving?Math.max(0,p)*-.28:-.035}
  if(action==='jump'){
   const p=clamp(motion.jumpProgress??.5,0,1),launch=1-smooth(p/.16),extension=smooth((p-.10)/.25),approach=smooth((p-.62)/.30);body.position.y=-.12*launch;chest.rotation.x=mix(.28,-.10,extension)+approach*.20;head.rotation.x=-.08-approach*.06;
   for(let i=0;i<2;i++){const a=arms[i],l=legs[i];a.shoulder.rotation.x=mix(.7,-.85,extension)+approach*.18;a.shoulder.rotation.z=a.side*mix(.22,.63,extension);a.elbow.rotation.x=-.45-launch*.45+approach*.20;l.hip.rotation.x=mix(-.75,i?.20:-.30,extension)-approach*.42;l.knee.rotation.x=mix(1.12,i?.80:.48,extension)-approach*.22;l.ankle.rotation.x=-.18+approach*.08}pack.rotation.x=.10*launch-.11*extension;scarf.rotation.x=reduced?-.35:-.9-Math.sin(p*Math.PI)*.45;
  }
  if(action==='land'||landing>0){const c=Math.max(landing,action==='land'?.18:0);body.position.y=-.16*c;chest.rotation.x=.20*c;head.rotation.x=-.14*c;for(const a of arms){a.shoulder.rotation.x=-.52*c;a.shoulder.rotation.z=a.side*.34;a.elbow.rotation.x=-.40}for(const l of legs){l.hip.rotation.x=-.62*c;l.knee.rotation.x=.98*c;l.ankle.rotation.x=-.36*c}pack.rotation.x=.13*c}
  if(action==='wait'){body.position.y=-.035;chest.rotation.y=-.08;arms[0].shoulder.rotation.set(-.6,-.3,-.1);arms[0].elbow.rotation.x=-1.05;arms[1].shoulder.rotation.set(.06,0,.22);arms[1].elbow.rotation.x=-.40;legs[0].hip.rotation.z=-.045;legs[1].hip.rotation.z=.045}else legs[0].hip.rotation.z=legs[1].hip.rotation.z=0;
  if(action==='celebrate'){chest.rotation.x=-.1;arms.forEach(a=>{a.shoulder.rotation.z=a.side*2.2;a.shoulder.rotation.x=-.35;a.elbow.rotation.x=-.45});head.rotation.z=reduced?-.08:Math.sin(time*3)*.08}
  if(action==='recover'||action==='hit'){chest.rotation.x=.26;head.rotation.z=-.19;arms.forEach(a=>{a.shoulder.rotation.z=a.side*.5;a.elbow.rotation.x=-.65})}
  // Every parameter is reset on every sample: no action leaves stale fingers,
  // brows, scarf bends or companion reactions behind after recovery/pause.
  body.position.y+=performance.breath;chest.rotation.y+=performance.torsoTwist;
  head.rotation.y=performance.gaze;mouth.scale.x=performance.mouthWidth;mouth.rotation.z=performance.mouthFrown*Math.PI;
  eyes.forEach((e,i)=>{e.scale.y=performance.eyeScale;e.position.x=(i?1:-1)*.135+performance.gaze*.035});
  brows.forEach((b,i)=>{b.rotation.z=(i?-1:1)*(action==='wait'?.18:action==='hit'?-.25:action==='celebrate'?.15:.04)});
  for(const {finger,tip,index} of digits){finger.rotation.x=-performance.fingerCurl*.95;finger.rotation.z=(index-1)*(1-performance.fingerCurl)*.09;tip.rotation.x=-performance.fingerCurl*.75}
  for(const {thumb,side} of thumbs){thumb.rotation.set(-performance.fingerCurl*.45,side*performance.fingerCurl*.30,-side*.25)}
  scarf.rotation.x=performance.scarfBase;scarfMid.rotation.x=performance.scarfMid;scarfTip.rotation.x=performance.scarfTip;
  // Camera-space separation makes the complete companion readable during turns.
  // Only its presentation pose changes; the explorer's authority is untouched.
  const companionAngle=Number.isFinite(motion.companionAngle)?motion.companionAngle:0;
  drone.position.set(-.86*Math.cos(companionAngle)+.20*Math.sin(companionAngle),1.80+performance.companionBob+performance.rewardLift,.86*Math.sin(companionAngle)+.20*Math.cos(companionAngle));
  drone.rotation.set(performance.companionPitch,companionAngle,performance.companionBank);
  lanternEye.scale.y=performance.companionEye;lanternLid.position.y=.107-(1-performance.companionEye)*.045;
  fins.forEach((f,i)=>{f.rotation.z=(i?1:-1)*performance.companionFin});
  const supportVisible=Number.isFinite(motion.groundOffset??0),ground=supportVisible?(motion.groundOffset??0):0,height=Math.max(0,-ground);shadow.visible=supportVisible;shadow.position.y=ground+.024;shadow.scale.setScalar(1+height*.16);shadowMaterial.opacity=.32/(1+height*.65);
  const age=motion.landAge??Infinity;ring.visible=!reduced&&supportVisible&&age>=0&&age<.32;ring.position.y=ground+.035;ring.scale.setScalar(Number.isFinite(age)?.75+age*2.8:1);ringMaterial.opacity=.35*Math.max(0,1-age/.32);
 }};
}
