import * as THREE from './vendor/three.module.js';

// Original Garden Expedition models. Local +Z is forward; the host owns position.
// All animation is cosmetic, derived only from the supplied public presentation state.
const TAU = Math.PI * 2;
const finite = (value, fallback = 0) => Number.isFinite(value) ? value : fallback;
const approach = (a, b, speed, delta) => a + (b - a) * (1 - Math.exp(-speed * delta));
function rig(name, { balanced = false } = {}) {
  const group = new THREE.Group(); group.name = name;
  const geometries = new Set(), materials = new Set(), cache = new Map();
  // At gameplay scale, fewer samples retain each modeled detail and its silhouette.
  const sphereWidth = balanced ? 12 : 20, sphereHeight = balanced ? 8 : 14;
  const radial = balanced ? 8 : 16, ringRadial = balanced ? 5 : 8, ringLength = balanced ? 12 : 24;
  let disposed = false;
  function material(color, metalness = .1, roughness = .55, extra = {}) {
    const m = new THREE.MeshStandardMaterial({color, metalness, roughness, ...extra});
    materials.add(m); return m;
  }
  function geometry(key, make) {
    if (!cache.has(key)) { const g = make(); cache.set(key, g); geometries.add(g); }
    return cache.get(key);
  }
  function mesh(parent, g, material, pos = [0,0,0], scale = [1,1,1]) {
    const m = new THREE.Mesh(g, material); m.position.set(...pos); m.scale.set(...scale);
    m.castShadow = true; m.receiveShadow = true; parent.add(m); return m;
  }
  const ball = (p, m, pos, scale) => mesh(p, geometry('sphere', () => new THREE.SphereGeometry(1, sphereWidth, sphereHeight)), m, pos, scale);
  const tube = (p, m, pos, radius, length, top = radius) => mesh(p, geometry(`c${radius},${length},${top}`, () => new THREE.CylinderGeometry(top,radius,length,radial)), m, pos);
  const ring = (p, m, pos, radius, thickness) => mesh(p, geometry(`t${radius},${thickness}`, () => new THREE.TorusGeometry(radius,thickness,ringRadial,ringLength)), m, pos);
  function rounded(p, m, pos, dimensions, radius = .04) {
    const [w,h,d] = dimensions, r = Math.min(radius,w/2,h/2,d/2);
    const key = `b${w},${h},${d},${r}`;
    return mesh(p,geometry(key,() => {
      const s = new THREE.Shape(), x = -w/2+r, y = -h/2+r, sw = w-2*r, sh = h-2*r;
      s.moveTo(x,y-r); s.lineTo(x+sw,y-r); s.quadraticCurveTo(x+sw+r,y-r,x+sw+r,y);
      s.lineTo(x+sw+r,y+sh); s.quadraticCurveTo(x+sw+r,y+sh+r,x+sw,y+sh+r);
      s.lineTo(x,y+sh+r); s.quadraticCurveTo(x-r,y+sh+r,x-r,y+sh);
      s.lineTo(x-r,y); s.quadraticCurveTo(x-r,y-r,x,y-r);
      const g = new THREE.ExtrudeGeometry(s,{depth:d-2*r,bevelEnabled:true,bevelThickness:r,bevelSize:r*.45,bevelSegments:balanced ? 1 : 3,steps:1,curveSegments:balanced ? 2 : 5});
      g.translate(0,0,-d/2+r); g.computeVertexNormals(); return g;
    }),m,pos);
  }
  function pivot(parent,name,pos) { const g = new THREE.Group(); g.name=name; g.position.set(...pos); parent.add(g); return g; }
  function bar(parent,m,a,b,radius=.025) {
    const start = new THREE.Vector3(...a), end = new THREE.Vector3(...b), direction = end.clone().sub(start);
    const object = tube(parent,m,start.clone().add(end).multiplyScalar(.5).toArray(),radius,direction.length());
    object.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),direction.normalize()); return object;
  }
  // Batch rigid details by material inside each articulated part. Animation pivots remain independent.
  function finish() {
    group.traverse(parent => {
      if (!parent.isGroup) return;
      const batches = new Map();
      for (const child of parent.children) if (child.isMesh) {
        if (!batches.has(child.material)) batches.set(child.material,[]);
        batches.get(child.material).push(child);
      }
      for (const [mat, children] of batches) {
        if (children.length < 2) continue;
        const positions=[], normals=[], uvs=[];
        for (const child of children) {
          child.updateMatrix();
          const g = child.geometry.index ? child.geometry.toNonIndexed() : child.geometry.clone();
          g.applyMatrix4(child.matrix);
          positions.push(...g.attributes.position.array); normals.push(...g.attributes.normal.array); uvs.push(...g.attributes.uv.array);
          g.dispose(); parent.remove(child);
        }
        const combined = new THREE.BufferGeometry();
        combined.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
        combined.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
        combined.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
        combined.computeBoundingSphere(); geometries.add(combined); mesh(parent,combined,mat);
      }
    });
  }
  function dispose() {
    if (disposed) return; disposed = true;
    group.removeFromParent(); group.clear();
    for (const g of geometries) g.dispose();
    for (const m of materials) m.dispose();
    geometries.clear(); materials.clear(); cache.clear();
  }
  return {group,material,ball,tube,ring,rounded,pivot,bar,finish,dispose,isDisposed:()=>disposed};
}
function motionState(options) {
  const result = typeof options.result === 'string' ? options.result : options.result?.reason ?? options.result?.status ?? options.result?.outcome;
  return {time:finite(options.time), delta:Math.max(0,Math.min(.1,finite(options.delta,1/60))), moving:!!options.moving,
    danger:Math.min(1,Math.max(0,finite(Number(options.danger)))), reduced:!!options.reducedMotion,
    win:['escaped','escape','won','win','success'].includes(result), lose:['capture','trap-death','timer-expired','stagnation','caught','failed','failure','lost','loss','dead','timeout','exhausted'].includes(result)};
}
function face(group, heading, delta, reduced) {
  if (!Number.isFinite(heading)) return;
  const distance = Math.atan2(Math.sin(heading-group.rotation.y),Math.cos(heading-group.rotation.y));
  group.rotation.y += distance * (reduced ? 1 : 1-Math.exp(-14*delta));
}

export function createExplorer(options = {}) {
  const r = rig('Pip · garden expedition robot', options), {group,material,ball,tube,ring,rounded,pivot,bar}=r;
  const amber=material('#e6a532',.2,.48), brass=material('#927340',.55,.48), ivory=material('#eee6cb',.08,.65);
  const dark=material('#263e43',.55,.38), rubber=material('#1c3037',.02,.92), teal=material('#127f89',.08,.72);
  const leather=material('#8a5436',.05,.86), glass=material('#112b39',.1,.58);
  const scarfCloth=material('#db6256',.01,.91);
  const glow=material('#ffdf83',.12,.26,{emissive:'#ffb52d',emissiveIntensity:1.45});
  const eye=material('#d5fff1',.08,.18,{emissive:'#a4ffe5',emissiveIntensity:.65});
  const body=pivot(group,'breathing torso',[0,.78,0]);
  ball(body,teal,[0,.04,0],[.3,.33,.24]);
  rounded(body,teal,[0,.03,.218],[.37,.29,.055],.04);
  // One quiet expedition badge leaves the broad painted chest and eyes dominant.
  rounded(body,ivory,[-.105,.095,.259],[.065,.08,.018],.012);
  // Waist seam, visible belt buckle and shoulder rivets.
  const belt=tube(body,dark,[0,-.17,0],.259,.065); belt.scale.z=.8;
  rounded(body,brass,[0,-.17,.218],[.105,.072,.035],.012);
  for (const side of [-1,1]) {
    ball(body,brass,[side*.245,.15,.14],[.025,.025,.018]);
    const strap=rounded(body,leather,[side*.177,.08,-.225],[.075,.44,.05],.018); strap.rotation.z=side*.1;
  }
  // A packed expedition satchel, rolled bedroll and map tube remain visible from chase views.
  rounded(body,leather,[0,.04,-.29],[.43,.43,.22],.065);
  rounded(body,amber,[0,.22,-.31],[.45,.12,.24],.04);
  rounded(body,leather,[0,-.02,-.417],[.25,.2,.05],.025);
  rounded(body,brass,[0,.07,-.45],[.067,.08,.02],.01);
  const bedroll=tube(body,scarfCloth,[0,.29,-.31],.115,.46); bedroll.rotation.z=Math.PI/2;
  for (const side of [-1,1]) { const tie=ring(body,leather,[side*.15,.29,-.31],.116,.013); tie.rotation.y=Math.PI/2; }
  const map=tube(body,ivory,[-.29,.03,-.27],.045,.35); map.rotation.z=-.18;
  // Soft neckerchief with an asymmetrical tail, its pivot can lag behind the body.
  const scarf=tube(body,scarfCloth,[0,.29,0],.23,.12); scarf.scale.z=.91;
  ball(body,scarfCloth,[.21,.265,.135],[.085,.075,.07]);
  const tail=pivot(body,'scarf tail',[.25,.24,.065]);
  const flap=rounded(tail,scarfCloth,[.035,-.12,-.045],[.15,.3,.045],.03); flap.rotation.z=.35;
  const head=pivot(body,'curious head',[0,.54,0]);
  ball(head,amber,[0,.025,0],[.335,.3,.285]);
  const helmetRim=tube(head,amber,[0,-.06,0],.354,.055); helmetRim.scale.z=.9;
  rounded(head,dark,[0,-.015,.234],[.54,.235,.11],.07);
  const eyes=[];
  for (const side of [-1,1]) {
    ring(head,dark,[side*.145,.015,.302],.113,.011);
    ball(head,glass,[side*.145,.015,.303],[.102,.106,.06]);
    const pupil=pivot(head,`eye ${side}`,[side*.145,.017,.358]);
    ball(pupil,eye,[0,0,0],[.073,.081,.016]);
    // Large dark centers establish gaze; avoid competing glass pin highlights.
    ball(pupil,dark,[.006,-.002,.016],[.031,.045,.009]); eyes.push(pupil);
    const ear=tube(head,brass,[side*.34,0,-.035],.074,.055); ear.rotation.z=Math.PI/2;
    const screw=tube(head,dark,[side*.37,0,-.035],.032,.015); screw.rotation.z=Math.PI/2;
  }
  rounded(head,ivory,[0,-.155,.25],[.12,.024,.025],.009);
  // Helmet crest, recessed headlamp, and three engraved vents.
  rounded(head,ivory,[0,.205,.075],[.095,.05,.34],.025);
  ring(head,brass,[0,.19,.251],.052,.014);
  ball(head,glow,[0,.19,.257],[.042,.042,.02]);
  for (let i=-1;i<=1;i++) rounded(head,dark,[i*.055,.045,-.282],[.024,.085,.014],.007);
  const legs=[];
  for (const side of [-1,1]) {
    const hip=pivot(group,`hip ${side}`,[side*.16,.51,0]);
    ball(hip,dark,[0,-.02,0],[.09,.09,.09]);
    tube(hip,ivory,[0,-.12,0],.078,.2);
    const knee=pivot(hip,`knee ${side}`,[0,-.225,0]);
    ball(knee,brass,[0,0,0],[.086,.08,.085]);
    tube(knee,dark,[0,-.085,0],.067,.14);
    rounded(knee,rubber,[0,-.17,.035],[.205,.18,.32],.055);
    rounded(knee,rubber,[0,-.235,.048],[.213,.065,.333],.025);
    rounded(knee,teal,[0,-.135,.175],[.13,.055,.025],.012);
    legs.push({hip,knee});
  }
  const arms=[];
  for (const side of [-1,1]) {
    const shoulder=pivot(body,`shoulder ${side}`,[side*.33,.18,0]);
    ball(shoulder,teal,[0,-.015,0],[.105,.12,.105]);
    tube(shoulder,dark,[0,-.115,0],.06,.18);
    const elbow=pivot(shoulder,`elbow ${side}`,[0,-.21,0]);
    ball(elbow,brass,[0,0,0],[.068,.065,.067]);
    tube(elbow,ivory,[0,-.065,.015],.066,.13);
    const hand=pivot(elbow,'glove',[0,-.15,.025]);
    rounded(hand,dark,[0,0,0],[.115,.12,.115],.038);
    for (const x of [-.032,.009,.05]) rounded(hand,ivory,[x,-.035,.045],[.029,.075,.045],.013);
    ball(hand,ivory,[-side*.065,.005,.028],[.035,.05,.038]);
    arms.push({shoulder,elbow,hand});
  }
  // Pip reveals the matching key in the *left glove* only when a disclosed
  // nearby sealed gate matches public inventory. The held physical model is
  // always built once and toggled; no props are allocated per frame.
  const keyMint=material('#a5ffdc',.22,.3,{emissive:'#50d5ae',emissiveIntensity:.65});
  // The warm solid blade makes this read as a held *key*, rather than a
  // floating mint loop. A dark grip collar overlaps the existing glove so
  // its shaft has a visible physical connection at normal game scale.
  const keyBlade=material('#ffe2a1',.43,.34,{emissive:'#e7a64c',emissiveIntensity:.3});
  const heldKey=pivot(arms[0].hand,'presented matching key',[0,-.075,.14]);
  // Preserve the original connected key while revealing its octagonal bow at mobile scale.
  ring(heldKey,keyMint,[0,.18,0],.215,.06);
  rounded(heldKey,keyBlade,[0,-.095,0],[.14,.40,.13],.028);
  // Raised warm-metal ridge on the camera-side face of the real blade. It
  // crosses the glove collar and physically joins the mint bow; no beam,
  // floating HUD marker or simulated unlock is introduced.
  bar(heldKey,keyBlade,[0,-.185,.078],[0,.058,.078],.034);
  rounded(heldKey,keyBlade,[.14,-.235,0],[.25,.12,.13],.026);
  rounded(heldKey,keyBlade,[.14,-.09,0],[.25,.105,.13],.023);
  rounded(heldKey,dark,[0,-.025,-.047],[.20,.135,.18],.032);
  // Paired physical thumb/finger clamps meet the blade at its real grip.
  // The prop stays parented to the connected wrist and disappears with it.
  rounded(heldKey,dark,[-.087,-.025,.079],[.039,.15,.045],.014);
  rounded(heldKey,dark,[.087,-.025,.079],[.039,.15,.045],.014);
  heldKey.visible=false;
  // The modeled blade-tooth axis points to a public physical socket only
  // when this exact matched carried-key gesture is valid. Reuse scratch.
  const keyToothAxis=new THREE.Vector3(0,-1,0);
  const keyAimOrigin=new THREE.Vector3(), keyAimDirection=new THREE.Vector3();
  const keyHandInverse=new THREE.Quaternion();
  const keyViewerDirection=new THREE.Vector3(), keyBowNormal=new THREE.Vector3();
  const keyRollCross=new THREE.Vector3(), keyViewerRoll=new THREE.Quaternion();

  // An expedition signal crest is legible in a wide, silent stream frame.
  // It is suppressed by default and receives only disclosed-threat attention;
  // it is not a detection radius, navigation instruction or hidden game event.
  const flareGold=material('#fff1ad',.08,.26,{emissive:'#ffd069',emissiveIntensity:1.35});
  const flareCoral=material('#f07b43',.07,.33,{emissive:'#e35021',emissiveIntensity:.9});
  // A triangle with a bold exclamation is a warning, not a collectible halo.
  const alertFlare=pivot(group,'disclosed threat flare',[0,1.83,0]);
  bar(alertFlare,flareGold,[-.34,-.13,0],[0,.4,0],.049);
  bar(alertFlare,flareGold,[0,.4,0],[.34,-.13,0],.049);
  bar(alertFlare,flareGold,[.34,-.13,0],[-.34,-.13,0],.049);
  rounded(alertFlare,flareCoral,[0,.13,.025],[.105,.235,.075],.026);
  ball(alertFlare,flareGold,[0,-.07,.038],[.069,.073,.07]);
  alertFlare.visible=false;
  // A cage lantern with a solid emissive crystal: no per-character dynamic lights.
  const lantern=pivot(arms[1].hand,'swinging lantern',[.045,-.045,.06]);
  ring(lantern,brass,[0,-.055,0],.073,.013);
  const lamp=pivot(lantern,'lantern cage',[0,-.21,0]);
  tube(lamp,brass,[0,-.1,0],.109,.035);
  tube(lamp,brass,[0,.095,0],.11,.045,.07);
  ball(lamp,glow,[0,0,0],[.066,.09,.066]);
  for (let i=0;i<4;i++) { const a=i*TAU/4; bar(lamp,brass,[Math.sin(a)*.087,-.085,Math.cos(a)*.087],[Math.sin(a)*.087,.075,Math.cos(a)*.087],.009); }
  r.finish();
  let gait=0, stride=0;
  return {group, dispose:r.dispose, update(options={}) {
    if (r.isDisposed()) return;
    const s=motionState(options), amount=s.reduced?0:1;
    face(group,options.heading,s.delta,s.reduced);
    stride=approach(stride,s.moving&&!s.win&&!s.lose?1:0,10,s.delta);
    gait += s.delta*(8.5+s.danger*3)*stride;
    const step=Math.sin(gait)*stride*amount, idle=Math.sin(s.time*2.4)*amount;
    const turn=Number.isFinite(options.heading)?Math.atan2(Math.sin(options.heading-group.rotation.y),Math.cos(options.heading-group.rotation.y)):0;
    const rest=(1-stride)*amount;
    // Attention is presentation-only and comes exclusively from a nearby,
    // already-disclosed threat. Without it, Pip continues to face the route.
    const reacting=!s.win&&!s.lose&&Number.isFinite(options.attentionHeading);
    const alert=reacting?Math.max(0,Math.min(1,finite(options.attentionStrength))):0;
    const relativeLook=reacting?Math.atan2(Math.sin(options.attentionHeading-group.rotation.y),Math.cos(options.attentionHeading-group.rotation.y)):0;
    const lookYaw=Math.max(-.72,Math.min(.72,relativeLook))*alert;
    // The key gesture has lower priority than a genuine nearby warden. Its
    // heading and strength are sourced only from a public carried-key/closed-
    // gate pair; a static readable pose remains in reduced-motion mode.
    const keyReach=!s.win&&!s.lose&&alert<.1&&Number.isFinite(options.keyHeading)
      ?Math.max(0,Math.min(1,finite(options.keyStrength))):0;
    // Guard the absent heading explicitly: 0 * NaN still yields NaN, which
    // would corrupt neutral/guardian head rotations after a key cue clears.
    const keyYaw=keyReach>0?keyReach*Math.max(-.7,Math.min(.7,
      Math.atan2(Math.sin(options.keyHeading-group.rotation.y),
        Math.cos(options.keyHeading-group.rotation.y)))):0;
    heldKey.visible=keyReach>.2;
    // Raise the already modeled key into Pip's silhouette, above the foreground
    // gate post; counter-rotate the held prop so its bow stays above its teeth.
    // No new information, simulation action or frame-time allocation is used.
    // Clear any prior quaternion aim when returning to neutral or guardian.
    heldKey.rotation.set(keyReach*2.7,0,s.reduced?0:Math.sin(s.time*2.2)*.045*keyReach);
    heldKey.scale.setScalar(1+keyReach*.25);
    // Shape, not color or blinking alone, communicates a real nearby warden.
    // Reduced-motion keeps the same static visual cue.
    alertFlare.visible=alert>.24;
    alertFlare.position.y=1.83+(s.reduced?0:Math.sin(s.time*4)*.035);
    alertFlare.rotation.y=.7-group.rotation.y;
    alertFlare.scale.setScalar(.85+alert*.27);
    // True, already-observed danger makes Pip visibly recoil, crouch and brace
    // the lantern toward Thornback. These are cosmetic, local rig transforms:
    // no run movement, new gameplay ability or undisclosed target is invented.
    // The entire gesture clears as soon as public attention is withdrawn.
    body.position.x=-.025*rest;
    body.position.y=.78+Math.abs(step)*.035+(s.lose?0:idle*.008)-alert*.11;
    body.position.z=alert>0?-alert*.105:0;
    body.rotation.set(s.lose?.22:stride*.065-s.danger*.035-keyReach*.07-alert*.25,
      lookYaw*.14+keyYaw*.08,
      .035*rest-step*.05-Math.sign(lookYaw)*alert*.12);
    head.rotation.set(s.lose?.28:-.04-s.danger*.08+idle*.018+alert*.10-keyReach*.06,
      (s.reduced?0:Math.max(-.42,Math.min(.42,turn*.7))+(Math.sin(s.time*.73)*.08+.12)*rest)*(1-alert-keyReach*.7)+lookYaw+keyYaw,
      s.win?-.13:s.lose?.07:-.065*rest+step*.035-Math.sign(lookYaw)*alert*.19);
    for (let i=0;i<2;i++) {
      const sign=i===0?1:-1;
      // Two planted, widened knees sell a real physical startle without
      // moving the authoritative public cell or suggesting retreat movement.
      legs[i].hip.rotation.x=step*sign*.62-alert*.22;
      legs[i].hip.rotation.z=alert>0?-sign*alert*.3:0;
      legs[i].knee.rotation.x=Math.max(0,-step*sign)*.58+alert*.3;
      arms[i].shoulder.rotation.x=-step*sign*(i===1?.2:.4)-(s.win?.9:0)-(i===1?.16:0)-alert*(i===1?1.55:.95)-(i===0?keyReach*2.3:0);
      // Aim the raised physical glove toward the publicly disclosed lock,
      // not just upward. Reduced-motion uses the same stable static pose.
      // A terminal result or nearby guardian suppresses keyYaw entirely.
      arms[i].shoulder.rotation.y=i===0?keyYaw*1.1:0;
      arms[i].shoulder.rotation.z=(i===0?-1:1)*(s.win?.95:i===1?.34:.15)+(i===0?keyYaw*.25:0)+(i===0?-1:1)*alert*.65;
      arms[i].elbow.rotation.x=-.16-(i===1?.22:0)-(s.danger*.3)-(i===0?keyReach*.7:0)-alert*(i===1?.38:.24);
      // Counter-turn the connected wrist as the shoulder aims at the known lock.
      // Keep the actual glove/key face visible rather than twisting its bow
      // behind the sealed gate's foreground masonry. No hidden-state input.
      arms[i].elbow.rotation.y=i===0&&keyYaw!==0?-keyYaw*.9:0;
      eyes[i].position.x=(i===0?-1:1)*.145+Math.max(-.024,Math.min(.024,(lookYaw+keyYaw)*.032+(s.reduced?0:(Math.max(-.016,Math.min(.016,turn*.045))+.006*rest)*(1-alert))));
      eyes[i].scale.y=s.lose?.32:s.danger>.45||alert>.4?1.13:(s.reduced?1:Math.pow(Math.max(0,Math.cos(s.time*.83)),60)>.88?.12:1);
    }
    // Aim the existing connected tooth at the real closed socket; do NOT
    // extend it across a cell, move Pip or imply an authoritative unlock.
    const target=options.keyTarget;
    if (heldKey.visible && target && Number.isFinite(target.x) &&
        Number.isFinite(target.y) && Number.isFinite(target.z)) {
      heldKey.getWorldPosition(keyAimOrigin);
      arms[0].hand.getWorldQuaternion(keyHandInverse).invert();
      keyAimDirection.set(target.x-keyAimOrigin.x,target.y-keyAimOrigin.y,
        target.z-keyAimOrigin.z).applyQuaternion(keyHandInverse);
      if (keyAimDirection.lengthSq()>.01) {
        keyAimDirection.normalize();
        heldKey.quaternion.setFromUnitVectors(keyToothAxis,keyAimDirection);
        // Preserve the real tooth/socket aim. Only roll around that shaft to
        // keep the mint bow's physical face visible to the rendering camera.
        // No authority, contact, private map or new meshes enter this pose.
        const viewer=options.keyCameraPosition;
        if (viewer && Number.isFinite(viewer.x) && Number.isFinite(viewer.y) && Number.isFinite(viewer.z)) {
          keyViewerDirection.set(viewer.x-keyAimOrigin.x,viewer.y-keyAimOrigin.y,
            viewer.z-keyAimOrigin.z).applyQuaternion(keyHandInverse);
          keyViewerDirection.addScaledVector(keyAimDirection,-keyViewerDirection.dot(keyAimDirection));
          if (keyViewerDirection.lengthSq()>.0001) {
            keyViewerDirection.normalize();
            keyBowNormal.set(0,0,1).applyQuaternion(heldKey.quaternion);
            const sine=keyAimDirection.dot(keyRollCross.crossVectors(keyBowNormal,keyViewerDirection));
            const cosine=THREE.MathUtils.clamp(keyBowNormal.dot(keyViewerDirection),-1,1);
            keyViewerRoll.setFromAxisAngle(keyAimDirection,Math.atan2(sine,cosine));
            heldKey.quaternion.premultiply(keyViewerRoll);
          }
        }
      }
    }
    if (s.win) body.position.y += amount*Math.max(0,Math.sin(s.time*5))*.075;
    // Scarf reacts to the same public startle, including a static pose when
    // reduced motion is requested; return to neutral without lingering cues.
    tail.rotation.x=-stride*.28+step*.1-alert*.27;
    tail.rotation.z=alert*.22;
    // Keep the hanging cage upright beneath the outward arm; let it trail the stride.
    lantern.rotation.z=-arms[1].shoulder.rotation.z-step*.17;
    lantern.rotation.x=-(arms[1].shoulder.rotation.x+arms[1].elbow.rotation.x)+step*.18;
    lantern.rotation.y=lookYaw*.38;
    glow.emissiveIntensity=s.lose?.45:1.45;
  }};
}

export function createWarden(options = {}) {
  const r=rig('Thornback · ancient garden warden', options), {group,material,ball,tube,ring,rounded,pivot,bar}=r;
  // The old jade-on-jade shell disappeared against the adjacent garden
  // parapets in real 390px encounter footage. Give Thornback a consistent
  // slate-violet carapace, warm copper shoulder plates and brass face. These
  // remain physical shared materials, not screen-facing warning sprites.
  const shell=material('#4d4364',.52,.38), plates=material('#a17b5b',.48,.43), bronze=material('#bd8b51',.7,.4);
  const dark=material('#292e40',.48,.6), claw=material('#e1c997',.55,.35);
  const red=material('#ff8650',.2,.27,{emissive:'#ff401a',emissiveIntensity:1.1});
  const body=pivot(group,'armored body',[0,.79,-.035]);
  ball(body,dark,[0,0,0],[.53,.33,.6]);
  // Real articulated left/right shell halves pivot around the dorsal seam.
  // A disclosed nearby threat can raise them; idle, unseen and terminal poses
  // close the armor without implying a new game action or hidden enemy state.
  const elytra=[];
  for (const side of [-1,1]) {
    const wing=pivot(body,`flared elytron ${side}`,[side*.05,.15,-.11]);
    ball(wing,shell,[side*.165,-.02,.03],[.32,.35,.57]);
    for (let i=0;i<3;i++) {
      const band=ring(wing,bronze,[side*.17,-.03,-.21+i*.23],.28,.014);
      band.scale.set(1,1.08,1); band.rotation.y=side*.16;
    }
    for (let i=0;i<3;i++) ball(wing,plates,[side*(.27-i*.02),.19,-.23+i*.23],[.135,.065,.09]);
    elytra.push({wing,side});
  }
  rounded(body,bronze,[0,.435,-.06],[.055,.045,.78],.022);
  for (let i=0;i<4;i++) {
    const thorn=tube(body,claw,[0,.48,-.36+i*.21],.063,.15,0); thorn.rotation.x=-.3;
  }
  // A wardens' raised ember crest makes the aggressor recognizable even
  // when the camera sees its armored back. Only an observed nearby explorer
  // activates it; the material is cosmetic and never reveals hidden threats.
  const ember=material('#ff9b59',.08,.3,{emissive:'#f25a1c',emissiveIntensity:1.55});
  // Signature garden-warden anatomy: sea-glass fronds unfurl from the
  // disclosed beetle's real elytra. Original 3D parts, not screen decals.
  const frondGlass=material('#8bcfac',.15,.52,{emissive:'#28654c',emissiveIntensity:.3});
  // Ember linings are physical pieces tucked under the opening carapace, not
  // camera-facing sprites. Both remain hidden without public close attention.
  for (const shellHalf of elytra) {
    const lining=pivot(shellHalf.wing,`exposed elytron lining ${shellHalf.side}`,[shellHalf.side*.12,-.17,.02]);
    rounded(lining,ember,[shellHalf.side*.07,0,0],[.25,.065,.66],.02);
    lining.visible=false;
    shellHalf.lining=lining;
    // The old underside was completely hidden by the raised shell from the
    // actual +X/+Z gameplay camera. A small physically attached glowing lip
    // crosses its *top inside edge*, so the real split reads at 1280px.
    // It remains a real piece of the hinge, never a billboard or fake actor.
    const seam=pivot(shellHalf.wing,`opened elytron ember seam ${shellHalf.side}`,[shellHalf.side*.095,.292,-.03]);
    rounded(seam,ember,[shellHalf.side*.045,.025,0],[.105,.048,.78],.018);
    seam.visible=false;
    shellHalf.seam=seam;
    // Three individually sculpted rigid leaf-blades flare UP from each
    // hinge, preserving the beetle's rounded armored body and contact feet.
    // Their common root is part of the physical wing, not an effect sprite.
    const crest=pivot(shellHalf.wing,`unfurled sea-glass wing fronds ${shellHalf.side}`,[shellHalf.side*.17,.18,-.07]);
    for (let blade=0;blade<3;blade++) {
      const x=shellHalf.side*(.035+blade*.085);
      const z=(blade-1)*.19;
      const length=.57+blade*.15;
      const leaf=rounded(crest,frondGlass,[x,.25+blade*.075,z],[.22,length,.11],.048);
      leaf.rotation.z=shellHalf.side*(.12+blade*.18);
      leaf.rotation.x=(blade-1)*.19;
      // Bronze-colored struts visibly connect each tall blade to the hinge.
      bar(crest,bronze,[0,0,0],[x,.20+blade*.055,z],.032);
      const vein=rounded(crest,ember,[x,.26+blade*.075,z+.069],[.041,length*.61,.024],.01);
      vein.rotation.z=leaf.rotation.z;
      vein.rotation.x=leaf.rotation.x;
    }
    // A larger, independently hinged tide sail gives the botanical armor a
    // readable high silhouette in the real 320px encounter. Its root and two
    // copper spars are physically connected to the same existing wing hinge;
    // this is neither a floating warning decal nor an extra simulated actor.
    // It only appears with the already public close encounter, and does not
    // alter threat movement, collision, gameplay authority or private state.
    const tideSail=pivot(crest,`articulated tidal sail ${shellHalf.side}`,[shellHalf.side*.13,.08,-.18]);
    const sailBlade=rounded(tideSail,frondGlass,[shellHalf.side*.13,.55,-.045],[.33,1.06,.12],.055);
    sailBlade.rotation.z=shellHalf.side*.18;
    const sailRidge=rounded(tideSail,bronze,[shellHalf.side*.12,.48,.03],[.065,.89,.045],.018);
    sailRidge.rotation.z=shellHalf.side*.18;
    bar(tideSail,bronze,[0,0,0],[shellHalf.side*.12,.40,-.045],.045);
    bar(tideSail,ember,[shellHalf.side*.12,.22,.05],[shellHalf.side*.22,.79,.04],.024);
    crest.visible=false;
    shellHalf.fronds=crest;
    shellHalf.tideSail=tideSail;
  }
  const warningSpines=pivot(body,'activated warden spines',[0,.48,-.13]);
  for (const side of [-1,0,1]) {
    const height=side===0?.32:.21;
    bar(warningSpines,ember,[side*.23,0,-.01],[side*.23,height,.1],.043);
    ball(warningSpines,ember,[side*.23,height,.1],[.095,.105,.084]);
  }
  warningSpines.visible=false;
  // Original sculpted signal heart: an actual three-dimensional mechanism
  // nested beneath the paired armor plates, never a billboard or invented foe.
  // It appears only while this *publicly disclosed* guardian attends to Pip.
  // The fixed modeled assembly is constructed once, not during animation.
  const signalCore=pivot(body,'opened guardian signal heart',[0,.32,.02]);
  ball(signalCore,dark,[0,-.02,0],[.25,.10,.32]);
  ball(signalCore,ember,[0,.065,0],[.165,.115,.235]);
  // First authentic 320px capture rejected a bright circular rim: it read
  // like a collectible coin, not Thornback's anatomy. Give the mechanism a
  // unique vertical *split spine* and two bolted side guards instead. All
  // three occupy genuine local 3D depth inside the opening carapace.
  const heartSpine=rounded(signalCore,ember,[0,.16,0],[.18,.38,.24],.038);
  heartSpine.rotation.x=-.16;
  for (const side of [-1,1]) {
    const guard=rounded(signalCore,claw,[side*.17,.09,-.07],[.09,.24,.37],.031);
    guard.rotation.z=side*.30;
  }
  signalCore.visible=false;
  const head=pivot(body,'warden mask',[0,.08,.62]);
  // A broad forward bronze mask makes approach direction distinct from the dark elytra.
  ball(head,bronze,[0,0,0],[.37,.245,.27]);
  rounded(head,dark,[0,.035,.205],[.62,.19,.1],.045);
  for (const side of [-1,1]) {
    const brow=rounded(head,claw,[side*.17,.119,.254],[.23,.055,.04],.012); brow.rotation.z=-side*.2;
    const lens=rounded(head,red,[side*.17,.032,.268],[.205,.095,.035],.025); lens.rotation.z=-side*.13;
    ring(head,bronze,[side*.275,-.05,.13],.057,.014);
  }
  const jaws=[], antennae=[];
  for (const side of [-1,1]) {
    const jaw=pivot(head,`mandible ${side}`,[side*.21,-.11,.12]);
    bar(jaw,bronze,[0,0,0],[side*.09,-.1,.22],.045);
    bar(jaw,claw,[side*.09,-.1,.22],[-side*.065,-.085,.34],.035);
    jaws.push(jaw);
    const antenna=pivot(head,`antenna ${side}`,[side*.18,.18,.015]);
    bar(antenna,dark,[0,0,0],[side*.13,.35,.13],.025);
    bar(antenna,bronze,[side*.13,.35,.13],[side*.2,.49,.23],.018);
    ball(antenna,red,[side*.2,.49,.23],[.036,.047,.035]);
    antennae.push({antenna,side});
  }
  const legs=[];
  for (const side of [-1,1]) for (let i=0;i<3;i++) {
    const z=.36-i*.36;
    const hip=pivot(body,`leg ${side} ${i}`,[side*.4,-.09,z]);
    ball(hip,bronze,[0,0,0],[.095,.095,.095]);
    const reach=side*.32, sweep=(1-i)*.11;
    bar(hip,plates,[0,0,0],[reach,.05,sweep],.07);
    const knee=pivot(hip,'claw knee',[reach,.05,sweep]);
    ball(knee,bronze,[0,0,0],[.086,.085,.085]);
    bar(knee,dark,[0,0,0],[side*.13,-.55,.055],.045);
    bar(knee,claw,[side*.13,-.55,.055],[side*.16,-.7,.15],.035);
    ball(knee,plates,[side*.085,-.32,.033],[.057,.16,.07]);
    // The foremost two legs have real articulated pincer tips. During a
    // source-disclosed close encounter they brace toward Pip; they never
    // imply an additional attack, collision, or simulated creature.
    let pincer=null;
    if (i===0) {
      pincer=pivot(knee,`foreleg pincer ${side}`,[side*.13,-.55,.055]);
      bar(pincer,claw,[0,0,0],[side*.12,-.06,.22],.047);
      bar(pincer,claw,[side*.12,-.06,.22],[side*.01,-.16,.30],.032);
    }
    legs.push({hip,knee,side,index:i,pincer});
  }
  r.finish(); let gait=0, stride=0;
  return {group,dispose:r.dispose,update(options={}) {
    if (r.isDisposed()) return;
    const s=motionState(options), amount=s.reduced?0:1;
    face(group,options.heading,s.delta,s.reduced);
    const reacting=!s.win&&!s.lose&&Number.isFinite(options.attentionHeading);
    const alert=reacting?Math.max(0,Math.min(1,finite(options.attentionStrength))):0;
    const relativeLook=reacting?Math.atan2(Math.sin(options.attentionHeading-group.rotation.y),Math.cos(options.attentionHeading-group.rotation.y)):0;
    const lookYaw=Math.max(-.58,Math.min(.58,relativeLook))*alert;
    warningSpines.visible=alert>.24;
    warningSpines.scale.y=1+alert*.4+(s.reduced?0:Math.sin(s.time*4.1)*.04);
    // A real physical encounter unveils the internal lantern-heart through
    // the opening shell. Keep the reduced-motion pose steady and clear the
    // entire assembly on terminal/withdrawn public snapshots.
    signalCore.visible=alert>.24;
    signalCore.position.y=.32+alert*.19;
    signalCore.scale.setScalar(.78+alert*.5);
    // Explicit neutral +0 also matters for deterministic exact pose resets:
    // negative signed zero from Math.sin(time) * 0 must never be retained.
    signalCore.rotation.y=alert>0&&!s.reduced?Math.sin(s.time*1.7)*alert*.15:0;
    // Two readable shell wings open independently in true close encounters.
    // Reduced-motion retains a static disclosed-warning silhouette.
    for (const shellHalf of elytra) {
      // A neutral/terminal pose must reset to +0 on both sides. Negative
      // zero can survive a signed-angle multiplication and break strict
      // replay/teardown invariants even when the rendered pose looks flat.
      // The previous 0.68-rad/full-strength opening barely changed the
      // source-verified warden silhouette. Separate the halves farther, then
      // expose a physically attached dorsal seam while the threat is public.
      shellHalf.wing.rotation.z=alert>0?shellHalf.side*Math.min(1.12,alert*1.18):0;
      shellHalf.wing.rotation.y=alert>0?-shellHalf.side*alert*.45:0;
      shellHalf.wing.rotation.x=alert>0?-alert*.12:0;
      shellHalf.lining.visible=alert>.24;
      shellHalf.seam.visible=alert>.24;
      // The moving blades mark the original guardian's *visible* uncoiling,
      // not a new attack or an undisclosed move. Reduced motion leaves one
      // steady pose; terminal/withdrawn attention hides the complete crest.
      shellHalf.fronds.visible=alert>.24;
      shellHalf.fronds.rotation.y=alert>0&&!s.reduced
        ?shellHalf.side*Math.sin(s.time*1.3)*alert*.075:0;
      // Real hinge flex is slow and capped, with no new frame allocations.
      // Reduced motion holds the disclosed pose; withdrawal/terminal restores
      // exact +0, never leaving a ghost danger cue in the hidden maze.
      shellHalf.tideSail.rotation.z=alert>0
        ?shellHalf.side*(.16+alert*.25+(s.reduced?0:Math.sin(s.time*1.2)*.035*alert)):0;
    }
    stride=approach(stride,s.moving?1:0,12,s.delta); gait+=s.delta*(10+s.danger*3)*stride;
    body.position.y=.79-(s.win?.07:0)+amount*(Math.sin(s.time*2)*.012+Math.sin(gait*2)*stride*.018);
    body.rotation.x=-s.danger*.055-alert*.11;
    body.rotation.y=lookYaw*.4;
    body.rotation.z=Math.sin(relativeLook)*alert*.06;
    for (const leg of legs) {
      const phase=gait+(leg.index%2===0?0:Math.PI)+(leg.side===1?Math.PI:0);
      leg.hip.rotation.y=Math.sin(phase)*stride*.24*amount;
      leg.hip.rotation.z=leg.side*Math.max(0,Math.cos(phase))*stride*.15*amount;
      leg.knee.rotation.z=-leg.side*Math.max(0,Math.cos(phase))*stride*.16*amount;
      leg.hip.rotation.x=leg.index===0?-alert*.32:leg.index===2?alert*.08:0;
      leg.knee.rotation.x=leg.index===0?alert*.20:0;
      if (leg.pincer) leg.pincer.rotation.y=alert>0?leg.side*alert*.42:0;
    }
    // An encounter is a physical performance: the already-modeled front
    // legs plant outward, antennae track the publicly visible explorer and
    // mandibles flare. Neutral, result and reduced-motion poses stay stable.
    // No new mesh, material, random draw, network fact or game command runs
    // in this render loop.
    head.position.z=.62+alert*.07;
    head.rotation.x=s.win?.16:s.lose?-.13:-.045-s.danger*.065;
    head.rotation.y=Math.sin(s.time*.8)*.08*(1-stride)*amount*(1-alert)+lookYaw;
    for (const {antenna,side} of antennae) {
      antenna.rotation.z=side*(.08+alert*.40)+(s.reduced?0:Math.sin(s.time*1.7+side)*.04)*(1-alert*.5);
      antenna.rotation.x=alert*.22+(s.reduced?0:Math.sin(s.time*2.3+side)*.03);
      antenna.rotation.y=lookYaw*.4;
    }
    for (let i=0;i<2;i++) {
      jaws[i].rotation.y=(i===0?-1:1)*(.06+s.danger*.13+alert*.16+Math.sin(s.time*3)*.025*amount);
      jaws[i].rotation.z=(i===0?-1:1)*alert*.14;
    }
    red.emissiveIntensity=s.win?.45:s.lose?1.6:1.1+s.danger*.4+alert*1.25;
  }};
}
