// Eko Run — original stylized articulated Tayo. Rendering is cosmetic; physics stays on the server.
// Procedural joint hierarchy is a mid-fidelity art pass, NOT a production skinned character asset.
export function createTayoActor(THREE) {
  const root = new THREE.Group(); root.name = 'Tayo · procedural joint rig';
  const torso = new THREE.Group(); torso.name = 'pelvis / torso'; root.add(torso);
  const matPool = new Map(), geoPool = new Map();
  const mat = (hex, metalness=0, roughness=.77) => {
    const key = hex+':'+metalness+':'+roughness;
    if (!matPool.has(key)) matPool.set(key,new THREE.MeshStandardMaterial({color:hex,metalness,roughness}));
    return matPool.get(key);
  };
  const skins=[0x70422f,0x815239,0x986044,0xac744f];
  const skin=mat(skins[1]), dark=mat(0x232f3e), trim=mat(0xf5e7bd);
  function shape(parent,kind,x,y,z,sx,sy,sz,color,name){
    if(!geoPool.has(kind)){
      const geometry = kind==='ball'?new THREE.SphereGeometry(1,16,12):
        kind==='cone'?new THREE.CylinderGeometry(.82,1.05,1,12,1):
        kind==='torso'?new THREE.CylinderGeometry(.78,1,.98,12,1):
        kind==='capsule'?new THREE.CapsuleGeometry(.5,1,5,10):
        new THREE.BoxGeometry(1,1,1);
      geoPool.set(kind,geometry);
    }
    const mesh=new THREE.Mesh(geoPool.get(kind),mat(color));
    mesh.position.set(x,y,z);mesh.scale.set(sx,sy,sz);
    mesh.name=name||kind;
    // On Chromium CI the prior 129-piece character created approximately a
    // hundred redundant shadow passes. Cast shadows only for major silhouette
    // masses; do not make every eyebrow, finger or embroidery a shadow caster.
    const coreSilhouette=/^(jacket|head|waist|hip|upper sleeve|forearm|trouser|shin|running shoe|short natural hair|agbada drape|isi agu tunic|baban riga outer robe|fila|red cap|embroidered cap|urban running cap)$/;
    mesh.castShadow=coreSilhouette.test(mesh.name);
    mesh.receiveShadow=mesh.castShadow;
    parent.add(mesh);return mesh;
  }
  const rootShadow=shape(root,'ball',0,.025,0,.45,.035,.29,0x1b2734,'contact-shadow-proxy');
  rootShadow.castShadow=false;
  // Functional landmarks are modeled independently so poses remain legible at 360p.
  const pelvis=shape(torso,'ball',0,1.09,0,.33,.26,.32,0x173b4b,'waist');
  const jacket=shape(torso,'torso',-.025,1.54,0,.38,.52,.43,0xf4b52b,'jacket');
  const shirt=shape(torso,'ball',.24,1.51,0,.14,.42,.31,0xf0ebe0,'shirt');
  const seam=shape(torso,'capsule',.34,1.50,0,.025,.31,.035,0x1a9e98,'jacket front seam');
  // Fine silhouette and costume construction, with custom hand-sewn edges.
  shape(torso,'capsule',.25,1.64,.28,.031,.28,.035,0xfce1ac,'jacket piped seam');
  shape(torso,'capsule',.25,1.64,-.28,.031,.28,.035,0xfce1ac,'jacket piped back seam');
  shape(torso,'ball',.26,1.90,0,.10,.035,.31,0x104d59,'shirt collar');
  shape(torso,'box',.31,1.43,.32,.055,.11,.055,0xe2a946,'zip pull');
  shape(torso,'capsule',.27,1.21,.29,.055,.065,.045,0xfbd584,'waist patch');
  shape(torso,'capsule',.27,1.21,-.29,.055,.065,.045,0xfbd584,'waist patch back');
  const hip=shape(torso,'ball',-.02,1.18,0,.31,.23,.29,0x243e58,'hip');
  const neck=shape(torso,'capsule',.04,2.02,0,.14,.09,.14,skins[1],'neck');
  const headPivot=new THREE.Group();headPivot.position.set(.045,2.05,0);torso.add(headPivot);
  const face=shape(headPivot,'ball',.08,.245,0,.255,.305,.259,skins[1],'head');
  const hairBase=shape(headPivot,'ball',0,.46,0,.272,.165,.28,0x191e26,'short natural hair');
  for(let n=0;n<17;n++){
    const a=n*2.399, r=.1+.15*Math.sqrt((n+1)/17);
    shape(headPivot,'ball',r*Math.cos(a),.54+(n%3)*.017,r*Math.sin(a),.075,.065,.075,0x21232c,'hair texture');
  }
  for(const s of [-1,1]){
    shape(headPivot,'ball',.30,.285,s*.115,.026,.052,.046,0xf1eee7,'eye');
    shape(headPivot,'ball',.318,.293,s*.12,.017,.031,.022,0x1a2533,'iris');
    shape(headPivot,'ball',.315,.41,s*.12,.072,.027,.036,0x22222a,'brow');
    shape(headPivot,'ball',.02,.25,s*.258,.064,.082,.06,skins[1],'ear');
  }
  shape(headPivot,'ball',.30,.16,0,.078,.076,.086,skins[1],'nose');
  shape(headPivot,'capsule',.316,.068,0,.022,.007,.101,0x4d2d2c,'smile');

  const arms=[], legs=[];
  for(const s of [-1,1]){
    const shoulder=new THREE.Group();shoulder.position.set(0,1.86,s*.34);torso.add(shoulder);shoulder.name=(s<0?'left':'right')+'-shoulder';
    shape(shoulder,'capsule',0,-.21,0,.164,.22,.145,0xf3b42b,'upper sleeve');
    const elbow=new THREE.Group();elbow.position.set(0,-.48,0);shoulder.add(elbow);
    shape(elbow,'ball',0,0,0,.136,.13,.135,0x8a593e,'elbow');
    shape(elbow,'capsule',.02,-.17,0,.115,.18,.118,skins[1],'forearm');
    const wrist=new THREE.Group();wrist.position.set(.03,-.37,0);elbow.add(wrist);
    shape(wrist,'ball',.06,-.042,0,.13,.142,.109,skins[1],'hand');
    for(let k=0;k<3;k++)shape(wrist,'capsule',.15,-.10,s*(k-1)*.059,.034,.062,.035,skins[1],'finger');
    shape(shoulder,'capsule',.09,-.13,s*.08,.041,.13,.052,0xf9d178,'sleeve reflective tape');
    shape(elbow,'ball',.08,-.18,s*.03,.046,.035,.052,0xe8c59d,'elbow highlight');
    shape(wrist,'capsule',.035,.065,0,.13,.05,.12,0x28a8af,'fitness wrist cuff');
    arms.push({shoulder,elbow,wrist,s,upper:shoulder.children[0]});
    const thigh=new THREE.Group();thigh.position.set(-.02,1.06,s*.185);torso.add(thigh);thigh.name=(s<0?'left':'right')+'-hip';
    shape(thigh,'capsule',0,-.24,0,.168,.255,.154,0x173c52,'trouser');
    const knee=new THREE.Group();knee.position.set(0,-.53,0);thigh.add(knee);
    shape(knee,'ball',0,0,0,.151,.16,.14,0x173c52,'knee');
    shape(knee,'capsule',0,-.20,0,.134,.23,.135,0x173c52,'shin');
    const ankle=new THREE.Group();ankle.position.set(0,-.45,0);knee.add(ankle);
    shape(ankle,'ball',.12,-.06,0,.29,.105,.19,0xf7f0d9,'running shoe');
    shape(ankle,'capsule',.33,-.075,0,.075,.035,.18,0xf6ca4e,'toe stripe');
    shape(ankle,'box',.11,-.145,0,.52,.03,.33,0x243f50,'shoe sole');
    shape(ankle,'box',.36,-.02,.10,.06,.012,.22,0xf3d078,'shoe lace stripe');
    shape(ankle,'box',.36,-.02,-.10,.06,.012,.22,0xf3d078,'shoe lace stripe');
    shape(thigh,'capsule',.13,-.33,s*.06,.044,.095,.05,0x4e7087,'trouser cuff stitch');
    legs.push({thigh,knee,ankle,s,pants:thigh.children[0],shin:knee.children[1]});
  }
  // Each cultural costume is a distinct layered silhouette, not a hitbox change.
  const costumes=new Map();
  function costume(id,fn){const g=new THREE.Group();g.name='costume-'+id;torso.add(g);fn(g);g.visible=false;costumes.set(id,g);}
  costume('lagos-streetwear',g=>{
    shape(g,'box',-.32,1.49,0,.10,.73,.52,0x16444d,'sling bag');
    shape(g,'box',-.24,1.65,-.16,.21,.42,.06,0x11a9a1,'strap');
    shape(g,'box',0,2.63,0,.56,.18,.48,0x185868,'urban running cap');
    shape(g,'box',.25,2.57,0,.46,.055,.52,0xf5bc43,'cap brim');
    shape(g,'box',-.29,1.58,-.13,.11,.27,.29,0x2a6e75,'sport bag side pocket');
    shape(g,'capsule',.04,2.665,.26,.25,.023,.032,0xe3cc93,'hat stitched front badge');
    shape(g,'box',-.12,1.75,.31,.46,.09,.04,0xe3b852,'jacket upper yoke trim');
  });
  costume('yoruba-agbada-fila',g=>{
    shape(g,'cone',-.03,1.25,0,.55,.82,.66,0x244f81,'agbada drape');
    shape(g,'box',.38,1.45,0,.045,.65,.22,0xe9d5a6,'agbada central stitch');
    for(const s of [-1,1])shape(g,'box',.31,1.72,s*.18,.045,.15,.05,0xd5ad5a,'embroidery');
    shape(g,'cone',.03,2.62,0,.29,.21,.28,0x1e4877,'fila');
    for(let i=0;i<6;i++){
      const y=.71+i*.16;
      shape(g,'capsule',.35,y,.32,.026,.07,.023,i%2?0xf4cf84:0xb2ddeb,'agbada embroidered thread');
    }
    shape(g,'ball',.01,2.83,.01,.16,.05,.16,0xf3d09b,'fila top stitched crown');
  });
  costume('igbo-isi-agu-red-cap',g=>{
    shape(g,'torso',.00,1.55,0,.43,.54,.48,0x332323,'isi agu tunic');
    for(const s of [-1,1])for(let i=0;i<4;i++)
      shape(g,'ball',.29,1.23+i*.16,s*.26,.05,.055,.048,0xbda16d,'abstract rosette');
    shape(g,'cone',.02,2.63,0,.295,.25,.29,0xb72e3f,'red cap');
    shape(g,'box',.27,1.91,0,.035,.08,.38,0xcfb47a,'neck trim');
    for(let row=0;row<3;row++)for(const z of [-.30,.30]){
      shape(g,'ball',.28,1.12+row*.20,z,.07,.048,.045,0xc5a166,'isi agu decorative lion abstract mark');
    }
    shape(g,'capsule',.10,2.71,.25,.08,.08,.045,0xedb88c,'red cap insignia');
  });
  costume('hausa-baban-riga-cap',g=>{
    shape(g,'cone',-.03,1.18,0,.51,.98,.62,0x146e66,'baban riga outer robe');
    shape(g,'box',.41,1.56,0,.04,.61,.15,0xe3d19e,'baban riga embroidery');
    for(const s of [-1,1])shape(g,'box',.40,1.73,s*.15,.042,.26,.037,0xcda66b,'embroidered band');
    shape(g,'cone',.05,2.63,0,.29,.21,.28,0xdfcda8,'embroidered cap');
    for(let col=0;col<3;col++){
      shape(g,'capsule',.43,1.29+col*.19,.26,.025,.085,.028,0xe5d8ad,'robe front stitched knot');
      shape(g,'capsule',.43,1.29+col*.19,-.26,.025,.085,.028,0xe5d8ad,'robe back stitched knot');
    }
    shape(g,'capsule',.22,2.74,.23,.07,.07,.04,0xf7ce67,'cap crown embroidery');
  });
  const palette={
    'lagos-streetwear':[0xf3bc30,0x193b55,0x16acaa],
    'yoruba-agbada-fila':[0x244f81,0xede2cb,0xe1b75c],
    'igbo-isi-agu-red-cap':[0x352422,0x39292a,0xbc9f67],
    'hausa-baban-riga-cap':[0x146e66,0xd0b886,0xe4d3a7]
  };
  let active='';
  function setOutfit(outfit){
    if(!palette[outfit]||active===outfit)return;
    const [primary,secondary,accent]=palette[outfit];
    jacket.material=mat(primary);seam.material=mat(accent);hip.material=mat(secondary);
    for(const arm of arms)arm.upper.material=mat(primary);
    for(const leg of legs){leg.pants.material=mat(secondary);leg.shin.material=mat(secondary);}
    for(const [key,node] of costumes)node.visible=key===outfit;
    active=outfit;
  }
  setOutfit('lagos-streetwear');
  function pose(frame,now,reducedMotion=false) {
    const state=frame.movementState, vx=Math.abs(frame.velocity.x);
    const moving=state==='grounded'&&vx>.35, jump=['rising','falling','airborne'].includes(state);
    const slide=state==='sliding', hit=state==='stumbling', failed=state==='dead';
    const stride=reducedMotion?0:Math.sin(frame.tick*.19 + now*.003);
    const cycle=moving?Math.min(1,vx/5):0;
    const swing=moving?stride*.65*cycle:0;
    torso.rotation.z=slide?-.29:jump?.12:hit?-.28:failed?-.95:.04*Math.abs(swing);
    torso.position.y=slide?-.47:failed?-.43:(moving?.04*Math.abs(stride):0);
    torso.scale.y=slide?.88:1;
    headPivot.rotation.z=jump?-.09:hit?.18:0;
    arms.forEach((arm,i)=>{
      const sign=i===0?1:-1;
      arm.shoulder.rotation.z=slide?-.82:jump?-.78:hit?sign*.65:failed?1:swing*sign*.8;
      arm.shoulder.rotation.x=0;
      arm.elbow.rotation.z=slide?-.65:jump?-.30:-.35-Math.max(0,sign*swing)*.35;
      arm.wrist.rotation.z=0;
    });
    legs.forEach((leg,i)=>{
      const sign=i===0?-1:1;
      leg.thigh.rotation.z=slide?-.97:jump?sign*.32:failed?.40:sign*swing;
      leg.knee.rotation.z=slide?1.5:jump?.55:failed?.85:Math.max(0,sign*swing)*.86;
      leg.ankle.rotation.z=moving?-.2*sign*stride:0;
    });
    const shadowScale=1+Math.max(0,frame.position.y)*.20;
    rootShadow.scale.x=.45*shadowScale;
    rootShadow.scale.z=.29*shadowScale;
    rootShadow.material=mat(0x203642);
    rootShadow.visible=frame.position.y<=.15;
  }
  return Object.freeze({root,pose,setOutfit,meshCount:root.children.length+torso.children.length,
    articulatedJoints:arms.length*3+legs.length*3+2,availableOutfits:Object.freeze(Object.keys(palette))});
}
