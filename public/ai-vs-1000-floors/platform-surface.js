import * as THREE from 'three';

// Every mark is an inlaid cosmetic surface at a fixed height above the pad.
// Keep the center quiet: floor route arrows, hazards and character contact
// remain immediately readable on the original full rectangular surface.
const THEMES=Object.freeze([
 'verdant-filigree','aqueduct-currents','copper-machinery','frost-facets',
 'coral-ripples','canopy-leaves','foundry-grating','observatory-dials',
 'astral-stars','crown-sunbursts'
]);
const HEIGHT=.028;
const TAU=Math.PI*2;

/** Buffered top-surface tesserae; each color produces one batchable mesh.
 * There are no custom textures, shaders, event listeners or runtime updates.
 */
export function createPlatformFinish(platform, materials, districtIndex=0, variant=0){
 const w=platform?.width,d=platform?.depth;
 if(!Number.isFinite(w)||!Number.isFinite(d)||w<3.6||d<3.6)throw new RangeError('Finish requires a finite 3.6m or larger landing');
 const district=Number.isInteger(districtIndex)&&districtIndex>=0&&districtIndex<10?districtIndex:0;
 const stage=Number.isInteger(variant)&&variant>=0?variant:0;
 const root=new THREE.Group();root.name='surface:'+THEMES[district];
 root.userData.theme=THEMES[district];
 // Exact footprint inset. Edges and corner emblems fit inside a 4.5 m pad.
 const ex=w/2-.30,ez=d/2-.30,innerX=ex-.23,innerZ=ez-.23;
 const streams={gold:[],teal:[],copper:[],dark:[]};
 const tri=(material,a,b,c)=>{
  const dest=streams[material];
  if(!dest)throw new Error('Unknown inlay color');
  const normalY=(b[2]-a[2])*(c[0]-a[0])-(b[0]-a[0])*(c[2]-a[2]);
  if(Math.abs(normalY)<1e-10)return;
  if(normalY<0)[b,c]=[c,b];
  for(const [x,y,z] of [a,b,c])dest.push(x,y,z);
 };
 const polygon=(material,points)=>{
  if(points.length<3)return;
  const anchor=[points.reduce((sum,p)=>sum+p[0],0)/points.length,HEIGHT,points.reduce((sum,p)=>sum+p[1],0)/points.length];
  for(let k=0;k<points.length;k++)tri(material,anchor,[points[k][0],HEIGHT,points[k][1]],[points[(k+1)%points.length][0],HEIGHT,points[(k+1)%points.length][1]]);
 };
 const rect=(material,x,z,width,depth,turn=0)=>{
  const ct=Math.cos(turn),st=Math.sin(turn),coords=[];
  for(const [u,v] of [[-1,-1],[1,-1],[1,1],[-1,1]])coords.push([x+u*width/2*ct-v*depth/2*st,z+u*width/2*st+v*depth/2*ct]);
  polygon(material,coords);
 };
 const diamond=(material,x,z,r)=>polygon(material,[[x-r,z],[x,z-r],[x+r,z],[x,z+r]]);
 const stripe=(material,a,b,width)=>{
  const dx=b[0]-a[0],dz=b[1]-a[1],len=Math.hypot(dx,dz);
  if(!len)return;
  const nx=dz/len*width/2,nz=-dx/len*width/2;
  polygon(material,[[a[0]+nx,a[1]+nz],[b[0]+nx,b[1]+nz],[b[0]-nx,b[1]-nz],[a[0]-nx,a[1]-nz]]);
 };
 const lineArc=(material,x,z,r,start,end,width=0.055,steps=8)=>{
  for(let j=0;j<steps;j++){
   const a=start+(end-start)*j/steps,b=start+(end-start)*(j+1)/steps;
   stripe(material,[x+r*Math.cos(a),z+r*Math.sin(a)],[x+r*Math.cos(b),z+r*Math.sin(b)],width);
  }
 };
 // Engraved double-frame and alternating corner boss tiles. Four non-walkable
 // colored rails are more readable than the previous nearly-white grout seams.
 for(const s of [-1,1]){
  rect('copper',0,s*ez,w-.62,.085);
  rect('copper',s*ex,0,.085,d-.62);
  rect('dark',0,s*innerZ,w-1.02,.05);
  rect('dark',s*innerX,0,.05,d-1.02);
  for(const t of [-1,1]){
   diamond(stage%2?'gold':'teal',s*(ex-.17),t*(ez-.17),.15);
   diamond('dark',s*(ex-.17),t*(ez-.17),.056);
  }
 }
 // Strong themed ornaments hug side lanes. The center |x|<1.10 remains
 // vacant, as does every route/hazard/exit marking near its center.
 const sideX=innerX-.34;
 for(const s of [-1,1])for(const [ordinal,z] of [-1,0,1].map((v,i)=>[i,v*.94])){
  const mid=s*sideX;
  switch(district){
   case 0: { // Heraldic garden leaves, vein and side tendril.
    polygon('teal',[[mid,z-.36],[mid+s*.24,z-.11],[mid+s*.19,z+.15],[mid,z+.32],[mid-s*.11,z+.09]]);
    stripe('gold',[mid,z-.26],[mid+s*.08,z+.25],.035);
    break;
   }
   case 1: { // Aqueduct water ripples, interleaved crests.
    for(let k=0;k<4;k++){
     const zz=z-.35+k*.21,offset=k%2?.10:-.09;
     stripe('teal',[mid-s*.23,zz],[mid+s*offset,zz+.085],.075);
     stripe('gold',[mid+s*offset,zz+.085],[mid+s*.21,zz+.01],.043);
    }
    break;
   }
   case 2: { // Gear sector, cog teeth and brass rivets.
    lineArc('dark',mid,z,.35,-Math.PI*.65,Math.PI*.65,.095,7);
    for(let k=0;k<5;k++){const a=-1.7+k*.8;rect('gold',mid+.33*Math.cos(a),z+.33*Math.sin(a),.14,.12,a);}
    diamond('copper',mid,z,.16);
    break;
   }
   case 3: { // Frost cut-glass star facets.
    for(let k=0;k<6;k++){
     const a=k*TAU/6;
     polygon(k%2?'teal':'gold',[[mid,z],[mid+Math.cos(a-.22)*.42,z+Math.sin(a-.22)*.42],[mid+Math.cos(a+.22)*.42,z+Math.sin(a+.22)*.42]]);
    }
    diamond('dark',mid,z,.13);
    break;
   }
   case 4: { // Shell whorls and coral fan ribs.
    for(let k=0;k<4;k++)lineArc(k%2?'copper':'teal',mid-s*.10,z-.19,.21+k*.07,Math.PI*.14,Math.PI*.85,.055,5);
    for(let k=-1;k<=1;k++)stripe('gold',[mid,z-.32],[mid+k*.23,z+.24],.038);
    break;
   }
   case 5: { // Overlapping canopy leaves and branching vein.
    polygon('dark',[[mid,z-.4],[mid+s*.28,z-.15],[mid+s*.15,z+.13],[mid,z+.39],[mid-s*.19,z+.04]]);
    polygon('teal',[[mid,z-.31],[mid+s*.17,z-.12],[mid+s*.09,z+.11],[mid,z+.30]]);
    stripe('gold',[mid,z-.31],[mid,z+.30],.039);
    break;
   }
   case 6: { // Foundry hatch with diagonal safety grading.
    rect('dark',mid,z,.57,.76);
    for(let k=0;k<4;k++)stripe('copper',[mid-.26,z-.3+k*.18],[mid+.26,z-.15+k*.18],.052);
    rect('gold',mid-.18,z+.32,.06,.09);rect('gold',mid+.18,z-.32,.06,.09);
    break;
   }
   case 7: { // Surveyor's dial and brass hour ticks.
    lineArc('gold',mid,z,.39,-Math.PI*.65,Math.PI*.65,.07,12);
    for(let k=0;k<7;k++){const a=-2.1+k*.7;stripe('dark',[mid+.27*Math.cos(a),z+.27*Math.sin(a)],[mid+.39*Math.cos(a),z+.39*Math.sin(a)],.064);}
    diamond('teal',mid,z,.13);
    break;
   }
   case 8: { // Compass-star and satellites.
    for(let k=0;k<8;k++){
     const a=k*TAU/8,r=k%2?.28:.46;
     polygon(k%2?'teal':'gold',[[mid,z],[mid+.085*Math.cos(a-.18),z+.085*Math.sin(a-.18)],[mid+r*Math.cos(a),z+r*Math.sin(a)],[mid+.085*Math.cos(a+.18),z+.085*Math.sin(a+.18)]]);
    }
    diamond('dark',mid,z,.13);
    break;
   }
   default: { // Crown sunburst: alternating radiant slivers and royal seal.
    for(let k=0;k<9;k++){
     const a=k*TAU/9;
     polygon(k%2?'gold':'copper',[[mid+.21*Math.cos(a-.12),z+.21*Math.sin(a-.12)],[mid+.48*Math.cos(a),z+.48*Math.sin(a)],[mid+.21*Math.cos(a+.12),z+.21*Math.sin(a+.12)]]);
    }
    diamond('dark',mid,z,.18);
   }
  }
 }
 for(const [name,material] of [['gold',materials.gold],['teal',materials.teal],['copper',materials.copper],['dark',materials.dark]]){
  const points=streams[name];if(!points.length)continue;
  const geometry=new THREE.BufferGeometry();
  geometry.setAttribute('position',new THREE.Float32BufferAttribute(points,3));
  const uv=[],normals=[];
  for(let i=0;i<points.length;i+=3){uv.push(points[i]/w+.5,points[i+2]/d+.5);normals.push(0,1,0);}
  geometry.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));
  geometry.setAttribute('normal',new THREE.Float32BufferAttribute(normals,3));
  const mesh=new THREE.Mesh(geometry,material);
  mesh.name=root.name+':'+name;mesh.receiveShadow=true;
  // These decals should neither cast a silhouette nor become a collision mesh.
  mesh.castShadow=false;root.add(mesh);
 }
 return root;
}
