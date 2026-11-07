/**
 * Original 3D combat-contact artwork; never simulates a hit or attack.
 * Real positive HP loss alone can authorize the fragment burst.
 * Shared bounded geometry has no new textures, requests, or random sources.
 */
export function createBladeRibbonGeometry(T){
 if(!T?.BufferGeometry||!T?.Float32BufferAttribute)return null;
 const p=[],uv=[],indices=[],N=28,quad=(a,b,c,d)=>indices.push(a,b,c,b,d,c);
 for(let i=0;i<=N;i++){
  const t=i/N,angle=(-.66+1.32*t)*Math.PI;
  const thickness=.012+.074*Math.pow(Math.max(0,Math.sin(Math.PI*t)),.8);
  const depth=.013+.019*Math.sin(Math.PI*t);
  for(const [r,z] of [[.43+thickness,depth],[.43-thickness,depth],[.43+thickness,-depth],[.43-thickness,-depth]]){
   p.push(r*Math.cos(angle),r*Math.sin(angle),z);uv.push(t,r>.43?1:0);
  }
 }
 for(let i=0;i<N;i++){
  const j=i*4,k=j+4;
  quad(j,k,j+1,k+1);quad(j+2,j+3,k+2,k+3);
  quad(j,j+2,k,k+2);quad(j+1,k+1,j+3,k+3);
 }
 quad(0,1,2,3);const e=N*4;quad(e,e+2,e+1,e+3);
 const g=new T.BufferGeometry();g.name='Original tapered forged blade';
 g.setAttribute('position',new T.Float32BufferAttribute(p,3));
 g.setAttribute('uv',new T.Float32BufferAttribute(uv,2));
 g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function createImpactSpallGeometry(T){
 if(!T?.BufferGeometry||!T?.Float32BufferAttribute)return null;
 const p=[],indices=[];
 for(let i=0;i<8;i++){
  const a=i*Math.PI/4,x=Math.cos(a),y=Math.sin(a),o=p.length/3;
  const length=.13+i%3*.035,width=.02+i%2*.007;
  p.push(x*.04,y*.04,-.018,x*(.04+length),y*(.04+length),.015,
   x*.055-y*width,y*.055+x*width,.048,
   x*.055+y*width,y*.055-x*width,-.034);
  indices.push(o,o+1,o+2,o,o+3,o+1,o,o+2,o+3,o+1,o+3,o+2);
 }
 const g=new T.BufferGeometry();g.name='Original actual-HP-loss spall';
 g.setAttribute('position',new T.Float32BufferAttribute(p,3));
 g.setIndex(indices);g.computeVertexNormals();g.computeBoundingSphere();return g;
}
export function planTrueDamageCue(b,stage){
 if(!b||typeof b.id!=='string'||!b.id||b.id.length>128||
 !['party','enemy'].includes(b.faction)||!Number.isFinite(b.damage)||b.damage<=0||
 !Number.isFinite(b.maxHp)||b.maxHp<=0||!Number.isFinite(b.x)||!Number.isFinite(b.z))return null;
 const x=Number.isFinite(stage?.x)&&Math.abs(stage.x-b.x)<=.3?stage.x:b.x;
 const z=Number.isFinite(stage?.z)&&Math.abs(stage.z-b.z)<=.3?stage.z:b.z;
 const power=Math.max(0,Math.min(1,b.damage/b.maxHp)),fatal=b.fatal===true;
 return Object.freeze({x,z,y:fatal?1.22:1.05,scale:(.95+.53*power)*(fatal?1.13:1),
  duration:fatal?.44:.30,color:b.faction==='party'?'#ffc29f':'#f0d2a3',fatal});
}

/**
 * Finite, original three-dimensional armor/soul splinters for *witnessed*
 * HP loss. Real positive damage is the gate, never proximity, an attack
 * animation, a projectile arriving, or a speculative target. These
 * deterministic directions are purely visual; an incoming lane describes
 * a possible bearing but does NOT attribute causation.
 *
 * A single InstancedMesh renders this entire bounded fan on the real rig
 * contact frame. No seeded authority RNG, extra geometry per shard, or
 * run-to-run accumulation is allowed.
 */
export function planContactShardFan(beat,reducedMotion=false){
 if(reducedMotion||!planTrueDamageCue(beat,{x:beat?.x,z:beat?.z}))return Object.freeze([]);
 const power=Math.min(1,Math.max(0,beat.damage/beat.maxHp));
 const fatal=beat.fatal===true;
 const count=fatal?10:6;
 const dx=beat.incoming?.dx,dz=beat.incoming?.dz;
 const bearing=Number.isInteger(dx)&&Number.isInteger(dz)&&
  Math.abs(dx)+Math.abs(dz)>=1&&Math.abs(dx)+Math.abs(dz)<=4?
  Math.atan2(dz,dx):null;
 const out=[];
 for(let i=0;i<count;i++){
  // A known legal cardinal incoming lane narrows the observed spray.
  // Ambiguous damage is an omnidirectional material shock, never a
  // falsely identified attacker or an invented hit location.
  const angle=bearing===null?
   (i+.5)*Math.PI*2/count:
   bearing+(i-(count-1)/2)*2.05/(count-1);
  const speed=(.44+power*.48)*(1+(i%3)*.13);
  out.push(Object.freeze({
   vx:Number((Math.cos(angle)*speed).toFixed(5)),
   vz:Number((Math.sin(angle)*speed).toFixed(5)),
   vy:Number((.35+power*.27+(i%4)*.075).toFixed(5)),
   spin:Number(((i%2?1:-1)*(4.8+(i%5)*1.25)).toFixed(5)),
   size:Number((.65+(i%3)*.16+power*.27).toFixed(5))
  }));
 }
 return Object.freeze(out);
}
