import * as THREE from '/tower/vendor/three.module.js';
import { SCALE, ARC, angleFor, pointFor, guardianGateAnchorX } from './coordinates.mjs';
import { createStoneSurfaceAsset, applyStoneSurface } from './world-surface.mjs';

// All geometry is presentation-only. Collision extents come exclusively from the snapshot.
export const THEMES = Object.freeze({
  foundry: { name:'Foundry', sky:0x45333f, fog:0x99796d, accent:0xff9d42, ambient:0xe8e0d3, sun:0xffdfbc },
  ruins: { name:'Sunken Ruins', sky:0x8cb8bd, fog:0xa9c9bd, accent:0x72e0b3, ambient:0xd9f0d3, sun:0xffe5ae },
  storm: { name:'Storm Spire', sky:0x4c657c, fog:0x718c9e, accent:0x8ce7ff, ambient:0xc5e4fb, sun:0xffddbc },
  clockwork: { name:'Clockwork', sky:0x697b83, fog:0xa0afa4, accent:0xffcf75, ambient:0xffe7c1, sun:0xffdd9d },
  void: { name:'Astral Vault', sky:0x26223f, fog:0x514267, accent:0xc9a1ff, ambient:0xc2baf0, sun:0xffccbc }
});
const PALETTES = {
  foundry:{stone:0x82918d,dark:0x29373c,metal:0x596c70,edge:0xd4c7a7,landing:0x88928d,glow:0xff982f},
  ruins:{stone:0x777a68,dark:0x293d36,metal:0x65745a,edge:0xa99f7d,landing:0x9a987e,glow:0x80e4b1},
  storm:{stone:0x485e6d,dark:0x223440,metal:0x587789,edge:0x9db0b7,landing:0x718890,glow:0x8eeaff},
  clockwork:{stone:0x625e51,dark:0x25323b,metal:0xa06a35,edge:0xb8a47d,landing:0x8e8269,glow:0xffc35f},
  void:{stone:0x514963,dark:0x28233c,metal:0x6a577e,edge:0xb3a3c9,landing:0x726982,glow:0xc59bff}
};
const TAU = Math.PI*2;
const dummy = new THREE.Object3D();
const tint = new THREE.Color();
const tempA = new THREE.Vector3();
const tempB = new THREE.Vector3();
function noise(i){const x=Math.sin(i*127.13+78.9)*43758.5453;return x-Math.floor(x);}

// A physically tapered stone wedge, rather than a rotated rectangular block.
// The same original mesh is instanced eleven times around the Ruins portal:
// open mortar joints, curved intrados, a genuine keystone and depth behind
// the front face. The primitive is independent of gameplay/collision geometry.
export function createCarvedVoussoirGeometry(THREE) {
  const stones = 11, inner = 1.87, outer = 2.52;
  const half = Math.PI / (stones * 2), joint = .012;
  const shape = new THREE.Shape();
  const start = -half + joint, end = half - joint;
  for (let i = 0; i <= 5; i++) {
    const angle = start + (end - start) * i / 5;
    const x = Math.cos(angle) * outer, y = Math.sin(angle) * outer;
    if (i === 0) shape.moveTo(x, y); else shape.lineTo(x, y);
  }
  for (let i = 5; i >= 0; i--) {
    const angle = start + (end - start) * i / 5;
    shape.lineTo(Math.cos(angle) * inner, Math.sin(angle) * inner);
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: .78, steps: 1, bevelEnabled: true, bevelSegments: 2,
    bevelSize: .025, bevelThickness: .035, curveSegments: 5,
  });
  geometry.translate(0, 0, -.39);
  return geometry;
}

// Two solid, asymmetrically mirrored bronze leaves follow the true curved
// intrados of the masonry rather than filling the arch with a flat black card.
// Their crest is inset from the stone; the closed gate is a background prop,
// not a new collider, route, or interactable gameplay door.
export function createRuinsGateLeafGeometry(THREE, side) {
  if (side !== -1 && side !== 1) throw new RangeError('Ruins gate leaf side must be -1 or 1');
  const outer = 1.69, inner = .065, bottom = .16;
  const crest = x => 3.72 + Math.sqrt(Math.max(0, 1.8 * 1.8 - x * x)) - .22;
  const shape = new THREE.Shape();
  shape.moveTo(side * outer, bottom);
  shape.lineTo(side * inner, bottom);
  shape.lineTo(side * inner, crest(inner));
  for (let i = 1; i <= 16; i++) {
    const x = inner + (outer - inner) * i / 16;
    shape.lineTo(side * x, crest(x));
  }
  shape.closePath();
  const geometry = new THREE.ExtrudeGeometry(shape, {
    depth: .24, steps: 1, bevelEnabled: true,
    bevelSegments: 2, bevelThickness: .025, bevelSize: .022,
  });
  geometry.translate(0, 0, -.12);
  return geometry;
}

// Original geologic panorama: large fragmented cliffs at three actual depths,
// not a screen-space card or cloned scenery from a commercial game. The full
// ring survives orbit/floor cameras; every point stays beyond the widest
// overview camera so the distant art cannot hide the simulated route.
export const VISTA_PALETTES = Object.freeze({
  foundry: [0x674b51, 0x8f6764, 0xae8577],
  ruins: [0x516f68, 0x77968b, 0xa0b5a4],
  storm: [0x344d67, 0x56778c, 0x859cb0],
  clockwork: [0x545d63, 0x788380, 0xa7a594],
  void: [0x383454, 0x59547d, 0x847caa],
});
export function createVistaLayerGeometry(THREE, biome, layer, height) {
  if (!VISTA_PALETTES[biome] || !Number.isInteger(layer) || layer < 0 || layer > 2
      || !Number.isFinite(height) || height <= 0) throw new RangeError('Invalid tower vista layer');
  const counts = [15, 20, 25], radii = [242, 340, 455], widths = [27, 31, 35];
  const count = counts[layer], radius = radii[layer], width = widths[layer];
  const palette = new THREE.Color(VISTA_PALETTES[biome][layer]);
  const positions = [], colors = [];
  const seed = Object.keys(VISTA_PALETTES).indexOf(biome) * 71;
  const scalarNoise = value => {
    const raw = Math.sin(value * 127.13 + 78.9) * 43758.5453;
    return raw - Math.floor(raw);
  };
  // Horizontal bands are genuine eroded courses. Irregular individual crowns
  // avoid a repeated silhouette; all geometry is generated once per floor.
  const courses = [0, .17, .29, .33, .48, .54, .58, .76, .89, 1];
  const taper = [1.22, 1.15, 1.08, 1.04, .97, .91, .84, .73, .43, .04];
  for (let i = 0; i < count; i++) {
    const angle = Math.PI * 2 * (i + .15 + scalarNoise(i * 3 + layer * 31 + seed) * .65) / count;
    const centerRadius = radius + (scalarNoise(i * 11 + layer * 9 + seed) - .5) * 13;
    const halfWidth = width * (.69 + scalarNoise(i * 7 + 13 + seed) * .47);
    const halfDepth = (12 + layer * 3) * (.75 + scalarNoise(i * 19 + seed) * .6);
    const crown = 24 + layer * 21 + height * .40 + scalarNoise(i * 17 + layer * 5 + seed) * (50 + layer * 11);
    const bottom = -130 - layer * 22;
    const bend = (scalarNoise(i * 23 + seed) - .5) * 16;
    const tangentX = Math.cos(angle), tangentZ = -Math.sin(angle);
    const radialX = Math.sin(angle), radialZ = Math.cos(angle);
    function point(j, side) {
      const phi = Math.PI * 2 * side / 8;
      const size = taper[j] * (1 + (scalarNoise(i * 41 + side * 3 + j * 13 + seed) - .5) * .14);
      const tangential = Math.cos(phi) * halfWidth * size + bend * courses[j];
      const radial = centerRadius + Math.sin(phi) * halfDepth * size;
      const y = bottom + (crown - bottom) * courses[j]
        + (j > 6 ? (scalarNoise(i * 37 + side * 13 + seed) - .5) * 2.5 * (j - 6) : 0);
      return [radialX * radial + tangentX * tangential, y,
        radialZ * radial + tangentZ * tangential];
    }
    for (let j = 0; j < courses.length - 1; j++) for (let side = 0; side < 8; side++) {
      const next = (side + 1) % 8;
      const a = point(j, side), b = point(j, next), c = point(j + 1, next), d = point(j + 1, side);
      const sunlit = .68 + Math.max(0, Math.cos(Math.PI * 2 * side / 8 - .65)) * .25;
      const sediment = j === 2 || j === 5 ? 1.22 : j === 3 || j === 6 ? .74 : 1;
      const tone = palette.clone().multiplyScalar((.74 + courses[j] * .34) * sunlit * sediment
        * (.92 + scalarNoise(i * 11 + seed) * .16));
      for (const p of [a,b,c,a,c,d]) {
        positions.push(...p);
        colors.push(tone.r, tone.g, tone.b);
      }
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.name = `original-${biome}-canyon-layer-${layer}`;
  geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3));
  geometry.computeBoundingSphere();
  return geometry;
}

// Flagship Ruins set piece: an actual hollow stone cloister, NOT a painted
// portal decal or a collider. A cloister opening stays open in depth; the
// broken outer silhouette and fluted reveals make the robot feel smaller.
// Used at three unequal scales / heights around the existing authored tower.
export function createRuinsSanctuaryArchGeometry(THREE) {
  const wall = new THREE.Shape();
  wall.moveTo(-4.05, -.12);
  wall.lineTo(4.05, -.12);
  wall.lineTo(4.25, 3.1);
  wall.lineTo(4.14, 9.2);
  wall.lineTo(3.95, 12.1);
  wall.lineTo(2.95, 13.05);
  wall.lineTo(1.15, 13.35);
  wall.lineTo(-1.72, 13.16);
  wall.lineTo(-3.82, 12.28);
  wall.lineTo(-4.18, 8.6);
  wall.closePath();
  const opening = new THREE.Path();
  opening.moveTo(-2.52, .58);
  opening.lineTo(2.52, .58);
  opening.lineTo(2.52, 7.55);
  // Tapered medieval arch with a steep summit, rather than a round doorway.
  for (let step = 1; step <= 12; step++) {
    const f = step / 12, a = Math.PI * f;
    opening.lineTo(2.52 * Math.cos(a), 7.55 + 3.52 * Math.sin(a));
  }
  opening.closePath();
  wall.holes.push(opening);
  const geometry = new THREE.ExtrudeGeometry(wall, {
    depth: 1.02, steps: 1, bevelEnabled: true,
    bevelSegments: 2, bevelSize: .11, bevelThickness: .12, curveSegments: 12,
  });
  geometry.translate(0, 0, -.51);
  return geometry;
}

/** A bounded, floor-owned Three.js environment. The host owns lights, fog and camera. */
export function createTowerWorld(){
  const group=new THREE.Group();group.name='InfiniteTowerWorld';
  const stoneSurface=createStoneSurfaceAsset(THREE);
  let floorGroup=null,key='',theme='foundry',disposed=false,lastSnapshot=null;
  let materials={}, floorGeometries=new Set(),floorMaterials=new Set();
  const primitives=new Map(),platforms=new Map(),hazards=new Map(),rotors=[],floaters=[];
  let particles=null,vistaGroup=null,quality='normal',occludedGuardianCaps=0,ruinsPortalVoussoirs=0,ruinsGateLeaves=0;
  let ruinsSanctuaryArches=0,ruinsSanctuaryPlants=0,ruinsSanctuaryCascadePanels=0;
  const canopyRay = new THREE.Raycaster(), canopyDirection = new THREE.Vector3();
  function geometry(name,build){if(!primitives.has(name))primitives.set(name,build());return primitives.get(name);}
  const box=()=>geometry('box',()=>new THREE.BoxGeometry(1,1,1));
  const sphere=()=>geometry('sphere',()=>new THREE.SphereGeometry(1,10,7));
  const cone=()=>geometry('cone',()=>new THREE.ConeGeometry(1,1,6));
  const cylinder=()=>geometry('cylinder',()=>new THREE.CylinderGeometry(1,1,1,12));
  const leaf=()=>geometry('leaf',()=>{
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute([-.5,0,0,0,-.5,0,.5,0,0,0,.5,0,0,0,.18,0,0,-.06],3));
    g.setIndex([0,1,4,1,2,4,2,3,4,3,0,4,1,0,5,2,1,5,3,2,5,0,3,5]);g.computeVertexNormals();return g;
  });
  const bevel=()=>geometry('bevel',()=>{
    const s=new THREE.Shape();s.moveTo(-.44,-.5);s.lineTo(.44,-.5);s.lineTo(.5,-.44);s.lineTo(.5,.44);s.lineTo(.44,.5);s.lineTo(-.44,.5);s.lineTo(-.5,.44);s.lineTo(-.5,-.44);s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:.9,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:.05,bevelThickness:.05});g.translate(0,0,-.45);return g;
  });
  const rounded=()=>geometry('rounded-casting',()=>{
    const s=new THREE.Shape(),r=.17;
    s.moveTo(-.5+r,-.5);s.lineTo(.5-r,-.5);s.quadraticCurveTo(.5,-.5,.5,-.5+r);
    s.lineTo(.5,.5-r);s.quadraticCurveTo(.5,.5,.5-r,.5);s.lineTo(-.5+r,.5);
    s.quadraticCurveTo(-.5,.5,-.5,.5-r);s.lineTo(-.5,-.5+r);s.quadraticCurveTo(-.5,-.5,-.5+r,-.5);
    const g=new THREE.ExtrudeGeometry(s,{depth:.76,bevelEnabled:true,bevelSize:.08,bevelThickness:.12,bevelSegments:3,steps:1,curveSegments:4});g.translate(0,0,-.38);return g;
  });
  const corbel=()=>geometry('open-cantilever',()=>{
    // A cast, open web supporting the rear of a route deck. The opening is real.
    const s=new THREE.Shape();s.moveTo(-2.15,.48);s.lineTo(1.8,.48);s.lineTo(1.8,.04);
    s.quadraticCurveTo(.45,-.1,-.2,-1.75);s.quadraticCurveTo(-.55,-2.8,-1.65,-3.05);s.lineTo(-2.15,-3.05);s.closePath();
    const h=new THREE.Path();h.moveTo(-1.65,-.18);h.lineTo(.45,-.18);h.quadraticCurveTo(-.5,-.6,-.75,-1.8);h.quadraticCurveTo(-.95,-2.2,-1.65,-2.35);h.closePath();s.holes.push(h);
    const g=new THREE.ExtrudeGeometry(s,{depth:.34,bevelEnabled:true,bevelSegments:2,bevelSize:.08,bevelThickness:.08,steps:1,curveSegments:8});g.translate(0,0,-.17);g.rotateY(-Math.PI/2);return g;
  });
  function chipped(variant=0){return geometry(`chipped:${variant}`,()=>{
    const s=new THREE.Shape(),points=[[-.5,-.39],[-.39,-.5],[.12,-.47],[.23,-.43],[.48,-.46],[.47,-.11],[.42,.03],[.5,.33],[.31,.5],[-.16,.47],[-.45,.5],[-.49,.17],[-.45,-.05]];
    points.forEach(([x,y],i)=>{x+=(noise(i+variant*17)-.5)*.065;y+=(noise(i+variant*23)-.5)*.055;if(i===0)s.moveTo(x,y);else s.lineTo(x,y);});s.closePath();
    const g=new THREE.ExtrudeGeometry(s,{depth:.8,steps:1,bevelEnabled:true,bevelSegments:1,bevelSize:.065,bevelThickness:.1});g.translate(0,0,-.4);return g;
  });}
  function fracturedMass(variant=0){return geometry(`fractured-mass:${variant}`,()=>{
    // An irregular volume with changing cross section, not a displaced wall tile.
    const outline=[[-.5,-.28],[-.32,-.5],[.29,-.49],[.5,-.19],[.46,.28],[.17,.5],[-.31,.45],[-.49,.16]],positions=[],indices=[];
    const levels=[-.5,-.14,.2,.5],widths=[1,.96,.83,.64];
    for(let row=0;row<4;row++)for(let j=0;j<8;j++){
      const [x,z]=outline[j],offset=(noise(row*17+variant*31)-.5)*.11;
      positions.push(x*widths[row]+offset,levels[row]+(noise(j+variant*41)-.5)*.07,z*(1-row*.065)+(noise(j+row+variant)-.5)*.045);
    }
    for(let row=0;row<3;row++)for(let j=0;j<8;j++){const a=row*8+j,b=row*8+(j+1)%8,c=b+8,d=a+8;indices.push(a,c,b,a,d,c);}
    for(let j=1;j<7;j++){indices.push(0,j,j+1,24,24+j+1,24+j);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));g.setIndex(indices);
    const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();return flat;
  });}
  function own(g){floorGeometries.add(g);return g;}
  function mat(color,metalness=0,roughness=.8,extra={}){const m=new THREE.MeshStandardMaterial({color,metalness,roughness,...extra});floorMaterials.add(m);return m;}
  function weather(m){return applyStoneSurface(m,stoneSurface);}
  function mesh(parent,g,m,pos=[0,0,0],scale=[1,1,1],rotation=null){const o=new THREE.Mesh(g,m);o.position.set(...pos);o.scale.set(...scale);if(rotation)o.rotation.set(...rotation);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function block(parent,m,pos,scale,rotation=null){return mesh(parent,bevel(),m,pos,scale,rotation);}
  function casting(parent,m,pos,scale,rotation=null){return mesh(parent,rounded(),m,pos,scale,rotation);}
  function lathe(parent,profile,m,pos=[0,0,0],rotation=null,segments=40){
    return mesh(parent,own(new THREE.LatheGeometry(profile.map(([r,y])=>new THREE.Vector2(r,y)),segments)),m,pos,[1,1,1],rotation);
  }
  function pipe(parent,points,r,m){
    const curve=new THREE.CatmullRomCurve3(points.map(p=>new THREE.Vector3(...p)),false,'centripetal');
    return mesh(parent,own(new THREE.TubeGeometry(curve,Math.max(12,points.length*7),r,8,false)),m);
  }
  function radial(o,a,r,y){o.position.set(Math.sin(a)*r,y,Math.cos(a)*r);o.rotation.y=a;return o;}
  function beam(parent,a,b,r,m){tempA.set(...a);tempB.set(...b);const d=tempB.clone().sub(tempA);const o=mesh(parent,cylinder(),m,tempA.clone().add(tempB).multiplyScalar(.5).toArray(),[r,d.length(),r]);o.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.normalize());return o;}
  // A curved, solid annular ledge. Exact angular edges preserve the simulation's x extents.
  function sector(inner,outer,angle,height){
    const steps=Math.max(3,Math.ceil(angle*20)),vertices=[],indices=[];
    for(let i=0;i<=steps;i++){const a=-angle/2+angle*i/steps;for(const y of [0,height])for(const r of [inner,outer])vertices.push(Math.sin(a)*r,y,Math.cos(a)*r);}
    for(let i=0;i<steps;i++){const a=i*4,b=(i+1)*4;for(const [p,q,r,s]of [[a+2,a+3,b+3,b+2],[a,b,b+1,a+1],[a+1,b+1,b+3,a+3],[a,a+2,b+2,b]])indices.push(p,q,r,p,r,s);}
    const end=steps*4;indices.push(0,1,3,0,3,2,end,end+2,end+3,end,end+3,end+1);
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vertices,3));g.setIndex(indices);g.computeVertexNormals();return own(g);
  }
  function ring(parent,r,tube,m,y,arc=TAU){const g=own(new THREE.TorusGeometry(r,tube,6,Math.max(20,Math.ceil(arc*16)),arc));const o=mesh(parent,g,m,[0,y,0]);o.rotation.x=Math.PI/2;return o;}
  function instanced(parent,g,m,items){const o=new THREE.InstancedMesh(g,m,items.length);items.forEach((s,i)=>{dummy.position.set(...s.p);dummy.rotation.set(...(s.r||[0,0,0]));dummy.scale.set(...(s.s||[1,1,1]));dummy.updateMatrix();o.setMatrixAt(i,dummy.matrix);if(s.c!==undefined)o.setColorAt(i,tint.set(s.c));});o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
  function at(a,r,y,s,c){return{p:[Math.sin(a)*r,y,Math.cos(a)*r],r:[0,a,0],s,c};}
  function batchRigid(root,excluded=new Set()){
    // Flatten only rigid descendants. Animated roots, snapshot roots and stateful
    // indicators are explicit boundaries. Large existing instances stay instanced.
    root.updateWorldMatrix(true,true);
    const inverse=new THREE.Matrix4().copy(root.matrixWorld).invert(),batches=new Map(),retired=[];
    const local=new THREE.Matrix4(),instance=new THREE.Matrix4();
    function collect(o){
      if(o!==root&&excluded.has(o))return;
      if(o.isMesh&&!Array.isArray(o.material)&&(!o.isInstancedMesh||(o.count<=100&&!o.instanceColor))){
        const id=`${o.material.uuid}:${o.castShadow}:${o.receiveShadow}`;
        if(!batches.has(id))batches.set(id,{material:o.material,cast:o.castShadow,receive:o.receiveShadow,parts:[]});
        const b=batches.get(id);local.multiplyMatrices(inverse,o.matrixWorld);
        if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,instance);b.parts.push({g:o.geometry,m:new THREE.Matrix4().multiplyMatrices(local,instance)});}}
        else b.parts.push({g:o.geometry,m:local.clone()});
        retired.push(o);
      }
      for(const child of o.children)collect(child);
    }
    collect(root);
    for(const b of batches.values()){
      let total=0;for(const p of b.parts)total+=p.g.index?p.g.index.count:p.g.attributes.position.count;
      const positions=new Float32Array(total*3),normals=new Float32Array(total*3),uvs=new Float32Array(total*2);
      const v=new THREE.Vector3(),n=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();let at=0;
      for(const p of b.parts){
        const a=p.g.attributes,index=p.g.index,count=index?index.count:a.position.count;normalMatrix.getNormalMatrix(p.m);
        for(let i=0;i<count;i++){
          const j=index?index.getX(i):i;
          v.fromBufferAttribute(a.position,j).applyMatrix4(p.m);positions.set([v.x,v.y,v.z],at*3);
          if(a.normal)n.fromBufferAttribute(a.normal,j).applyNormalMatrix(normalMatrix);else n.set(0,1,0);normals.set([n.x,n.y,n.z],at*3);
          if(a.uv){uvs[at*2]=a.uv.getX(j);uvs[at*2+1]=a.uv.getY(j);}at++;
        }
      }
      const g=own(new THREE.BufferGeometry());g.setAttribute('position',new THREE.BufferAttribute(positions,3));g.setAttribute('normal',new THREE.BufferAttribute(normals,3));g.setAttribute('uv',new THREE.BufferAttribute(uvs,2));g.computeBoundingSphere();
      const o=mesh(root,g,b.material);o.name='rigid-material-batch';o.castShadow=b.cast;o.receiveShadow=b.receive;
    }
    for(const o of retired){o.removeFromParent();if(o.isInstancedMesh)o.dispose();}
  }
  function finishBatches(){
    const boundaries=new Set([particles,vistaGroup,...platforms.values()].map(e=>e?.root||e).filter(Boolean));
    // Animated guardian gates are floor-owned siblings of the traversable
    // cap, not part of its exact collision-aligned top geometry. Preserve
    // their skinned/hinged scene nodes across the static floor merge.
    for(const p of platforms.values())if(p.guardianGate)boundaries.add(p.guardianGate.frame);
    for(const e of hazards.values())boundaries.add(e.root);
    for(const r of rotors){boundaries.add(r.o);batchRigid(r.o);}
    for(const f of floaters)boundaries.add(f.o);
    for(const p of platforms.values())batchRigid(p.root);
    for(const e of hazards.values()){
      batchRigid(e.live,new Set(e.spin?[e.spin]:[]));
      batchRigid(e.root,new Set([e.live,e.indicator]));
    }
    batchRigid(floorGroup,boundaries);
    // Original unique source buffers are no longer needed after rigid merging.
    const used=new Set();floorGroup.traverse(o=>{if(o.geometry)used.add(o.geometry);});
    for(const g of floorGeometries)if(!used.has(g)){g.dispose();floorGeometries.delete(g);}
  }
  function conformDanger(live,width,height,spin){
    // Tangent-plane boxes grow in angular width at their rear edge. Bake the
    // active pieces into the exact authoritative arc and vertical interval.
    // Stationary plinths and frame hardware remain outside the lethal volume.
    batchRigid(live,new Set(spin?[spin]:[]));
    for(const o of live.children){
      if(!o.isMesh||o===spin)continue;
      const p=o.geometry.attributes.position,n=o.geometry.attributes.normal;
      for(let i=0;i<p.count;i++){
        const x=Math.max(-width*.5,Math.min(width*.5,p.getX(i))),y=Math.max(0,Math.min(height,p.getY(i))),r=25+p.getZ(i),a=x/25,c=Math.cos(a),s=Math.sin(a);
        const nx=n.getX(i)*25/r,ny=n.getY(i),nz=n.getZ(i);
        tempA.set(c*nx+s*nz,ny,-s*nx+c*nz).normalize();n.setXYZ(i,tempA.x,tempA.y,tempA.z);
        p.setXYZ(i,s*r,y,c*r-25);
      }
      p.needsUpdate=true;n.needsUpdate=true;o.geometry.computeBoundingSphere();
    }
  }
  function gear(parent,r,thickness,m){
    const shape=new THREE.Shape(),teeth=14;for(let i=0;i<teeth*4;i++){const a=i/teeth/4*TAU,rad=r*(i%4===0||i%4===3?.84:1);const x=Math.sin(a)*rad,y=Math.cos(a)*rad;if(i===0)shape.moveTo(x,y);else shape.lineTo(x,y);}shape.closePath();
    const hole=new THREE.Path();hole.absarc(0,0,r*.49,0,TAU,true);shape.holes.push(hole);
    const g=own(new THREE.ExtrudeGeometry(shape,{depth:thickness,bevelEnabled:true,bevelSize:.06,bevelThickness:.04,bevelSegments:1,steps:1,curveSegments:18}));
    const root=new THREE.Group();parent.add(root);mesh(root,g,m,[0,0,-thickness/2]);mesh(root,cylinder(),materials.edge,[0,0,0],[r*.16,thickness*1.6,r*.16],[Math.PI/2,0,0]);
    for(let i=0;i<4;i++)block(root,m,[0,0,0],[r*1.42,r*.13,thickness],[0,0,i*Math.PI/4]);return root;
  }
  function arch(parent,a,y,size=1){const root=new THREE.Group();radial(root,a,22.65,y);parent.add(root);
    root.name = 'ruins-carved-portal';
    // True curved aperture. The darkness follows the intrados instead of
    // leaving a rectangular void behind a row of large rounded cubes.
    const opening=new THREE.Shape();
    opening.moveTo(-1.80,.06); opening.lineTo(1.80,.06); opening.lineTo(1.80,3.72);
    for(let i=0;i<=24;i++){
      const angle=Math.PI*i/24;
      opening.lineTo(Math.cos(angle)*1.80,3.72+Math.sin(angle)*1.80);
    }
    opening.closePath();
    const recess=own(new THREE.ExtrudeGeometry(opening,{depth:.22,bevelEnabled:false,steps:1,curveSegments:24}));
    mesh(root,recess,materials.dark,[0,0,-.28],[size,size,1]);

    // Eleven identical, actual tapered stone wedges. A narrow radial joint
    // separates neighboring stones; no box corners cut into the opening.
    // The existing rigid batching folds them into the floor's material batch.
    const wedges=[];
    for(let i=0;i<11;i++) wedges.push({
      p:[0,3.72*size,.12],r:[0,0,(i+.5)*Math.PI/11],s:[size,size,size],
    });
    instanced(root,geometry('ruins-carved-voussoir',()=>createCarvedVoussoirGeometry(THREE)),materials.portalStone,wedges);
    ruinsPortalVoussoirs=wedges.length;

    // Irregular eroded pier stones keep the spring lines load-bearing while
    // sharing the same quiet, weathered limestone as the arch, not Lego caps.
    const jamb=[];
    for(const side of [-1,1])for(let i=0;i<5;i++)jamb.push({
      p:[side*2.13*size,(.39+i*.74)*size,.12],
      r:[0,0,side*(i%3-1)*.008],s:[.73*size,.69*size,.78*size],
    });
    instanced(root,chipped(2),materials.portalStone,jamb);

    // Inset patinated bronze leaves replace the featureless void and floating
    // luminous line. All detailing is shallow, non-emissive and floor-batched:
    // no fake route marker competes with the real landing beacon.
    const studs=[];
    for (const side of [-1,1]) {
      mesh(root,own(createRuinsGateLeafGeometry(THREE,side)),materials.gate,[0,0,.08],[size,size,1]);
      ruinsGateLeaves++;
      block(root,materials.gateTrim,[side*.26*size,2.68*size,.27],[.075*size,4.5*size,.09]);
      block(root,materials.gateTrim,[side*1.43*size,2.17*size,.27],[.07*size,3.55*size,.09]);
      for(const y of [1.40,3.10])
        block(root,materials.gateTrim,[side*.85*size,y*size,.27],[1.37*size,.075*size,.09]);
      const crown=[];
      for(let i=0;i<=12;i++){
        const x=.14+1.43*i/12;
        crown.push(new THREE.Vector3(side*x*size,(3.72+Math.sqrt(1.8*1.8-x*x)-.42)*size,.27));
      }
      mesh(root,own(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(crown),18,.029*size,5,false)),materials.gateTrim);
      mesh(root,own(new THREE.TorusGeometry(.16*size,.027*size,6,20)),materials.gateTrim,
        [side*.55*size,2.45*size,.33]);
      for(const y of [1.18,2.5,3.68])studs.push({p:[side*1.43*size,y*size,.35],s:[.055*size,.055*size,.055*size]});
    }
    instanced(root,sphere(),materials.gateTrim,studs);
    return root;
  }
  function buildTower(height){
    const root=floorGroup;
    // Separate load-bearing vessels leave the central climbing corridor quiet;
    // each biome's machinery belongs to the surrounding architecture.
    lathe(root,[[0,-34],[10.8,-34],[12.4,-24],[12.4,height+13],[10.2,height+25],[0,height+25]],materials.dark,[0,0,-3]).userData.structural=true;
    const pylons=[
      {a:-.66,r:16.8,R:4.9,bottom:-31,top:height+16},
      {a:.67,r:16.65,R:5.25,bottom:-35,top:height+6},
      {a:-.18,r:8.6,R:5.5,bottom:-27,top:height+31}
    ];
    for(const [i,p]of pylons.entries()){
      const body=new THREE.Group();radial(body,p.a,p.r,0);root.add(body);body.name='tapered-structural-pylon';
      const shoulder=p.top-8;
      lathe(body,[[0,p.bottom],[p.R*.75,p.bottom],[p.R*.96,p.bottom+2],[p.R,p.bottom+7],[p.R,shoulder],[p.R*.96,shoulder+2],[p.R*.82,shoulder+4.5],[p.R*.58,shoulder+6],[p.R*.56,shoulder+8],[0,shoulder+8]],materials.stone).userData.structural=true;
      // Each cladding bay has a curved face, inset joint and a single broad seam.
      // Three groups of bays give an architectural scale above that of the robot.
      for(const y of [-18,3,24]){
        if(y+17>shoulder)continue;
        for(let col=0;col<5;col++){
          const a=(col-2)*.39;
          mesh(body,sector(p.R+.015,p.R+.10,.35,17.6),i===2?materials.stone:materials.ceramic,[0,y,0],[1,1,1],[0,a,0]);
        }
        lathe(body,[[p.R+.03,y-.5],[p.R+.19,y-.35],[p.R+.19,y+.08],[p.R+.03,y+.23]],materials.metal);
      }
      // A rolled shoulder and narrowed neck replace the flat transverse cap.
      lathe(body,[[p.R*.92,shoulder+1.6],[p.R*.99,shoulder+2],[p.R*.96,shoulder+2.6],[p.R*.86,shoulder+3.8]],materials.metal);
      lathe(body,[[p.R*.55,p.top-.9],[p.R*.65,p.top-.75],[p.R*.65,p.top-.3],[p.R*.55,p.top]],materials.copper);
      const channels=[];
      for(const side of [-1,1]){
        const a=side*1.09;
        channels.push(at(a,p.R+.12,(p.bottom+shoulder)*.5,[.24,shoulder-p.bottom-2,.24]));
      }
      instanced(body,bevel(),materials.metal,channels);
      if(i<2){
        const seal=new THREE.Group();radial(seal,i===0?.34:-.36,p.R+.16,shoulder-4);body.add(seal);
        casting(seal,materials.dark,[0,0,0],[1.8,3.4,.16]);
        for(const y of [-.9,0,.9])casting(seal,materials.copper,[0,y,.12],[1.12,.22,.12]);
      }
    }
    // Unequal mineral footings retain the expedition setting, but stay behind
    // the fabricated shells instead of competing with them as giant flat slabs.
    for(const [a,y,w,h,d,v]of [[-1.12,-7,5.8,height+28,6.4,1],[1.18,-11,6.4,height+25,6.1,2],[2.5,2,13,height+43,10,0]]){
      const rock=new THREE.Group();radial(rock,a,16.1,y);root.add(rock);
      mesh(rock,fracturedMass(v),materials.stone,[0,0,0],[w,h,d]).userData.structural=true;
    }
    // The overhead manifold leads the eye up through a real junction between
    // the shoulders. There is no large empty lintel hanging above the route.
    pipe(root,[[-10.4,height+5,13.4],[-10.4,height+10,13.4],[-6.5,height+13,12.7],[3.5,height+13,12.7],[8.6,height+8,13.8]],.77,materials.metal).userData.structural=true;
    for(const x of [-6,0,5.1]){
      const c=mesh(root,cylinder(),materials.copper,[x,height+12.9,12.8],[1.04,.42,1.04],[0,0,Math.PI/2]);
      c.userData.ambientDetail=true;
    }
    // A recessed annular foundation visually roots the separate vertical forms.
    mesh(root,sector(14,22.3,2.75,2.1),materials.dark,[0,-26,0]).userData.structural=true;
    mesh(root,sector(20.7,22.42,2.75,.25),materials.metal,[0,-23.9,0]);
    if(theme==='foundry')buildFoundry(height);
    if(theme==='ruins')buildRuins(height);
    if(theme==='storm')buildStorm(height);
    if(theme==='clockwork')buildClockwork(height);
    if(theme==='void')buildVoid(height);
  }
  function buildFoundry(height){
    // A complete pressure furnace sits on the right shoulder. Its smaller,
    // offset silhouette preserves the Foundry identity without occupying the
    // hero-to-landing corridor or becoming the subject of the follow camera.
    const furnace=new THREE.Group();radial(furnace,.51,22,height*.62);furnace.scale.setScalar(.6);floorGroup.add(furnace);furnace.name='foundry-pressure-furnace';
    lathe(furnace,[[0,-3.5],[5.9,-3.5],[7.0,-2.9],[7.35,-2.0],[7.35,-.4],[6.94,.34],[6.35,.56],[5.83,.28],[5.64,-.28],[5.64,-1.2],[0,-1.2]],materials.dark,[0,0,0],[Math.PI/2,0,0],56).userData.structural=true;
    lathe(furnace,[[6.28,.52],[6.42,.9],[6.83,.85],[7.08,.55],[7.22,.15],[7.04,.05]],materials.ceramic,[0,0,0],[Math.PI/2,0,0],56);
    lathe(furnace,[[5.56,-.56],[5.69,-.18],[5.88,.14],[6.09,.18],[6.13,-.13],[5.87,-.58]],materials.copper,[0,0,0],[Math.PI/2,0,0],56);
    mesh(furnace,own(new THREE.TorusGeometry(5.52,.085,7,56)),materials.glow,[0,0,-.66]);
    mesh(furnace,cylinder(),materials.furnaceCore,[0,0,-1.03],[5.35,.12,5.35],[Math.PI/2,0,0]);
    // Ten curved shutters form one engineered iris. The long shapes and the
    // recessed glowing chamber establish scale without a field of tiny greebles.
    const bladeShape=new THREE.Shape();bladeShape.moveTo(1.6,-.55);bladeShape.quadraticCurveTo(3.2,-2.1,5.27,-1.5);bladeShape.absarc(0,0,5.48,-.277,.40,false);bladeShape.quadraticCurveTo(3.2,1.50,1.85,.65);bladeShape.closePath();
    const bladeGeometry=own(new THREE.ExtrudeGeometry(bladeShape,{depth:.27,bevelEnabled:true,bevelThickness:.045,bevelSize:.045,bevelSegments:2,steps:1,curveSegments:10}));
    const iris=new THREE.Group();iris.position.z=-.58;furnace.add(iris);
    for(let i=0;i<10;i++)mesh(iris,bladeGeometry,materials.metal,[0,0,i*.018],[1,1,1],[0,0,i/10*TAU]);
    rotors.push({o:iris,speed:.018});
    lathe(furnace,[[1.65,-.48],[1.85,-.26],[1.94,-.08],[1.94,.10],[1.65,.13]],materials.copper,[0,0,0],[Math.PI/2,0,0],40);
    mesh(furnace,sphere(),materials.furnaceCore,[0,0,-.73],[1.57,1.57,.28]);
    for(const y of [-.65,0,.65])casting(furnace,materials.dark,[0,y,-.32],[y===0?3.0:2.55,.13,.15]);
    const clips=[];for(let i=0;i<8;i++){
      const a=(i+.5)/8*TAU;
      clips.push({p:[Math.sin(a)*6.75,Math.cos(a)*6.75,.46],r:[0,0,-a],s:[.74,1.65,.68]});
    }
    instanced(furnace,rounded(),materials.metal,clips);
    // One asymmetrical bonnet above the iris and two graceful cast feet make
    // the mechanism a connected place, rather than a symbol on a wall.
    casting(furnace,materials.ceramic,[-1.0,8.05,-1.8],[9.2,2.8,3.8]);
    casting(furnace,materials.dark,[-1.0,8.1,.12],[7.2,1.1,.25]);
    const slots=[];for(let i=0;i<9;i++)slots.push({p:[-4.1+i*.77,8.12,.3],s:[.33,.67,.12]});instanced(furnace,rounded(),materials.copper,slots);
    for(const x of [-4.65,4.65]){
      pipe(furnace,[[x,-5.2,-.8],[x*1.25,-8.5,-1.3],[x*1.5,-10.1,-2.1],[x*1.5,-14,-2.1]],.72,materials.metal).userData.structural=true;
      lathe(furnace,[[.77,-.3],[1.02,-.2],[1.02,.3],[.77,.42]],materials.copper,[x*1.5,-10.8,-2.1]);
    }
    // Circuit pipes move with their actual connection points on the furnace.
    pipe(furnace,[[-6.975,-10.8,-2.1],[-10,-10.8,-3.4],[-11,-15,-5.2],[-11,-40,-5.2]],.7,materials.copper);
    pipe(furnace,[[6.2,4,-1.4],[9,7,-3],[10,12,-4],[10,38,-4]],.8,materials.metal);
    // The tall offset chimney gives the sector an upward destination.
    const stack=new THREE.Group();radial(stack,-.61,16.8,height+10);floorGroup.add(stack);
    lathe(stack,[[0,0],[1.6,0],[1.7,2],[1.27,4],[1.27,13],[1.0,14],[0,14]],materials.dark);
    lathe(stack,[[1.25,10.8],[1.5,11],[1.5,12.2],[1.25,12.5]],materials.copper);
    for(let i=0;i<5;i++){const a=i/5*TAU;mesh(stack,sector(1.42,1.6,.37,3.1),materials.ceramic,[0,11.8,0],[1,1,1],[0,a,0]);}
    // A quiet recessed service bay makes scale legible below the great machine.
    const service=new THREE.Group();radial(service,.03,18.8,-4.5);floorGroup.add(service);
    casting(service,materials.metal,[0,0,0],[6.8,4.8,1.1]);casting(service,materials.dark,[0,.1,.56],[5.6,3.5,.14]);
    for(const x of [-1.8,0,1.8])casting(service,materials.ceramic,[x,.05,.68],[1.35,2.7,.14]);
    casting(service,materials.copper,[0,-1.75,.68],[5.4,.18,.16]);
  }
  // A cohesive hero environment rather than incremental portal decoration:
  // three monumental, hollow chambers at distinct elevations, carved veins,
  // hanging terraces and a cool cascade. All are presentation-only, behind the
  // authoritative 22.4..27.18 platform corridor. The real route stays legible.
  function buildRuinsSanctuary(height) {
    const stone = geometry('ruins-cloister-open-sanctuary', () => createRuinsSanctuaryArchGeometry(THREE));
    const arcade = [
      { angle: -.58, radius: 20.42, y: 4.6, scale: 1.08 },
      { angle: -.29, radius: 20.25, y: 25.0, scale: .90 },
      { angle: .52, radius: 20.20, y: -3.5, scale: .97 },
    ];
    const roots=[],leaves=[];
    function plantWorld(bay,x,y,z){
      const c=Math.cos(bay.angle),s=Math.sin(bay.angle);
      return [s*(bay.radius+z)+c*x, bay.y+y, c*(bay.radius+z)-s*x];
    }
    for (const [index, bay] of arcade.entries()) {
      const root = new THREE.Group();
      radial(root, bay.angle, bay.radius, bay.y);
      root.name = 'ruins-grand-sanctuary-bay';
      floorGroup.add(root);
      const s = bay.scale;
      const facade = mesh(root, stone, materials.sanctuaryStone, [0,0,0], [s,s,1]);
      facade.userData.ambientDetail=true;
      // Two deep recessed intrados bands follow the same arch curve. These
      // create true directional depth when seen at 3/4 camera angles.
      const ribs=[];
      for(let step=0;step<=18;step++) {
        const a=Math.PI*step/18;
        ribs.push(new THREE.Vector3(Math.cos(a)*2.55*s,(7.55+Math.sin(a)*3.58)*s,.72));
      }
      const frame=mesh(root,own(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(ribs),32,.09*s,6,false)),materials.gateTrim);
      frame.userData.ambientDetail=true;
      // Recessed, non-emissive relief remains subordinate to the real landing
      // indicator. The apertures themselves are truly open in the main mesh.
      for(const x of [-3.42,3.42]) {
        const pier=mesh(root,rounded(),materials.sanctuaryStone,[x*s,2.25*s,.65],[.38*s,4.6*s,.4]);
        pier.userData.ambientDetail=true;
        for(const level of [.45,1.3,2.15,3.0]) {
          const groove=mesh(root,bevel(),materials.gateTrim,[x*s,level*s,.89],[.26*s,.035*s,.065]);
          groove.userData.ambientDetail=true;
        }
      }
      const keystone=mesh(root,chipped(index),materials.sanctuaryStone,[0,11.28*s,.66],[1.35*s,1.25*s,.46]);
      keystone.userData.ambientDetail=true;
      // Broken suspended capstones and actual weight-bearing corbels establish
      // scale without adding fictional traversable floors.
      for(const x of [-3.6,3.6]) {
        const crown=mesh(root,fracturedMass(index%3),materials.sanctuaryStone,
          [x*s,12.62*s,-.05],[1.2*s,1.9*s,1.2]);
        crown.userData.ambientDetail=true;
        const bracket=mesh(root,corbel(),materials.sanctuaryStone,
          [x*s,9.68*s,.09],[.7*s,.8*s,.75]);
        bracket.userData.ambientDetail=true;
      }
      // Every garden is tied to a ledge or a cracked crown, not floating
      // evenly distributed particles. Instance counts/draws are bounded.
      for(let strand=0;strand<7;strand++) {
        const x=(-3.45+strand*1.12)*s;
        const top=(11.85+noise(index*19+strand)*1.0)*s;
        for(let step=0;step<9;step++) {
          const y=top-step*.73*s;
          const drift=Math.sin(step*.8+strand*2+index)*.2*s;
          roots.push({p:plantWorld(bay,x+drift,y,.74),r:[0,bay.angle,0],s:[.056*s,.85*s,.07]});
          for(const side of [-1,1]) {
            const leaf={p:plantWorld(bay,x+drift+side*.30*s,y+.11*s,.8),s:[.49*s,.19*s,.32*s],
              r:[0,bay.angle,side*(.4+noise(step+strand*4)*.2)]};
            leaves.push(leaf);
          }
        }
      }
      ruinsSanctuaryArches++;
    }
    ruinsSanctuaryPlants=leaves.length;
    // The cliff is wet and inhabitable: two subdued, sculpted streams emerge
    // from the broken aqueduct shoulder. No new colliders, shadows, or lights.
    // Not a glowing path cue: the cascade is physically behind the gameplay.
    for (const [i,a] of [-.86,-.74].entries()) {
      const root=new THREE.Group();radial(root,a,20.36,11-i*4);floorGroup.add(root);
      root.name='ruins-sanctuary-cascade';
      const width=i===0?1.7:.92, tall=i===0?20:15;
      const water=own(new THREE.PlaneGeometry(width,tall,6,38));
      const coords=water.attributes.position;
      for(let k=0;k<coords.count;k++){
        const x=coords.getX(k), y=coords.getY(k);
        coords.setZ(k,.14*Math.sin(y*.7+i*2)+.09*Math.sin(y*1.9+x*2+i));
      }
      coords.needsUpdate=true;water.computeVertexNormals();
      const sheet=mesh(root,water,materials.sanctuaryWater,[0,-tall*.48,.75]);
      sheet.userData.ambientDetail=true;
      ruinsSanctuaryCascadePanels++;
    }
    // An asymmetrical aqueduct terminates at the cascade rather than being a
    // decorative floating wall. Heavy stones are deep behind the route.
    const bridge=new THREE.Group();radial(bridge,-.80,19.15,21.7);floorGroup.add(bridge);
    bridge.name='ruins-sanctuary-broken-aqueduct';
    for(const [x,w] of [[-3.1,3.2],[1.25,2.3]]){
      const part=mesh(bridge,fracturedMass(Math.round(x+7)%3),materials.sanctuaryStone,
        [x,0,-.1],[w,1.25,2.2]);part.userData.ambientDetail=true;
    }
    return {roots,leaves};
  }

  function buildRuins(height){
    const sanctuary=buildRuinsSanctuary(height);
    const portal=arch(floorGroup,.02,7,1.9);portal.position.z-=2.3;
    // The broken aqueduct shoulder and hanging gardens occupy the two sides;
    // the dark portal remains a quiet, readable background to the moving hero.
    const broken=new THREE.Group();radial(broken,.85,20.2,22);floorGroup.add(broken);
    block(broken,materials.stone,[0,0,-.9],[8.8,2.6,4.5]).userData.structural=true;
    for(const x of [-3.5,2.7])block(broken,materials.edge,[x,-4.2,-.9],[1.9,9,3.8]);
    mesh(broken,fracturedMass(1),materials.stone,[2.9,3,-1.1],[3.6,6,4]);
    const roots=[...sanctuary.roots],leaves=[...sanctuary.leaves];
    for(let v=0;v<10;v++){
      const a=v<6?-.95+v*.075:.63+(v-6)*.08,top=v<6?height+7:28;
      for(let i=0;i<25;i++){
        const y=top-i*1.04,aa=a+Math.sin(i*.55+v)*.018,r=22.05+(v%2)*.3;
        roots.push(at(aa,r,y,[.11,1.2,.12]));
        for(const side of [-1,1]){const item=at(aa+side*.014,r+.18,y,[.75,.31,.36]);item.r[2]=side*.5;leaves.push(item);}
      }
    }
    instanced(floorGroup,geometry('vine-stem',()=>new THREE.CylinderGeometry(1,1,1,5)),materials.bark,roots);instanced(floorGroup,leaf(),materials.foliage,leaves);
    for(const [a,y]of [[-.83,9],[.82,30]]){
      const planter=new THREE.Group();radial(planter,a,21.6,y);floorGroup.add(planter);
      mesh(planter,fracturedMass(2),materials.stone,[0,-1,-.5],[5.2,3,3.4]);
      const crowns=[];for(let i=0;i<9;i++)crowns.push({p:[(noise(i)-.5)*4.2,.15+noise(i+20)*.65,noise(i+30)*1.6-1],s:[1.8,.6,1.2]});instanced(planter,sphere(),materials.foliage,crowns);
    }
    // The closed gate is an architectural feature; the true landing remains
    // the only high-contrast traversal marker in this scene.
  }
  function buildStorm(height){
    const engine=new THREE.Group();radial(engine,.08,18.7,21);floorGroup.add(engine);
    block(engine,materials.dark,[0,0,-.7],[12.5,14,3]).userData.structural=true;
    mesh(engine,own(new THREE.TorusGeometry(5.1,.55,8,40)),materials.metal,[0,0,1.1]);
    mesh(engine,own(new THREE.TorusGeometry(4.55,.1,5,40)),materials.glow,[0,0,1.15]);
    const blades=new THREE.Group();blades.position.z=1.2;engine.add(blades);
    mesh(blades,cylinder(),materials.dark,[0,0,0],[4.45,.3,4.45],[Math.PI/2,0,0]);
    for(let i=0;i<7;i++){const a=i/7*TAU;block(blades,materials.edge,[Math.cos(a)*2.5,Math.sin(a)*2.5,.22],[3.4,.9,.2],[0,0,a+.4]);}
    mesh(blades,sphere(),materials.metal,[0,0,.48],[1.1,1.1,.45]);rotors.push({o:blades,speed:.23});
    for(const x of [-5.7,5.7]){
      block(engine,materials.metal,[x,1,.2],[1,16,1.2]);
      for(const y of [-5,0,5])mesh(engine,cylinder(),materials.edge,[x,y,.8],[.8,.32,.8]);
    }
    const mast=new THREE.Group();radial(mast,-.8,20.4,height+5);floorGroup.add(mast);
    mesh(mast,cylinder(),materials.metal,[0,0,0],[.35,20,.35]);
    beam(mast,[-5,5,0],[5,5,0],.2,materials.copper);
    const vanes=[];for(let i=0;i<5;i++)vanes.push({p:[-4+i*2,3.8,.1],s:[.35,2.8,1.6],r:[0,0,.1]});instanced(mast,bevel(),materials.edge,vanes);
    mesh(mast,cone(),materials.glow,[0,11,0],[.2,2,.2]);
  }
  function buildClockwork(height){
    const clock=new THREE.Group();radial(clock,.05,18.6,20);floorGroup.add(clock);
    block(clock,materials.dark,[0,0,-.8],[14,16,3]).userData.structural=true;
    mesh(clock,own(new THREE.TorusGeometry(6.4,.45,8,48)),materials.copper,[0,0,.9]);
    mesh(clock,own(new THREE.TorusGeometry(5.8,.11,5,48)),materials.edge,[0,0,1]);
    const markers=[];for(let i=0;i<12;i++){const a=i/12*TAU;markers.push({p:[Math.sin(a)*5.45,Math.cos(a)*5.45,1],s:[.2,.65,.16],r:[0,0,-a]});}instanced(clock,bevel(),materials.edge,markers);
    const main=gear(clock,4.8,.45,materials.copper);main.position.z=1.2;rotors.push({o:main,speed:.045});
    for(const [a,y,size,speed]of [[-.66,7,3.6,-.11],[.75,31,3.1,.15]]){
      const root=new THREE.Group();radial(root,a,21.3,y);floorGroup.add(root);const g=gear(root,size,.42,materials.copper);rotors.push({o:g,speed});
      block(root,materials.dark,[0,0,-.6],[size*1.9,size*2.1,1.1]);
    }
    const rack=new THREE.Group();radial(rack,-.32,20.4,15);floorGroup.add(rack);
    block(rack,materials.dark,[0,0,-.2],[1.1,42,1.2]);
    const teeth=[];for(let y=-20;y<22;y+=.85)teeth.push({p:[0,y,.5],s:[1.65,.3,.45]});instanced(rack,box(),materials.copper,teeth);
    for(const x of [-6.7,6.7]){mesh(clock,cylinder(),materials.metal,[x,-7,.2],[.35,20,.35]);mesh(clock,cylinder(),materials.copper,[x,-13,.2],[.75,5,.75]);}
  }
  function buildVoid(height){
    const vault=new THREE.Group();radial(vault,.03,18.4,20);floorGroup.add(vault);
    const halo=new THREE.Group();vault.add(halo);
    mesh(halo,own(new THREE.TorusGeometry(5.7,.2,6,40)),materials.crystal);
    mesh(halo,own(new THREE.TorusGeometry(6.3,.07,5,40)),materials.glow,[0,0,-.2]);
    halo.rotation.z=.32;rotors.push({o:halo,speed:.04});
    for(let i=0;i<5;i++){
      const a=i/5*TAU,crystal=mesh(vault,geometry('vault-crystal',()=>new THREE.OctahedronGeometry(1,0)),materials.crystal,[Math.sin(a)*5.8,Math.cos(a)*5.8,.3],[.65,1.4,.65],[0,0,-a]);
      floaters.push({o:crystal,y:crystal.position.y,phase:i*1.8,speed:.18});
    }
    for(const [a,y]of [[-.73,4],[.89,30]]){
      const root=new THREE.Group();radial(root,a,20.8,y);floorGroup.add(root);
      mesh(root,fracturedMass(2),materials.dark,[0,0,0],[3.9,12,3.2]);block(root,materials.glow,[0,0,1.65],[.1,9,.1]);
      for(const sign of [-1,1])mesh(root,geometry('vault-crystal',()=>new THREE.OctahedronGeometry(1,0)),materials.crystal,[sign*1.3,sign*2,1.7],[.4,1.4,.45],[0,0,sign*.25]);
    }
  }
  function buildVista(height) {
    // Three atmosphere-separated silhouettes, each already batched into one
    // shadow-free mesh. Full-wrap terrain adds scale without route occlusion,
    // 2D HUD interference, texture fetches or per-tick animation/draw growth.
    vistaGroup=new THREE.Group();vistaGroup.name='tower-canyon-vista';
    floorGroup.add(vistaGroup);
    const strata=[0,1,2].map(layer=>createVistaLayerGeometry(THREE,theme,layer,height));
    const merged=own(new THREE.BufferGeometry());
    for(const key of ['position','color']){
      const arrays=strata.map(geometry=>geometry.attributes[key].array);
      const values=new Float32Array(arrays.reduce((sum,array)=>sum+array.length,0));
      let offset=0;
      for(const array of arrays){values.set(array,offset);offset+=array.length;}
      merged.setAttribute(key,new THREE.BufferAttribute(values,3));
    }
    strata.forEach(geometry=>geometry.dispose());
    merged.computeBoundingSphere();
    const material=new THREE.MeshBasicMaterial({vertexColors:true,side:THREE.DoubleSide,fog:true});
    material.name='tower-vista-atmosphere';
    floorMaterials.add(material);
    const cliffs=new THREE.Mesh(merged,material);
    cliffs.name='tower-vista-cliffs';
    cliffs.castShadow=false;cliffs.receiveShadow=false;
    vistaGroup.add(cliffs);
  }
  // Low tier still needs an expansive, unmistakably three-dimensional skyline.
  // Preserve the seven stepped towers and their supported skybridges, but replace
  // hundreds of fully lit and translucent far-field pieces with one fogged,
  // shadow-free original silhouette batch. The near playable architecture,
  // dynamic hazards, routes and three-layer canyon keep their complete geometry.
  function buildLeanDistantWorld(height){
    const color=new THREE.Color(THEMES[theme].sky).lerp(new THREE.Color(THEMES[theme].fog),.23).multiplyScalar(.5);
    const silhouette=new THREE.MeshBasicMaterial({color,fog:true});
    silhouette.name='distant-atmosphere';floorMaterials.add(silhouette);
    const tower=geometry('lean-citadel-column',()=>new THREE.CylinderGeometry(.75,1,1,7));
    const crown=geometry('lean-citadel-crown',()=>new THREE.ConeGeometry(1,1,7));
    for(let i=0;i<7;i++){
      const side=i%2?-1:1,x=side*(65+noise(i)*91),z=-96-noise(i+20)*110;
      const h=50+noise(i+30)*74;
      const root=new THREE.Group();root.name='distant-citadel-silhouette';
      root.position.set(x,-64,z);floorGroup.add(root);
      mesh(root,tower,silhouette,[0,h*.40,0],[9.5,h*.80,9.5]);
      mesh(root,tower,silhouette,[.7,h*.85,0],[7,h*.22,7]);
      mesh(root,crown,silhouette,[.7,h*.99,0],[5.6,h*.16,5.6]);
      const companionX=-side*24,companionHeight=h*.64;
      mesh(root,tower,silhouette,[companionX,companionHeight*.50,4],[6,companionHeight,6]);
      // A continuous deck with two grounded supports keeps the same skyline
      // story as high tier: the bridge does not hang in an empty sky.
      mesh(root,box(),silhouette,[companionX*.5,h*.43,2],[Math.abs(companionX),1.5,4]);
      for(const ratio of [.33,.67])mesh(root,box(),silhouette,
        [companionX*ratio,h*.215,2],[1.4,h*.43,2.3]);
    }
  }
  function buildDistantWorld(height){
    if(quality==='low'){
      buildLeanDistantWorld(height);
      // The fogged three-depth canyon already creates atmospheric separation;
      // 48 translucent overlapping spherical clouds were a large low-tier
      // fragment/overdraw expense and added no actionable route information.
      particles=null;
      return;
    }
    // Distant citadels have stepped shoulders, broken crowns and grounded companion
    // towers. Every skywalk terminates in architecture and has supports below it.
    for(let i=0;i<7;i++){
      const side=i%2?-1:1,x=side*(65+noise(i)*91),z=-96-noise(i+20)*110,h=50+noise(i+30)*74;
      const root=new THREE.Group();root.position.set(x,-64,z);floorGroup.add(root);
      for(let tier=0;tier<3;tier++){
        const base=h*tier*.29,r=9.5-tier*2.4;
        mesh(root,own(new THREE.CylinderGeometry(r-1,r,h*.34,8)),materials.distant,[tier*.7,base+h*.17,0],[1,1,.88],[0,.2+tier*.17,0]);
        for(let q=0;q<4;q++){const a=q/4*TAU+.3;mesh(root,chipped(q%3),materials.distant,[Math.sin(a)*(r-.9),base+h*.14,Math.cos(a)*(r-.9)],[1.3,h*.39,2],[0,a,.045]);}
      }
      const fins=[];for(let q=0;q<7;q++){const a=q/7*TAU;fins.push(at(a,3.6,h*.91,[.85,3+noise(q+i)*5,1.4]));}instanced(root,chipped(i%3),materials.distant,fins);
      const companionX=-side*24,companionHeight=h*.64;
      mesh(root,own(new THREE.CylinderGeometry(4.6,7.5,companionHeight,7)),materials.distant,[companionX,companionHeight*.5,4]);
      for(let q=0;q<3;q++)mesh(root,chipped(q),materials.distant,[companionX-3+q*3,companionHeight,4],[1.1,5+q,4]);
      const deckY=h*.43;
      block(root,materials.distant,[companionX*.5,deckY,2],[Math.abs(companionX),1.5,4]);
      for(const ratio of [.33,.67]){
        block(root,materials.distant,[companionX*ratio,deckY*.5,2],[1.5,deckY,3]);
        beam(root,[companionX*ratio,deckY-1,2],[companionX*(ratio+.2),deckY-7,2],.45,materials.distant);
      }
      for(const ratio of [.2,.5,.8])block(root,materials.distant,[companionX*ratio,deckY+1.1,2],[.7,1,4.6]);
    }
    const clouds=[];for(let bank=0;bank<12;bank++)for(let puff=0;puff<4;puff++){
      const side=bank%2?-1:1;
      clouds.push({p:[side*(60+noise(bank)*100)+puff*7,-27+noise(bank+21)*16+noise(puff)*2,-85-noise(bank+10)*95+puff*3],s:[10+noise(puff+bank)*8,3+noise(puff+1)*2,7+noise(puff+5)*5]});
    }
    const cloudMesh=instanced(floorGroup,sphere(),materials.cloud,clouds);cloudMesh.castShadow=false;cloudMesh.receiveShadow=false;
    const items=[];for(let i=0;i<48;i++){const a=-1.8+noise(i)*3.6,r=30+noise(i+3)*22;items.push({p:[Math.sin(a)*r,-5+noise(i+9)*(height+23),Math.cos(a)*r],s:[.035+noise(i)*.045,.035+noise(i)*.045,.035+noise(i)*.045]});}
    particles=instanced(floorGroup,sphere(),materials.particle,items);particles.userData.items=items;particles.castShadow=false;particles.receiveShadow=false;
  }
  function buildPlatform(p,width,guardianCap=false){
    const root=new THREE.Group();root.name=`platform:${p.id}`;floorGroup.add(root);
    const angle=p.width/width*ARC,h=p.height/SCALE;
    const bodyMaterial=theme==='ruins'?materials.stone:theme==='void'?materials.crystal:theme==='clockwork'?materials.copper:materials.metal;
    // The route is an engineered deck, not another monumental shelf. A slim
    // curved box beam, rolled edge and open rear webs leave the undercroft open.
    mesh(root,sector(22.45,27.05,angle,.48),bodyMaterial,[0,h-.64,0]).userData.structural=true;
    mesh(root,sector(22.5,26.97,angle,.10),materials.dark,[0,h-.74,0]);
    mesh(root,sector(22.4,27.18,angle,.16),materials.landing,[0,h-.16,0]);
    mesh(root,sector(27.02,27.22,angle,.095),p.kind==='moving'?materials.mint:materials.copper,[0,h-.27,0]);
    mesh(root,sector(26.99,27.13,angle,.07),bodyMaterial,[0,h-.66,0]);
    const ribs=[],treads=[],count=Math.max(2,Math.round(angle*25/2.6));
    for(let i=0;i<count;i++){
      const a=-angle/2+(i+.5)*angle/count;
      ribs.push(at(a,27.01,h-.45,[.14,.33,.27]));
      treads.push(at(a,24.9,h-.0015,[.035,.003,4.0]));
    }
    instanced(root,rounded(),bodyMaterial,ribs);instanced(root,box(),materials.tread,treads);
    const mount=new THREE.Group();mount.name='recessed-platform-mount';root.add(mount);
    const supports=angle>1.1?4:2;
    for(let i=0;i<supports;i++){
      const a=-angle*.4+(i+.5)*angle*.8/supports,brace=new THREE.Group();radial(brace,a,20.75,h-.7);mount.add(brace);
      if(p.kind==='moving'){
        casting(brace,materials.dark,[0,-.75,.25],[1.55,1.8,2.5]);
        mesh(brace,cylinder(),bodyMaterial,[0,-1.0,1.1],[.47,.24,.47],[Math.PI/2,0,0]);
        mesh(brace,cone(),materials.mint,[0,-1.9,.45],[.22,.7,.22],[0,0,Math.PI]);
      }else if(theme==='ruins'){
        mesh(brace,corbel(),materials.stone,[0,0,0],[1.35,1.05,1]).userData.structural=true;
        casting(brace,bodyMaterial,[0,-2.4,-1.4],[1.3,1,.7]);
      }else{
        mesh(brace,corbel(),bodyMaterial).userData.structural=true;
        casting(brace,materials.dark,[0,-1.05,-1.9],[.66,2.9,.42]);
      }
    }
    // Two broad ceramic corners identify a usable landing; all upper vertices
    // terminate at exactly p.y + p.height and never invent a raised collider.
    const landingMarks=[];for(const a of [-angle*.35,angle*.35])landingMarks.push(at(a,26.45,h-.009,[.16,.018,.55]));
    instanced(root,box(),p.kind==='moving'?materials.mint:materials.copper,landingMarks);
    const faceCount=Math.max(2,Math.round(angle*25/3.4));
    if(theme==='ruins'){
      const rock=[],moss=[];
      for(let i=0;i<faceCount;i++){
        const a=-angle*.45+(i+.5)*angle*.90/faceCount;
        rock.push(at(a,26.9,h-.43,[1.65,.43,.4]));
        if(i%2===0)moss.push(at(a,26.85,h-.14,[1.1,.13,.4]));
      }
      instanced(root,chipped(1),materials.stone,rock);instanced(root,sphere(),materials.foliage,moss);
    }else if(theme==='foundry'){
      // One large stamped face per bay, restrained warm seams at the rear.
      const plates=[];for(let i=0;i<faceCount;i++)plates.push(at(-angle*.43+(i+.5)*angle*.86/faceCount,27.04,h-.45,[1.6,.31,.17]));
      instanced(root,rounded(),materials.copper,plates);
    }else if(theme==='storm'){
      mesh(root,sector(27.045,27.17,angle,.045),materials.glow,[0,h-.38,0]);
    }else if(theme==='clockwork'){
      const sockets=[];for(let i=0;i<faceCount;i++)sockets.push(at(-angle*.44+(i+.5)*angle*.88/faceCount,27.08,h-.46,[.65,.26,.12]));
      instanced(root,rounded(),materials.dark,sockets);
    }else{
      const shards=[];for(let i=0;i<faceCount;i++){
        const item=at(-angle*.43+(i+.5)*angle*.86/faceCount,22.6,h-1.2,[.26,.6+noise(i)*.4,.36]);item.r[2]=.22;shards.push(item);
      }
      instanced(root,geometry('void-undercroft',()=>new THREE.OctahedronGeometry(1,0)),materials.crystal,shards);
      mesh(root,sector(27.04,27.17,angle,.05),materials.glow,[0,h-.37,0]);
    }
    // An original, physically modeled guardian seal makes the boss gate's
    // authoritative lock/unlock legible even without HUD text or sound.
    // Its near-core radius is INSIDE the 22.4..27.18 walkable annulus; unlike
    // a fake blocker it has no collider and never moves an autonomous actor.
    // Animated leaves are excluded from static floor batching and shadow
    // multiplication. Ordinary floors have no added portal/draw overhead.
    let guardianGate = null;
    if(guardianCap && p.id.endsWith(':cap')){
      const frame=new THREE.Group();frame.name='AuthoritativeGuardianGate';
      // Separate the decorative gate from the cap's exact collision mesh:
      // traversable platform tests, camera clearance and collision bounds
      // must see only the real walkable deck, never the towering gate facade.
      floorGroup.add(frame);
      const doorway=new THREE.Group();
      doorway.name='GuardianGateInset';
      doorway.position.z=21.8;frame.add(doorway);
      for(const side of [-1,1]){
        block(doorway,materials.dark,[side*3.38,2.35,0],[.58,4.8,.78]);
        block(doorway,materials.edge,[side*3.38,4.77,.12],[.8,.25,.95]);
      }
      block(doorway,materials.dark,[0,4.7,0],[7.35,.5,.88]);
      const wings=[];
      for(const side of [-1,1]){
        const wing=new THREE.Group();
        wing.name=side<0?'GuardianSealWingLeft':'GuardianSealWingRight';
        wing.position.z=.37;doorway.add(wing);
        block(wing,materials.copper,[side*1.56,2.13,0],[3.09,4.14,.28]);
        block(wing,materials.edge,[side*2.82,2.13,.19],[.13,3.6,.075]);
        wings.push({side,wing});
      }
      // A large faceted lock is a shape cue, not color-only state feedback.
      const crest=mesh(doorway,geometry('guardian-gate-keystone',()=>new THREE.OctahedronGeometry(.52,0)),
        materials.warning,[0,4.72,.54],[1,.78,.36]);
      crest.name='ObservedGuardianLockCrest';
      // One physically attached luminous conduit travels from the lock to
      // the cap's walking lane as genuine guardian HP drops. The player can
      // read the combat-to-gate relationship even when the doors are behind
      // the guardian: one reusable bevelled mesh, no light, shadow, collider
      // or extra HUD. At full HP this is only a short inset socket.
      const conduit=block(doorway,materials.mint,[0,.07,.34],[.18,.06,.18]);
      conduit.name='GuardianEncounterConduit';
      // Paired counterweights drop as the actual guardian takes damage:
      // original, non-colliding architectural silhouettes beyond the cap.
      // No shadow multiplication, animation timers or fabricated door events.
      const counterweights=[];
      for(const side of [-1,1]){
        block(doorway,materials.dark,[side*4.3,2.25,-.3],[.34,5.1,.42]).name='GuardianSealCounterweightRail';
        const carriage=new THREE.Group();
        carriage.name=side<0?'GuardianCounterweightLeft':'GuardianCounterweightRight';
        doorway.add(carriage);
        block(carriage,materials.copper,[side*4.3,3.76,-.02],[.8,1.45,.65]).name='GuardianSealCounterweight';
        block(carriage,materials.edge,[side*4.3,4.5,.13],[.9,.16,.7]);
        counterweights.push({side,carriage});
      }
      // A physically coupled capstan and paired tension lines explain WHY
      // the gate doors and heavy counterweights move as the guardian loses
      // actual health. This is original 3D world geometry, not a HUD meter
      // or a second gameplay authority. Rigid spoke art batches to two
      // materials; the two live cable lengths share one GPU instance draw.
      const capstan=new THREE.Group();capstan.name='GuardianGateCapstan';
      capstan.position.set(0,5.2,.26);doorway.add(capstan);
      mesh(capstan,geometry('guardian-gate-capstan-rim',
        ()=>new THREE.TorusGeometry(.66,.105,6,22)),materials.copper);
      mesh(capstan,cylinder(),materials.edge,[0,0,0],[.16,.14,.16],[Math.PI/2,0,0]);
      for(const angle of [0,Math.PI/2])
        block(capstan,materials.edge,[0,0,-.06],[1.12,.1,.13],[0,0,angle]);
      batchRigid(capstan);
      const tension=new THREE.InstancedMesh(cylinder(),materials.edge,2);
      tension.name='GuardianCounterweightTension';
      tension.instanceMatrix.setUsage(THREE.DynamicDrawUsage);
      tension.castShadow=false;tension.receiveShadow=false;tension.frustumCulled=false;
      doorway.add(tension);
      const tensionPose=new THREE.Object3D();
      // The rigid gate piers, lintel and rails do not need one GPU draw
      // each. Batch ONLY this immovable architecture into shared-material
      // meshes; the source-driven doors, weights, crest and conduit stay
      // separate animated nodes with the exact same visible silhouette.
      // The entire frame remains a floor-owned decorative sibling, never
      // part of the walkable deck or authoritative hitbox.
      batchRigid(frame,new Set([crest,conduit,capstan,tension,
        ...wings.map(entry=>entry.wing),
        ...counterweights.map(entry=>entry.carriage)]));
      // Rigid batching creates fresh material-sharing meshes. Mark the final
      // meshes after batching, or the floor's subsequent generic shadow pass
      // would wrongly turn the dark masonry into new shadow casters.
      frame.traverse(object=>{if(object.isMesh){
        object.userData.ambientDetail=true;object.castShadow=false;object.receiveShadow=false;
      }});
      guardianGate={frame,wings,crest,counterweights,conduit,capstan,tension,tensionPose,
        progress:null,unlocked:false};
    }
    let capMaterials = [];
    if(p.id.endsWith(':cap')){
      // The last route gap is shorter than the guardian's body. A thick
      // decorative box beam buries its face inside a one-way platform. Keep
      // the exact usable top and angular edges, with a thin front plate and
      // the existing supports recessed behind the character corridor.
      for(const child of root.children)if(child!==mount&&child!==guardianGate?.frame){
        child.position.y=h+(child.position.y-h)*.12;child.scale.y*=.12;
      }
      // A cap may cross the line of sight to its own guardian. Give only its
      // traversable face and trim floor-owned alpha materials; keep rear supports
      // and every collision-aligned vertex untouched. Precompile transparency
      // once so visibility transitions cannot cause per-frame shader churn.
      const owned = new Map();
      for(const child of root.children)if(child!==mount&&child!==guardianGate?.frame)child.traverse(object=>{
        if(!object.isMesh)return;
        const original=object.material;
        if(!owned.has(original)){
          const material=original.clone();
          material.transparent=true;material.opacity=1;material.depthWrite=true;
          material.name='guardian-sightline-cap';
          owned.set(original,material);floorMaterials.add(material);
        }
        object.material=owned.get(original);
      });
      capMaterials=[...owned.values()];
    }
    root.traverse(o=>{if(o.isMesh&&o.material===bodyMaterial)o.userData.structural=true;});
    platforms.set(p.id,{root,angle,width:p.width,height:p.height,capMaterials,guardianGate});return root;
  }
  function buildHazard(h,width){
    const root=new THREE.Group();root.name=`hazard:${h.id}`;floorGroup.add(root);
    const w=h.width/width*ARC*25,height=h.height/SCALE;
    const live=new THREE.Group();root.add(live);
    // The warning plinth sits below the lethal collider; only active geometry occupies its exact height.
    block(root,materials.dark,[0,-.22,0],[w,.42,2.9]);
    for(const sign of [-1,1])block(root,materials.warning,[sign*(w*.5-.1),-.1,.3],[.2,.2,3]);
    const indicator=block(root,materials.mint,[0,-.12,1.54],[w*.7,.09,.08]);
    let spin=null;
    if(h.kind==='spikes'){
      const teeth=[];for(let i=0;i<Math.max(3,Math.round(w/.48));i++)for(const z of [-.65,.55])teeth.push({p:[-w*.5+.25+i*w/Math.max(3,Math.round(w/.48)),height*.5,z],s:[.25,height,.25]});instanced(live,cone(),materials.edge,teeth);
    }else if(h.kind==='heat'){
      for(let i=0;i<4;i++){
        const x=-w*.37+i*w*.245;mesh(root,cylinder(),materials.copper,[x,-.07,0],[.27,.18,.27]);
        mesh(live,cone(),materials.fire,[x,height*.5,0],[.32,height,.32]);mesh(live,sphere(),materials.hot,[x,height*.17,0],[.25,height*.31,.25]);
      }
      const grille=[];for(let i=0;i<7;i++)grille.push({p:[-w*.44+i*w*.145,-.02,0],s:[.09,.12,2.5]});instanced(root,box(),materials.metal,grille);
    }else if(h.kind==='crusher'){
      for(const sign of [-1,1]){block(root,materials.metal,[sign*w*.43,height*.5,-.95],[.18,height+1.1,.22]);mesh(root,cylinder(),materials.copper,[sign*w*.32,.35,-.5],[.12,1.1,.12]);}
      block(live,materials.edge,[0,height*.62,0],[w*.94,height*.75,2.45]);
      for(let i=0;i<5;i++)block(live,materials.warning,[-w*.37+i*w*.18,height*.55,1.25],[w*.11,height*.6,.07],[0,0,-.35]);
      block(live,materials.metal,[0,.08,0],[w*.94,.16,2.5]);
    }else if(h.kind==='lightning'){
      for(const sign of [-1,1]){mesh(root,cylinder(),materials.metal,[sign*w*.45,.1,0],[.18,.6,.18]);mesh(root,sphere(),materials.edge,[sign*w*.45,.42,0],[.28,.18,.28]);}
      const pts=[];for(let i=0;i<10;i++)pts.push([-w*.45+i*w*.1,height*(.2+(i%2)*.62),0]);
      for(let i=1;i<pts.length;i++)beam(live,pts[i-1],pts[i],.065,materials.electric);
      for(let i=0;i<3;i++)block(root,materials.glow,[-w*.25+i*w*.25,-.12,1.56],[.15,.12,.06]);
    }else{
      const portal=mesh(live,own(new THREE.TorusGeometry(Math.min(w*.38,height*.37),Math.min(.07,height*.08,w*.08),6,24)),materials.crystal,[0,height*.5,.2]);spin=portal;
      mesh(live,own(new THREE.OctahedronGeometry(.42,0)),materials.glow,[0,height*.5,0],[1,height,.8]);
      for(let i=0;i<4;i++){const a=i/4*TAU;block(root,materials.edge,[Math.cos(a)*w*.37,-.01,Math.sin(a)],[.35,.3,.35],[0,a,.4]);}
    }
    conformDanger(live,w,height,spin);
    hazards.set(h.id,{root,live,indicator,spin,kind:h.kind,active:false,height});
  }
  function clearFloor(){
    if(floorGroup){group.remove(floorGroup);floorGroup.traverse(o=>{if(o.isInstancedMesh)o.dispose();});}
    for(const g of floorGeometries)g.dispose();for(const m of floorMaterials)m.dispose();
    floorGeometries.clear();floorMaterials.clear();platforms.clear();hazards.clear();rotors.length=0;floaters.length=0;particles=null;vistaGroup=null;floorGroup=null;occludedGuardianCaps=0;ruinsPortalVoussoirs=0;ruinsGateLeaves=0;
    ruinsSanctuaryArches=0;ruinsSanctuaryPlants=0;ruinsSanctuaryCascadePanels=0;
  }
  function rebuild(snapshot, requestedQuality='normal'){
    clearFloor();quality=requestedQuality;theme=THEMES[snapshot.theme]?snapshot.theme:'foundry';const p=PALETTES[theme];
    materials={stone:weather(mat(p.stone,.04,.86)),dark:mat(p.dark,.28,.58),metal:mat(p.metal,.48,.39),copper:mat(theme==='foundry'?0xc88c57:p.metal,.55,.32),edge:mat(p.edge,.12,.68),
      portalStone:theme==='ruins'?applyStoneSurface(mat(p.edge,.035,.90),stoneSurface,{scale:.11,strength:.56,relief:.013}):mat(p.edge,.12,.68),
      gate:theme==='ruins'?mat(0x43534b,.38,.73):null,gateTrim:theme==='ruins'?mat(0x87846a,.48,.64):null,
      ceramic:applyStoneSurface(mat(theme==='foundry'?0xb6b5a0:p.stone,.08,.4),stoneSurface,{scale:.085,strength:.36,relief:.01}),furnaceCore:mat(0x7d301b,.1,.72,{emissive:0xf25a13,emissiveIntensity:.72}),
      glow:mat(p.glow,.1,.4,{emissive:p.glow,emissiveIntensity:.85}),mint:mat(0xb6ffdc,.1,.35,{emissive:0x63e4ad,emissiveIntensity:.7}),warning:mat(0xf2ad4e,.3,.62),
      fire:mat(0xffa835,0,.5,{emissive:0xff7021,emissiveIntensity:1.5}),hot:mat(0xffe7a3,0,.5,{emissive:0xffb83c,emissiveIntensity:1}),electric:mat(0xc6f8ff,0,.3,{emissive:0x83dfff,emissiveIntensity:1.2}),
      bark:mat(0x5b6b4b,0,1),foliage:mat(0x698e58,0,.94),crystal:mat(0xb5a0ec,.45,.23,{emissive:0x7758ae,emissiveIntensity:.35}),
      sanctuaryStone:theme==='ruins'?applyStoneSurface(mat(0xb5a890,.025,.86),stoneSurface,{scale:.1,strength:.54,relief:.014}):null,
      sanctuaryWater:theme==='ruins'?mat(0x79b9ac,.04,.33,{transparent:true,opacity:.75,depthWrite:false,side:THREE.DoubleSide}):null,
      distant:null,cloud:mat(THEMES[theme].fog,0,1,{transparent:true,opacity:.075,depthWrite:false}),particle:mat(p.glow,0,1,{emissive:p.glow,emissiveIntensity:1})};
    // The remote buildings retain directional form through the haze instead
    // of becoming a single flat silhouette cutout at every depth.
    materials.distant=mat(new THREE.Color(THEMES[theme].sky).lerp(new THREE.Color(THEMES[theme].fog),.23).multiplyScalar(.5),.03,.95);
    if(theme==='ruins'){materials.gate.name='ruins-gate-leaves';materials.gateTrim.name='ruins-gate-relief';}
    if(theme==='ruins')materials.sanctuaryStone.name='ruins-sanctuary-stone';
    materials.distant.name='distant-atmosphere';
    materials.cloud.name='ambient-clouds';materials.particle.name='ambient-particles';
    materials.cloud.onBeforeCompile=shader=>{shader.fragmentShader=shader.fragmentShader.replace('#include <opaque_fragment>','diffuseColor.a *= pow(max(0.0, dot(normal, normalize(vViewPosition))), 1.4);\n#include <opaque_fragment>');};
    materials.cloud.customProgramCacheKey=()=> 'soft-atmosphere-shell-v1';
    materials.landing=mat(p.landing,theme==='ruins'?.03:.35,theme==='ruins'?.88:.62);
    if(theme==='ruins')weather(materials.landing);
    materials.tread=mat(p.dark,.4,.8,{polygonOffset:true,polygonOffsetFactor:-1,polygonOffsetUnits:-1});
    floorGroup=new THREE.Group();floorGroup.name=`floor:${snapshot.floor}:${theme}`;group.add(floorGroup);
    const height=snapshot.chunkHeight/SCALE;buildTower(height);buildDistantWorld(height);buildVista(height);
    for(const p of snapshot.platforms||[])buildPlatform(p,snapshot.worldWidth,(snapshot.enemies||[]).some(e=>e.kind==='guardian'));
    for(const h of snapshot.hazards||[])buildHazard(h,snapshot.worldWidth);
    for(const r of rotors)r.o.traverse(o=>{if(o.isMesh)o.userData.ambientDetail=true;});
    // The large structural masses cast the route shadows. Tiny bolts, foliage,
    // motes, glow strips and remote buildings keep their geometry and receive
    // lighting without multiplying shadow-map draws.
    floorGroup.traverse(o=>{if(o.isMesh){o.castShadow=!o.userData.ambientDetail&&(!!o.userData.structural||o.material===materials.stone||o.material===materials.dark);if(o.material===materials.distant)o.receiveShadow=false;}});
    for(const h of hazards.values())h.root.traverse(o=>{if(o.isMesh)o.castShadow=true;});
    finishBatches();
    key=`${snapshot.runToken}:${snapshot.floor}:${snapshot.theme}:${quality}`;
  }
  function update(snapshot,dt=0,time=0,options={}){
    if(disposed||!snapshot)return;
    const requestedQuality=options.quality==='low'?'low':options.quality==='high'?'high':'normal';
    if(key!==`${snapshot.runToken}:${snapshot.floor}:${snapshot.theme}:${requestedQuality}`)rebuild(snapshot,requestedQuality);
    lastSnapshot=snapshot;
    for(const p of snapshot.platforms||[]){const entry=platforms.get(p.id);if(!entry)continue;entry.root.rotation.y=angleFor(p.x+p.width*.5,snapshot.worldWidth);entry.root.position.y=(p.y-snapshot.chunkBaseY)/SCALE;entry.root.userData.authority={x:p.x,y:p.y,width:p.width,height:p.height};
      if(entry.guardianGate){
        // A cap can move or appear at a different height in a replay. Anchor
        // its independent decorative doorway to the exact live cap transform.
        // The doorway's child inset remains safely inside the walking radius.
        const anchorX=guardianGateAnchorX(snapshot,p);
        entry.guardianGate.anchorX=anchorX;
        entry.guardianGate.frame.rotation.y=angleFor(anchorX,snapshot.worldWidth);
        entry.guardianGate.frame.position.set(0,entry.root.position.y+p.height/SCALE,0);
        // Only the genuine, present guardian's authoritative active state can
        // release the gate. A missing snapshot or transport outage never
        // fabricates a victory. On a mid-run renderer rebuild, it rehydrates
        // directly to the current observed state without replaying a cue.
        const guardian=(snapshot.enemies||[]).find(enemy=>enemy.kind==='guardian');
        if(guardian){
          const unlocked=!guardian.active;
          const gate=entry.guardianGate;
          // Real guardian health is the encounter's visible progression
          // currency. The source often moves straight from final hit to the
          // next floor, so a door that reacts ONLY to inactive guardians
          // would never be seen opening in actual autonomous play.
          // Incrementally separate the original physical bronze wings as
          // real hit points fall, reserving full passage for a real defeat.
          const healthRatio=Number.isFinite(guardian.health)&&
            Number.isFinite(guardian.maxHealth)&&guardian.maxHealth>0
            ? THREE.MathUtils.clamp(guardian.health/guardian.maxHealth,0,1):1;
          const target=unlocked?1:(1-healthRatio)*.72;
          if(gate.progress===null || options.reducedMotion)gate.progress=target;
          else if(!options.stale){
            // Calibrated to real displayed dt: a slow render still catches
            // up visibly, whereas a fast renderer opens smoothly. No timer
            // changes tower ticks or asserts a hit before the source does.
            const step=Math.min(Math.max(dt,0),.25)*1.8;
            gate.progress+=Math.sign(target-gate.progress)*Math.min(Math.abs(target-gate.progress),step);
          }
          gate.unlocked=unlocked;
          for(const {side,wing} of gate.wings)wing.position.x=gate.progress===0?0:side*gate.progress*2.8;
          for(const {side,carriage} of gate.counterweights){
            carriage.position.y=-gate.progress*2.35;
            carriage.rotation.z=side*gate.progress*.07;
          }
          // No invented impulse: the wheel turns and the cables spool only
          // as the true source-driven weights descend. Reduced motion retains
          // the new cable length but not the extra winding rotation.
          gate.capstan.rotation.z=options.reducedMotion?0:gate.progress*Math.PI*1.45;
          const cableLength=.54+gate.progress*2.35;
          for(const [index,side] of [-1,1].entries()){
            gate.tensionPose.position.set(side*4.3,5.12-cableLength*.5,.24);
            gate.tensionPose.rotation.set(0,0,0);
            gate.tensionPose.scale.set(.047,cableLength,.047);
            gate.tensionPose.updateMatrix();
            gate.tension.setMatrixAt(index,gate.tensionPose.matrix);
          }
          gate.tension.instanceMatrix.needsUpdate=true;
          gate.crest.scale.x=1+gate.progress*.2;
          // The path advances with the HP-driven lock, never invented clearance.
          // It ends inside the real deck's outer rim and has no collider.
          gate.conduit.scale.z=.18+gate.progress*4.52;
          gate.conduit.scale.x=.18+gate.progress*.12;
          gate.conduit.position.z=.25+gate.conduit.scale.z*.5;
          gate.crest.material=unlocked?materials.mint:materials.warning;
          gate.crest.rotation.z=gate.progress*Math.PI*.5;
        }
      }
    }
    for(const h of snapshot.hazards||[]){const e=hazards.get(h.id);if(!e)continue;const p=pointFor(h.x+h.width*.5,h.y,snapshot.chunkBaseY,snapshot.worldWidth,25);e.root.position.set(p.x,p.y,p.z);e.root.rotation.y=p.angle;e.live.visible=!!h.active;e.active=!!h.active;e.indicator.material=h.active?materials.warning:materials.mint;if(e.spin&&!options.reducedMotion)e.spin.rotation.z=time*.35;}
    if(!options.reducedMotion){for(const r of rotors)r.o.rotation[r.axis||'z']+=Math.min(dt,.05)*r.speed;for(const f of floaters)f.o.position.y=f.y+Math.sin(time*f.speed+f.phase)*.23;}
    if(particles){particles.visible=quality!=='low';if(!options.reducedMotion&&quality!=='low'){
      const items=particles.userData.items;for(let i=0;i<items.length;i++){const s=items[i];dummy.position.set(s.p[0]+Math.sin(time*.13+i)*.2,s.p[1]+Math.sin(time*.19+i*.5)*.7,s.p[2]);dummy.rotation.set(0,0,0);dummy.scale.set(...s.s);dummy.updateMatrix();particles.setMatrixAt(i,dummy.matrix);}particles.instanceMatrix.needsUpdate=true;
    }}
  }
  function revealGuardianSightlines(camera, crestPoints=[]) {
    if(disposed||!camera)return;
    let faded=0;
    for(const entry of platforms.values()){
      if(!entry.capMaterials.length)continue;
      entry.root.updateWorldMatrix(true,true);
      let blocked=false;
      for(const crest of crestPoints){
        canopyDirection.copy(crest).sub(camera.position);
        const distance=canopyDirection.length();
        if(!Number.isFinite(distance)||distance<=.1)continue;
        canopyRay.set(camera.position,canopyDirection.multiplyScalar(1/distance));
        canopyRay.near=0;canopyRay.far=distance-.05;
        if(canopyRay.intersectObject(entry.root,true).length){blocked=true;break;}
      }
      // The guarded enemy remains behind the physical cap. Only the cap's
      // camera-obstructing pixels soften, preserving the drawn deck/rim as a
      // translucent climbable surface, depth-tested against other obstacles.
      // No overlays, x-ray characters, authoring edits or renderer allocations.
      for(const material of entry.capMaterials){
        material.opacity=blocked?.32:1;
        material.depthWrite=!blocked;
      }
      if(blocked)faded++;
    }
    occludedGuardianCaps=faded;
  }
  function diagnostics(){let objects=0,meshes=0,instances=0,shadowCasterMeshes=0,triangles=0;group.traverse(o=>{objects++;if(o.isMesh){meshes++;if(o.castShadow)shadowCasterMeshes++;triangles+=(o.geometry.index?o.geometry.index.count:o.geometry.attributes.position.count)/3*(o.isInstancedMesh?o.count:1);}if(o.isInstancedMesh)instances+=o.count;});return{objects,meshes,instances,shadowCasterMeshes,triangles,geometries:floorGeometries.size+primitives.size,materials:floorMaterials.size,platforms:platforms.size,hazards:hazards.size,ambientParticles:particles?.visible?48:0,floor:lastSnapshot?.floor??null,theme,quality,disposed,guardianGates:[...platforms.entries()].filter(([,p])=>p.guardianGate).map(([id,p])=>({id,unlocked:p.guardianGate.unlocked,opening:p.guardianGate.progress,conduitReach:p.guardianGate.conduit.scale.z,anchorX:p.guardianGate.anchorX})),occludedGuardianCaps,ruinsPortalVoussoirs,ruinsGateLeaves,ruinsSanctuaryArches,ruinsSanctuaryPlants,ruinsSanctuaryCascadePanels,vistaLayers:vistaGroup?3:0,vistaTriangles:vistaGroup?.children.reduce((sum,mesh)=>sum+mesh.geometry.attributes.position.count/3,0)??0,surfaceTexture:stoneSurface.diagnostics(),platformTransforms:[...platforms.entries()].map(([id,e])=>({id,...e.root.userData.authority,angle:e.root.rotation.y,yWorld:e.root.position.y}))};}
  function dispose(){if(disposed)return;clearFloor();for(const g of primitives.values())g.dispose();primitives.clear();stoneSurface.dispose();group.clear();lastSnapshot=null;disposed=true;}
  return{group,update,revealGuardianSightlines,dispose,diagnostics};
}
