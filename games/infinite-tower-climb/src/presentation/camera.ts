import type{TowerRenderSnapshot}from'./snapshot';
export interface TowerCameraFrame{centerX:number;centerY:number;zoom:number;impulse:number;lookAheadY:number}
export class TowerCameraDirector{
  private lastRun='';private centerY=0;private centerX=0;private zoom=1;
  frame(snapshot:Readonly<TowerRenderSnapshot>,viewport:{width:number;height:number},options:{reducedMotion?:boolean}={}):TowerCameraFrame{
    const reduced=!!options.reducedMotion,minY=snapshot.chunkBaseY+viewport.height*120,maxY=snapshot.chunkBaseY+snapshot.chunkHeight-viewport.height*120;
    const speedY=Math.max(-22000,Math.min(22000,snapshot.player.vy)),verticalLead=speedY>0?speedY*3.4:speedY*1.5;
    const guardian=snapshot.enemies.find(e=>e.active&&e.kind==='guardian');
    const hazard=snapshot.hazards.filter(h=>h.active&&h.y>=snapshot.player.y-18000).sort((a,b)=>Math.abs(a.y-snapshot.player.y)-Math.abs(b.y-snapshot.player.y))[0];
    let targetY=snapshot.player.y+verticalLead;
    let targetX=snapshot.player.x+snapshot.player.vx*1.8;
    if(guardian&&Math.abs(guardian.y-snapshot.player.y)<115000){targetY=(snapshot.player.y+guardian.y)/2;targetX=(snapshot.player.x+guardian.x)/2}
    else if(snapshot.dangerPermille>=800&&hazard){targetY=(snapshot.player.y+hazard.y)/2;targetX=(snapshot.player.x+hazard.x+hazard.width/2)/2}
    targetY=Math.max(minY,Math.min(maxY,targetY));targetX=Math.max(snapshot.worldWidth*.18,Math.min(snapshot.worldWidth*.82,targetX));
    const danger=snapshot.dangerPermille>=800&&!reduced?Math.min(1,(snapshot.dangerPermille-700)/300):0;
    const speed=Math.abs(snapshot.player.vy)+Math.abs(snapshot.player.vx),targetZoom=guardian?.active?.valueOf()?0.86:Math.max(.8,Math.min(1.06,1.02-speed/135000));
    if(snapshot.runToken!==this.lastRun){this.lastRun=snapshot.runToken;this.centerY=targetY;this.centerX=targetX;this.zoom=reduced?1:targetZoom}else{
      const follow=reduced?.14:.2;this.centerY=Math.round(this.centerY+(targetY-this.centerY)*follow);this.centerX=Math.round(this.centerX+(targetX-this.centerX)*follow);this.zoom=reduced?1:this.zoom+(targetZoom-this.zoom)*.12
    }
    return{centerX:reduced?Math.round(snapshot.worldWidth/2):this.centerX,centerY:this.centerY,zoom:reduced?1:Math.max(.78,Math.min(1.08,this.zoom)),impulse:danger,lookAheadY:targetY-snapshot.player.y};
  }
}
