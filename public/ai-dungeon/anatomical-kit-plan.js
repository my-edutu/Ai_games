/**
 * Six original sculpted anatomy overlays on real CC0 skeletal GLBs.
 * Read-only, static, bounded and separate from collisions/combat/navigation.
 */
const profile=Object.freeze({
 vanguard:{chest:'steel',detail:'bronze',arm:'steel',lower:'steel',face:'steel',scale:1.00,head:1.00,robe:.70,ornament:'cuirass'},
 ranger:{chest:'leather',detail:'bronze',arm:'leather',lower:'leather',face:'textile',scale:.89,head:.80,robe:.83,ornament:'pauldron'},
 mystic:{chest:'textile',detail:'bronze',arm:'textile',lower:'leather',face:'textile',scale:.83,head:.94,robe:1.03,ornament:'tabard'},
 revenant:{chest:'bone',detail:'bone',arm:'steel',lower:'bone',face:'bone',scale:.72,head:.96,robe:.53,ornament:'rib'},
 cultist:{chest:'leather',detail:'bone',arm:'leather',lower:'leather',face:'textile',scale:.87,head:1.05,robe:.99,ornament:'tabard'},
 warden:{chest:'steel',detail:'bronze',arm:'steel',lower:'steel',face:'bone',scale:1.08,head:1.10,robe:1.06,ornament:'rib'}
});
const part=(id,shape,finish,x,y,z,sx,sy,sz,rz=0,mount='torso')=>
 Object.freeze({id,shape,finish,x,y,z,sx,sy,sz,rz,mount});
function make(kind,p){
 const w=p.scale,robe=p.robe;
 const items=[
  part(kind+'-forged-cuirass','cuirass',p.chest,0,1.19,-.29,.73*w,.67,.27),
  part(kind+'-upper-breastplate','cuirass',p.detail,0,1.32,-.40,.31*w,.32,.10),
  part(kind+'-neck-gorget','collar',p.detail,0,1.50,-.19,.53*w,.23,.27),
  // Three coherent skinned helmet layers replace the tiny postage-stamp face
  // fitting. They ride the genuine animated cranial joint and frame the face
  // in bone/leather/steel instead of exposing an oversized bright cartoon cap.
  part(kind+'-face-guard','mask',p.face,0,1.68,-.26,.78*p.head,.56,.43,0,'head'),
  part(kind+'-helmet-brow','mask',p.detail,0,1.80,-.25,.93*p.head,.22,.51,0,'head'),
  part(kind+'-visor-shadow','mask','leather',0,1.715,-.43,.55*p.head,.14,.23,0,'head'),
  part(kind+'-left-shoulder','pauldron',p.chest,-.42,1.38,-.08,.36*w,.28,.35,-.12),
  part(kind+'-right-shoulder','pauldron',p.chest,.42,1.38,-.08,.36*w,.28,.35,.12),
  part(kind+'-left-bracer','vambrace',p.arm,-.43,1.03,-.10,.30,.47,.30,-.12,'leftForearm'),
  part(kind+'-right-bracer','vambrace',p.arm,.43,1.03,-.10,.30,.47,.30,.12,'rightForearm'),
  part(kind+'-left-shin','greave',p.lower,-.17,.36,-.13,.29,.46,.29,0,'leftLowerLeg'),
  part(kind+'-right-shin','greave',p.lower,.17,.36,-.13,.29,.46,.29,0,'rightLowerLeg'),
  part(kind+'-hip-mail','fauld',p.chest,0,.79,-.12,.64*w,.36,.46),
  part(kind+'-hanging-tabard','tabard',p.face,0,.52,-.33,.39*w,.52*robe,.17),
  part(kind+'-left-patella','pauldron',p.detail,-.18,.61,-.22,.27,.17,.19),
  part(kind+'-right-patella','pauldron',p.detail,.18,.61,-.22,.27,.17,.19)
 ];
 if(kind==='revenant'||kind==='warden'){
  items.push(part(kind+'-exposed-first-rib','rib','bone',0,1.43,-.40,.63,.31,.13));
  items.push(part(kind+'-exposed-second-rib','rib','bone',0,1.24,-.40,.61,.28,.12));
 }else if(kind==='ranger'){
  items.push(part('ranger-studded-crossguard','pauldron','bronze',-.49,1.42,-.19,.26,.30,.31,-.24));
 }else if(kind==='mystic'){
  items.push(part('mystic-silver-oracle-seal','tabard','bronze',0,1.06,-.42,.24,.28,.12));
 }else if(kind==='cultist'){
  items.push(part('cultist-ritual-hem','tabard','bone',-.18,.40,-.33,.25,.37,.14,-.15));
 }
 return Object.freeze(items);
}
const KITS=Object.freeze(Object.fromEntries(Object.entries(profile).map(([kind,p])=>[kind,make(kind,p)])));
const EMPTY=Object.freeze([]);
export function planAnatomicalKit(kind){return Object.hasOwn(KITS,kind)?KITS[kind]:EMPTY;}

// Precompute rigid torso material batches once. Articulated bracers and greaves
// must remain individual because they follow the real imported GLB joints.
const EMPTY_DRAW=Object.freeze({staticGroups:EMPTY,jointPieces:EMPTY});
const DRAW=Object.freeze(Object.fromEntries(Object.entries(KITS).map(([kind,pieces])=>{
 const grouped=new Map(),jointPieces=[];
 for(const piece of pieces){
  if(piece.mount!=='torso'){jointPieces.push(piece);continue;}
  if(!grouped.has(piece.finish))grouped.set(piece.finish,[]);
  grouped.get(piece.finish).push(piece);
 }
 const staticGroups=Object.freeze([...grouped].map(([finish,parts])=>
  Object.freeze({finish,parts:Object.freeze(parts)})));
 return [kind,Object.freeze({staticGroups,jointPieces:Object.freeze(jointPieces)})];
})));
export function planAnatomicalDrawGroups(kind){
 return Object.hasOwn(DRAW,kind)?DRAW[kind]:EMPTY_DRAW;
}
