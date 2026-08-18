export interface TowerRect{x:number;y:number;width:number;height:number}
export interface TowerLayout{viewport:TowerRect;stage:TowerRect;topBar:TowerRect;sidePanel:TowerRect;captionZone:TowerRect;mobile:boolean;cleanFeed:boolean}
export function computeTowerLayout(width:number,height:number,options:{cleanFeed?:boolean}={}):TowerLayout{
  if(!Number.isFinite(width)||!Number.isFinite(height)||width<320||height<180)throw new RangeError('viewport');
  const mobile=width<1000||height<560,cleanFeed=!!options.cleanFeed,pad=mobile?8:18;
  if(cleanFeed)return{viewport:{x:0,y:0,width,height},stage:{x:0,y:0,width,height},topBar:{x:0,y:0,width:0,height:0},sidePanel:{x:0,y:0,width:0,height:0},captionZone:{x:pad,y:height-(mobile?46:64),width:width-pad*2,height:mobile?38:48},mobile,cleanFeed};
  const top=mobile?54:74,side=mobile?0:Math.max(280,Math.min(370,width*.22)),captions=mobile?44:58;
  return{viewport:{x:0,y:0,width,height},stage:{x:pad,y:top+pad,width:width-side-pad*(side?3:2),height:height-top-captions-pad*3},topBar:{x:pad,y:pad,width:width-pad*2,height:top},sidePanel:{x:width-side-pad,y:top+pad,width:side,height:height-top-captions-pad*3},captionZone:{x:pad,y:height-captions-pad,width:width-pad*2,height:captions},mobile,cleanFeed};
}
