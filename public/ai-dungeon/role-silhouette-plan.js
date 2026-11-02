/**
 * Original cosmetic fittings for the five ordinary textured GLB archetypes.
 * Every form is local to the existing rig's external visual pivot: it cannot
 * affect navigation, attack reach, hitboxes, physics, or authoritative replay.
 * Muted PBR finishes and curved silhouette arcs favour legibility over glow.
 * Frozen, reusable recipes avoid per-frame procedural allocation or RNG.
 */
const piece=(id,shape,finish,x,y,z,sx,sy,sz,rz=0)=>
 Object.freeze({id,shape,finish,x,y,z,sx,sy,sz,rz});
const arc=(id,finish,points)=>Object.freeze({
 id,shape:'arc',finish,
 points:Object.freeze(points.map(p=>Object.freeze(p)))
});
const PLANS=Object.freeze({
 vanguard:Object.freeze([
  piece('left-etched-pauldron','plate','iron',-.45,1.39,.02,.48,.34,.42,-.20),
  piece('right-etched-pauldron','plate','iron',.45,1.39,.02,.48,.34,.42,.20),
  piece('left-gilt-rim','lamella','antique',-.54,1.47,-.10,.32,.065,.31,-.20),
  piece('right-gilt-rim','lamella','antique',.54,1.47,-.10,.32,.065,.31,.20),
  piece('neck-gorget','plate','iron',0,1.51,-.25,.45,.14,.21),
  piece('chest-oath','gem','antique',0,1.17,-.345,.16,.21,.065),
  piece('helm-banner','spike','antique',0,2.04,.04,.13,.36,.16),
  piece('belt-guard','lamella','iron',0,.82,-.30,.56,.17,.12),
  piece('back-scabbard','rod','leather',.37,.86,.37,.13,1.06,.13,-.26)
 ]),
 ranger:Object.freeze([
  arc('flexed-back-bow','antique',[[.43,.48,.37],[.70,.80,.43],[.70,1.41,.43],[.43,1.88,.37]]),
  piece('taut-bowstring','rod','leather',.43,1.18,.37,.024,1.40,.024),
  piece('quiver','rod','leather',-.37,1.15,.34,.24,.72,.24,-.14),
  piece('arrow-one','rod','antique',-.46,1.55,.36,.035,.32,.035),
  piece('arrow-two','rod','antique',-.36,1.56,.39,.035,.34,.035),
  piece('arrow-three','rod','antique',-.28,1.54,.34,.035,.30,.035),
  piece('left-mantle-clasp','gem','iron',-.29,1.43,-.29,.14,.14,.085),
  piece('right-mantle-clasp','gem','iron',.29,1.43,-.29,.14,.14,.085),
  piece('sash-buckle','lamella','antique',0,.86,-.30,.24,.12,.075)
 ]),
 mystic:Object.freeze([
  piece('staff-shaft','rod','antique',.53,1.12,.39,.075,1.62,.075,.055),
  arc('staff-crescent','antique',[[.28,1.94,.39],[.36,2.18,.39],[.68,2.18,.39],[.78,1.94,.39]]),
  piece('staff-heart','gem','arcane',.53,2.03,.38,.23,.30,.20),
  piece('left-scroll-shoulder','plate','leather',-.40,1.37,.03,.43,.25,.39,-.14),
  piece('right-scroll-shoulder','plate','leather',.40,1.37,.03,.43,.25,.39,.14),
  piece('left-oracle-stud','gem','antique',-.39,1.44,-.16,.11,.11,.065),
  piece('right-oracle-stud','gem','antique',.39,1.44,-.16,.11,.11,.065),
  piece('ritual-gorget','lamella','antique',0,1.49,-.29,.41,.09,.085),
  piece('mantle-brooch','gem','arcane',0,1.18,-.34,.15,.16,.09)
 ]),
 revenant:Object.freeze([
  arc('first-bone-rib','iron',[[-.31,1.46,-.29],[-.16,1.39,-.37],[.16,1.39,-.37],[.31,1.46,-.29]]),
  arc('second-bone-rib','iron',[[-.35,1.30,-.29],[-.17,1.23,-.38],[.17,1.23,-.38],[.35,1.30,-.29]]),
  arc('third-bone-rib','iron',[[-.32,1.12,-.29],[-.16,1.05,-.36],[.16,1.05,-.36],[.32,1.12,-.29]]),
  piece('left-spined-shoulder','spike','iron',-.49,1.65,.06,.20,.48,.23,-.31),
  piece('right-spined-shoulder','spike','iron',.49,1.65,.06,.20,.48,.23,.31),
  piece('grave-collar','plate','leather',0,1.58,-.23,.44,.16,.20),
  piece('coffin-seal','gem','arcane',0,.94,-.35,.19,.21,.095),
  piece('rusted-hip-blade','rod','iron',-.43,.75,.27,.12,.96,.13,.19)
 ]),
 cultist:Object.freeze([
  arc('left-horned-cowl','antique',[[-.23,1.69,.09],[-.37,1.82,.10],[-.49,2.02,.11],[-.43,2.22,.12]]),
  arc('right-horned-cowl','antique',[[.23,1.69,.09],[.37,1.82,.10],[.49,2.02,.11],[.43,2.22,.12]]),
  piece('left-ritual-mantle','plate','leather',-.40,1.36,.07,.43,.27,.42,-.15),
  piece('right-ritual-mantle','plate','leather',.40,1.36,.07,.43,.27,.42,.15),
  piece('veil-anchor','lamella','antique',0,1.52,-.25,.35,.12,.14),
  piece('occult-medallion','gem','arcane',0,1.12,-.36,.19,.22,.095),
  piece('left-pendant','lamella','leather',-.18,.64,-.27,.17,.49,.10,-.08),
  piece('right-pendant','lamella','leather',.18,.64,-.27,.17,.49,.10,.08),
  piece('ritual-belt','lamella','antique',0,.91,-.27,.50,.10,.13)
 ])
});
const EMPTY=Object.freeze([]);
export function planRoleSilhouette(kind){return Object.hasOwn(PLANS,kind)?PLANS[kind]:EMPTY;}
