/* Infinite Tower | Atmosphere and color grading VIII.
 * Cinematic environmental treatment driven by public immutable snapshots.
 * Purely decorative. All materials, particles and time changes are renderer-local.
 */
import * as THREE from '/tower/three.module.js';

const PALETTE={
  foundry:{sun:0xffc176,light:0xff8052,dust:0xffdc95,secondary:0xf2aa61,shadow:0x82474b},
  ruins:{sun:0xffecc5,light:0xb6ffc0,dust:0xe6f9b7,secondary:0x65ca8a,shadow:0x406950},
  storm:{sun:0xffefc8,light:0x9eeaff,dust:0xcceeff,secondary:0x70cef4,shadow:0x537a9d},
  clockwork:{sun:0xffebac,light:0xffcc78,dust:0xffe6bb,secondary:0xe4a34d,shadow:0x815942},
  void:{sun:0xffe8ff,light:0xf2a7fa,dust:0xd8c3ff,secondary:0x9b83ee,shadow:0x594582}
};
const hash=n=>{const a=Math.sin(n*127.17+14.31)*31345.23;return a-Math.floor(a)};
const add=(g,obj,x,y,z)=>{obj.position.set(x,y,z);g.add(obj);return obj};
const m=(color,roughness=.83,metalness=.15)=>new THREE.MeshStandardMaterial({color,roughness,metalness,side:THREE.DoubleSide});
const glow=(color,opacity=.21)=>new THREE.MeshBasicMaterial({color,transparent:true,opacity,depthWrite:false,blending:THREE.AdditiveBlending,side:THREE.DoubleSide,fog:false});
const cube=(w,h,d,material)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),material);
const cone=(r,h,material)=>new THREE.Mesh(new THREE.ConeGeometry(r,h,8,1,true),material);
const plane=(w,h,material)=>new THREE.Mesh(new THREE.PlaneGeometry(w,h),material);

function buildLightShafts(scene,p,width,height,base,seed,quality){
  const shafts=[];
  for(let i=0;i<(quality==='low'?2:6);i++){
    const x=width*(.12+hash(seed+i*11)*.76),y=base+height*(.17+.72*hash(seed+i*13));
    const intensity=.10+hash(seed+i*31)*.1;
    const mat=glow(i%2?p.light:p.sun,intensity);
    const beam=add(scene,cone(quality==='low'?15:30,95+hash(seed+i*7)*70,mat),x,y,-42);
    beam.rotation.z=.25+(hash(seed+i*19)-.5)*.45;
    beam.rotation.x=.24;
    beam.userData.restOpacity=intensity;
    shafts.push(beam);
  }
  return shafts;
}
function curtain(scene,p,width,base,height,seed){
  const curtainGroup=new THREE.Group();curtainGroup.name='soft atmospheric curtains';scene.add(curtainGroup);
  const strips=[];
  for(let layer=0;layer<4;layer++){
    const geo=new THREE.PlaneGeometry(width+50,14+layer*3,17,2);
    const pos=geo.getAttribute('position'),rest=new Float32Array(pos.array);
    for(let k=0;k<pos.count;k++){
      const px=pos.getX(k);pos.setZ(k,Math.sin(px*.024+layer+seed)*2);
    }
    geo.computeVertexNormals();
    const mat=glow(layer%2?p.secondary:p.sun,.042+(3-layer)*.013);
    const mesh=add(curtainGroup,new THREE.Mesh(geo,mat),width/2,base+height*(.2+layer*.18),-77+layer*9);
    mesh.userData.phase=layer*1.8+seed;mesh.userData.rest=rest;
    strips.push(mesh);
  }
  return strips;
}
function particles(scene,p,width,base,height,seed,quality){
  const count=quality==='low'?78:180;
  const geo=new THREE.BufferGeometry(),position=new Float32Array(count*3),color=new Float32Array(count*3);
  const baseColor=new THREE.Color(p.dust);
  for(let i=0;i<count;i++){
    position[i*3]=hash(seed*17+i*4)*width;
    position[i*3+1]=base+hash(seed*33+i*5)*height;
    position[i*3+2]=-45+hash(seed*3+i*6)*80;
    const strength=.54+hash(seed+i*11)*.46;
    color[i*3]=baseColor.r*strength;color[i*3+1]=baseColor.g*strength;color[i*3+2]=baseColor.b*strength;
  }
  geo.setAttribute('position',new THREE.BufferAttribute(position,3).setUsage(THREE.DynamicDrawUsage));
  geo.setAttribute('color',new THREE.Float32BufferAttribute(color,3));
  const mat=new THREE.PointsMaterial({size:1.3,vertexColors:true,transparent:true,opacity:.77,
    depthWrite:false,blending:THREE.AdditiveBlending,sizeAttenuation:true});
  const cloud=new THREE.Points(geo,mat);cloud.frustumCulled=false;scene.add(cloud);
  return{cloud,position,basePosition:Float32Array.from(position),count};
}
function biomeDetails(scene,theme,p,width,base,height,seed,quality){
  const geometry=new THREE.Group();geometry.name='environmental narrative props';scene.add(geometry);
  const count=quality==='low'?5:12;
  if(theme==='ruins'){
    const bark=m(0x675544),leaf=m(0x43916d),sunlit=m(0x8ecd82);
    for(let i=0;i<count;i++){
      const x=width*(.06+.88*hash(seed+i*7)),y=base+height*hash(seed+i*13);
      const branch=add(geometry,cube(1.3,23,1.3,bark),x,y,-35);
      branch.rotation.z=(hash(seed+i*17)-.5)*1.1;
      for(let k=0;k<4;k++){
        const l=new THREE.Mesh(new THREE.IcosahedronGeometry(1.8+hash(seed+i*2+k)*2),k%2?leaf:sunlit);
        add(geometry,l,x+(k-1.5)*4,y+8+hash(seed+k)*10,-32-k);
        l.scale.set(1,.44,.5);
      }
    }
  }else if(theme==='foundry'){
    const iron=m(0x58403c,.6,.66),copper=m(0xeb945e,.48,.45),hot=glow(p.light,.65);
    for(let i=0;i<count;i++){
      const x=width*(.06+.88*hash(seed+i*5)),y=base+height*hash(seed+i*13);
      add(geometry,cube(4,15,3,iron),x,y,-37);
      add(geometry,cube(11,3,4,copper),x,y+9,-37);
      add(geometry,cube(8,.8,5,hot),x,y+11,-33);
    }
  }else if(theme==='storm'){
    const iron=m(0x557c97,.5,.45),electric=glow(p.secondary,.61);
    for(let i=0;i<count;i++){
      const x=width*(.07+.86*hash(seed+i*7)),y=base+height*hash(seed+i*13);
      const prism=add(geometry,new THREE.Mesh(new THREE.OctahedronGeometry(2+hash(seed+i*3)*5),electric),x,y,-38);
      prism.rotation.z=i;
      add(geometry,cube(2,13,3,iron),x,y-10,-38);
    }
  }else if(theme==='clockwork'){
    const clockmetal=m(0xa3743d,.4,.68),ivory=m(0xf3d8a0,.54,.26);
    for(let i=0;i<count;i++){
      const x=width*(.07+.86*hash(seed+i*7)),y=base+height*hash(seed+i*13);
      add(geometry,new THREE.Mesh(new THREE.TorusGeometry(6,1.3,8,16),clockmetal),x,y,-36);
      add(geometry,new THREE.Mesh(new THREE.OctahedronGeometry(3,0),ivory),x,y,-36);
    }
  }else{
    const crystal=m(0x7961ad,.2,.55),highlight=glow(p.secondary,.36);
    for(let i=0;i<count;i++){
      const x=width*(.07+.86*hash(seed+i*5)),y=base+height*hash(seed+i*11);
      const rock=add(geometry,new THREE.Mesh(new THREE.OctahedronGeometry(4+hash(seed+i*3)*6),i%2?crystal:highlight),x,y,-37);
      rock.scale.set(.6,1.6,.75);rock.rotation.z=hash(seed+i*19);
    }
  }
  return geometry;
}
export function mountTowerAtmosphere({group,snapshot,quality='auto'}){
  const theme=snapshot.theme,p=PALETTE[theme]||PALETTE.foundry;
  const width=snapshot.worldWidth/1000,base=snapshot.chunkBaseY/1000,height=snapshot.chunkHeight/1000,seed=snapshot.floor*31+theme.length;
  const root=new THREE.Group();root.name='tower-atmosphere-v8';group.add(root);
  const shafts=buildLightShafts(root,p,width,height,base,seed,quality);
  const strips=curtain(root,p,width,base,height,seed);
  const dust=particles(root,p,width,base,height,seed,quality);
  biomeDetails(root,theme,p,width,base,height,seed,quality);
  // A softly illuminated distant halo, decorative rather than an authoritative target.
  const halo=add(root,plane(195,195,glow(p.sun,.13)),width*(.25+hash(seed)*.5),base+height*.79,-123);
  halo.rotation.z=.12;
  return{root,shafts,strips,dust,halo,theme,metrics:{volumeLights:shafts.length,dustPoints:dust.count,curtains:strips.length}};
}
export function animateTowerAtmosphere(handle,now,reducedMotion=false){
  if(!handle||reducedMotion)return;
  const time=now*.001,{shafts,strips,dust}=handle;
  for(let i=0;i<shafts.length;i++){
    const m=shafts[i];m.material.opacity=m.userData.restOpacity*(.77+.23*Math.sin(time*.35+i));
  }
  for(const mesh of strips){
    const geo=mesh.geometry,attr=geo.attributes.position,rest=mesh.userData.rest;
    for(let i=0;i<attr.count;i++){
      const n=i*3;
      attr.array[n+2]=rest[n+2]+Math.sin(time*.33+mesh.userData.phase+rest[n]*.016)*1.15;
    }
    attr.needsUpdate=true;
  }
  const {position,basePosition,cloud,count}=dust;
  for(let i=0;i<count;i++){
    const offset=i*3;
    position[offset]=basePosition[offset]+Math.sin(time*.16+i*1.13)*1.4;
    position[offset+1]=basePosition[offset+1]+Math.sin(time*.21+i*.51)*1.8;
  }
  cloud.geometry.attributes.position.needsUpdate=true;
}
