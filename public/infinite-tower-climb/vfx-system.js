'use strict';
(()=>{
const MAX_PARTICLES=96;
const EFFECTS=Object.freeze(['dust','sparks','smoke','steam','debris','shield','electricity','fire','checkpoint','guardian']);
const hash=n=>{let x=(n|0)+0x6d2b79f5;x=Math.imul(x^(x>>>15),x|1);x^=x+Math.imul(x^(x>>>7),x|61);return((x^(x>>>14))>>>0)/4294967296};
class TowerVfxSystem{
  constructor(){this.pool=Array.from({length:MAX_PARTICLES},()=>({active:false,type:'dust',x:0,y:0,vx:0,vy:0,life:0,maxLife:1,size:1,spin:0,alpha:1}));this.cursor=0;this.serial=1;this.previous=null;}
  emit(type,x,y,count=5,intensity=1,seed=0){if(!EFFECTS.includes(type))return;const n=Math.min(18,Math.max(1,count|0));for(let i=0;i<n;i++){const p=this.pool[this.cursor++%MAX_PARTICLES],r=hash(seed+this.serial*17+i*101),a=hash(seed+this.serial*31+i*53)*Math.PI*2,speed=(9000+r*26000)*intensity;p.active=true;p.type=type;p.x=x;p.y=y;p.vx=Math.cos(a)*speed;p.vy=Math.sin(a)*speed+9000*intensity;p.maxLife=p.life=.28+hash(seed+i*79+this.serial)*.75;p.size=2+hash(seed+i*113)*5*intensity;p.spin=(r-.5)*5;p.alpha=1;}this.serial++;}
  ingest(snapshot){const prev=this.previous;if(prev){const p=snapshot.player,q=prev.player;if(p.health<q.health)this.emit('debris',p.x,p.y,10,1.1,snapshot.tick);if(p.shieldCharges>q.shieldCharges)this.emit('shield',p.x,p.y,12,1,snapshot.tick);if(snapshot.floor>prev.floor)this.emit('checkpoint',p.x,p.y,18,1.25,snapshot.floor);if(p.state==='standing'&&q.state==='airborne')this.emit(q.vy<-33000?'debris':'dust',p.x,p.y-p.halfHeight,9,q.vy<-33000?1.35:.75,snapshot.tick);if(snapshot.enemies.some(e=>e.kind==='guardian'&&e.active)&&!prev.enemies.some(e=>e.kind==='guardian'&&e.active))this.emit('guardian',p.x,p.y+42000,18,1.4,snapshot.floor);if(snapshot.projectiles.length>prev.projectiles.length)this.emit('sparks',p.x+p.facing*p.halfWidth,p.y,4,.5,snapshot.tick);}
    const theme=snapshot.theme;if(snapshot.tick%18===0){if(theme==='foundry')this.emit('fire',snapshot.worldWidth*(.2+(snapshot.tick%37)/60),snapshot.player.y-60000,2,.45,snapshot.tick);if(theme==='storm')this.emit('electricity',snapshot.worldWidth*(.15+(snapshot.tick%43)/58),snapshot.player.y+80000,2,.5,snapshot.tick);if(theme==='clockwork')this.emit('steam',snapshot.worldWidth*(.18+(snapshot.tick%29)/48),snapshot.player.y+30000,2,.45,snapshot.tick);if(theme==='ruins')this.emit('dust',snapshot.worldWidth*(.2+(snapshot.tick%31)/52),snapshot.player.y+90000,1,.3,snapshot.tick);if(theme==='void')this.emit('smoke',snapshot.worldWidth*(.15+(snapshot.tick%47)/60),snapshot.player.y+50000,2,.35,snapshot.tick);}
    this.previous=snapshot;
  }
  update(dt){const step=Math.min(.05,Math.max(0,dt));for(const p of this.pool){if(!p.active)continue;p.life-=step;if(p.life<=0){p.active=false;continue}const gravity=(p.type==='dust'||p.type==='debris')?-26000:(p.type==='fire'||p.type==='steam'||p.type==='smoke')?11000:-2000;p.vy+=gravity*step;p.x+=p.vx*step;p.y+=p.vy*step;p.vx*=.982;p.alpha=Math.max(0,p.life/p.maxLife);}}
  active(){return this.pool.filter(p=>p.active)}
}
window.TowerVfx=Object.freeze({MAX_PARTICLES,EFFECTS,TowerVfxSystem});
})();
