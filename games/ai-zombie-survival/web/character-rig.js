// Original procedural anatomical mesh + articulated action poses for CLOSE survivor/zombie cameras.
// Scene-only; joints are built from the authoritative current world state and never feed back to AI.
// Unlike duplicate box puppets this connects a tapered chest/pelvis to posed shoulders, wrists and feet.

import { actionPose } from './animation-pose.js';
const ROLES={
  leader:{coat:'#d1a978',vest:'#344b5b',pants:'#36474e',strap:'#f4c983'},
  medic:{coat:'#d0ddce',vest:'#497c82',pants:'#526973',strap:'#ff7880'},
  scout:{coat:'#63a5a1',vest:'#264c60',pants:'#30494f',strap:'#b3ecdb'},
  defender:{coat:'#667b9b',vest:'#394d61',pants:'#35444e',strap:'#ecc16e'},
  engineer:{coat:'#6b9bb2',vest:'#475969',pants:'#495560',strap:'#eeb766'},
  scavenger:{coat:'#c09669',vest:'#535b50',pants:'#514b46',strap:'#e8c484'}
};
const INFECTED={shambler:{coat:'#636b58',vest:'#4c594d',pants:'#454d41',strap:'#bc7364'},
  runner:{coat:'#76826a',vest:'#5d6b4b',pants:'#434f44',strap:'#d49f7a'},
  brute:{coat:'#847860',vest:'#665d4a',pants:'#50483e',strap:'#bf685c'}};
const vec=(a,b)=>[a[0]-b[0],a[1]-b[1],a[2]-b[2]];
const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
const unit=a=>{const mag=Math.hypot(...a)||1;return a.map(v=>v/mag);};
const tint=(hex)=>{const h=hex.replace('#','');return [0,2,4].map(i=>parseInt(h.slice(i,i+2),16)/255);};
function tubular(mesh,pointA,pointB,rA,rB,color,{sides=9,cap=true}={}){
  const tangent=unit(vec(pointB,pointA)),helper=Math.abs(tangent[1])>.90?[1,0,0]:[0,1,0];
  const side=unit(cross(tangent,helper)),binormal=unit(cross(tangent,side));
  const c=tint(color);
  const ring=(p,r,a)=>p.map((v,i)=>v+r*(side[i]*Math.cos(a)+binormal[i]*Math.sin(a)));
  const tri=(a,b,d)=>{const N=unit(cross(vec(b,a),vec(d,a)));mesh.tri(a,b,d,N,c);};
  for(let i=0;i<sides;i++){
    const a=i*2*Math.PI/sides,b=(i+1)*2*Math.PI/sides;
    const p=ring(pointA,rA,a),q=ring(pointB,rB,a),r=ring(pointB,rB,b),s=ring(pointA,rA,b);
    tri(p,q,r);tri(p,r,s);
    if(cap){tri(pointA,s,p);tri(pointB,q,r);}
  }
}
function torso(mesh,center,palette,lean,scale=1){
  const rings=[
    {y:.98,w:.27,d:.205,z:-.07},
    {y:1.20,w:.33,d:.215,z:-.04},
    {y:1.41,w:.36,d:.26,z:0},
    {y:1.68,w:.40,d:.265,z:.01+lean*.12},
    {y:1.84,w:.30,d:.215,z:.015+lean*.18},
    {y:1.96,w:.13,d:.14,z:.04+lean*.20}
  ];
  const sides=12,c=tint(palette);
  const pt=(ring,t)=>{
    const rx=Math.cos(t)*ring.w,rz=Math.sin(t)*ring.d;
    return center([rx,ring.y*scale,(rz+ring.z)*scale]);
  };
  const tri=(a,b,d)=>mesh.tri(a,b,d,unit(cross(vec(b,a),vec(d,a))),c);
  for(let j=0;j<rings.length-1;j++){
    const lower=rings[j],upper=rings[j+1];
    for(let i=0;i<sides;i++){
      const a=i*Math.PI*2/sides,b=(i+1)*Math.PI*2/sides;
      const L0=pt(lower,a),L1=pt(lower,b),U0=pt(upper,a),U1=pt(upper,b);
      tri(L0,L1,U1);tri(L0,U1,U0);
    }
  }
}
function patch(mesh,at,color,scale=1){
  mesh.ellipsoid(...at,.10*scale,.06*scale,.029*scale,color,5,7);
}
function posedLimb(mesh,coords,r,color){
  const [a,b,c]=coords;
  tubular(mesh,a,b,r[0],r[1],color,{sides:9});
  tubular(mesh,b,c,r[1],r[2],color,{sides:9});
}
// Dedicated close-range skin, non-box torso, calves, elbows, neck and role equipment.
// Gait, stance and facial direction change deterministically as the real AI action changes.
export function drawCharacterRig(mesh,entity,infected,time,{scale=1}={}){
  if((infected&&entity.health<=0)||(!infected&&!entity.alive))return false;
  const body=infected?(entity.archetype==='brute'?1.28:entity.archetype==='runner'?.89:1):1;
  const S=scale*body,p=actionPose(entity,infected,time);
  const yaw=entity.facing||0,co=Math.cos(yaw),si=Math.sin(yaw);
  const at=([dx,y,dz])=>[entity.x+S*(dx*co+dz*si),y*S,entity.y+S*(-dx*si+dz*co)];
  const style=infected?(INFECTED[entity.archetype]||INFECTED.shambler):(ROLES[entity.role]||ROLES.scout);
  const variant=(Number.parseInt(String(entity.id).split('-').at(-1),10)||0)%4;
  const skin=infected?['#aca286','#8d9780','#938e78'][variant%3]:['#a57b65','#b98b70','#d2a082','#8b6452'][variant];
  const lean=p.headForward,bob=p.bodyBob,crouch=p.crouch,waist=.99-crouch*.35;
  const place=([dx,y,dz])=>at([dx,y+bob-crouch*.47,dz+lean*(y-1.0)*.25]);
  torso(mesh,place,style.coat,lean,S/Math.max(S,1)); // one smooth tapered organic torso
  tubular(mesh,place([0,1.78,.02]),place([0,2.10,.09]),.115,.105,skin,{sides:9});
  const skull=place([0,2.27,.13+lean]);
  mesh.ellipsoid(...skull,.255*S,.296*S,.246*S,skin,9,14);
  // Subtle asymmetric face, sunken eyes and battle damage; never a copied billboard.
  for(const sign of [-1,1]){
    const eye=place([sign*.10,2.29,.36+lean]);
    patch(mesh,eye,infected?'#fb746a':'#293640',S);
    patch(mesh,place([sign*.10,2.31,.380+lean]),infected?'#db443e':'#ddd4b5',S*.47);
  }
  mesh.ellipsoid(...place([0,2.19,.385+lean]),.068*S,.11*S,.078*S,skin,6,8);
  tubular(mesh,place([-.095,2.08,.35+lean]),place([.095,2.08,.35+lean]),.018*S,.018*S,infected?'#71463c':'#6a4e46',{sides:7,cap:false});
  if(!infected){
    // Hood, collar and tactical fit stay connected to the anatomy.
    mesh.ellipsoid(...place([0,2.53,.065]),.27*S,.107*S,.28*S,style.vest,6,11);
    mesh.ellipsoid(...place([0,1.52,.27]),.34*S,.37*S,.105*S,style.vest,7,11);
    tubular(mesh,place([-.34,1.80,-.10]),place([-.22,1.24,-.28]),.065*S,.049*S,style.strap,{sides:6});
    tubular(mesh,place([.34,1.80,-.10]),place([.22,1.24,-.28]),.065*S,.049*S,style.strap,{sides:6});
  }else{
    // Injured rib line and silhouette broken by asymmetric shoulder height.
    tubular(mesh,place([-.19,1.60,.26]),place([.13,1.20,.25]),.04*S,.024*S,style.strap,{sides:6});
    mesh.ellipsoid(...place([-.38,1.80,.02]),.24*S,.20*S,.24*S,style.vest,6,8);
  }
  for(const sign of [-1,1]){
    const legMotion=p.stride*sign;
    const hip=place([sign*.19,waist,0]);
    const knee=place([sign*.23,.57-crouch*.24,.10+legMotion*.18]);
    const ankle=at([sign*.23,.15,.12+legMotion*.34]);
    posedLimb(mesh,[hip,knee,ankle],[.176*S,.131*S,.092*S],style.pants);
    mesh.ellipsoid(...at([sign*.23,.105,.245+legMotion*.34]),.151*S,.092*S,.272*S,'#23333b',5,9);
    const shoulder=place([sign*.385,1.82,0]);
    const left=sign<0;
    const raise=left?p.leftHandRaise:p.rightHandRaise;
    const elbow=place([sign*.49,1.45+raise*.42,.10+p.shoulderRoll*sign+raise*.28]);
    const hand=place([sign*.42,1.12+raise*1.19,.21+raise*.54-p.weaponRecoil*.20]);
    posedLimb(mesh,[shoulder,elbow,hand],[.146*S,.111*S,.075*S],infected?style.coat:style.vest);
    mesh.ellipsoid(...hand,.091*S,.105*S,.073*S,skin,5,8);
  }
  if(entity.action==='attack'||entity.action==='aim'){
    // Weapon and two-hand hold move with pose rather than teleporting.
    const barrel=place([.29,1.54+p.rightHandRaise*.26,.85-p.weaponRecoil]);
    tubular(mesh,place([.29,1.53,.33]),barrel,.097*S,.053*S,'#273a47',{sides:8});
    tubular(mesh,barrel,place([.29,1.55+p.rightHandRaise*.26,1.19-p.weaponRecoil]),.049*S,.049*S,'#7c9b9c',{sides:8});
  }
  return true;
}
