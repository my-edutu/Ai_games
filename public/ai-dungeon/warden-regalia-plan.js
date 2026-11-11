/**
 * Original Warden silhouette: martial anatomy, not an oversized pile of spikes.
 * The actual skinned CC0 swordsman supplies body and locomotion. These 24
 * attached fittings establish a restrained iron/bone crown, weighty shoulders,
 * weathered battle plate and a single visible oath ember. The forged armour
 * layer supplies detailed anatomy: do not compete with it using inflated orbs.
 * Cosmetic, bounded, seeded-state independent and original; never a hitbox.
 */
// One shared model-to-world scale for the REAL imported boss, fallback rig,
// authored crown, telegraph and collision-neutral cinematic staging. Previous
// 1.55 x 2.05 m created a 3.18 m toy giant hiding the live Vanguard at contact.
// A 2.67 m imposing enemy still towers over the 1.82 m human protagonists,
// while allowing a believable paired duel. Pure presentation; no hitboxes.
export const WARDEN_STAGE_PROFILE=Object.freeze({worldScale:1.16,sourceHeight:2.30});
const piece=(id,shape,finish,x,y,z,sx,sy,sz,rz=0)=>Object.freeze({id,shape,finish,x,y,z,sx,sy,sz,rz});
const horn=(id,side)=>Object.freeze({id,shape:'horn',finish:'bone',points:Object.freeze([
 Object.freeze([side*.25,1.69,.05]),
 Object.freeze([side*.36,1.88,.11]),
 Object.freeze([side*.46,2.05,.16]),
 Object.freeze([side*.52,2.23,.22])
])});
const REGALIA=Object.freeze([
 horn('left-horn',-1),horn('right-horn',1),
 // Shoulder armour stays within the readable human silhouette instead of
 // obscuring adjacent heroes, weapon contact and the Warden's head.
 piece('left-pauldron','plate','iron',-.40,1.45,.015,.39,.24,.38,-.20),
 piece('right-pauldron','plate','iron',.40,1.45,.015,.39,.24,.38,.20),
 piece('left-rim','plate','brass',-.47,1.51,-.165,.32,.09,.29,-.19),
 piece('right-rim','plate','brass',.47,1.51,-.165,.32,.09,.29,.19),
 piece('left-talon','spike','bone',-.59,1.62,.075,.12,.31,.13,-.39),
 piece('right-talon','spike','bone',.59,1.62,.075,.12,.31,.13,.39),
 // Four small spine studs preserve the oathbreaker identity but no longer
 // build a wall of full-height ornament behind the actual fighting skeleton.
 piece('back-spine-1','spike','iron',-.35,1.75,.27,.105,.32,.15,-.30),
 piece('back-spine-2','spike','iron',-.12,1.87,.33,.085,.38,.12,-.12),
 piece('back-spine-3','spike','iron',.12,1.87,.33,.085,.38,.12,.12),
 piece('back-spine-4','spike','iron',.35,1.75,.27,.105,.32,.15,.30),
 piece('left-collar','lamella','brass',-.23,1.58,-.21,.25,.15,.10,-.30),
 piece('right-collar','lamella','brass',.23,1.58,-.21,.25,.15,.10,.30),
 // Underlying sculpted cuirass remains visible instead of buried by a huge
 // sphere. Narrow sternum and shallow heartplate lead the viewer to the face.
 piece('cuirass','plate','iron',0,1.17,-.24,.60,.56,.18),
 piece('sternum','lamella','brass',0,1.17,-.38,.105,.41,.035),
 piece('ember-heart','gem','ember',0,1.21,-.445,.17,.20,.075),
 piece('left-rivet','gem','brass',-.24,1.35,-.38,.055,.065,.035),
 piece('right-rivet','gem','brass',.24,1.35,-.38,.055,.065,.035),
 piece('left-tasset','lamella','iron',-.26,.71,-.19,.24,.34,.12,-.14),
 piece('centre-tasset','lamella','brass',0,.68,-.25,.21,.31,.13),
 piece('right-tasset','lamella','iron',.26,.71,-.19,.24,.34,.12,.14),
 piece('brow-diadem','lamella','brass',0,1.88,-.21,.35,.08,.09),
 piece('crown-finial','spike','bone',0,2.11,-.075,.10,.23,.11)
]);
const EMPTY=Object.freeze([]);
export function planWardenRegalia(kind){return kind==='warden'?REGALIA:EMPTY;}

// Bounded GPU submission plan for the same 24 original Warden fittings.
// Keep the two curved horns as separately sculpted mesh surfaces; every
// other authored shape retains its exact geometry, finish and bone target.
const REGALIA_DRAWS=Object.freeze([...REGALIA.filter(p=>p.shape!=='horn').reduce((map,part)=>{
 const key=part.shape+'|'+part.finish;
 if(!map.has(key))map.set(key,{shape:part.shape,finish:part.finish,parts:[]});
 map.get(key).parts.push(part);
 return map;
},new Map()).values()].map(group=>Object.freeze({shape:group.shape,finish:group.finish,
 parts:Object.freeze(group.parts)})));
export function planWardenRegaliaDrawGroups(kind){return kind==='warden'?REGALIA_DRAWS:EMPTY;}


/** The vetted Warden sculpture follows its true animated native skeleton. */
const REGALIA_BONE_TARGETS=Object.freeze(Object.fromEntries(REGALIA.map(p=>{
 const id=p.id;
 const joint=/(?:-horn|brow-diadem|crown-finial)$/.test(id)?'head':
  /^(?:left|right)-(?:pauldron|rim|talon)$/.test(id)?
   (id.startsWith('left-')?'leftUpperArm':'rightUpperArm'):
  /-tasset$/.test(id)?'pelvis':'chest';
 return [id,joint];
})));
export function planWardenRegaliaBone(id){
 return typeof id==='string'&&Object.hasOwn(REGALIA_BONE_TARGETS,id)?REGALIA_BONE_TARGETS[id]:null;
}
