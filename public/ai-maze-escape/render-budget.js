// Performance manager for a genuine unattended 24/7 WebGL stream.
// It adapts pixel ratio only after sustained evidence, never on a single slow frame.
export function createRenderBudget({mode='adaptive',dpr=1.5,compact=false}={}){
  const profiles={
    cinematic:{min:1.1,max:Math.min(2,dpr),shadow:1024},
    balanced:{min:.85,max:Math.min(1.5,dpr),shadow:768},
    performance:{min:.7,max:Math.min(1,dpr),shadow:512},
    adaptive:{min:.68,max:Math.min(compact?1:1.25,dpr),shadow:512}
  };
  const name=profiles[mode]?mode:'adaptive';
  const profile=profiles[name];
  const clamp=v=>Math.min(profile.max,Math.max(profile.min,v));
  let ratio=clamp(profile.max),lowStreak=0,highStreak=0,lastAdjustment=0;
  const locked=name!=='adaptive';
  function sample(fps,now=0){
    if(!Number.isFinite(fps)||fps<=0)return {ratio,changed:false,mode:name};
    if(locked)return {ratio,changed:false,mode:name};
    lowStreak=fps<32?lowStreak+1:0;
    highStreak=fps>54?highStreak+1:0;
    if(now-lastAdjustment<3500)return {ratio,changed:false,mode:name};
    const low=lowStreak>=4,high=highStreak>=10;
    if(!low&&!high)return {ratio,changed:false,mode:name};
    const before=ratio;
    ratio=clamp(Math.round((ratio+(low?-.20:.06))*100)/100);
    lowStreak=0;highStreak=0;
    if(ratio!==before)lastAdjustment=now;
    return {ratio,changed:ratio!==before,mode:name};
  }
  return {
    sample,
    get ratio(){return ratio},
    get mode(){return name},
    get shadowResolution(){return profile.shadow},
    get bounds(){return {min:profile.min,max:profile.max}}
  };
}
