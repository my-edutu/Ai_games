export interface TowerRect{x:number;y:number;width:number;height:number}
export interface TowerLayout{viewport:TowerRect;stage:TowerRect;topBar:TowerRect;sidePanel:TowerRect;captionZone:TowerRect;mobile:boolean;cleanFeed:boolean}

/**
 * Broadcast-first layout: the gameplay stage always owns the full viewport.
 * HUD regions are safe-zone overlays and never reserve world pixels.
 */
export function computeTowerLayout(width:number,height:number,options:{cleanFeed?:boolean}={}):TowerLayout{
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<320||height<180)throw new RangeError('viewport');
  const mobile=width<1000||height<560,cleanFeed=!!options.cleanFeed;
  const viewport={x:0,y:0,width,height};
  if(cleanFeed)return{viewport,stage:{...viewport},topBar:{x:0,y:0,width:0,height:0},sidePanel:{x:0,y:0,width:0,height:0},captionZone:{x:0,y:0,width:0,height:0},mobile,cleanFeed};
  const inset=mobile?10:20,topHeight=mobile?46:60,captionHeight=mobile?38:48;
  return{
    viewport,
    stage:{...viewport},
    topBar:{x:inset,y:inset,width:Math.min(width-inset*2,mobile?width-inset*2:920),height:topHeight},
    sidePanel:{x:0,y:0,width:0,height:0},
    captionZone:{x:inset,y:height-captionHeight-inset,width:Math.min(width-inset*2,mobile?width-inset*2:880),height:captionHeight},
    mobile,cleanFeed
  };
}
