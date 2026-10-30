/** Original LAST LIGHT combatants. Render-only articulated rigs; yaw zero faces +Z. */
export function createCombatant(THREE, agent) {
  const group = new THREE.Group();
  group.name = `combatant-${agent.id}`;
  const hash = Array.from(String(agent.id)).reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
  const role = String(agent.archetype || 'ranger').toLowerCase();
  const heavy = /heavy|tank|jugger|bulwark|breach/.test(role);
  const medic = /medic|support|heal/.test(role);
  const scout = /scout|runner|recon|path/.test(role);
  const sniper = /snip|marks|ranger|hunter/.test(role);
  const engineer = /engineer|tech|sapper|mechanic/.test(role);
  const stealth = /assassin|ghost|stealth|rogue/.test(role);
  const build = heavy ? 1.32 : scout || stealth ? .86 : medic ? .94 : 1.04;
  const resources = new Set();
  const disposable = r => { resources.add(r); return r; };
  // Original woven roughness, deterministic and shared by all fabric on this rig.
  const pixels = new Uint8Array(32 * 32 * 4);
  for (let y = 0; y < 32; y++) for (let x = 0; x < 32; x++) {
    const i = (y * 32 + x) * 4, v = 175 + ((x ^ y) & 1) * 35 + ((x * 17 + y * 13) % 13);
    pixels[i] = pixels[i + 1] = pixels[i + 2] = v; pixels[i + 3] = 255;
  }
  const weave = disposable(new THREE.DataTexture(pixels, 32, 32));
  weave.wrapS = weave.wrapT = THREE.RepeatWrapping; weave.repeat.set(3, 3); weave.needsUpdate = true;
  const mat = (color, roughness = .65, metalness = .1, extra = {}) => disposable(new THREE.MeshStandardMaterial({ color, roughness, metalness, ...extra }));
  const accent = mat(agent.color || '#f18c56', .4, .3);
  const cloth = mat(stealth ? '#1e3040' : '#293c48', .94, 0, { roughnessMap: weave });
  const armor = mat(heavy ? '#52616b' : '#d8d7c9', .48, .48);
  const dark = mat('#17252d', .46, .45);
  const trim = mat('#b0b8b5', .31, .7);
  const visor = mat(stealth ? '#edb7ff' : '#69dfdb', .19, .7, { emissive: stealth ? '#49245b' : '#124d51', emissiveIntensity: .48 });
  const glow = mat(medic ? '#91ffc6' : '#ffe4a1', .35, .2, { emissive: medic ? '#239761' : '#bf7431', emissiveIntensity: .7 });
  const flashMat = disposable(new THREE.MeshBasicMaterial({ color: '#fff0ae', transparent: true, opacity: .9, depthWrite: false, toneMapped: false }));
  const plate = mat('#ffffff', .48, .42, { vertexColors: true });
  const plated = new Set([armor, accent, trim]);
  const fabric = mat('#ffffff', .88, .05, {vertexColors:true, roughnessMap:weave});
  const skin = mat(medic?'#af7759':'#ca9671',.86,0);
  const eyes = mat('#dedbc9',.65,0);
  const cube = (w,h,d) => {
    // Beveled octagonal section: tailored hard surfaces without primitive box silhouettes.
    const b = Math.min(w,h,d) * .17, s = new THREE.Shape();
    s.moveTo(-w/2+b,-h/2); s.lineTo(w/2-b,-h/2); s.lineTo(w/2,-h/2+b);
    s.lineTo(w/2,h/2-b); s.lineTo(w/2-b,h/2); s.lineTo(-w/2+b,h/2);
    s.lineTo(-w/2,h/2-b); s.lineTo(-w/2,-h/2+b); s.closePath();
    const g = new THREE.ExtrudeGeometry(s,{depth:Math.max(.001,d-2*b),bevelEnabled:true,bevelThickness:b,bevelSize:b*.48,bevelSegments:1,steps:1});
    g.translate(0,0,-d/2+b); return g;
  };
  const ellipsoid = (x,y,z) => new THREE.SphereGeometry(1,12,8).scale(x,y,z);
  // Sculpted elliptical ring surfaces give continuous anatomical and garment volumes.
  function sculpt(rings, depth=1, sides=14) {
    const points=rings.map(([y,r])=>new THREE.Vector2(r,y));
    return new THREE.LatheGeometry(points,sides).scale(1,1,depth);
  }
  const taper = (top,bottom,height) => new THREE.CylinderGeometry(top,bottom,height,8,1);
  // Bake material batches per joint: details add triangles, not individual draw calls.
  function part(parent, name, position, pieces) {
    const joint = new THREE.Group(); joint.name = name; joint.position.set(...position); parent.add(joint);
    const buckets = new Map();
    for (const [material, geom, pos = [0,0,0], rot = [0,0,0]] of pieces) {
      let g = geom.index ? geom.toNonIndexed() : geom;
      if (g !== geom) geom.dispose();
      const matrix = new THREE.Matrix4().compose(new THREE.Vector3(...pos),new THREE.Quaternion().setFromEuler(new THREE.Euler(...rot)),new THREE.Vector3(1,1,1));
      g.applyMatrix4(matrix);
      const tinted=plated.has(material)||material===dark||material===cloth;
      const surface = plated.has(material) ? plate : material===dark||material===cloth ? fabric : material;
      const colors = new Float32Array(g.getAttribute('position').count * 3);
      const color = tinted ? material.color : new THREE.Color(1,1,1);
      for (let i=0;i<colors.length;i+=3) { colors[i]=color.r; colors[i+1]=color.g; colors[i+2]=color.b; }
      g.setAttribute('color',new THREE.BufferAttribute(colors,3));
      if (!buckets.has(surface)) buckets.set(surface,[]); buckets.get(surface).push(g);
    }
    for (const [material, geometries] of buckets) {
      const result = disposable(new THREE.BufferGeometry());
      for (const key of ['position','normal','uv','color']) {
        const arrays = geometries.map(g => g.getAttribute(key));
        const merged = new Float32Array(arrays.reduce((sum,a) => sum+a.array.length,0)); let offset=0;
        arrays.forEach(a => { merged.set(a.array,offset); offset+=a.array.length; });
        result.setAttribute(key,new THREE.BufferAttribute(merged,arrays[0].itemSize));
      }
      geometries.forEach(g=>g.dispose()); result.computeBoundingSphere();
      const mesh = new THREE.Mesh(result,material); mesh.castShadow = true; mesh.receiveShadow = true; joint.add(mesh);
    }
    return joint;
  }
  const rig = new THREE.Group(); rig.position.y=1.18; group.add(rig);
  const pelvis = part(rig,'pelvis',[0,0,0],[
    [cloth,sculpt([[-.23,.16],[-.19,.29],[0,.32],[.15,.27],[.25,.26]],.7)],
    [dark,sculpt([[.04,.32],[.12,.32]],.73)],
    [trim,cube(.12,.075,.035),[0,.08,.24]],
    [cloth,ellipsoid(.12,.16,.07),[-.29,-.04,.17]], [cloth,ellipsoid(.12,.16,.07),[.29,-.04,.17]],
    [accent,cube(.12,.035,.025),[-.3,.01,.24]],
  ]);
  const chestPieces=[
    [cloth,sculpt([[-.4,.24],[-.3,.28],[-.15,.29],[.02,.35],[.23,.41*build],[.38,.39*build],[.47,.26],[.52,.16]],.64)],
    [armor,ellipsoid(.30*build,.26,.13),[0,.22,.19]],
    [accent,ellipsoid(.26*build,.10,.065),[0,.36,.27]],
    [cloth,sculpt([[-.25,.276],[-.23,.278]],.65)],
    [cloth,sculpt([[-.12,.30],[-.10,.303]],.65)],
    [trim,cube(.025,.32,.02),[-.25*build,.20,.27],[0,0,-.2]],
    [trim,cube(.025,.32,.02),[.25*build,.20,.27],[0,0,.2]],
    [cloth,cube(.075,.43,.045),[-.29*build,.17,.26],[0,0,-.2]],
    [cloth,cube(.075,.43,.045),[.29*build,.17,.26],[0,0,.2]],
    [accent,cube(.10,.16,.045),[.14,.08,.30]],
    [glow,cube(.08,.022,.02),[-.13,.26,.32]],
    [cloth,taper(.145,.19,.21),[0,.52,0]],
  ];
  if(medic) chestPieces.push([glow,cube(.16,.04,.02),[0,.22,.325]],[glow,cube(.04,.16,.02),[0,.22,.325]]);
  if(heavy) chestPieces.push([armor,ellipsoid(.35,.20,.12),[0,-.08,.20]],[accent,ellipsoid(.43,.12,.23),[0,.43,0]]);
  // Stitched side ribs and rolled fabric creases remain in the same material batch.
  for(const side of [-1,1]) for(let j=0;j<3;j++) chestPieces.push([cloth,ellipsoid(.028,.012,.105),[side*(.265+j*.02),-.21+j*.075,.025],[0,0,side*.15]]);
  const torso = part(rig,'chest',[0,.42,0],chestPieces);
  if (scout || stealth) part(torso,'neck-scarf',[0,.51,0],[[accent,sculpt([[-.10,.24],[0,.26],[.08,.22]],.85)],[cloth,ellipsoid(.29,.38,.035),[-.21,-.32,-.24],[0,.18,-.18]]]);
  let helmetPieces;
  if(medic||scout){
    helmetPieces=[
      [skin,sculpt([[-.23,.075],[-.19,.13],[-.1,.17],[.04,.185],[.16,.18],[.23,.12],[.26,.01]],.88)],
      [skin,ellipsoid(.10,.085,.06),[0,-.14,.11]],
      [skin,ellipsoid(.037,.075,.07),[0,.015,.15]],
      [skin,ellipsoid(.04,.065,.03),[-.185,0,0]], [skin,ellipsoid(.04,.065,.03),[.185,0,0]],
      [eyes,ellipsoid(.043,.021,.017),[-.078,.065,.147]], [eyes,ellipsoid(.043,.021,.017),[.078,.065,.147]],
      [dark,ellipsoid(.016,.019,.01),[-.074,.065,.165]], [dark,ellipsoid(.016,.019,.01),[.074,.065,.165]],
      [dark,ellipsoid(.052,.013,.02),[-.077,.10,.146],[0,0,-.1]], [dark,ellipsoid(.052,.013,.02),[.077,.10,.146],[0,0,.1]],
      [dark,ellipsoid(.053,.009,.009),[0,-.105,.17]],
      [dark,ellipsoid(.19,.15,.17),[0,.19,-.035]],
      [accent,ellipsoid(.20,.065,.19),[0,.23,-.03]],
      [dark,ellipsoid(.06,.09,.05),[-.20,.02,-.015]],
      [trim,taper(.012,.012,.19),[-.17,-.05,.09],[1.1,0,.4]],
    ];
    if(scout) helmetPieces.push([dark,ellipsoid(.08,.05,.05),[-.09,.21,.15]],[dark,ellipsoid(.08,.05,.05),[.09,.21,.15]],[visor,ellipsoid(.06,.033,.02),[-.09,.21,.19]],[visor,ellipsoid(.06,.033,.02),[.09,.21,.19]]);
    if(medic) helmetPieces.push([dark,ellipsoid(.11,.15,.11),[0,.09,-.18]],[glow,cube(.09,.02,.015),[0,.26,.16]]);
  }else{
    helmetPieces=[
      [dark,ellipsoid(.21,.25,.19)],
      [armor,sculpt([[-.14,.17],[-.02,.23],[.14,.24],[.25,.15],[.29,.025]],.84)],
      [dark,ellipsoid(.205,.095,.055),[0,.055,.17]],
      [visor,ellipsoid(.175,.05,.025),[0,.065,.221]],
      [armor,ellipsoid(.09,.12,.10),[-.14,-.10,.12],[0,.2,-.2]],
      [armor,ellipsoid(.09,.12,.10),[.14,-.10,.12],[0,-.2,.2]],
      [dark,ellipsoid(.09,.08,.06),[0,-.13,.18]],
      [trim,cube(.08,.017,.012),[0,-.12,.237]],
      [accent,ellipsoid(.055,.06,.18),[0,.27,-.015]],
      [accent,ellipsoid(.055,.075,.09),[-.225,.02,0]], [accent,ellipsoid(.055,.075,.09),[.225,.02,0]],
    ];
    if(heavy) helmetPieces.push([armor,ellipsoid(.25,.10,.19),[0,-.19,0]],[accent,ellipsoid(.25,.08,.12),[0,.20,.12]]);
  }
  const head = part(torso,'head',[0,.80,0],helmetPieces);
  const packPieces = [
    [cloth,ellipsoid(heavy?.31:medic?.29:.20,medic?.37:.29,heavy?.22:.15),[0,.13,-.27]],
    [accent,ellipsoid(medic?.24:.17,.20,.045),[0,.15,heavy?-.47:-.40]],
    [trim,cube(.28,.025,.025),[0,.27,heavy?-.5:-.44]],
  ];
  if (medic) packPieces.push([glow,cube(.21,.05,.02),[0,.16,-.455]],[glow,cube(.05,.21,.02),[0,.16,-.455]]);
  if (engineer || heavy) for (const side of [-1,1]) packPieces.push([armor,sculpt([[-.25,.055],[-.20,.11],[.21,.11],[.26,.055]],1),[side*.31,.13,-.29]],[accent,taper(.115,.115,.07),[side*.31,.20,-.29]]);
  if (scout || sniper) packPieces.push([trim,taper(.012,.012,.56),[.17,.61,-.25]]);
  part(torso,'equipment',[0,0,0],packPieces);
  const legs=[]; const arms=[];
  for (const side of [-1,1]) {
    const legPieces=[
      [cloth,sculpt([[-.55,.105],[-.45,.13],[-.29,.165*build],[-.10,.18*build],[.045,.13]],.83)],
      [armor,ellipsoid(.115*build,.19,.06),[side*.055,-.27,.10],[0,0,side*.08]],
      [cloth,ellipsoid(.16,.025,.12),[0,-.43,.01],[0,0,side*.14]],
      [cloth,ellipsoid(.15,.022,.12),[0,-.37,.01],[0,0,-side*.14]],
      [accent,cube(.025,.23,.02),[side*.13,-.25,.10],[0,0,side*.08]],
    ];
    if(scout)legPieces.push([cloth,ellipsoid(.10,.15,.06),[side*.15,-.12,0]]);
    const leg=part(rig,`thigh-${side}`,[side*.205*build,-.05,0],legPieces);
    const knee=part(rig,`shin-${side}`,[0,0,0],[
      [cloth,sculpt([[-.52,.075],[-.39,.09],[-.23,.13],[-.07,.12],[.04,.115]],.87)],
      [armor,ellipsoid(.125*build,.12,.075),[0,-.025,.09]],
      [accent,ellipsoid(.09,.17,.04),[0,-.25,.105]],
      [cloth,ellipsoid(.10,.026,.085),[0,-.42,0]],
    ]);
    const boot=part(rig,`boot-${side}`,[0,0,0],[
      [dark,ellipsoid(.12,.11,.20),[0,-.055,.055]],
      [dark,cube(.245,.05,.38),[0,-.115,.05]],
      [armor,ellipsoid(.115,.055,.105),[0,-.06,.15]],
      [cloth,sculpt([[-.09,.10],[.07,.10],[.12,.075]],.85),[0,0,-.025]],
      [trim,cube(.09,.018,.02),[0,.015,.092]],
      [trim,cube(.09,.018,.02),[0,-.025,.12]],
    ]);
    legs.push({leg,knee,boot,side,hip:new THREE.Vector3(side*.205*build,-.05,0)});
    const shoulder=side*.40*build;
    const arm=part(torso,`upper-arm-${side}`,[shoulder,.34,0],[
      [cloth,sculpt([[-.45,.09],[-.34,.11],[-.19,.15],[0,.16],[.09,.10]],.92)],
      [accent,ellipsoid(.19*build,heavy?.25:role==='vanguard'&&side===-1?.23:.15,.18),[side*.025,-.035,0]],
      [armor,ellipsoid(.105,.14,.025),[side*.035,-.15,.12]],
      [cloth,ellipsoid(.12,.022,.105),[0,-.33,0],[0,0,.2]],
    ]);
    const elbow=part(torso,`forearm-${side}`,[0,0,0],[
      [cloth,sculpt([[-.43,.065],[-.34,.085],[-.18,.115],[-.03,.105],[.04,.09]],.9)],
      [armor,sculpt([[-.31,.075],[-.25,.105],[-.10,.115],[-.045,.09]],.78),[0,0,.005]],
      [accent,sculpt([[-.36,.09],[-.31,.09]],.9)],
    ]);
    const handPieces=[[dark,ellipsoid(.065,.08,.045),[0,-.02,0]]];
    for(let j=0;j<4;j++)handPieces.push([dark,ellipsoid(.016,.045,.022),[-.047+j*.031,-.075,.025],[.55,0,0]]);
    handPieces.push([dark,ellipsoid(.022,.05,.025),[side*.065,-.01,.035],[.4,0,side*.4]],[armor,ellipsoid(.05,.045,.015),[0,-.01,-.04]]);
    const hand=part(torso,`hand-${side}`,[0,0,0],handPieces);
    arms.push({arm,elbow,hand,side,shoulder:new THREE.Vector3(shoulder,.34,0)});
  }
  // The weapon, its stock contact and both grasp targets share one coordinate frame.
  // Receiver origin is close to the torso; the support wrist sits under the fore-end.
  let gunLength=.32;
  const stockX=arms[0].shoulder.x+.05+.24;
  const stockAngle=Math.atan2(-stockX,.22);
  const weaponPieces=[
    [dark,cube(.17,.18,.32),[0,.015,.18]],
    [armor,cube(.185,.08,.29),[0,.095,.19]],
    [accent,cube(.018,.075,.18),[.095,.02,.18]],
    // Sculpted pistol grip and separate magazine identify the firing-hand location.
    [dark,cube(.075,.18,.095),[0,-.14,.115],[.20,0,0]],
    [dark,cube(.095,.21,.13),[0,-.16,.29],[-.18,0,0]],
    [trim,cube(.1,.03,.14),[0,-.265,.31]],
    [dark,cube(.095,.025,.14),[0,-.10,.17]],
    [dark,cube(.025,.10,.025),[.04,-.155,.21]],
    // Angled cheek stock terminates against the inner firing shoulder, not in space.
    [dark,cube(.105,.12,Math.hypot(stockX,.22)),[stockX/2,.015,.03],[0,stockAngle,0]],
    [armor,cube(.10,.06,.18),[stockX*.45,.085,.035],[0,stockAngle,0]],
    [dark,cube(.115,.22,.055),[stockX,-.01,-.08]],
    [accent,cube(.12,.027,.06),[stockX,.07,-.08]],
    // Solid vented handguard gives the forward hand a substantial supported surface.
    [dark,cube(.16,.15,.38),[0,.025,.49]],
    [armor,cube(.175,.055,.33),[0,.085,.48]],
    [accent,cube(.025,.07,.26),[-.088,.01,.48]],
    [dark,cube(.045,.035,.48),[0,.15,.30]],
    [trim,cube(.04,.025,.035),[0,.18,.62]],
    [visor,cube(.035,.025,.02),[0,.185,.18]],
  ];
  for(let i=0;i<4;i++)weaponPieces.push([dark,cube(.018,.023,.035),[-.104,.04,.37+i*.065]],[trim,cube(.11,.012,.015),[0,-.055,.39+i*.065]]);
  const weapon=part(torso,'weapon',[-.24,.35,.08],weaponPieces);
  const barrel = part(weapon,'barrel',[0,.035,.67],[[dark,taper(.035,.035,1),[0,0,.5],[Math.PI/2,0,0]],[trim,taper(.045,.045,.09),[0,0,.83],[Math.PI/2,0,0]],[dark,taper(.055,.055,.15),[0,0,.99],[Math.PI/2,0,0]]]);
  const scope = part(weapon,'scope',[0,.22,.24],[[dark,taper(.052,.052,.25),[0,0,0],[Math.PI/2,0,0]],[visor,taper(.04,.04,.008),[0,0,-.13],[Math.PI/2,0,0]]]);
  const grip = new THREE.Object3D();grip.name='firing-grip';grip.position.set(.015,-.11,.115);weapon.add(grip);
  const foregrip = new THREE.Object3D();foregrip.name='support-grip';foregrip.position.set(.055,-.09,.55);weapon.add(foregrip);
  const stockContact = new THREE.Object3D();stockContact.name='stock-contact';stockContact.position.set(stockX,-.01,-.08);weapon.add(stockContact);
  const muzzle = new THREE.Object3D(); muzzle.name='muzzle'; muzzle.position.set(0,.035,.67+gunLength*1.065); weapon.add(muzzle);
  const flashGeo=disposable(new THREE.ConeGeometry(.11,.38,5)); flashGeo.rotateX(Math.PI/2); flashGeo.translate(0,0,.18);
  const flash = new THREE.Mesh(flashGeo,flashMat); muzzle.add(flash); flash.visible=false;
  const shadowPixels=new Uint8Array(32*32*4);
  for(let y=0;y<32;y++)for(let x=0;x<32;x++){
    const i=(y*32+x)*4, r=Math.hypot((x-15.5)/15.5,(y-15.5)/15.5);
    shadowPixels[i]=shadowPixels[i+1]=shadowPixels[i+2]=18;
    shadowPixels[i+3]=Math.round(Math.pow(Math.max(0,1-r),1.8)*125);
  }
  const shadowTexture=disposable(new THREE.DataTexture(shadowPixels,32,32));shadowTexture.needsUpdate=true;
  const shadowMaterial=disposable(new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-1,toneMapped:false}));
  const contacts=legs.map(()=>{const m=new THREE.Mesh(disposable(new THREE.PlaneGeometry(.8,.85)),shadowMaterial);m.rotation.x=-Math.PI/2;m.position.y=.014;group.add(m);return m;});
  group.userData.muzzle=muzzle;
  group.userData.archetype=role;
  // Host may set these presentation preferences without editing a snapshot.
  group.userData.reducedMotion=false; group.userData.reducedFlash=false;
  let prevX=agent.x, prevZ=agent.z, lastFire=agent.fireTick, lastHit=agent.hitTick;
  let gait=hash%30, velocity=0, recoil=0, hit=0, death=agent.alive===false?1:0;
  const damp=(a,b,k,dt)=>a+(b-a)*(1-Math.exp(-k*dt));
  const down=new THREE.Vector3(0,-1,0), direction=new THREE.Vector3(), pole=new THREE.Vector3(), middle=new THREE.Vector3();
  const delta=new THREE.Vector3(), target=new THREE.Vector3(), secondDirection=new THREE.Vector3();
  function solve(upper,lower,origin,end,poleHint,lengthA,lengthB){
    direction.subVectors(end,origin);const raw=direction.length(),distance=Math.min(lengthA+lengthB-.0001,Math.max(.001,raw));direction.normalize();
    const along=(lengthA*lengthA-lengthB*lengthB+distance*distance)/(2*distance);
    const height=Math.sqrt(Math.max(0,lengthA*lengthA-along*along));
    pole.copy(poleHint).addScaledVector(direction,-poleHint.dot(direction)).normalize();
    middle.copy(origin).addScaledVector(direction,along).addScaledVector(pole,height);
    upper.position.copy(origin);delta.subVectors(middle,origin).normalize();upper.quaternion.setFromUnitVectors(down,delta);
    lower.position.copy(middle);secondDirection.subVectors(end,middle).normalize();lower.quaternion.setFromUnitVectors(down,secondDirection);
  }
  const armPole=new THREE.Vector3(),legPole=new THREE.Vector3(0,0,1);
  function update(a,dt,elapsed) {
    dt=Math.min(.1,Math.max(0,Number.isFinite(dt)?dt:0)); elapsed=Number.isFinite(elapsed)?elapsed:0;
    const motion=group.userData.reducedMotion?.35:1;
    const distance=Math.hypot(a.x-prevX,a.z-prevZ); prevX=a.x; prevZ=a.z;
    velocity=damp(velocity,Math.min(8,distance/Math.max(dt,.001)),10,dt);
    const moving=Math.min(1,velocity/3.4)*(a.alive===false?0:1);
    gait+=dt*(6+velocity*1.55);
    if(a.fireTick!==lastFire){ if(a.fireTick>=0) recoil=1; lastFire=a.fireTick; }
    if(a.hitTick!==lastHit){ if(a.hitTick>=0) hit=1; lastHit=a.hitTick; }
    recoil=Math.max(0,recoil-dt*9); hit=Math.max(0,hit-dt*5);
    death=damp(death,a.alive===false?1:0,7,dt);
    const weaponType=String(a.weapon||'').toLowerCase();
    const longshot=/longshot|snip/.test(weaponType), scatter=/scatter|shotgun|cannon/.test(weaponType), smg=/smg/.test(weaponType);
    gunLength=longshot?.58:scatter?.20:smg?.14:.32;
    barrel.scale.set(scatter?1.8:1,scatter?1.8:1,gunLength);
    muzzle.position.z=.67+gunLength*1.065; scope.visible=longshot;
    const state=`${a.action||''} ${a.intent||''}`.toLowerCase();
    // Descriptive intent such as "Recovering supplies" is navigation, not a timed action.
    const healing=a.action==='healing', reload=a.action==='reloading';
    const aiming=/attack|shoot|fire|engage|aim|combat/.test(state)||recoil>0;
    const breath=Math.sin(elapsed*2.8+(hash%8))*.012;
    rig.position.y=1.16+Math.abs(Math.sin(gait))*moving*.025*motion-death*.88;
    rig.rotation.set(-moving*.055*motion,0,death*1.47);
    pelvis.rotation.y=Math.sin(gait)*moving*.045*motion;
    torso.rotation.set(.025-recoil*.055*motion+hit*.06*motion,.08+Math.sin(gait)*moving*.045*motion,Math.sin(gait)*moving*.025*motion);
    torso.position.y=.42+breath*(1-death);
    head.rotation.set(healing?.20:.035+breath*.6,aiming?0:Math.sin(elapsed*.75+hash)*.08,hit*.07*motion);
    legs.forEach(({leg,knee,boot,side,hip},i)=>{
      const phase=gait+i*Math.PI,swing=Math.sin(phase), lift=Math.max(0,Math.cos(phase))*moving*.19*motion;
      target.set(side*(.235*build),.15-rig.position.y+lift,(i===0?-.16:.22)*(1-moving)+swing*.29*moving*motion);
      solve(leg,knee,hip,target,legPole,.53,.50);
      boot.position.copy(target);boot.rotation.set(-Math.max(0,-swing)*moving*.12,side*.12,0);
      contacts[i].position.x=target.x;contacts[i].position.z=target.z+.05;
      contacts[i].scale.setScalar(1-lift*.9);contacts[i].visible=death<.5;
    });
    weapon.position.set(-.24,.35-recoil*.009,.08-recoil*.035);
    weapon.rotation.set(reload?-.20:healing?.60:recoil*.025,healing?-.30:0,reload?-.20:0);
    weapon.updateMatrix();
    arms.forEach(({arm,elbow,hand,side,shoulder},i)=>{
      target.copy(i===0?grip.position:foregrip.position).applyMatrix4(weapon.matrix);
      if(reload&&i===1){target.y-=.13+Math.sin(elapsed*10)*.06*motion;target.z-=.08;}
      if(healing&&i===1)target.set(.02,-.10,.30);
      const reach=heavy?1.16:1.025;arm.scale.y=reach;elbow.scale.y=reach;
      armPole.set(i===0?-.85:.25,-1,i===0?-.18:.08);solve(arm,elbow,shoulder,target,armPole,.44*reach,.43*reach);
      hand.position.copy(target);hand.quaternion.copy(weapon.quaternion);hand.rotateX(i===0?.10:-1.55);hand.rotateZ(i===0?-.08:.35);
    });
    weapon.visible=death<.95;
    flash.visible=recoil>.48&&a.alive!==false&&!group.userData.reducedFlash;
    flash.scale.setScalar(.7+recoil*.4); flash.rotation.z=elapsed*25;
    glow.emissiveIntensity=.7+((healing||reload)?Math.sin(elapsed*7)*.35:0);
    plate.emissive.setHex(hit>0?0x843b25:0); plate.emissiveIntensity=hit*.45;
  }
  update(agent,0,0);
  return { group, update, dispose(){ resources.forEach(r=>r.dispose()); resources.clear(); group.removeFromParent(); } };
}
