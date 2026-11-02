/**
 * Original Warden silhouette: martial anatomy, not an oversized pile of spikes.
 * The actual skinned CC0 swordsman supplies body and locomotion. These 24
 * attached fittings establish a restrained iron/bone crown, weighty shoulders,
 * weathered battle plate and a single visible oath ember. The forged armour
 * layer supplies detailed anatomy: do not compete with it using inflated orbs.
 * Cosmetic, bounded, seeded-state independent and original; never a hitbox.
 */
const piece=(id,shape,finish,x,y,z,sx,sy,sz,rz=0)=>Object.freeze({id,shape,finish,x,y,z,sx,sy,sz,rz});
const horn=(id,side)=>Object.freeze({id,shape:'horn',finish:'bone',points:Object.freeze([
 Object.freeze([side*.25,1.69,.05]),
 Object.freeze([side*.41,1.88,.10]),
 Object.freeze([side*.56,2.07,.08]),
 Object.freeze([side*(side<0?.60:.68),2.25,.11])
])});
const REGALIA=Object.freeze([
 horn('left-horn',-1),horn('right-horn',1),
 // Shoulder armour stays within the readable human silhouette instead of
 // obscuring adjacent heroes, weapon contact and the Warden's head.
 piece('left-pauldron','plate','iron',-.43,1.45,.015,.47,.27,.42,-.20),
 piece('right-pauldron','plate','iron',.43,1.45,.015,.47,.27,.42,.20),
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
