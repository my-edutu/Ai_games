// Explicit art-direction details for near-camera articulated 3D characters.
// Geometry is purely cosmetic and keyed to authoritative role/action/infection.
const COLORS={steel:'#294452',steel2:'#425d64',cyan:'#49f3da',sand:'#c6ad7b',gold:'#f5ca83',
coral:'#ff6a6c',cloth:'#394f52',pale:'#cbb395',medical:'#e7e4d0',medicalRed:'#d55b67',
runner:'#b09c76',brute:'#8d785e'};
function localPoint(x,z,yaw,dx,y,dz,body=1){
 const c=Math.cos(yaw),s=Math.sin(yaw);
 return[x+body*(dx*c+dz*s),y*body,z+body*(-dx*s+dz*c)];
}
function localBox(mesh,x,z,yaw,dx,y,dz,w,h,d,color,body=1){
 const p=localPoint(x,z,yaw,dx,y,dz,body);
 mesh.box(...p,w*body,h*body,d*body,color,yaw);
}
function localBall(mesh,x,z,yaw,dx,y,dz,r,color,body=1){
 mesh.ball(...localPoint(x,z,yaw,dx,y,dz,body),r*body,color);
}
function localBone(mesh,x,z,yaw,a,b,r,color,body=1){
 mesh.bone(localPoint(x,z,yaw,...a,body),localPoint(x,z,yaw,...b,body),r*body,color);
}
function customHelmet(mesh,x,z,yaw,body,role){
 const color=role==='medic'?'#edf0e1':role==='leader'?'#f7d58f':'#5a7477';
 localBox(mesh,x,z,yaw,0,2.53,.035,.48,.16,.43,color,body);
 localBox(mesh,x,z,yaw,0,2.50,.25,.61,.07,.19,'#233e48',body);
 localBox(mesh,x,z,yaw,-.24,2.29,.015,.11,.27,.22,color,body);
 localBox(mesh,x,z,yaw,.24,2.29,.015,.11,.27,.22,color,body);
}
export function decorateActor(mesh,entity,infected,elapsed=0,body=1){
 const x=entity.x,z=entity.y,yaw=entity.facing||0;
 if(infected){
  if(entity.health<=0)return;
  const action=entity.action,brute=entity.archetype==='brute',runner=entity.archetype==='runner';
  const v=entity.variant||0;
  // A readable decay profile: asymmetric shoulder, torn sleeves, skeletal hands and exposed rib scars.
  localBox(mesh,x,z,yaw,-.34,1.73,-.03,.23,brute?.42:.29,.4,brute?'#594f43':'#655a4b',body);
  localBox(mesh,x,z,yaw,.32,1.56,.02,.18,.42,.39,v%2?'#685647':'#765a4f',body);
  localBox(mesh,x,z,yaw,-.14,1.57,.225,.11,.27,.055,'#b6655a',body);
  localBox(mesh,x,z,yaw,.09,1.48,.230,.08,.22,.065,'#8f3e48',body);
  for(let i=0;i<3;i++)localBox(mesh,x,z,yaw,-.22+i*.21,1.27,.23,.105,.04,.10,'#e2ba9b',body);
  // Small eye sockets read in closeups but remain cosmetic, not targetable hitboxes.
  localBox(mesh,x,z,yaw,-.095,2.25,.224,.074,.071,.035,runner?'#f1bf7b':'#ef7270',body);
  localBox(mesh,x,z,yaw,.10,2.25,.224,.074,.071,.035,brute?'#ff7049':'#e5a479',body);
  if(brute){
   localBox(mesh,x,z,yaw,0,1.77,-.37,.82,.42,.16,'#4d4e3f',body);
   localBox(mesh,x,z,yaw,0,1.03,.20,.72,.26,.10,'#817057',body);
   for(const i of [-1,1]){
    localBox(mesh,x,z,yaw,i*.42,1.28,.14,.23,.35,.33,'#5a5b50',body);
    localBall(mesh,x,z,yaw,i*.4,1.05,.18,.11,'#ad9278',body);
   }
  }else if(runner){
   localBox(mesh,x,z,yaw,0,1.40,-.20,.25,.55,.11,'#4f6555',body);
   localBone(mesh,x,z,yaw,[-.36,1.56,.04],[-.46,1.27,.33],.06,'#a2a37a',body);
   localBone(mesh,x,z,yaw,[.38,1.58,.10],[.46,1.20,.33],.06,'#967f6a',body);
  }else{
   localBox(mesh,x,z,yaw,-.31,1.44,-.27,.20,.43,.19,'#6b5f59',body);
   localBox(mesh,x,z,yaw,.27,1.45,-.26,.16,.27,.21,'#4b6a58',body);
  }
  if(action==='stagger'||entity.stagger>0){
   const jitter=Math.sin(elapsed*11+v)*.045;
   localBall(mesh,x,z,yaw,jitter,2.43,.15,.12,'#b09b7b',body);
  }
  return;
 }
 // Survivor roles are readable in silhouette even when the camera is moving and audio is muted.
 const role=entity.role||'scout';
 customHelmet(mesh,x,z,yaw,body,role);
 // Layered vest, backpack, roll pouch, gloves and leg holster.
 localBox(mesh,x,z,yaw,0,1.48,.29,.42,.66,.17,COLORS.steel,body);
 localBox(mesh,x,z,yaw,0,1.31,.37,.46,.09,.14,COLORS.gold,body);
 localBox(mesh,x,z,yaw,-.37,1.37,.02,.15,.47,.35,COLORS.steel2,body);
 localBox(mesh,x,z,yaw,.37,1.42,.02,.16,.47,.35,COLORS.steel2,body);
 localBox(mesh,x,z,yaw,0,1.38,-.34,.56,.74,.35,role==='scout'?'#375d65':'#43545b',body);
 localBox(mesh,x,z,yaw,0,1.64,-.53,.46,.22,.08,'#dfb877',body);
 localBox(mesh,x,z,yaw,-.33,.72,.16,.22,.38,.22,'#263e49',body);
 localBox(mesh,x,z,yaw,.34,.80,.16,.24,.45,.21,'#586e74',body);
 // Role-specific loadouts: medical packs, engineer toolkit, recon antenna and command patch.
 if(role==='medic'){
  localBox(mesh,x,z,yaw,0,1.51,-.55,.41,.47,.16,COLORS.medical,body);
  localBox(mesh,x,z,yaw,0,1.51,-.647,.09,.31,.05,COLORS.medicalRed,body);
  localBox(mesh,x,z,yaw,0,1.51,-.65,.31,.09,.05,COLORS.medicalRed,body);
  localBox(mesh,x,z,yaw,.35,1.13,.1,.18,.38,.33,'#d7ebdf',body);
 }else if(role==='defender'){
  localBox(mesh,x,z,yaw,0,1.62,.41,.44,.38,.12,'#718889',body);
  localBox(mesh,x,z,yaw,0,1.60,.48,.32,.19,.1,'#facb81',body);
  localBox(mesh,x,z,yaw,-.48,1.62,.09,.20,.37,.45,'#425260',body);
 }else if(role==='engineer'){
  localBox(mesh,x,z,yaw,0,1.04,-.46,.65,.23,.2,'#e8b56d',body);
  for(let i=0;i<4;i++)localBox(mesh,x,z,yaw,-.28+i*.18,1.08,-.60,.08,.20,.10,'#385f6f',body);
  localBox(mesh,x,z,yaw,.45,.67,.18,.26,.42,.20,'#b7a17d',body);
 }else if(role==='scout'){
  localBox(mesh,x,z,yaw,.45,1.49,-.36,.10,.60,.12,'#d6d9b5',body);
  localBall(mesh,x,z,yaw,.45,1.81,-.36,.11,COLORS.cyan,body);
  localBox(mesh,x,z,yaw,0,2.20,.28,.38,.17,.09,'#b6dbea',body);
 }else if(role==='leader'){
  localBox(mesh,x,z,yaw,-.35,1.88,.2,.19,.16,.08,'#f8cd83',body);
  localBox(mesh,x,z,yaw,.34,1.88,.2,.19,.16,.08,'#f8cd83',body);
  localBox(mesh,x,z,yaw,0,1.49,.46,.25,.15,.09,'#31dec8',body);
 }else if(role==='scavenger'){
  localBox(mesh,x,z,yaw,-.51,1.25,-.14,.35,.45,.24,'#a28555',body);
  localBox(mesh,x,z,yaw,.42,1.13,-.12,.24,.35,.32,'#cbac68',body);
 }
 if(entity.health<35){
  localBox(mesh,x,z,yaw,.27,1.66,.26,.13,.35,.08,'#d9706b',body);
  localBall(mesh,x,z,yaw,.34,1.42,.27,.09,COLORS.coral,body);
 }
 if(entity.infection>20){
  localBox(mesh,x,z,yaw,-.16,2.24,.25,.10,.10,.05,'#b58a6d',body);
 }
 if(entity.action==='aim'||entity.action==='attack'){
  localBox(mesh,x,z,yaw,.32,1.45,.77,.18,.17,.64,'#243744',body);
  localBox(mesh,x,z,yaw,.32,1.49,1.13,.09,.1,.49,'#b6bcac',body);
  localBox(mesh,x,z,yaw,.32,1.59,.83,.06,.12,.15,'#90afbd',body);
 }
}
