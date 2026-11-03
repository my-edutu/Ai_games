/** Pure read-only skeletal release and original 3D shot plan. */
const ease=n=>{const t=Math.max(0,Math.min(1,n));return t*t*(3-2*t)};
const ZERO=Object.freeze({weight:0,spine:{pitch:0,yaw:0,roll:0},shoulders:{left:{pitch:0,roll:0},right:{pitch:0,roll:0}},elbows:{left:0,right:0}});
export function planRangedBodyPose(kind,action,age=0,distance=null,targetId=null,reducedMotion=false){
 const archer=kind==='ranger'&&action==='attack';
 const caster=(kind==='mystic'||kind==='cultist')&&action==='cast';
 if((!archer&&!caster)||reducedMotion||!Number.isFinite(age)||age<0||age>=.72)return ZERO;
 if(archer&&(!Number.isInteger(distance)||distance<1||distance>4||
  typeof targetId!=='string'||targetId.length<1||targetId.length>128))return ZERO;
 const draw=age<.18?ease(age/.18):age<.34?1-ease((age-.18)/.16):0;
 const release=age<.18?0:age<.35?ease((age-.18)/.17):1-ease((age-.35)/.37);
 const w=Math.max(draw,release);if(w<=0)return ZERO;
 if(archer)return {weight:w,
  spine:{pitch:.045*draw-.095*release,yaw:.10*draw-.06*release,roll:-.045*draw},
  shoulders:{left:{pitch:-.26*draw+.16*release,roll:-.14*draw},
   right:{pitch:.18*draw-.24*release,roll:.12*draw-.06*release}},
  elbows:{left:.23*draw-.10*release,right:-.20*draw+.16*release}};
 const sign=kind==='cultist'?-1:1;
 return {weight:w,
  spine:{pitch:-.065*draw-.082*release,yaw:sign*.08*release,roll:sign*.055*draw},
  shoulders:{left:{pitch:-.22*draw-.17*release,roll:-.12*draw-.06*release},
   right:{pitch:-.24*draw-.18*release,roll:.12*draw+.05*release}},
  elbows:{left:.19*draw+.07*release,right:.21*draw+.09*release}};
}
const SHOTS=Object.freeze({
 ranger:Object.freeze({shape:'arrow',spin:0,arc:.025}),
 mystic:Object.freeze({shape:'glyph',spin:5,arc:.15}),
 cultist:Object.freeze({shape:'glyph',spin:-5,arc:.15})
});
export function rangedProjectileProfile(kind,action){
 if(kind==='ranger'&&action==='attack')return SHOTS.ranger;
 if(kind==='mystic'&&action==='cast')return SHOTS.mystic;
 if(kind==='cultist'&&action==='cast')return SHOTS.cultist;
 return null;
}
// Shared original geometry: one physical metal arrow or one arcane knot.
// One mesh per shot; no new lights, particle emitters, downloads or RNG.
export function createRangedProjectileGeometry(THREE,shape){
 if(!THREE?.Vector2||!THREE?.LatheGeometry||!THREE?.TorusKnotGeometry)return null;
 if(shape==='arrow'){
  const rings=[[0,-.46],[.025,-.45],[.032,-.37],[.018,-.32],[.020,.29],
   [.055,.31],[.062,.34],[.012,.55],[0,.57]];
  const g=new THREE.LatheGeometry(rings.map(([r,y])=>new THREE.Vector2(r,y)),9);
  g.name='Original forged ranger arrow';return g;
 }
 if(shape==='glyph'){
  const g=new THREE.TorusKnotGeometry(.14,.035,24,4,2,3);
  g.name='Original focused arcane knot';return g;
 }
 return null;
}
