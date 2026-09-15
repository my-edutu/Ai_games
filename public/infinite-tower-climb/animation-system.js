'use strict';
(()=>{
const STATES=Object.freeze(['idle','run','sprint','jump-anticipation','jump','fall','land','hard-land','climb','ledge-grab','pull-up','dash','dodge','attack','hit','shield','death','victory','exhausted','recovery']);
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
class TowerAnimationSystem{
  constructor(){this.state='idle';this.previous='idle';this.changedAt=0;this.last=null;this.lastFloor=-1;this.lastVy=0;this.lastProjectiles=0;this.lastShield=0;}
  resolve(snapshot){const p=snapshot.player,prev=this.last;
    if(p.state==='dead'||snapshot.lifecycle!=='running')return snapshot.result?.reason?'death':'victory';
    if(prev&&snapshot.floor>this.lastFloor)return'victory';
    if(p.state==='hurt'||(prev&&p.health<prev.player.health))return'hit';
    if(prev&&p.shieldCharges>this.lastShield)return'shield';
    if(snapshot.projectiles.filter(v=>v.owner==='player').length>this.lastProjectiles)return'attack';
    if(snapshot.intent.fallback)return'recovery';
    if(p.state==='dashing')return snapshot.dangerPermille>=800?'dodge':'dash';
    if(p.state==='airborne'){
      const edge=this.nearLedge(snapshot);
      if(edge&&Math.abs(p.vy)<3500)return'ledge-grab';
      if(edge&&p.vy>3500)return'pull-up';
      if(Math.abs(p.vx)<1800&&p.vy>900)return'climb';
      if(prev&&prev.player.state==='standing'&&p.vy>0)return'jump-anticipation';
      return p.vy>=0?'jump':'fall';
    }
    if(prev&&prev.player.state==='airborne')return this.lastVy<-33000?'hard-land':'land';
    if(p.stamina<=Math.max(12,p.maxStamina*.16))return'exhausted';
    const speed=Math.abs(p.vx);if(speed>50000)return'sprint';if(speed>4500)return'run';return'idle';
  }
  nearLedge(snapshot){const p=snapshot.player;return snapshot.platforms.some(v=>Math.abs(v.y-(p.y-p.halfHeight))<12000&&(Math.abs(v.x-p.x)<16000||Math.abs(v.x+v.width-p.x)<16000));}
  update(snapshot,timeMs){const next=this.resolve(snapshot);if(next!==this.state){this.previous=this.state;this.state=next;this.changedAt=timeMs;}this.lastVy=snapshot.player.vy;this.lastFloor=snapshot.floor;this.lastProjectiles=snapshot.projectiles.filter(v=>v.owner==='player').length;this.lastShield=snapshot.player.shieldCharges;this.last=snapshot;return this.sample(snapshot,timeMs);}
  sample(snapshot,timeMs){const p=snapshot.player,state=this.state,t=(snapshot.tick%10000)/20,transition=clamp((timeMs-this.changedAt)/140,0,1),speed=clamp(Math.abs(p.vx)/65000,0,1),motion=(state==='run'||state==='sprint')?Math.sin(t*(state==='sprint'?1.75:1.25))*speed:0;
    let lean=clamp(p.vx/95000,-.28,.28),bob=0,squash=1,arm=motion*.72,leg=motion*.88,crouch=0,reach=0;
    if(state==='idle')bob=Math.sin(t*.35)*.035;
    if(state==='jump-anticipation'){crouch=.24;squash=.86;}
    if(state==='jump'){lean+=p.facing*.08;arm=-.48;leg=.36;}
    if(state==='fall'){arm=.52;leg=-.18;}
    if(state==='land'){crouch=.16;squash=.9;}
    if(state==='hard-land'){crouch=.36;squash=.78;arm=.34;}
    if(state==='climb'||state==='ledge-grab'||state==='pull-up'){reach=.7;arm=-.75;leg=.28;lean=p.facing*.15;}
    if(state==='dash'||state==='dodge'){lean=p.facing*.48;arm=.35;leg=-.5;squash=.88;}
    if(state==='attack'){arm=-1.05;lean=p.facing*.2;}
    if(state==='hit'){lean=-p.facing*.34;arm=.58;squash=.9;}
    if(state==='shield'){arm=-.42;}
    if(state==='death'){lean=p.facing*1.15;crouch=.4;squash=.7;}
    if(state==='victory'){arm=-1.25;bob=.08;}
    if(state==='exhausted'){crouch=.18;bob=Math.sin(t*.18)*.02;arm=.2;}
    if(state==='recovery'){crouch=.12;lean=-p.facing*.08;}
    const blend=.62+.38*transition;
    return{state,previous:this.previous,blend,lean:lean*blend,bob,crouch,squash,reach,head:{x:0,y:-1.28+crouch+bob},torso:{x:0,y:-.66+crouch+bob,rotation:lean},leftArm:{rotation:arm-reach,right:false},rightArm:{rotation:-arm-reach*.7,right:true},leftLeg:{rotation:-leg+.08,right:false},rightLeg:{rotation:leg-.08,right:true},facing:p.facing};
  }
}
window.TowerAnimation=Object.freeze({STATES,TowerAnimationSystem});
})();
