/**
 * Original presentation-only Warden silhouette recipe. The existing CC0 rig
 * still supplies animation and texture; these restrained iron, brass and bone
 * forms make the boss recognisably different from ordinary swordsmen.
 * Coordinates are in local scene metres on the independent cosmetic pivot.
 * The authoritative map, collision, damage, animation clips and RNG never read
 * this recipe. Keep all shapes finite, sparse and within the occupied tile.
 */
const piece=(id,shape,finish,x,y,z,sx,sy,sz,rz=0)=>Object.freeze({id,shape,finish,x,y,z,sx,sy,sz,rz});
const horn=(id,side)=>Object.freeze({id,shape:'horn',finish:'bone',points:Object.freeze([
 Object.freeze([side*.32,1.68,.07]),Object.freeze([side*.57,1.91,.10]),
 Object.freeze([side*.86,2.23,.08]),Object.freeze([side*1.09,2.49,.15])
])});
const REGALIA=Object.freeze([
 horn('left-horn',-1),horn('right-horn',1),
 piece('left-pauldron','plate','iron',-.53,1.45,.02,.65,.36,.53,-.18),
 piece('right-pauldron','plate','iron',.53,1.45,.02,.65,.36,.53,.18),
 piece('left-rim','plate','brass',-.64,1.52,-.15,.46,.10,.40,-.22),
 piece('right-rim','plate','brass',.64,1.52,-.15,.46,.10,.40,.22),
 piece('left-talon','spike','bone',-.91,1.64,.10,.20,.43,.24,-.52),
 piece('right-talon','spike','bone',.91,1.64,.10,.20,.43,.24,.52),
 piece('back-spine-1','spike','iron',-.53,1.84,.36,.22,.66,.26,-.35),
 piece('back-spine-2','spike','iron',-.20,2.02,.40,.17,.77,.21,-.16),
 piece('back-spine-3','spike','iron',.20,2.02,.40,.17,.77,.21,.16),
 piece('back-spine-4','spike','iron',.53,1.84,.36,.22,.66,.26,.35),
 piece('left-collar','lamella','brass',-.30,1.61,-.24,.33,.21,.16,-.34),
 piece('right-collar','lamella','brass',.30,1.61,-.24,.33,.21,.16,.34),
 piece('cuirass','plate','iron',0,1.17,-.30,.80,.77,.27),
 piece('sternum','lamella','brass',0,1.18,-.47,.14,.60,.06),
 piece('ember-heart','gem','ember',0,1.19,-.53,.23,.27,.12),
 piece('left-rivet','gem','brass',-.30,1.38,-.45,.09,.10,.065),
 piece('right-rivet','gem','brass',.30,1.38,-.45,.09,.10,.065),
 piece('left-tasset','lamella','iron',-.31,.67,-.25,.29,.39,.16,-.12),
 piece('centre-tasset','lamella','brass',0,.64,-.31,.24,.35,.18),
 piece('right-tasset','lamella','iron',.31,.67,-.25,.29,.39,.16,.12),
 piece('brow-diadem','lamella','brass',0,1.91,-.25,.40,.095,.13),
 piece('crown-finial','spike','bone',0,2.24,-.13,.17,.40,.18)
]);
const EMPTY=Object.freeze([]);
export function planWardenRegalia(kind){return kind==='warden'?REGALIA:EMPTY;}
