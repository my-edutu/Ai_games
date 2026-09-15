import type{TowerRenderSnapshot}from'./snapshot';

export type TowerCameraMode='ascent'|'danger'|'guardian'|'fall'|'recovery'|'milestone'|'result';
export interface TowerCameraFrame{
  centerX:number;centerY:number;zoom:number;impulse:number;lookAheadY:number;
  mode:TowerCameraMode;focusX:number;focusY:number;shakeX:number;shakeY:number;
}
const MILESTONES=new Set([10,25,50,100,250,500,1000]);
const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value));

/** Presentation-only spectator camera. It derives framing from public truth and never mutates authority. */
export class TowerCameraDirector{
  private lastRun='';private centerX=0;private centerY=0;private zoom=1;
  frame(snapshot:Readonly<TowerRenderSnapshot>,viewport:{width:number;height:number},options:{reducedMotion?:boolean}={}):TowerCameraFrame{
    const reduced=!!options.reducedMotion;
    const guardian=snapshot.enemies.find(e=>e.kind==='guardian'&&e.active);
    const milestone=MILESTONES.has(snapshot.floor)&&snapshot.progress.floorProgressPermille<160;
    let mode:TowerCameraMode='ascent';
    if(snapshot.lifecycle!=='running'||snapshot.result)mode='result';
    else if(guardian)mode='guardian';
    else if(milestone)mode='milestone';
    else if(snapshot.player.vy<-9000)mode='fall';
    else if(snapshot.intent.fallback)mode='recovery';
    else if(snapshot.dangerPermille>=800)mode='danger';

    let focusX=snapshot.player.x+snapshot.player.vx*(mode==='danger'?2:3);
    let focusY=snapshot.player.y+Math.max(-50000,Math.min(70000,snapshot.player.vy*3));
    if(mode==='fall')focusY=snapshot.player.y+Math.max(-80000,snapshot.player.vy*4);
    if(guardian){focusX=(snapshot.player.x+guardian.x)/2;focusY=(snapshot.player.y+guardian.y)/2+14000;}
    if(mode==='milestone')focusY=snapshot.chunkBaseY+snapshot.chunkHeight*.72;
    if(mode==='result')focusY=snapshot.player.y+18000;
    if(mode==='danger'&&!guardian){
      const threats=[...snapshot.enemies.filter(e=>e.active),...snapshot.hazards.filter(h=>h.active)];
      const nearest=threats.sort((a,b)=>Math.abs(a.x-snapshot.player.x)+Math.abs(a.y-snapshot.player.y)-Math.abs(b.x-snapshot.player.x)-Math.abs(b.y-snapshot.player.y))[0];
      if(nearest){focusX=(snapshot.player.x+nearest.x)/2;focusY=(snapshot.player.y+nearest.y)/2+12000;}
    }

    const horizontalMargin=Math.min(snapshot.worldWidth*.24,Math.max(22000,viewport.width*55));
    focusX=clamp(focusX,horizontalMargin,snapshot.worldWidth-horizontalMargin);
    const verticalMargin=Math.min(snapshot.chunkHeight*.28,Math.max(26000,viewport.height*80));
    const minY=snapshot.chunkBaseY+verticalMargin,maxY=snapshot.chunkBaseY+snapshot.chunkHeight-verticalMargin;
    focusY=clamp(focusY,Math.min(minY,maxY),Math.max(minY,maxY));

    const speed=Math.abs(snapshot.player.vy)+Math.abs(snapshot.player.vx);
    const modeZoom:Record<TowerCameraMode,number>={ascent:clamp(.96+speed/260000,.96,1.08),danger:1.07,guardian:1.13,fall:1.12,recovery:1.04,milestone:1.16,result:1.08};
    const targetZoom=reduced?1:modeZoom[mode];
    if(snapshot.runToken!==this.lastRun){this.lastRun=snapshot.runToken;this.centerX=focusX;this.centerY=focusY;this.zoom=targetZoom;}
    else{
      const follow=reduced?.11:mode==='danger'||mode==='guardian'?.3:.2;
      this.centerX+= (focusX-this.centerX)*follow;
      this.centerY+= (focusY-this.centerY)*follow;
      this.zoom+= (targetZoom-this.zoom)*(reduced?.12:.18);
    }
    const dangerImpulse=reduced?0:mode==='guardian'?.8:mode==='danger'?clamp((snapshot.dangerPermille-650)/350,0,1):mode==='fall'?.35:0;
    const phase=snapshot.tick*.73;
    const shakeX=reduced?0:Math.sin(phase)*dangerImpulse*3.2;
    const shakeY=reduced?0:Math.cos(phase*1.37)*dangerImpulse*2.1;
    return{
      centerX:Math.round(this.centerX),centerY:Math.round(this.centerY),zoom:reduced?1:Number(this.zoom.toFixed(4)),
      impulse:dangerImpulse,lookAheadY:Math.round(focusY-snapshot.player.y),mode,focusX:Math.round(focusX),focusY:Math.round(focusY),shakeX,shakeY
    };
  }
}
