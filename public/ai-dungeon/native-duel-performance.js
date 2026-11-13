/**
 * M1 native-skeleton combat performance: one connected windup -> contact ->
 * follow-through -> recovery for the actual licensed GLB figure.
 *
 * Every joint delta is a reversible cosmetic rotation on the imported rig,
 * NOT a new simulation movement, victim, attack or hit. The contact landmark
 * deliberately shares the 215 ms original sword/audio/impact presentation
 * envelope; only authoritative HP loss may show damage.
 */
export const NATIVE_CONTACT_TIME=0.215;
export const NATIVE_DUEL_DURATION=0.62;
const clamp=(n,lo=0,hi=1)=>Math.min(hi,Math.max(lo,n));
const ease=x=>{const t=clamp(x);return t*t*(3-2*t)};
const role=Object.freeze({
 vanguard:Object.freeze({power:1,side:1,plant:1,wind:.135,style:'shielded-cleave'}),
 revenant:Object.freeze({power:.86,side:-1,plant:1.16,wind:.105,style:'reaching-hook'}),
 warden:Object.freeze({power:1.19,side:1,plant:.84,wind:.165,style:'warden-overhead'})
});
const zero=Object.freeze({pitch:0,yaw:0,roll:0});
const legZero=Object.freeze({upper:0,lower:0,foot:0});
const armsZero=Object.freeze({pitch:0,roll:0});
const rest=Object.freeze({mode:'rest',phase:'rest',contactWeight:0,strength:0,
 head:zero,hips:zero,spine:zero,wrist:zero,
 arms:Object.freeze({left:armsZero,right:armsZero}),
 forearms:Object.freeze({left:0,right:0}),
 legs:Object.freeze({left:legZero,right:legZero}),
 root:Object.freeze({x:0,y:0,z:0})});
const round=n=>Math.round(n*10000)/10000;

/**
 * Normalize the imported ONE-SHOT clip's animation-clock duration. Otherwise
 * the original KayKit swing, our skinned wrist, and the original impact sound
 * reach their peaks at unrelated times for different classes. This never
 * changes actual simulation cadence; a missing clip keeps its native speed.
 */
export function planNativeOneShotSpeed(action,duration){
 if(!['attack','cast','hurt'].includes(action)||!Number.isFinite(duration)||
  duration<.12||duration>12)return 1;
 const target=action==='attack'?NATIVE_DUEL_DURATION:action==='cast'?.64:.38;
 return round(clamp(duration/target,.55,2.6));
}

/**
 * Designed for real visible adjacent hero/enemy sword exchanges. The compact
 * bone choreography is small enough to add over authentic imported clips,
 * but unlike an isolated sword twitch transfers weight across lead/back
 * thighs, ankles, pelvis, torso, both shoulders, forearms, wrist and gaze.
 *
 * A detached/dying/out-of-range/stale/invalid opponent cannot stage this.
 * Reduced-motion mode keeps the unchanged imported skin and static cues.
 */
export function planNativeDuelPose(kind,action,age=0,{targetId=null,distance=null,
 alive=true,reducedMotion=false,sourceBlend=1}={}){
 const p=role[kind];
 if(!p||action!=='attack'||!alive||reducedMotion||
  typeof targetId!=='string'||!targetId.trim()||targetId.length>96||
  distance!==1||!Number.isFinite(age)||age<0||age>=NATIVE_DUEL_DURATION||
  !Number.isFinite(sourceBlend)||sourceBlend<0||sourceBlend>1)return rest;
 // Actual THREE.AnimationAction post-mixer fade weight owns every additive
 // bone in the same connected strike. Do not jump hips/soles/wrist ahead
 // while the genuine source one-shot is still crossfading from locomotion.
 // Easing the *real imported* AnimationAction's current weight keeps the
 // authenticated partial-fade sword performance readable as one connected
 // pelvis -> spine -> shoulder -> hand/weapon -> supported-feet chain.
 // The original linear 0.60 fade left its witnessed active torso at just
 // 0.0922rad in source WebGL (Actions #43348792350). A smooth sublinear
 // support envelope reaches precisely zero with the source clip, precisely
 // one at full ownership, and never exceeds full-strength original joints.
 // Contact weight/strength below remain gated by the unmodified sourceBlend:
 // this cannot manufacture a hit, swing, target, movement tick or damage.
 const physicalBlend=sourceBlend*(2-sourceBlend);
 const w=p.power*physicalBlend,s=p.side,foot=p.plant*physicalBlend,t=age;
 const wind=t<p.wind?ease(t/p.wind):t<NATIVE_CONTACT_TIME?
  1-ease((t-p.wind)/(NATIVE_CONTACT_TIME-p.wind)):0;
 const release=t<.105?0:t<NATIVE_CONTACT_TIME?
  ease((t-.105)/(NATIVE_CONTACT_TIME-.105)):
  t<.345?1-.23*ease((t-NATIVE_CONTACT_TIME)/(.345-NATIVE_CONTACT_TIME)):
  .77*(1-ease((t-.345)/(NATIVE_DUEL_DURATION-.345)));
 const settle=t<=NATIVE_CONTACT_TIME?0:t<.355?
  ease((t-NATIVE_CONTACT_TIME)/(.355-NATIVE_CONTACT_TIME)):
  1-ease((t-.355)/(NATIVE_DUEL_DURATION-.355));
 // One source-skinned planted stance spans the real attack clip. The back
 // thigh loads in anticipation; lead knee and ankle visibly absorb contact
 // while the source-hand blade follows through at the same 215 ms landmark.
 // Joint angles stay bounded and never alter reach, targets or hitboxes.
 // ONE attached native rig now makes a visible, grounded step *within* its
 // original authoritative tile. Existing actor yaw turns local -Z toward the
 // actual adjacent living opponent; the blade, wrists, pelvis and boots travel
 // together in that local frame. This is not a movement tick or a damage cue.
 // A rear-foot load gives way to a 16–23cm sword drive at the existing 215ms
 // contact landmark, then an elastic heel recovery returns the exact same
 // imported skeleton almost to its rest placement before the next action.
 // No root displacement exists for stale, distant, dead or reduced-motion duels.
 const drive=release*(1-.85*settle);
 const heelRecovery=.04*settle;
 const leadUpper=foot*(-.088*wind+.172*release);
 const rearUpper=foot*(.129*wind-.126*release);
 const lead={upper:round(leadUpper),lower:round(foot*(.093*wind+.177*release)),foot:round(foot*(-.078*wind-.121*release))};
 const rear={upper:round(rearUpper),lower:round(foot*(.054*wind+.080*release)),foot:round(foot*(-.076*wind+.109*release))};
 const legs=s>0?{left:lead,right:rear}:{left:rear,right:lead};
 return {
  mode:p.style,phase:t<NATIVE_CONTACT_TIME?'windup':t<.355?'impact':'recovery',
  contactWeight:round(sourceBlend*release*(1-.32*settle)),
  strength:round(sourceBlend*clamp(.55*wind+.8*release)),
  head:{pitch:round(w*(-.047*wind+.030*release)),yaw:round(s*w*(.060*wind-.07*release)),roll:round(-s*w*.022*settle)},
  hips:{pitch:round(w*(.069*wind-.082*release)),yaw:round(s*w*(-.091*wind+.117*release)),roll:round(s*w*(.032*wind-.038*release))},
  spine:{pitch:round(w*(.067*wind-.117*release)),yaw:round(s*w*(-.107*wind+.155*release)),roll:round(s*w*(.056*wind-.060*release))},
  wrist:{pitch:round(w*(-.082*wind+.153*release)),yaw:round(s*w*(.061*wind-.08*release)),roll:round(s*w*(-.068*wind+.102*release))},
  arms:{
   left:{pitch:round(w*(-.074*wind+.068*release)),roll:round(s*w*(.057*wind-.029*release))},
   right:{pitch:round(w*(.131*wind-.148*release)),roll:round(s*w*(-.070*wind+.092*release))}
  },
  forearms:{left:round(w*(.046*wind-.035*release)),right:round(w*(.096*wind-.113*release))},
  legs,
  root:{x:round(physicalBlend*s*(.018*wind+.014*drive)),
   y:round(physicalBlend*(-.042*p.plant*wind-.026*release+.012*settle)),
   z:round(physicalBlend*(.023*wind-.20*p.plant*drive+heelRecovery))}
 };
}
