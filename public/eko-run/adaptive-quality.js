// Eko Run: cosmetic adaptive resolution, hysteresis and conservative frame pacing.
// Never affects simulation tick, hazard timing, player hitbox, or warnings.
export function createAdaptiveQualityGovernor({
  initialRatio=1.25,floorRatio=.65,ceilingRatio=1.6,lowFps=24,highFps=47,
  reduceAfter=2,recoverAfter=7,step=.14,normalCooldownMs=2800
}={}){
  let ratio=Math.min(ceilingRatio,Math.max(floorRatio,initialRatio));
  let low=0,high=0,lastChange=-Infinity,changes=0,mode='balanced';
  function observe(fps,now=0){
    if(!Number.isFinite(fps)||!Number.isFinite(now)||fps<=0){
      return {changed:false,ratio,mode};
    }
    if(fps<lowFps){low++;high=0;}
    else if(fps>highFps){high++;low=0;}
    else {low=0;high=0;}
    if(now-lastChange<normalCooldownMs){
      return {changed:false,ratio,mode};
    }
    const previous=ratio;
    if(low>=reduceAfter){
      ratio=Math.max(floorRatio,Number((ratio-step).toFixed(3)));
      low=0;mode='performance';
    }else if(high>=recoverAfter){
      ratio=Math.min(ceilingRatio,Number((ratio+step*.5).toFixed(3)));
      high=0;mode='quality';
    }
    if(previous!==ratio){lastChange=now;changes++;return {changed:true,ratio,mode};}
    return {changed:false,ratio,mode};
  }
  return Object.freeze({
    observe,get ratio(){return ratio;},
    get mode(){return mode;},
    metrics(){return Object.freeze({pixelRatioTarget:ratio,mode,changes,lowStreak:low,highStreak:high})}
  });
}
