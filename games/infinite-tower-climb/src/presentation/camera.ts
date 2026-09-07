import type{TowerRenderSnapshot}from'./snapshot';
export interface TowerCameraFrame{centerX:number;centerY:number;zoom:number;impulse:number;lookAheadY:number}
function clamp(value:number,min:number,max:number){return Math.max(min,Math.min(max,value))}
export class TowerCameraDirector{
  private lastRun='';private centerY=0;
  frame(snapshot:Readonly<TowerRenderSnapshot>,viewport:{width:number;height:number},options:{reducedMotion?:boolean}={}):TowerCameraFrame{
    const targetPlatform=snapshot.intent.targetPlatformId?snapshot.platforms.find(platform=>platform.id===snapshot.intent.targetPlatformId):undefined;
    const routeDelta=targetPlatform?targetPlatform.y+targetPlatform.height-snapshot.player.y:0;
    const routeLead=targetPlatform&&routeDelta>0?clamp(Math.round(routeDelta*.55),0,150000):0;
    const velocityLead=clamp(Math.round(snapshot.player.vy*1.5),-180000,120000);
    const lookAhead=targetPlatform&&routeLead>0?Math.max(routeLead,velocityLead):velocityLead;
    const minY=snapshot.chunkBaseY+viewport.height*120,maxY=snapshot.chunkBaseY+snapshot.chunkHeight-viewport.height*120;
    const target=clamp(snapshot.player.y+lookAhead,minY,maxY);
    if(snapshot.runToken!==this.lastRun){this.lastRun=snapshot.runToken;this.centerY=target}else this.centerY=Math.round(this.centerY+(target-this.centerY)*(options.reducedMotion?.12:.24));
    const danger=snapshot.dangerPermille>=800&&!options.reducedMotion?Math.min(1,(snapshot.dangerPermille-700)/300):0;
    const speed=Math.abs(snapshot.player.vy)+Math.abs(snapshot.player.vx),zoom=Math.max(.82,Math.min(1.08,1.03-speed/120000));
    return{centerX:Math.round(snapshot.worldWidth/2),centerY:this.centerY,zoom:options.reducedMotion?1:zoom,impulse:danger,lookAheadY:target-snapshot.player.y};
  }
}
