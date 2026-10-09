import * as THREE from '/dungeon/vendor/three.module.js';

// Cosmetic foot grounding: procedural shadow texture is owned by the module.
// Geometry is small, bounded per visible unit and independent of gameplay authority.
const colours={vanguard:'#5fbfff',ranger:'#67ffc3',mystic:'#cba0ff',revenant:'#db94ff',cultist:'#ff6d96',warden:'#ffb45d'};
const textureCanvas=document.createElement('canvas');textureCanvas.width=128;textureCanvas.height=128;
const c=textureCanvas.getContext('2d');
const grad=c.createRadialGradient(64,64,4,64,64,61);grad.addColorStop(0,'rgba(0,0,0,0.95)');grad.addColorStop(.31,'rgba(0,0,0,0.66)');grad.addColorStop(.72,'rgba(0,0,0,.29)');grad.addColorStop(1,'rgba(0,0,0,0)');
c.fillStyle=grad;c.fillRect(0,0,128,128);
const shadowTexture=new THREE.CanvasTexture(textureCanvas);
const flatGeometry=new THREE.PlaneGeometry(1,1);
const circleGeometry=new THREE.RingGeometry(.61,.66,48);
const sparksGeometry=new THREE.RingGeometry(.72,.735,48);
export function addContactProjection(actor){
 const kind=actor.u.kind,boss=kind==='warden',radius=boss?2.05:1.03;
 const material=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,opacity:boss?.56:.38,depthWrite:false,depthTest:true,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1});
 const shadow=new THREE.Mesh(flatGeometry,material);shadow.rotation.x=-Math.PI/2;shadow.position.y=.018;shadow.scale.set(radius*1.85,radius*1.45,1);shadow.renderOrder=1;actor.root.add(shadow);
 const accent=colours[kind]||'#7cdff5',sigilMat=new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:boss?.8:.37,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-2});
 const sigil=new THREE.Mesh(circleGeometry,sigilMat);sigil.rotation.x=-Math.PI/2;sigil.position.y=.025;sigil.scale.setScalar(boss?1.27:.78);sigil.renderOrder=2;actor.root.add(sigil);
 const coronaMat=new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.11,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
 const corona=new THREE.Mesh(sparksGeometry,coronaMat);corona.rotation.x=-Math.PI/2;corona.position.y=.03;corona.scale.setScalar(boss?1.35:.86);actor.root.add(corona);
 return {
  update(t,action,alive){
   shadow.visible=sigil.visible=corona.visible=alive;
   if(!alive)return;
   const active=action==='cast'||action==='attack'||action==='hurt';
   sigilMat.opacity=(boss?.5:.22)+(active?.28:.0)+Math.sin(t*(boss?2:1.8)+actor.at.x)*.065;
   coronaMat.opacity=active?.35:.07;
   if(active){corona.rotation.z+=.024;sigil.rotation.z-=.01}
   else corona.rotation.z+=.003;
  },
  dispose(){
   actor.root.remove(shadow,sigil,corona);
   material.dispose();sigilMat.dispose();coronaMat.dispose();
  },
  type:'grounded-3d'
 };
}
