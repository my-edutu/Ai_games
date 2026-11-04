// Source-backed, physically interlocked guardian defense on the REAL 3D stage.
// No gameplay authority, predicted hit, transparency, new light, shadow pass,
// particles, audio or HUD. At most ONE instanced draw (four rigid battens).
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
export function observeGuardianGuard(snapshot,enemy,stale=false){
  if(stale||snapshot?.lifecycle!=='running'||snapshot?.player?.health<=0||
      !Number.isSafeInteger(snapshot?.tick)||!Number.isSafeInteger(snapshot?.floor)||
      !enemy||enemy.kind!=='guardian'||enemy.active!==true||
      !Number.isFinite(enemy.guardTicksRemaining)||
      enemy.guardTicksRemaining<=0||enemy.guardTicksRemaining>22||
      !Number.isFinite(enemy.health)||enemy.health<=0||
      !Number.isFinite(enemy.maxHealth)||enemy.maxHealth<=0||
      enemy.health*2>enemy.maxHealth)return null;
  const opening=enemy.telegraph===true&&
    Number.isFinite(enemy.telegraphTicksRemaining)&&
    enemy.telegraphTicksRemaining>0&&enemy.telegraphTicksRemaining<=8;
  const chargeTotal=enemy.telegraphTotalTicks===6?6:8;
  return {sourceTick:snapshot.tick,remaining:enemy.guardTicksRemaining,
    progress:clamp((22-enemy.guardTicksRemaining)/22,0,1),
    opening,chargeRemaining:opening?Math.min(chargeTotal,enemy.telegraphTicksRemaining):0,
    chargeTotal,guardianId:enemy.id,runToken:snapshot.runToken,
    floor:snapshot.floor};
}
export function createObservedGuardianGuardStage(THREE){
  const group=new THREE.Group();
  group.name='RealGuardianShieldInterlock';
  group.visible=false;
  const geometry=new THREE.BoxGeometry(.19,1,.22);
  const material=new THREE.MeshStandardMaterial({
    color:0xa9784e,emissive:0x43260d,emissiveIntensity:.12,
    metalness:.71,roughness:.47,depthTest:true,depthWrite:true
  });
  const mesh=new THREE.InstancedMesh(geometry,material,4);
  mesh.name='SourceGuardMetalBattens';
  mesh.castShadow=false;mesh.receiveShadow=false;
  mesh.frustumCulled=false;
  group.add(mesh);
  const matrix=new THREE.Matrix4();
  const p=new THREE.Vector3(),q=new THREE.Quaternion(),s=new THREE.Vector3();
  const axis=new THREE.Vector3(0,0,1);
  let last=null;
  function update(snapshot,model,enemy,options={}){
    const observed=observeGuardianGuard(snapshot,enemy,!!options.stale);
    group.visible=!!observed&&!!model&&options.quality!=='none';
    if(!group.visible){last=null;return null;}
    // The ACTUAL hostile windup, not a timer in the renderer, unlocks a
    // dramatic physical opening before its body becomes melee-vulnerable.
    // Regular guard stays interlocked; its real expiry still eases the posts.
    // Reduced-motion presents the exposed core immediately and statically.
    const windupProgress=observed.opening?
      clamp(1-observed.chargeRemaining/observed.chargeTotal,0,1):0;
    const release=observed.opening?
      (options.reducedMotion?1:.78+.22*windupProgress):
      clamp((5-observed.remaining)/5,0,1);
    const opened=release*(observed.opening?.7:.15);
    group.position.copy(model.position);
    group.quaternion.copy(model.quaternion);
    group.scale.copy(model.scale);
    for(let i=0;i<4;i++){
      const side=i%2===0?-1:1,upper=i>=2;
      const angle=side*(upper?-.72:.15)+(side*opened*(upper?1:-1));
      p.set(side*(upper?.53:1.1)+side*opened*.32,upper?3.33:2.75,
        upper?1.65:1.66);
      q.setFromAxisAngle(axis,angle);
      s.set(upper?1.05:1,upper?1.04:1.72,1);
      matrix.compose(p,q,s);
      mesh.setMatrixAt(i,matrix);
    }
    mesh.instanceMatrix.needsUpdate=true;
    last={...observed,release};
    return last;
  }
  return {group,update,diagnostics:()=>last?{...last,extraDraws:1,sourceBound:true}:
    {visible:false,extraDraws:0,sourceBound:true},
    dispose(){group.remove(mesh);geometry.dispose();material.dispose();group.clear();last=null;}};
}
