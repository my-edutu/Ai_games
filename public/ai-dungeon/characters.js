import * as THREE from '/dungeon/vendor/three.module.js';

// Expressive silhouettes built from authored parametric forms. Cosmetic-only: no collision or damage.
const palette={
 vanguard:{metal:'#a4c5e5',trim:'#f1c57d',cloth:'#244e80',aura:'#6dd8ff'},
 ranger:{metal:'#8ad6a0',trim:'#e7c88f',cloth:'#254d39',aura:'#85ffa9'},
 mystic:{metal:'#c2a4ff',trim:'#8ef9ee',cloth:'#4a3781',aura:'#c98aff'},
 revenant:{metal:'#a3b6c6',trim:'#64f9df',cloth:'#26374c',aura:'#77e9ff'},
 cultist:{metal:'#dd899f',trim:'#e7a6dd',cloth:'#53314c',aura:'#ff79b3'},
 warden:{metal:'#e6a46d',trim:'#ffe69f',cloth:'#5a2945',aura:'#ff9b58'}
};
function robeGeometry(){
 const verts=[],indices=[],w=[.28,.32,.42,.52],length=[0,-.22,-.58,-1.0];
 for(let row=0;row<4;row++)for(let col=0;col<5;col++){const x=(col-2)/2*w[row],y=length[row],z=.21+row*.09+Math.abs(col-2)*-.016;verts.push(x,y,z)}
 for(let r=0;r<3;r++)for(let c=0;c<4;c++){const a=r*5+c,b=a+1,d=a+5,e=d+1;indices.push(a,d,b,b,d,e)}
 const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(verts,3));g.setIndex(indices);g.computeVertexNormals();return g;
}
const capeBase=robeGeometry();
function shine(color,emissive=0){return new THREE.MeshStandardMaterial({color,emissive:emissive?color:'#000000',emissiveIntensity:emissive,roughness:.24,metalness:.78})}
function fabric(color){return new THREE.MeshStandardMaterial({color,roughness:.94,metalness:.02,side:THREE.DoubleSide})}
function sphere(parent,color,x,y,z,sc){const o=new THREE.Mesh(new THREE.IcosahedronGeometry(1,1),color);o.position.set(x,y,z);o.scale.set(...sc);parent.add(o);return o}
function block(parent,material,x,y,z,sc,rotation=0){const o=new THREE.Mesh(new THREE.BoxGeometry(1,1,1),material);o.position.set(x,y,z);o.scale.set(...sc);o.rotation.z=rotation;parent.add(o);return o}
function cone(parent,material,x,y,z,sc,rot=0){const o=new THREE.Mesh(new THREE.ConeGeometry(1,1,7),material);o.position.set(x,y,z);o.scale.set(...sc);o.rotation.z=rot;parent.add(o);return o}
function ring(parent,material,x,y,z,r=0.4){const o=new THREE.Mesh(new THREE.TorusGeometry(r,.045,6,22),material);o.position.set(x,y,z);parent.add(o);return o}
export function enrichCharacter(u,{root,body,leftArm,rightArm,leftLeg,rightLeg}){
 const c=palette[u.kind],steel=shine(c.metal),ornate=shine(c.trim),glow=shine(c.aura,1.3),cloth=fabric(c.cloth);
 const created=[],aura=[];
 const add=obj=>{created.push(obj);return obj};
 const shoulderPlate=(side,material)=>{const plate=block(body,material,side*.38,1.39,-.025,[.41,.23,.40],-side*.18);add(plate);const spike=cone(body,material,side*.39,1.64,-.015,[.12,.29,.16],-side*.24);add(spike)};
 const greaves=()=>{for(const leg of [leftLeg,rightLeg]){add(block(leg,steel,0,-.32,-.09,[.24,.39,.25]));add(block(leg,ornate,0,-.57,-.13,[.29,.15,.36]))}};
 const makeCape=(scale=1)=>{const g=capeBase.clone(),cape=new THREE.Mesh(g,cloth);cape.position.set(0,1.25,.17);cape.scale.setScalar(scale);body.add(cape);return add(cape)};
 let cape=null,halo=null,articulatedOrbs=[];
 if(u.kind==='vanguard'){
  greaves();shoulderPlate(-1,steel);shoulderPlate(1,steel);
  block(body,ornate,0,1.16,-.301,[.38,.30,.09]);
  block(body,glow,0,1.16,-.357,[.14,.16,.03]);
  for(const side of [-1,1])block(body,ornate,side*.24,1.03,-.26,[.07,.42,.06],side*.11);
  const crest=cone(body,ornate,0,2.09,-.01,[.10,.39,.11]);crest.rotation.x=.27;
  cape=makeCape(1.04);cape.position.z=.17;
  add(block(leftArm,ornate,-.06,-.55,-.21,[.40,.38,.10]));
 }
 if(u.kind==='ranger'){
  greaves();cape=makeCape(.88);
  const hood=cone(body,cloth,0,1.86,.08,[.33,.40,.36]);hood.rotation.x=.23;
  block(body,ornate,0,1.58,-.226,[.30,.08,.05]);
  const strap=block(body,steel,0,1.07,-.275,[.13,.68,.10],-.6);add(strap);
  const quiver=block(body,cloth,.29,1.13,.30,[.22,.66,.22],-.12);add(quiver);
  for(let i=0;i<3;i++){add(cone(body,ornate,.22+i*.075,1.57,.30,[.040,.19,.040]));}
  block(rightArm,steel,.05,-.48,-.09,[.10,.18,.10]);
  const string=new THREE.Mesh(new THREE.CylinderGeometry(.007,.007,.73,5),ornate);string.position.set(.04,-.45,-.12);rightArm.add(string);add(string);
 }
 if(u.kind==='mystic'){
  cape=makeCape(1.18);cape.position.y=1.4;
  const sash=block(body,ornate,0,.88,-.25,[.44,.075,.17]);add(sash);
  for(const side of [-1,1]){sphere(body,glow,side*.24,1.57,-.04,[.085,.09,.07]);cone(body,steel,side*.31,1.8,.12,[.14,.37,.20],side*.28)}
  halo=ring(body,glow,0,2.05,0,.32);halo.rotation.x=.38;
  for(let i=0;i<3;i++){const orb=sphere(root,glow,0,1.27,0,[.072,.075,.075]);articulatedOrbs.push(orb)}
  sphere(rightArm,glow,.06,-1.06,-.2,[.16,.19,.16]);
  block(body,steel,0,.53,-.21,[.43,.08,.12]);
 }
 if(u.kind==='revenant'){
  shoulderPlate(-1,steel);shoulderPlate(1,steel);
  for(let i=0;i<4;i++)block(body,ornate,0,1.36-i*.13,-.246,[.43-i*.04,.045,.07]);
  const jaw=block(body,steel,0,1.46,-.22,[.29,.14,.24]);add(jaw);
  for(const side of [-1,1])sphere(body,glow,side*.11,1.60,-.235,[.047,.051,.026]);
  cape=makeCape(.83);
  const blade=block(rightArm,steel,.12,-.68,-.03,[.15,.72,.20],-.22);add(blade);
 }
 if(u.kind==='cultist'){
  cape=makeCape(1.2);
  const hood=cone(body,cloth,0,1.88,.05,[.37,.48,.40]);add(hood);
  const emblem=ring(body,glow,0,1.06,-.318,.18);emblem.rotation.y=.15;
  for(const side of [-1,1]){const tassel=block(body,ornate,side*.20,.56,-.32,[.07,.48,.06],side*.17);add(tassel)}
  sphere(rightArm,glow,.06,-1.05,-.2,[.12,.13,.12]);
 }
 if(u.kind==='warden'){
  shoulderPlate(-1,ornate);shoulderPlate(1,ornate);
  cape=makeCape(1.35);
  for(const side of [-1,1]){const outer=cone(body,steel,side*.38,1.85,.1,[.21,.58,.22],-side*.37);add(outer);}
  const face=block(body,ornate,0,1.63,-.265,[.42,.27,.10]);add(face);
  for(const side of [-1,1]){sphere(body,glow,side*.13,1.65,-.325,[.065,.06,.024]);}
  const core=sphere(body,glow,0,1.17,-.36,[.24,.28,.10]);add(core);
  const haloA=ring(root,glow,0,.06,0,.90);haloA.rotation.x=Math.PI/2;add(haloA);aura.push(haloA);
  const haloB=ring(root,ornate,0,.08,0,.67);haloB.rotation.x=Math.PI/2;add(haloB);aura.push(haloB);
  for(let i=0;i<3;i++){const shard=cone(body,ornate,-.36+i*.36,2.13,.1,[.11,.4,.11]);add(shard)}
  greaves();
 }
 return{
  update(time,action){
   if(cape){cape.rotation.x=.07+Math.sin(time*2.6+u.x)*.035+(action==='move'?.12:0)}
   if(halo)halo.rotation.z=Math.sin(time*.7)*.14;
   for(let i=0;i<articulatedOrbs.length;i++){const a=time*1.25+i*Math.PI*2/3;articulatedOrbs[i].position.set(Math.sin(a)*.62,1.1+Math.cos(a*1.5)*.16,Math.cos(a)*.45);}
   for(let i=0;i<aura.length;i++){aura[i].rotation.z=time*(i?-.15:.22);}
  },parts:created.length+articulatedOrbs.length,dispose:()=>{for(const m of [steel,ornate,glow,cloth])m.dispose()}
 };
}
