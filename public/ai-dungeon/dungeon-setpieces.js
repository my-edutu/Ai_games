import * as THREE from '/dungeon/vendor/three.module.js';
import {planDungeonSetpieces} from '/dungeon/setpiece-plan.js';

// A small original sculptural vocabulary replaces repeated neon obelisks.
// Decoration is anchored against solid walls; the collision grid is NEVER modified.
// Reusing every geometry and material makes successive autonomous floors affordable.
const PALETTES=[
 {stone:'#445c62',rim:'#8aaba0',metal:'#896e53',cloth:'#2d5e58',core:'#59c4ad'},
 {stone:'#584149',rim:'#bc8d79',metal:'#d4a46f',cloth:'#632e34',core:'#efa16c'},
 {stone:'#3d5277',rim:'#8facc8',metal:'#9d998e',cloth:'#293d62',core:'#71b9d8'},
 {stone:'#55446a',rim:'#b1a0c1',metal:'#bba28f',cloth:'#45355f',core:'#b08bcf'}
];
export function createDungeonSetpieces(world,map,floor,exit){
 const placements=planDungeonSetpieces(map,floor,exit,8),palette=PALETTES[(floor-1)%4];
 const root=new THREE.Group();root.name='Dungeon biomes: original setpieces';world.add(root);
 const geos=[],mats=[],movables=[];
 const geometry=g=>{geos.push(g);return g};
 const material=(color,roughness=.84,metalness=.09,emissiveIntensity=0)=>{
  const m=new THREE.MeshStandardMaterial({color,roughness,metalness,emissive:emissiveIntensity?color:'#000000',emissiveIntensity});mats.push(m);return m;
 };
 const stone=material(palette.stone),edge=material(palette.rim,.8,.16),metal=material(palette.metal,.48,.61);
 const cloth=material(palette.cloth,.92,.03),ink=material('#171d27',.96,.04),magic=material(palette.core,.46,.2,.36);
 const box=geometry(new THREE.BoxGeometry(1,1,1));
 const oval=geometry(new THREE.SphereGeometry(1,10,7));
 const cylinder=geometry(new THREE.CylinderGeometry(.5,.5,1,10));
 const cone=geometry(new THREE.ConeGeometry(.5,1,9));
 const crystal=geometry(new THREE.OctahedronGeometry(.5,0));
 const ring=geometry(new THREE.TorusGeometry(.24,.028,6,22));
 const largeRing=geometry(new THREE.TorusGeometry(.32,.036,6,28));
 const arch=geometry(new THREE.TorusGeometry(.34,.065,7,24,Math.PI));
 const relief=geometry(new THREE.DodecahedronGeometry(.5,0));
 const inPlace=(g,geo,mat,x,y,z,sx=1,sy=1,sz=1)=>{
  const mesh=new THREE.Mesh(geo,mat);mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
  mesh.receiveShadow=true;mesh.castShadow=false;g.add(mesh);return mesh;
 };
 function commonNiche(g,variant){
  // A projecting tracery frame and paired columns produce a recognisable architectural pocket.
  // Back pieces hug the wall; nothing takes over the centre of a traversable tile.
  inPlace(g,box,stone,0,.94,.18,.73,1.53,.11);
  inPlace(g,box,edge,-.34,.91,.08,.085,1.57,.12);
  inPlace(g,box,edge,.34,.91,.08,.085,1.57,.12);
  inPlace(g,arch,metal,0,1.68,-.017,1,1,.40);
  inPlace(g,box,stone,0,.095,-.16,.69,.18,.54);
  inPlace(g,box,edge,0,.2,-.16,.61,.055,.48);
  if(variant===1){
   inPlace(g,oval,edge,-.28,.26,-.37,.07,.075,.065);
   inPlace(g,oval,edge,.28,.26,-.37,.07,.075,.065);
  }
 }
 function ossuary(g,variant){
  // A recumbent stone reliquary, cut lid, bone-coloured masks and oxidised burial seals.
  inPlace(g,box,stone,0,.35,-.15,.51,.21,.30);
  inPlace(g,box,edge,0,.475,-.15,.55,.08,.34).rotation.z=(variant-1)*.09;
  inPlace(g,box,metal,0,.52,-.155,.085,.022,.28);
  const skull=inPlace(g,oval,edge,0,.80,-.025,.135,.15,.125);
  inPlace(g,oval,ink,-.052,.82,-.135,.029,.04,.02);
  inPlace(g,oval,ink,.052,.82,-.135,.029,.04,.02);
  inPlace(g,crystal,magic,0,1.25,-.04,.14,.30,.075);
  skull.rotation.z=(variant-1)*.14;
 }
 function forge(g,variant){
  // Low furnace bowl surrounded by forged copper teeth; no white oversized shafts.
  inPlace(g,cylinder,stone,0,.42,-.17,.54,.39,.54);
  inPlace(g,cylinder,metal,0,.67,-.17,.55,.11,.55);
  inPlace(g,oval,ink,0,.735,-.17,.24,.035,.24);
  const flame=inPlace(g,cone,magic,0,.87,-.17,.28,.35,.28);
  for(const x of [-.20,.20]){
   inPlace(g,cone,edge,x,.79,-.20,.10,.22,.10);
   inPlace(g,box,metal,x,.38,-.42,.09,.25,.10);
  }
  inPlace(g,ring,metal,0,1.32,.06,.6,.6,.6);
  flame.rotation.z=(variant-1)*.2;movables.push({object:flame,kind:'flame',phase:variant});
 }
 function orrery(g,variant){
  // Metal gyroscope and octahedral starlight on a square astronomy table.
  inPlace(g,box,ink,0,.36,-.17,.54,.22,.36);
  inPlace(g,box,metal,0,.51,-.17,.57,.07,.39);
  const wheel=new THREE.Group();wheel.position.set(0,1.00,-.12);
  inPlace(wheel,largeRing,metal,0,0,0,1,.97,1).rotation.y=.37;
  inPlace(wheel,ring,edge,0,0,0,.83,.83,.83).rotation.x=.65;
  inPlace(wheel,crystal,magic,0,0,0,.28,.50,.28);
  g.add(wheel);movables.push({object:wheel,kind:'wheel',phase:variant});
  for(const x of [-.22,.22])inPlace(g,oval,edge,x,.57,-.26,.04,.045,.04);
 }
 function scriptorium(g,variant){
  // A reading desk with a genuinely open two-page codex and a restrained spectral seal.
  inPlace(g,box,stone,0,.38,-.19,.42,.39,.32);
  const desk=inPlace(g,box,edge,0,.62,-.26,.63,.075,.37);desk.rotation.x=-.18;
  const left=inPlace(g,box,cloth,-.14,.69,-.29,.29,.026,.23);left.rotation.z=-.10;
  const right=inPlace(g,box,cloth,.14,.69,-.29,.29,.026,.23);right.rotation.z=.10;
  inPlace(g,box,metal,0,.70,-.30,.018,.028,.27);
  for(const side of [-1,1])for(let i=0;i<3;i++){
   inPlace(g,box,metal,side*.16,.725,-.39+i*.064,.11,.005,.009);
  }
  const seal=inPlace(g,crystal,magic,0,1.18,-.07,.13,.22,.095);
  seal.rotation.z=(variant-1)*.22;
 }
 for(const p of placements){
  const anchor=new THREE.Group();anchor.name=p.motif+'-niche';
  anchor.position.set(p.worldX,0,p.worldZ);anchor.rotation.y=p.yaw;
  commonNiche(anchor,p.variant);
  if(p.motif==='ossuary')ossuary(anchor,p.variant);
  else if(p.motif==='forge')forge(anchor,p.variant);
  else if(p.motif==='orrery')orrery(anchor,p.variant);
  else scriptorium(anchor,p.variant);
  root.add(anchor);
  // The existing 3D camera clearance protects the party from set-piece occlusion.
  world.userData.foregroundProps?.push(anchor);
 }
 const metrics={landmarks:placements.length,wallReliefs:placements.length,
  motif:placements[0]?.motif??'none',animatedSetpieces:movables.length,
  uniqueSculptureFamilies:4,meshBudget:placements.length*21};
 return{metrics,update(time){
  for(const move of movables){
   if(move.kind==='wheel')move.object.rotation.y=time*.19+move.phase*.25;
   else move.object.scale.y=1+Math.sin(time*4.2+move.phase)*.07;
  }
 },dispose(){root.parent?.remove(root);for(const m of mats)m.dispose();for(const g of geos)g.dispose()}};
}
