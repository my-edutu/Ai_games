/**
 * Genuine skinned character-performance envelope for the autonomous dungeon.
 * These small local rig deltas complement imported CC0 animations, never
 * change authority, AI, collision, combat range or seeded replay.
 */
const ease=x=>{const v=Math.max(0,Math.min(1,x));return v*v*(3-2*v)};
const rnd=x=>Math.round(x*10000)/10000;
const R=Object.freeze({pitch:0,yaw:0,roll:0});
const REST=Object.freeze({mode:'rest',strength:0,
 arms:{left:{pitch:0,roll:0},right:{pitch:0,roll:0}},
 elbows:{left:0,right:0},spine:R,wrist:R,
 root:{x:0,y:0,z:0,pitch:0,roll:0}});
const MELEE={vanguard:{weight:1,side:1},revenant:{weight:.82,side:-1},warden:{weight:1.18,side:-1}};
const done=(mode,strength,arms,elbows,spine,wrist,root)=>Object.freeze({
 mode,strength:rnd(strength),arms,elbows,spine,wrist,root});
export function planCombatPerformanceBeat(kind,action,age=0,{
 targetId=null,distance=null,alive=true,reducedMotion=false
}={}){
 if(!alive||reducedMotion||!Number.isFinite(age)||age<0||age>=.62)return REST;
 const target=typeof targetId==='string'&&targetId.length>0&&targetId.length<=128;
 const wind=age<.14?ease(age/.14):age<.23?1-ease((age-.14)/.09):0;
 const drive=age<.14?0:age<.295?ease((age-.14)/.155):1-ease((age-.295)/.325);
 if(!wind&&!drive)return REST;
 const m=MELEE[kind];
 if(m&&action==='attack'&&target&&distance===1){
  const w=m.weight,s=m.side;
  return done('melee',w*(wind+drive),
   {left:{pitch:rnd(w*(-.105*wind+.092*drive)),roll:rnd(s*w*(.055*wind-.048*drive))},
    right:{pitch:rnd(w*(.18*wind-.155*drive)),roll:rnd(s*w*(-.11*wind+.105*drive))}},
   {left:rnd(w*(.075*wind-.06*drive)),right:rnd(w*(.115*wind-.12*drive))},
   {pitch:rnd(w*(.045*wind-.075*drive)),yaw:rnd(s*w*(-.075*wind+.115*drive)),roll:rnd(s*w*(.04*wind-.065*drive))},
   {pitch:rnd(w*(-.12*wind+.145*drive)),yaw:rnd(s*w*(.045*wind-.085*drive)),roll:rnd(s*w*(.06*wind+.085*drive))},
   {x:rnd(s*w*(.016*wind+.022*drive)),y:rnd(w*(-.014*wind+.007*drive)),z:rnd(w*(.024*wind-.035*drive)),pitch:rnd(w*(.026*wind-.031*drive)),roll:rnd(s*w*(.014*wind-.014*drive))});
 }
 if(kind==='ranger'&&action==='attack'&&target&&Number.isInteger(distance)&&distance>=1&&distance<=4)
  return done('archery',wind+drive,
   {left:{pitch:rnd(.11*wind-.035*drive),roll:rnd(-.055*wind+.03*drive)},
    right:{pitch:rnd(-.155*wind+.12*drive),roll:rnd(.07*wind-.055*drive)}},
   {left:rnd(.09*wind-.07*drive),right:rnd(.12*wind-.11*drive)},
   {pitch:rnd(-.02*wind+.03*drive),yaw:rnd(-.045*wind+.055*drive),roll:0},
   R,{x:0,y:rnd(-.007*wind),z:rnd(.017*wind-.014*drive),pitch:0,roll:0});
 if((kind==='mystic'||kind==='cultist')&&action==='cast'&&target&&
    Number.isInteger(distance)&&distance>=1&&distance<=3){
  const v=Math.sin(Math.PI*age/.62),s=kind==='mystic'?1:-1;
  return done('spell',v,
   {left:{pitch:rnd(-.105*v),roll:rnd(-s*.09*v)},
    right:{pitch:rnd(-.125*v),roll:rnd(s*.09*v)}},
   {left:rnd(.1*v),right:rnd(.08*v)},
   {pitch:rnd(-.04*v),yaw:rnd(s*.06*v),roll:0},
   R,{x:0,y:rnd(.018*v),z:0,pitch:0,roll:rnd(s*.015*v)});
 }
 // The actual Warden area cast has no single victim: its public strike
 // footprint and already-rendered warning alone authorize this brief motion.
 if(kind==='warden'&&action==='cast')
  return done('boss-cast',drive,
   {left:{pitch:rnd(-.10*wind+.06*drive),roll:rnd(-.09*drive)},
    right:{pitch:rnd(-.10*wind+.06*drive),roll:rnd(.09*drive)}},
   {left:rnd(.08*wind-.07*drive),right:rnd(.08*wind-.07*drive)},
   {pitch:rnd(-.07*wind+.08*drive),yaw:0,roll:0},
   R,{x:0,y:rnd(.02*wind-.015*drive),z:0,pitch:rnd(-.02*wind+.015*drive),roll:0});
 return REST;
}
