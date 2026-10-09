/* Infinite Tower — Sculpted Geology IX.
 * Render-only cliff faces, stratified rock and talus; deterministic from public floor/theme.
 * Every surface is behind the authoritative gameplay plane. No collisions or AI changes.
 */
import * as THREE from '/tower/three.module.js';

const hash=n=>{const v=Math.sin(n*127.71+18.93)*43758.5453;return v-Math.floor(v)};
const THEMES={
  foundry:{rock:0x76504a,light:0xc68a6c,dark:0x3c3037,vein:0xf4a86b},
  ruins:{rock:0x788b75,light:0xb9c6a0,dark:0x3e5b53,vein:0x85c5a0},
  storm:{rock:0x657f9c,light:0xb8d5df,dark:0x334967,vein:0x8ee4f6},
  clockwork:{rock:0x9b7655,light:0xd9b789,dark:0x53443f,vein:0xe5b16b},
  void:{rock:0x5a527f,light:0xa79bc8,dark:0x292740,vein:0xc5a1ef}
};
const mix=(a,b,t)=>new THREE.Color(a).lerp(new THREE.Color(b),t);
function cliffMesh(side,layer,{width,base,height,floor,theme,low}){
  const rows=low?24:48,cols=low?6:11,seed=floor*97+layer*41+(side==='left'?7:29);
  const tone=THEMES[theme]||THEMES.foundry;
  const pos=[],colors=[],indices=[],edge=[];
  const span=65+layer*17,outer=side==='left'?-78-layer*13:width+78+layer*13;
  const sign=side==='left'?1:-1;
  for(let j=0;j<=rows;j++){
    const v=j/rows,y=base-75+v*(height+150);
    const contour=8*Math.sin(v*13+seed*.1)+13*Math.sin(v*6.7+seed*.17)+7*(hash(seed+j*11)-.5);
    edge.push(outer+sign*(span+contour));
    for(let i=0;i<=cols;i++){
      const u=i/cols,grain=hash(seed+i*101+j*17);
      const x=outer+sign*u*(span+contour)+(grain-.5)*4.5;
      const z=-143+layer*20+Math.sin(v*22+u*7+seed)*5+Math.cos(v*41-u*19)*3+(grain-.5)*7;
      pos.push(x,y+(grain-.5)*2.2,z);
      const shade=.23+.58*hash(seed+i*19+j*13)+.15*u;
      const col=mix(tone.dark,tone.rock,shade).lerp(new THREE.Color(tone.light),Math.max(0,Math.sin(v*25+u*11+seed))*.18);
      colors.push(col.r,col.g,col.b);
    }
  }
  for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){
    const a=j*(cols+1)+i,b=a+1,c=a+cols+1,d=c+1;
    if((i+j+seed)%2){indices.push(a,c,b,b,c,d)}else{indices.push(a,c,d,a,d,b)}
  }
  const geo=new THREE.BufferGeometry();
  geo.setAttribute('position',new THREE.Float32BufferAttribute(pos,3));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
  geo.setIndex(indices);geo.computeVertexNormals();
  const mat=new THREE.MeshStandardMaterial({vertexColors:true,roughness:1,metalness:0,flatShading:true,side:THREE.DoubleSide});
  const face=new THREE.Mesh(geo,mat);face.name='faceted-'+side+'-cliff-'+layer;
  // Shallow, weathered striation strokes follow the cliff contour.
  const lines=[];
  for(let band=0;band<Math.min(20,low?9:20);band++){
    const j=2+Math.floor(hash(seed+band*47)*(rows-4));
    const y=base-75+j/rows*(height+150);
    const from=outer+sign*(span*.17),to=edge[j]-sign*4;
    lines.push(from,y,-140+layer*20+10,to,y+2*Math.sin(band+seed),-140+layer*20+10);
  }
  const fissures=new THREE.BufferGeometry();
  fissures.setAttribute('position',new THREE.Float32BufferAttribute(lines,3));
  const seams=new THREE.LineSegments(fissures,new THREE.LineBasicMaterial({color:tone.dark,transparent:true,opacity:.48,depthWrite:false}));
  seams.name='rock-strata-'+side+'-'+layer;
  return{face,seams};
}
function talus(group,{width,base,height,floor,theme,low}){
  const tone=THEMES[theme]||THEMES.foundry;
  const count=low?52:132,geometry=new THREE.DodecahedronGeometry(1,0);
  const mat=new THREE.MeshStandardMaterial({color:0xffffff,roughness:.96,metalness:.03,flatShading:true});
  const mesh=new THREE.InstancedMesh(geometry,mat,count),dummy=new THREE.Object3D();
  mesh.name='instanced-scree';mesh.frustumCulled=false;
  const dark=new THREE.Color(tone.rock),bright=new THREE.Color(tone.light);
  for(let i=0;i<count;i++){
    const side=i%2===0,seed=floor*331+i*29;
    const distance=4+hash(seed+7)*92;
    const x=side?-55+distance:width+55-distance;
    const y=base-45+hash(seed+11)*(height+90);
    const z=-77-hash(seed+17)*38;
    const size=3+hash(seed+23)*11;
    dummy.position.set(x,y,z);
    dummy.scale.set(size*(.65+hash(seed+31)),size*(1.1+hash(seed+37)*1.6),size*.65);
    dummy.rotation.set(hash(seed+43)*3,hash(seed+47)*3,hash(seed+53)*3);
    dummy.updateMatrix();mesh.setMatrixAt(i,dummy.matrix);
    mesh.setColorAt(i,dark.clone().lerp(bright,.18+hash(seed+61)*.53));
  }
  mesh.instanceMatrix.needsUpdate=true;
  if(mesh.instanceColor)mesh.instanceColor.needsUpdate=true;
  group.add(mesh);return count;
}
function brokenShelves(group,{width,base,height,floor,theme,low}){
  const tone=THEMES[theme]||THEMES.foundry;
  const stone=new THREE.MeshStandardMaterial({color:tone.rock,roughness:.92,metalness:.04,flatShading:true});
  const highlight=new THREE.MeshStandardMaterial({color:tone.light,roughness:.84,metalness:.08});
  const n=low?5:10;
  for(let i=0;i<n;i++){
    const left=i%2===0,seed=floor*43+i*17;
    const length=22+hash(seed+3)*49;
    const thickness=4+hash(seed+7)*9;
    const x=left?length*.25-8:width-length*.25+8;
    const y=base+height*(.06+.88*hash(seed+11));
    const shelf=new THREE.Mesh(new THREE.CylinderGeometry(length*.65,length*.46,thickness,6),stone);
    shelf.rotation.z=Math.PI/2+(hash(seed+19)-.5)*.16;
    shelf.scale.z=1.5;shelf.position.set(x,y,-85);group.add(shelf);
    const ridge=new THREE.Mesh(new THREE.IcosahedronGeometry(length*.3,0),highlight);
    ridge.scale.set(1,.13,.52);ridge.position.set(x,y+thickness*.6,-79);group.add(ridge);
  }
  return n;
}
export function buildTowerGeology({group,snapshot,quality='auto'}){
  const width=snapshot.worldWidth/1000,base=snapshot.chunkBaseY/1000,height=snapshot.chunkHeight/1000;
  const low=quality==='low',theme=snapshot.theme,floor=snapshot.floor;
  const root=new THREE.Group();root.name='sculpted-geology-v9';group.add(root);
  let cliffFaces=0;
  for(let layer=0;layer<(low?2:3);layer++)for(const side of ['left','right']){
    const {face,seams}=cliffMesh(side,layer,{width,base,height,floor,theme,low});
    root.add(face,seams);cliffFaces++;
  }
  const rockInstances=talus(root,{width,base,height,floor,theme,low});
  const shelves=brokenShelves(root,{width,base,height,floor,theme,low});
  root.userData.metrics={cliffFaces,rockInstances,shelves,theme};
  return root;
}
