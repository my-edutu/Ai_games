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
  // Ember is the first individually authored outfit. Other silhouettes keep their
  // existing construction until this slice has survived the real-camera review.
  const ember = agent.id === 'ember';
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
  const accent = mat(agent.color || '#f18c56', .4, .18);
  const cloth = mat(ember ? '#384650' : stealth ? '#1e3040' : '#293c48', .94, 0, { roughnessMap: weave });
  const armor = mat(heavy ? '#52616b' : '#d8d7c9', .48, .24);
  const dark = mat('#17252d', .46, .35);
  const trim = mat('#b0b8b5', .31, .7);
  const visor = mat(stealth ? '#edb7ff' : '#69dfdb', .19, .7, { emissive: stealth ? '#49245b' : '#124d51', emissiveIntensity: .48 });
  const glow = mat(medic ? '#91ffc6' : '#ffe4a1', .35, .2, { emissive: medic ? '#239761' : '#bf7431', emissiveIntensity: .7 });
  const flashMat = disposable(new THREE.MeshBasicMaterial({ color: '#fff0ae', transparent: true, opacity: .9, depthWrite: false, toneMapped: false }));
  const skin = mat(ember ? '#b87c62' : medic?'#af7759':'#ca9671',.77,0);
  const eyes = mat('#bcbcb1',.34,0);
  const jacket = mat('#d5d3bd', .91, 0, { roughnessMap: weave });
  const webbing = mat('#817e65', .96, 0, { roughnessMap: weave });
  const rubber = mat('#243139', .9, 0);
  const hair = mat('#302327', .83, 0);
  const glove = mat('#aebbb0', .8, 0);
  const lip = mat('#89554c', .76, 0);
  // Per-finish atlas: a shared draw can still contain actual cloth, skin, paint
  // and exposed metal. UV1 selects roughness/metalness; UV0 remains geometric.
  // The high-tier standard shader needs no injection, and the host's Lambert
  // fallback keeps the authored vertex tints and owns none of these resources.
  const finishes = [accent,cloth,armor,dark,trim,skin,eyes,jacket,webbing,rubber,hair,glove,lip];
  const finishIndex = new Map(finishes.map((material,index)=>[material,index]));
  const atlasWidth=finishes.length*32, surfacePixels=new Uint8Array(atlasWidth*32*4);
  finishes.forEach((material,index)=>{
    for(let y=0;y<32;y++)for(let x=0;x<32;x++){
      const i=(y*atlasWidth+index*32+x)*4;
      const grain=material.roughnessMap ? .92+(((x^y)&1)*.045)+((x*17+y*13)%13)/370 : 1;
      surfacePixels[i]=255;surfacePixels[i+1]=Math.round(material.roughness*grain*255);
      surfacePixels[i+2]=Math.round(material.metalness*255);surfacePixels[i+3]=255;
    }
  });
  const surfaceMap=disposable(new THREE.DataTexture(surfacePixels,atlasWidth,32));
  surfaceMap.channel=1;surfaceMap.magFilter=surfaceMap.minFilter=THREE.NearestFilter;surfaceMap.needsUpdate=true;
  const plate = mat('#ffffff',1,1,{vertexColors:true,roughnessMap:surfaceMap,metalnessMap:surfaceMap});
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
  // Unlike the legacy lathe, this loft has independent front/back depth, an
  // authored centre line and a flattened cross-section for anatomy and cloth.
  function loft(rows,sides=20,deform=null) {
    const positions=[],uvs=[],indices=[];
    rows.forEach((row,j)=>{
      const [y,width,front,back,cx=0,cz=0,power=1]=row;
      for(let i=0;i<=sides;i++){
        const angle=i/sides*Math.PI*2,s=Math.sin(angle),c=Math.cos(angle);
        const vertex={x:cx+width*Math.sign(s)*Math.pow(Math.abs(s),power),y,z:cz+(c>=0?front:back)*Math.sign(c)*Math.pow(Math.abs(c),power)};
        if(deform)deform(vertex,angle,j);
        positions.push(vertex.x,vertex.y,vertex.z);uvs.push(i/sides,j/(rows.length-1));
        if(j<rows.length-1&&i<sides){const a=j*(sides+1)+i,b=a+sides+1;indices.push(a,a+1,b,b,a+1,b+1);}
      }
    });
    for(const [row,j,reverse] of [[rows[0],0,true],[rows.at(-1),rows.length-1,false]]){
      const centre=positions.length/3;positions.push(row[4]||0,row[0],row[5]||0);uvs.push(.5,.5);
      for(let i=0;i<sides;i++){const a=j*(sides+1)+i;indices.push(centre,reverse?a+1:a,reverse?a:a+1);}
    }
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();
    // UV seam vertices occupy the same point and must share their lighting normal.
    const normals=geometry.getAttribute('normal'),seamNormal=new THREE.Vector3();
    for(let j=0;j<rows.length;j++){
      const first=j*(sides+1),last=first+sides;
      seamNormal.set(normals.getX(first)+normals.getX(last),normals.getY(first)+normals.getY(last),normals.getZ(first)+normals.getZ(last)).normalize();
      normals.setXYZ(first,seamNormal.x,seamNormal.y,seamNormal.z);normals.setXYZ(last,seamNormal.x,seamNormal.y,seamNormal.z);
    }
    return geometry;
  }
  function panel(outline,depth=.025,bevel=.005,bend=0) {
    const shape=new THREE.Shape();outline.forEach(([x,y],i)=>i?shape.lineTo(x,y):shape.moveTo(x,y));shape.closePath();
    const geometry=new THREE.ExtrudeGeometry(shape,{depth,bevelEnabled:bevel>0,bevelThickness:bevel,bevelSize:bevel,bevelSegments:1,steps:1});
    const positions=geometry.getAttribute('position');
    for(let i=0;i<positions.count;i++)positions.setZ(i,positions.getZ(i)-depth/2-bend*positions.getX(i)**2);
    geometry.computeVertexNormals();return geometry;
  }
  function cord(points,radius=.008,segments=12,sides=5) {
    return new THREE.TubeGeometry(new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),segments,radius,sides,false);
  }
  function ribbon(points,width=.04,thickness=.012) {
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p))),positions=[],uvs=[],indices=[];
    const samples=12;
    for(let i=0;i<=samples;i++){
      const p=curve.getPoint(i/samples),tangent=curve.getTangent(i/samples),across=new THREE.Vector3(-tangent.y,tangent.x,0).normalize();
      for(const [side,depth] of [[-1,-1],[1,-1],[1,1],[-1,1]]){
        const v=p.clone().addScaledVector(across,side*width/2);positions.push(v.x,v.y,v.z+depth*thickness/2);uvs.push(i/samples,(side+1)/2);
      }
      if(i<samples)for(let j=0;j<4;j++){const a=i*4+j,b=i*4+(j+1)%4;indices.push(a,b,a+4,b,b+4,a+4);}
    }
    indices.push(0,2,1,0,3,2,samples*4,samples*4+1,samples*4+2,samples*4,samples*4+2,samples*4+3);
    const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));geometry.setIndex(indices);geometry.computeVertexNormals();return geometry;
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
      const tinted=finishIndex.has(material);
      const surface = tinted ? plate : material;
      const colors = new Float32Array(g.getAttribute('position').count * 3);
      const color = tinted ? material.color : new THREE.Color(1,1,1);
      const authored=g.getAttribute('color');
      for (let i=0;i<colors.length;i+=3) { colors[i]=color.r*(authored?authored.array[i]:1); colors[i+1]=color.g*(authored?authored.array[i+1]:1); colors[i+2]=color.b*(authored?authored.array[i+2]:1); }
      g.setAttribute('color',new THREE.BufferAttribute(colors,3));
      const uv=g.getAttribute('uv'),finishUV=new Float32Array(uv.count*2),slot=finishIndex.get(material)||0;
      for(let i=0;i<uv.count;i++){
        finishUV[i*2]=(slot*32+.5+((uv.getX(i)*3)%1+1)%1*30)/atlasWidth;
        finishUV[i*2+1]=(.5+((uv.getY(i)*3)%1+1)%1*30)/32;
      }
      g.setAttribute('uv1',new THREE.BufferAttribute(finishUV,2));
      if (!buckets.has(surface)) buckets.set(surface,[]); buckets.get(surface).push(g);
    }
    for (const [material, geometries] of buckets) {
      const result = disposable(new THREE.BufferGeometry());
      for (const key of ['position','normal','uv','uv1','color']) {
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
  const pelvis = part(rig,'pelvis',[0,0,0],ember?[
    [cloth,loft([[-.23,.12,.12,.15],[-.19,.235,.17,.18],[-.09,.286,.19,.20],[.03,.28,.18,.18],[.14,.25,.16,.16]],24)],
    [webbing,loft([[.055,.284,.188,.19],[.12,.263,.177,.178]],24)],
    [trim,panel([[-.054,-.034],[.054,-.034],[.054,.034],[-.054,.034]],.025),[-.018,.086,.194]],
    [rubber,cube(.062,.035,.012),[-.018,.086,.213]],
    [webbing,cube(.038,.11,.025),[-.18,.084,.156],[0,-.45,.08]],
    [webbing,cube(.038,.11,.025),[.18,.084,.156],[0,.45,-.08]],
    // A rectangular field pouch sits on its belt, rather than floating hip balls.
    [webbing,panel([[-.11,-.14],[.10,-.13],[.12,.10],[.07,.145],[-.10,.145]],.115,.015),[.315,-.08,.035],[0,.48,-.10]],
    [jacket,panel([[-.10,-.025],[.10,-.025],[.10,.04],[-.10,.04]],.012,.004),[.342,.015,.102],[0,.48,-.10]],
    [accent,panel([[-.055,-.018],[.055,-.018],[.055,.018],[-.055,.018]],.008,.002),[.347,-.065,.104],[0,.48,-.10]],
    [trim,cube(.032,.045,.015),[.35,-.015,.116],[0,.48,-.10]],
    [rubber,panel([[-.065,-.12],[.065,-.12],[.075,.13],[-.065,.13]],.055,.008),[-.29,-.075,-.025],[0,-.65,.08]],
  ]:[
    [cloth,sculpt([[-.23,.16],[-.19,.29],[0,.32],[.15,.27],[.25,.26]],.7)],
    [dark,sculpt([[.04,.32],[.12,.32]],.73)],
    [trim,cube(.12,.075,.035),[0,.08,.24]],
    [cloth,ellipsoid(.12,.16,.07),[-.29,-.04,.17]], [cloth,ellipsoid(.12,.16,.07),[.29,-.04,.17]],
    [accent,cube(.12,.035,.025),[-.3,.01,.24]],
  ]);
  const chestPieces=ember?[
    // One tapered jacket volume carries the ribcage, abdomen and shoulder slope.
    [jacket,loft([[-.37,.25,.155,.15],[-.27,.255,.172,.155],[-.12,.273,.19,.165],[.04,.31,.205,.18],[.20,.345,.21,.18],[.34,.354,.18,.16],[.43,.285,.135,.125],[.49,.16,.10,.09]],28,
      (v,a,j)=>{if(j<3){v.z+=Math.cos(a*3+j*.6)*.004;v.y+=Math.sin(a*2+.4)*.006;}})],
    [cloth,loft([[-.40,.25,.158,.153],[-.35,.253,.16,.155]],24)],
    [skin,loft([[.43,.113,.09,.085,0,-.012],[.52,.102,.082,.078,0,-.015],[.65,.095,.08,.075,0,-.01]],20)],
    [cloth,loft([[.46,.142,.112,.105],[.51,.134,.104,.098],[.55,.12,.093,.09]],24)],
    // Off-centre zipper and broad, closely fitted rescue webbing give the cloth
    // an intelligible construction. Chest plates are shallow tailored polygons.
    [cloth,ribbon([[-.012,-.35,.17],[-.018,-.10,.199],[-.028,.14,.218],[-.045,.36,.184]],.028,.008)],
    [trim,cube(.025,.048,.012),[-.043,.32,.202]],
    [webbing,ribbon([[-.21,.44,.115],[-.255,.31,.184],[-.226,.05,.207],[-.195,-.27,.176]],.075,.019)],
    [webbing,ribbon([[.21,.43,.115],[.255,.27,.192],[.22,.02,.209],[.18,-.27,.176]],.064,.019)],
    [rubber,panel([[-.125,-.075],[.10,-.08],[.135,.055],[.075,.10],[-.125,.07]],.025,.007,.25),[-.08,.18,.224]],
    [accent,panel([[-.12,-.065],[.095,-.072],[.126,.05],[.072,.09],[-.12,.063]],.027,.006,.25),[-.08,.185,.242]],
    [jacket,panel([[-.10,-.055],[.105,-.055],[.105,.055],[.07,.075],[-.10,.075]],.038,.008,.35),[.115,-.115,.211]],
    [webbing,cube(.15,.027,.015),[.12,-.075,.239]],
    [trim,cube(.023,.05,.014),[.12,-.10,.251]],
    [rubber,panel([[-.044,-.07],[.044,-.07],[.05,.06],[-.035,.08]],.039,.006),[-.255,.25,.202],[0,-.2,-.11]],
    [trim,cube(.038,.012,.015),[-.25,.275,.23],[0,-.2,-.11]],
    [glow,cube(.026,.012,.01),[-.259,.245,.231],[0,-.2,-.11]],
    [rubber,cord([[-.26,.31,.18],[-.28,.40,.08],[-.18,.48,-.05]],.009,12)],
    [armor,panel([[-.035,-.047],[.04,-.047],[.04,.047],[-.035,.047]],.01,.003),[.235,.21,.222],[0,.15,.05]],
    [accent,cube(.052,.016,.012),[.237,.225,.237],[0,.15,.05]],
    [accent,cube(.026,.016,.012),[.225,.195,.237],[0,.15,.05]],
    [webbing,ribbon([[-.24,-.29,.17],[0,-.285,.19],[.24,-.28,.17]],.06,.017)],
  ]:[
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
  if(medic&&!ember) chestPieces.push([glow,cube(.16,.04,.02),[0,.22,.325]],[glow,cube(.04,.16,.02),[0,.22,.325]]);
  if(heavy) chestPieces.push([armor,ellipsoid(.35,.20,.12),[0,-.08,.20]],[accent,ellipsoid(.43,.12,.23),[0,.43,0]]);
  // Stitched side ribs and rolled fabric creases remain in the same material batch.
  if(!ember)for(const side of [-1,1]) for(let j=0;j<3;j++) chestPieces.push([cloth,ellipsoid(.028,.012,.105),[side*(.265+j*.02),-.21+j*.075,.025],[0,0,side*.15]]);
  const torso = part(rig,'chest',[0,.42,0],chestPieces);
  if (scout || stealth) part(torso,'neck-scarf',[0,.51,0],[[accent,sculpt([[-.10,.24],[0,.26],[.08,.22]],.85)],[cloth,ellipsoid(.29,.38,.035),[-.21,-.32,-.24],[0,.18,-.18]]]);
  let helmetPieces;
  if(ember){
    const profile=[[-.215,.028,.065,.055],[-.193,.080,.105,.080],[-.165,.112,.112,.105],[-.115,.145,.113,.125],[-.055,.165,.113,.138],[.015,.169,.113,.145],[.070,.164,.117,.145],[.135,.160,.121,.139],[.185,.146,.113,.127],[.222,.107,.087,.095],[.241,.045,.040,.045],[.247,.003,.003,.003]];
    const rowAt=y=>{
      let i=0;while(i<profile.length-2&&profile[i+1][0]<y)i++;
      const a=profile[i],b=profile[i+1],t=(y-a[0])/(b[0]-a[0]);return [y,...[1,2,3].map(k=>a[k]+(b[k]-a[k])*t)];
    };
    const gaussian=(x,y,cx,cy,sx,sy)=>Math.exp(-(((x-cx)/sx)**2)-((y-cy)/sy)**2);
    const facialRelief=(x,y)=>
      .035*gaussian(x,y,0,.030,.025,.079)+.057*gaussian(x,y,0,-.030,.028,.030)
      +.018*gaussian(x,y,-.027,-.042,.017,.014)+.018*gaussian(x,y,.027,-.042,.017,.014)
      -.026*gaussian(x,y,-.068,.051,.037,.024)-.026*gaussian(x,y,.068,.051,.037,.024)
      +.014*gaussian(x,y,-.068,.086,.043,.016)+.014*gaussian(x,y,.068,.086,.043,.016)
      +.018*gaussian(x,y,-.101,-.021,.037,.035)+.018*gaussian(x,y,.101,-.021,.037,.035)
      +.010*gaussian(x,y,0,-.112,.060,.027)+.011*gaussian(x,y,0,-.175,.058,.025);
    const faceZ=(x,y)=>{const row=rowAt(y),c=Math.sqrt(Math.max(0,1-(x/row[1])**2));return row[2]*Math.pow(c,.55)+facialRelief(x,y)*Math.pow(c,3);};
    const faceRows=Array.from({length:37},(_,i)=>rowAt(-.215+i*.462/36));
    const face=loft(faceRows,48,(v,a,j)=>{const c=Math.cos(a);if(c>0)v.z=faceRows[j][2]*Math.pow(c,.55)+facialRelief(v.x,v.y)*Math.pow(c,3);});
    const facePositions=face.getAttribute('position'),complexion=new Float32Array(facePositions.count*3);
    for(let i=0;i<facePositions.count;i++){
      const x=facePositions.getX(i),y=facePositions.getY(i),z=facePositions.getZ(i);
      const cheek=z>0?gaussian(Math.abs(x),y,.105,-.034,.041,.046):0;
      const beard=z>0?gaussian(x,y,0,-.164,.105,.056)*.065:0;
      complexion[i*3]=1+cheek*.045-beard;complexion[i*3+1]=1-cheek*.045-beard;complexion[i*3+2]=1-cheek*.025-beard;
    }
    face.setAttribute('color',new THREE.BufferAttribute(complexion,3));
    helmetPieces=[[skin,face]];
    for(const side of [-1,1]){
      const ex=side*.068,ey=.051,ez=faceZ(ex,ey)+.015;
      helmetPieces.push(
        [skin,loft([[-.061,.012,.018,.015],[-.041,.028,.026,.024],[.005,.030,.022,.025],[.033,.018,.019,.019],[.044,.004,.007,.008]],12),[side*.17,-.014,-.018],[0,0,side*-.1]],
        [lip,ellipsoid(.011,.030,.008),[side*.184,-.021,.006]],
        [eyes,ellipsoid(.031,.012,.014),[ex,ey,ez]],
        [hair,ellipsoid(.009,.010,.003),[ex+side*.001,ey,ez+.013]],
        [rubber,ellipsoid(.0045,.006,.002),[ex+side*.001,ey,ez+.016]],
        [skin,cord([[ex-.032,ey,ez+.004],[ex-.016,ey+.012,ez+.012],[ex+.009,ey+.013,ez+.013],[ex+.031,ey+.002,ez+.004]],.0038,10)],
        [skin,cord([[ex-.032,ey-.001,ez+.003],[ex-.012,ey-.010,ez+.012],[ex+.013,ey-.010,ez+.012],[ex+.031,ey+.001,ez+.004]],.003,10)],
        [hair,ribbon([[ex-.034,.092,faceZ(ex-.034,.092)+.003],[ex-.011,.098,faceZ(ex-.011,.098)+.005],[ex+.017,.095,faceZ(ex+.017,.095)+.004],[ex+.033,.087,faceZ(ex+.033,.087)+.003]],.008,.003)],
        [lip,ellipsoid(.0065,.0026,.003),[side*.020,-.049,faceZ(side*.020,-.049)+.002]],
      );
    }
    const mouthY=-.117;
    helmetPieces.push(
      [lip,ribbon([[-.035,mouthY,faceZ(-.035,mouthY)+.001],[-.017,mouthY+.002,faceZ(-.017,mouthY)+.003],[0,mouthY-.001,faceZ(0,mouthY)+.003],[.017,mouthY+.001,faceZ(.017,mouthY)+.003],[.035,mouthY,faceZ(.035,mouthY)+.001]],.007,.002)],
      [skin,cord([[-.026,mouthY-.009,faceZ(-.026,mouthY-.009)+.001],[0,mouthY-.011,faceZ(0,mouthY-.011)+.003],[.026,mouthY-.009,faceZ(.026,mouthY-.009)+.001]],.0035,12)],
    );
    const hairRows=Array.from({length:10},(_,i)=>{const t=i/9,r=Math.sqrt(Math.max(.0002,1-t*t));return [.135+t*.168,.174*r,.143*r,.157*r,-t*.022,-.021,1];});
    helmetPieces.push([hair,loft(hairRows,32,(v,a,j)=>{v.y+=(Math.cos(a)*.026+Math.sin(a)*.022)*(1-j/9);v.z-=j/9*.012;})]);
    for(let i=0;i<5;i++){
      const x=-.132+i*.048;
      helmetPieces.push([hair,cord([[x,.175+(i*.008),.104],[x+.035,.241+i*.006,.092],[x+.038,.282-i*.003,.012],[x+.015,.267,-.092]],.008,14,5)]);
    }
    helmetPieces.push(
      [accent,panel([[-.028,-.010],[.030,-.010],[.025,.010],[-.028,.010]],.010,.002),[.145,.155,.067],[0,.65,.5]],
      [rubber,panel([[-.022,-.052],[.022,-.052],[.025,.045],[-.02,.045]],.038,.007),[-.19,-.009,-.024],[0,-.65,0]],
      [trim,cube(.016,.038,.01),[-.207,-.005,-.007],[0,-.65,0]],
      [rubber,cord([[-.192,-.025,.005],[-.181,-.07,.08],[-.115,-.096,.137]],.006,12)],
      [rubber,ellipsoid(.016,.010,.010),[-.112,-.097,.14]],
    );
  }else if(medic||scout){
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
  const packPieces = ember ? [
    [rubber,panel([[-.19,-.28],[.19,-.28],[.205,.22],[.14,.29],[-.16,.28],[-.205,.17]],.18,.025),[0,.10,-.24]],
    [jacket,panel([[-.17,-.23],[.17,-.23],[.17,.20],[.12,.25],[-.14,.24],[-.17,.14]],.055,.012),[0,.11,-.365]],
    [accent,panel([[-.16,-.052],[.16,-.052],[.16,.07],[-.16,.07]],.018,.004),[0,.23,-.408]],
    [webbing,cube(.045,.51,.025),[-.12,.10,-.405]],
    [webbing,cube(.045,.51,.025),[.12,.10,-.405]],
    [trim,cube(.064,.035,.028),[-.12,.02,-.425]],
    [trim,cube(.064,.035,.028),[.12,.02,-.425]],
    [armor,loft([[-.14,.037,.039,.039],[-.12,.055,.055,.055],[.12,.055,.055,.055],[.15,.035,.035,.035]],12),[-.25,.01,-.28]],
    [accent,loft([[-.035,.057,.057,.057],[.025,.057,.057,.057]],12),[-.25,.01,-.28]],
    [rubber,cord([[-.25,.16,-.28],[-.26,.31,-.25],[-.19,.39,-.19]],.012,12)],
    [glow,cube(.075,.016,.012),[.03,.23,-.424]],
  ]:[
    [cloth,ellipsoid(heavy?.31:medic?.29:.20,medic?.37:.29,heavy?.22:.15),[0,.13,-.27]],
    [accent,ellipsoid(medic?.24:.17,.20,.045),[0,.15,heavy?-.47:-.40]],
    [trim,cube(.28,.025,.025),[0,.27,heavy?-.5:-.44]],
  ];
  if (medic&&!ember) packPieces.push([glow,cube(.21,.05,.02),[0,.16,-.455]],[glow,cube(.05,.21,.02),[0,.16,-.455]]);
  if (engineer || heavy) for (const side of [-1,1]) packPieces.push([armor,sculpt([[-.25,.055],[-.20,.11],[.21,.11],[.26,.055]],1),[side*.31,.13,-.29]],[accent,taper(.115,.115,.07),[side*.31,.20,-.29]]);
  if (scout || sniper) packPieces.push([trim,taper(.012,.012,.56),[.17,.61,-.25]]);
  part(torso,'equipment',[0,0,0],packPieces);
  const legs=[]; const arms=[];
  for (const side of [-1,1]) {
    const legPieces=ember?[
      [cloth,loft([[-.55,.09,.09,.085],[-.47,.108,.115,.10],[-.34,.132,.135,.125],[-.16,.155,.16,.15],[.025,.151,.155,.155],[.075,.13,.14,.14]],22,
        (v,a,j)=>{if(j===1||j===2){v.y+=Math.sin(a*2+side*.8)*.013;v.z+=Math.cos(a*3+side)*.004;}})],
      [webbing,panel([[-.077,-.10],[.077,-.10],[.084,.085],[.06,.11],[-.077,.11]],.035,.008),[side*.125,-.205,.074],[0,side*.75,side*-.03]],
      [cloth,panel([[-.077,-.025],[.077,-.025],[.077,.025],[-.077,.025]],.014,.003),[side*.14,-.145,.092],[0,side*.75,side*-.03]],
      [accent,cube(.017,.10,.008),[side*.185,-.22,.069],[0,side*.75,0]],
      [cloth,cord([[-.085,-.42,.082],[.005,-.445,.118],[.082,-.423,.078]],.005,12)],
    ]:[
      [cloth,sculpt([[-.55,.105],[-.45,.13],[-.29,.165*build],[-.10,.18*build],[.045,.13]],.83)],
      [armor,ellipsoid(.115*build,.19,.06),[side*.055,-.27,.10],[0,0,side*.08]],
      [cloth,ellipsoid(.16,.025,.12),[0,-.43,.01],[0,0,side*.14]],
      [cloth,ellipsoid(.15,.022,.12),[0,-.37,.01],[0,0,-side*.14]],
      [accent,cube(.025,.23,.02),[side*.13,-.25,.10],[0,0,side*.08]],
    ];
    if(scout)legPieces.push([cloth,ellipsoid(.10,.15,.06),[side*.15,-.12,0]]);
    const leg=part(rig,`thigh-${side}`,[side*.205*build,-.05,0],legPieces);
    const knee=part(rig,`shin-${side}`,[0,0,0],ember?[
      [cloth,loft([[-.52,.068,.07,.068],[-.43,.076,.078,.082],[-.29,.09,.092,.112],[-.13,.106,.105,.122],[.03,.104,.10,.10],[.07,.091,.09,.09]],20,
        (v,a,j)=>{if(j===1||j===4)v.y+=Math.cos(a*2+side*.5)*.011;})],
      [rubber,panel([[-.081,-.09],[.081,-.09],[.095,.04],[.055,.093],[-.07,.09],[-.095,.025]],.028,.012,.65),[0,-.018,.102]],
      [side<0?armor:accent,panel([[-.066,-.074],[.066,-.074],[.076,.034],[.046,.078],[-.056,.075],[-.077,.02]],.027,.008,.65),[0,-.018,.129]],
      [webbing,loft([[-.39,.081,.084,.085],[-.345,.086,.088,.092]],20)],
      [side<0?jacket:cloth,loft([[-.51,.073,.076,.073],[-.41,.081,.084,.085]],20)],
      [trim,cube(.033,.028,.015),[side*.069,-.368,.053],[0,side*.6,0]],
    ]:[
      [cloth,sculpt([[-.52,.075],[-.39,.09],[-.23,.13],[-.07,.12],[.04,.115]],.87)],
      [armor,ellipsoid(.125*build,.12,.075),[0,-.025,.09]],
      [accent,ellipsoid(.09,.17,.04),[0,-.25,.105]],
      [cloth,ellipsoid(.10,.026,.085),[0,-.42,0]],
    ]);
    const boot=part(rig,`boot-${side}`,[0,0,0],ember?[
      [rubber,loft([[-.122,.103,.215,.112,0,.035,.65],[-.087,.112,.221,.115,0,.035,.65],[-.068,.106,.210,.108,0,.035,.7]],24)],
      [dark,loft([[-.078,.101,.206,.102,0,.035,.72],[-.035,.103,.195,.100,0,.025,.80],[.018,.092,.129,.09,0,.005,.90],[.09,.075,.075,.074,0,-.01,1]],24)],
      [cloth,loft([[.015,.082,.095,.085,0,-.005],[.105,.076,.081,.075,0,-.012],[.14,.074,.075,.072,0,-.012]],20)],
      [webbing,panel([[-.066,-.025],[.066,-.025],[.066,.025],[-.066,.025]],.015,.004,.35),[0,.045,.087],[-.25,0,0]],
      [trim,cube(.031,.025,.017),[side*.031,.047,.103],[-.25,0,0]],
      [armor,panel([[-.074,-.023],[.074,-.023],[.082,.012],[.058,.037],[-.058,.037],[-.082,.012]],.014,.007,.6),[0,-.047,.177],[-.75,0,0]],
      [rubber,cube(.12,.014,.18),[0,-.129,.08]],
    ]:[
      [dark,ellipsoid(.12,.11,.20),[0,-.055,.055]],
      [dark,cube(.245,.05,.38),[0,-.115,.05]],
      [armor,ellipsoid(.115,.055,.105),[0,-.06,.15]],
      [cloth,sculpt([[-.09,.10],[.07,.10],[.12,.075]],.85),[0,0,-.025]],
      [trim,cube(.09,.018,.02),[0,.015,.092]],
      [trim,cube(.09,.018,.02),[0,-.025,.12]],
    ]);
    legs.push({leg,knee,boot,side,hip:new THREE.Vector3(side*.205*build,-.05,0)});
    const shoulder=side*(ember?.356:.40*build);
    const arm=part(torso,`upper-arm-${side}`,[shoulder,.34,0],ember?[
      [skin,loft([[-.46,.078,.078,.076],[-.35,.092,.092,.086],[-.21,.114,.107,.104],[-.04,.125,.113,.114],[.075,.091,.09,.089]],20)],
      [jacket,loft([[-.245,.105,.108,.107],[-.20,.122,.12,.12],[-.06,.14,.132,.131],[.045,.124,.12,.12],[.09,.083,.085,.083]],22)],
      [webbing,loft([[-.246,.108,.111,.11],[-.209,.123,.123,.123]],22)],
      [side<0?accent:armor,panel([[-.10,-.095],[.085,-.085],[.106,.055],[.045,.093],[-.092,.07]],.02,.008,1.45),[side*.014,-.055,.124],[0,side*.23,side*-.06]],
      [jacket,cube(.075,.018,.012),[side*.018,-.064,.151],[0,side*.23,side*-.06]],
    ]:[
      [cloth,sculpt([[-.45,.09],[-.34,.11],[-.19,.15],[0,.16],[.09,.10]],.92)],
      [accent,ellipsoid(.19*build,heavy?.25:role==='vanguard'&&side===-1?.23:.15,.18),[side*.025,-.035,0]],
      [armor,ellipsoid(.105,.14,.025),[side*.035,-.15,.12]],
      [cloth,ellipsoid(.12,.022,.105),[0,-.33,0],[0,0,.2]],
    ]);
    const elbow=part(torso,`forearm-${side}`,[0,0,0],ember?[
      [skin,loft([[-.43,.054,.058,.053],[-.35,.064,.066,.063],[-.22,.09,.088,.081],[-.07,.098,.094,.088],[.045,.081,.079,.079]],20)],
      [side<0?webbing:jacket,loft([[-.35,.071,.074,.069],[-.31,.081,.082,.078],[-.22,.097,.094,.088],[-.13,.104,.101,.095]],20)],
      [side<0?rubber:cloth,panel([[-.055,-.085],[.055,-.085],[.061,.069],[-.046,.087]],.02,.006,.7),[0,-.235,.09]],
      [accent,panel([[-.042,-.055],[.042,-.055],[.042,.045],[-.042,.055]],.015,.004,.7),[0,-.235,.107]],
      [glove,loft([[-.434,.06,.062,.059],[-.398,.063,.064,.061]],18)],
    ]:[
      [cloth,sculpt([[-.43,.065],[-.34,.085],[-.18,.115],[-.03,.105],[.04,.09]],.9)],
      [armor,sculpt([[-.31,.075],[-.25,.105],[-.10,.115],[-.045,.09]],.78),[0,0,.005]],
      [accent,sculpt([[-.36,.09],[-.31,.09]],.9)],
    ]);
    const handPieces=[];
    if(ember&&side<0){
      handPieces.push([glove,loft([[-.008,.026,.031,.026],[.03,.030,.036,.027],[.085,.025,.036,.027],[.115,.018,.026,.023]],14)]);
      for(let j=0;j<3;j++){
        const y=.028+j*.027;
        handPieces.push([glove,cord([[.002,y,.02],[.028,y,.055],[.064,y,.055],[.086,y,.032]],.012,9,6)],
          [skin,cord([[.060,y,.055],[.086,y,.032],[.084,y,.012]],.011,6,6)]);
      }
      handPieces.push(
        [skin,cord([[.002,.105,.019],[.025,.116,.069],[.065,.111,.078],[.080,.094,.053]],.011,12,6)],
        [glove,cord([[-.008,.095,-.017],[.030,.101,-.031],[.069,.088,-.010]],.015,10,6)],
        [skin,cord([[.055,.095,-.022],[.077,.073,.001],[.078,.052,.018]],.012,8,6)],
        [jacket,panel([[-.016,-.033],[.016,-.033],[.017,.034],[-.017,.034]],.006,.003),[-.026,.061,-.006],[0,-Math.PI/2,0]],
      );
    }else if(ember){
      handPieces.push([glove,ellipsoid(.054,.031,.066),[-.032,.025,0]]);
      for(let j=0;j<4;j++){
        const z=-.041+j*.026;
        handPieces.push([glove,cord([[-.025,.027,z],[-.074,.032,z],[-.113,.065,z],[-.117,.092,z]],.0115,10,6)],
          [skin,cord([[-.113,.077,z],[-.113,.104,z],[-.097,.121,z]],.0105,7,6)]);
      }
      handPieces.push(
        [glove,cord([[.002,.020,-.035],[.023,.065,-.024],[.009,.104,-.002]],.015,10,6)],
        [skin,cord([[.016,.088,-.016],[.007,.114,.007],[-.018,.122,.019]],.012,8,6)],
        [jacket,panel([[-.033,-.043],[.026,-.043],[.032,.041],[-.033,.041]],.007,.004),[-.032,-.003,0],[Math.PI/2,0,0]],
      );
    }else{
      handPieces.push([dark,ellipsoid(.065,.08,.045),[0,-.02,0]]);
      for(let j=0;j<4;j++)handPieces.push([dark,ellipsoid(.016,.045,.022),[-.047+j*.031,-.075,.025],[.55,0,0]]);
      handPieces.push([dark,ellipsoid(.022,.05,.025),[side*.065,-.01,.035],[.4,0,side*.4]],[armor,ellipsoid(.05,.045,.015),[0,-.01,-.04]]);
    }
    const hand=part(torso,`hand-${side}`,[0,0,0],handPieces);
    arms.push({arm,elbow,hand,side,shoulder:new THREE.Vector3(shoulder,.34,0)});
  }
  // The weapon, its stock contact and both grasp targets share one coordinate frame.
  // Receiver origin is close to the torso; the support wrist sits under the fore-end.
  let gunLength=.32;
  const weaponX=ember?-.20:-.24,weaponY=ember?.33:.35,weaponZ=ember?.13:.08;
  const stockX=arms[0].shoulder.x+(ember?.045:.05)-weaponX,stockZ=ember?-.045:-.08;
  const stockAngle=Math.atan2(-stockX,ember?.20:.22);
  const weaponPieces=ember?[
    [dark,cube(.14,.14,.28),[0,.015,.22]],
    [armor,cube(.15,.048,.32),[0,.107,.25]],
    [accent,panel([[-.105,-.028],[.11,-.028],[.11,.023],[-.075,.04],[-.105,.025]],.012,.003),[-.078,.028,.23],[0,-Math.PI/2,0]],
    [trim,cube(.018,.047,.068),[.08,.026,.23]],
    [rubber,cube(.075,.18,.095),[0,-.14,.115],[.20,0,0]],
    [dark,cube(.083,.19,.12),[0,-.135,.315],[-.13,0,0]],
    [armor,cube(.094,.025,.125),[0,-.23,.327],[-.13,0,0]],
    [trim,cord([[.042,-.072,.13],[.044,-.075,.213],[.044,-.153,.211],[.042,-.177,.157]],.008,12,5)],
    [rubber,cube(.105,.10,Math.hypot(stockX,.20)),[stockX/2,.015,.055],[0,stockAngle,0]],
    [armor,cube(.108,.036,.18),[stockX*.45,.082,.055],[0,stockAngle,0]],
    [rubber,panel([[-.052,-.10],[.052,-.10],[.06,.083],[.037,.108],[-.055,.09]],.046,.008),[stockX,.005,stockZ]],
    [accent,cube(.11,.025,.05),[stockX,.074,stockZ]],
    [dark,cube(.144,.132,.28),[0,.022,.52]],
    [armor,cube(.151,.038,.29),[0,.098,.52]],
    [rubber,cube(.12,.021,.23),[0,-.055,.52]],
    [trim,cube(.025,.024,.026),[0,.145,.625]],
    [rubber,cube(.033,.023,.45),[0,.137,.36]],
    [visor,cube(.025,.016,.018),[0,.157,.235]],
  ]:[
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
  for(let i=0;i<4;i++)weaponPieces.push([rubber,cube(.012,.022,.026),[ember?-.079:-.104,.033,.412+i*.052]],[trim,cube(ember?.08:.11,.008,.011),[0,-.057,.412+i*.052]]);
  const weapon=part(torso,'weapon',[weaponX,weaponY,weaponZ],weaponPieces);
  const barrel = part(weapon,'barrel',[0,.035,.67],[[dark,taper(.035,.035,1),[0,0,.5],[Math.PI/2,0,0]],[trim,taper(.045,.045,.09),[0,0,.83],[Math.PI/2,0,0]],[dark,taper(.055,.055,.15),[0,0,.99],[Math.PI/2,0,0]]]);
  const scope = part(weapon,'scope',[0,.22,.24],[[dark,taper(.052,.052,.25),[0,0,0],[Math.PI/2,0,0]],[visor,taper(.04,.04,.008),[0,0,-.13],[Math.PI/2,0,0]]]);
  const grip = new THREE.Object3D();grip.name='firing-grip';grip.position.set(ember?-.055:.015,ember?-.20:-.11,ember?.10:.115);weapon.add(grip);
  const foregrip = new THREE.Object3D();foregrip.name='support-grip';foregrip.position.set(ember?.07:.055,ember?-.105:-.09,ember?.49:.55);weapon.add(foregrip);
  const stockContact = new THREE.Object3D();stockContact.name='stock-contact';stockContact.position.set(stockX,ember?.005:-.01,stockZ);weapon.add(stockContact);
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
    weapon.position.set(weaponX,weaponY-recoil*.009,weaponZ-recoil*.035);
    weapon.rotation.set(reload?-.20:healing?.60:recoil*.025,healing?-.30:0,reload?-.20:0);
    weapon.updateMatrix();
    arms.forEach(({arm,elbow,hand,side,shoulder},i)=>{
      target.copy(i===0?grip.position:foregrip.position).applyMatrix4(weapon.matrix);
      if(reload&&i===1){target.y-=.13+Math.sin(elapsed*10)*.06*motion;target.z-=.08;}
      if(healing&&i===1)target.set(.02,-.10,.30);
      const reach=heavy?1.16:1.025;arm.scale.y=reach;elbow.scale.y=reach;
      armPole.set(i===0?-.85:.25,-1,i===0?-.18:.08);solve(arm,elbow,shoulder,target,armPole,.44*reach,.43*reach);
      hand.position.copy(target);hand.quaternion.copy(weapon.quaternion);
      if(!ember){hand.rotateX(i===0?.10:-1.55);hand.rotateZ(i===0?-.08:.35);}
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
