import * as THREE from '/dungeon/vendor/three.module.js';
import {planGroundSignal} from '/dungeon/ground-signal-plan.js';

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
// Matte, subdued physical tread impressions, not another fluorescent ring.
// One geometry is reused by a four-impression pool per living party member.
const treadGeometry=new THREE.PlaneGeometry(.14,.25);
const treadOffset=new THREE.Vector3();
export function addContactProjection(actor,{reducedMotion=false}={}){
 const kind=actor.u.kind,boss=kind==='warden',radius=boss?2.05:1.03;
 const material=new THREE.MeshBasicMaterial({map:shadowTexture,transparent:true,opacity:boss?.56:.38,depthWrite:false,depthTest:true,toneMapped:false,polygonOffset:true,polygonOffsetFactor:-1});
 const shadow=new THREE.Mesh(flatGeometry,material);shadow.rotation.x=-Math.PI/2;shadow.position.y=.018;shadow.scale.set(radius*1.85,radius*1.45,1);shadow.renderOrder=1;actor.root.add(shadow);
 const accent=colours[kind]||'#7cdff5',sigilMat=new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:boss?.8:.37,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending,polygonOffset:true,polygonOffsetFactor:-2});
 const sigil=new THREE.Mesh(circleGeometry,sigilMat);sigil.rotation.x=-Math.PI/2;sigil.position.y=.025;sigil.scale.setScalar(boss?1.27:.78);sigil.renderOrder=2;actor.root.add(sigil);
 const coronaMat=new THREE.MeshBasicMaterial({color:accent,transparent:true,opacity:.11,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending});
 const corona=new THREE.Mesh(sparksGeometry,coronaMat);corona.rotation.x=-Math.PI/2;corona.position.y=.03;corona.scale.setScalar(boss?1.35:.86);actor.root.add(corona);
 // Footprints stay on the actual scene floor as the rendered rig moves onward.
 // Pooling and disposal prevent unbounded marks on an endless autonomous run.
 const treads=[];let planted=0;
 if(!reducedMotion&&actor.u.faction==='party'&&actor.root.parent){
  for(let i=0;i<4;i++){
   const treadMat=new THREE.MeshBasicMaterial({color:'#75685b',transparent:true,opacity:0,
    side:THREE.DoubleSide,depthWrite:false,polygonOffset:true,polygonOffsetFactor:-3});
   const tread=new THREE.Mesh(treadGeometry,treadMat);
   tread.rotation.x=-Math.PI/2;tread.visible=false;tread.renderOrder=2;
   actor.root.parent.add(tread);treads.push(tread);
  }
 }
 let state=planGroundSignal(kind,'idle',false,reducedMotion);
 shadow.visible=sigil.visible=corona.visible=false;
 return {
  update(t,action,alive){
   state=planGroundSignal(kind,action,alive,reducedMotion);
   shadow.visible=state.shadowVisible;
   sigil.visible=state.sigilVisible;
   corona.visible=state.coronaVisible;
   sigilMat.opacity=state.sigilOpacity;
   coronaMat.opacity=state.coronaOpacity;
   // Only a genuine live ritual animates its small additive accent.
   if(state.spin&&Number.isFinite(t)){corona.rotation.z+=.018;sigil.rotation.z-=.007}
   // Marks are driven by stamps from true rendered travel, not idle cycles.
   for(const tread of treads){
    if(!tread.visible)continue;
    const age=Number.isFinite(t)?Math.max(0,t-(tread.userData.plantedAt??t)):1;
    tread.material.opacity=.24*Math.max(0,1-age/.72)**2;
    if(age>=.72)tread.visible=false;
   }
  },
  stamp(t,side){
   if(!treads.length||!Number.isFinite(t)||!Number.isFinite(side)||actor.u.hp<=0)return false;
   const tread=treads[planted%treads.length];planted++;
   actor.root.updateWorldMatrix(true,false);
   treadOffset.set(Math.sign(side)*.15,.025,0);
   actor.root.localToWorld(treadOffset);
   tread.position.copy(treadOffset);
   tread.rotation.set(-Math.PI/2,0,actor.root.rotation.y);
   tread.material.opacity=.24;tread.userData.plantedAt=t;tread.visible=true;
   return true;
  },
  getState:()=>({...state,plantedFootfalls:planted,activeFootprints:treads.filter(tread=>tread.visible).length}),
  dispose(){
   actor.root.remove(shadow,sigil,corona);
   for(const tread of treads){tread.parent?.remove(tread);tread.material.dispose()}
   material.dispose();sigilMat.dispose();coronaMat.dispose();
  },
  type:'grounded-3d'
 };
}
