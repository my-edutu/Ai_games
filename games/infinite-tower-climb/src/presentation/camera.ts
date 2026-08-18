import type{TowerRenderSnapshot}from'./snapshot';
export interface TowerCameraFrame{centerX:number;centerY:number;zoom:number;impulse:number;lookAheadY:number}
export class TowerCameraDirector{
  private lastRun='';private centerY=0;
  frame(snapshot:Readonly<TowerRenderSnapshot>,viewport:{width:number;height:number},options:{reducedMotion?:boolean}={}):TowerCameraFrame{
    const minY=snapshot.chunkBaseY+viewport.height*120,maxY=snapshot.chunkBaseY+snapshot.chunkHeight-viewport.height*120;
    const target=Math.max(minY,Math.min(maxY,snapshot.player.y+Math.max(0,snapshot.player.vy)*3));
    if(snapshot.runToken!==this.lastRun){this.lastRun=snapshot.runToken;this.centerY=target}else this.centerY=Math.round(this.centerY+(target-this.centerY)*(options.reducedMotion?.12:.24));
    const danger=snapshot.dangerPermille>=800&&!options.reducedMotion?Math.min(1,(snapshot.dangerPermille-700)/300):0;
    const speed=Math.abs(snapshot.player.vy)+Math.abs(snapshot.player.vx),zoom=Math.max(.82,Math.min(1.08,1.03-speed/120000));
    return{centerX:Math.round(snapshot.worldWidth/2),centerY:this.centerY,zoom:options.reducedMotion?1:zoom,impulse:danger,lookAheadY:target-snapshot.player.y};
  }
}
