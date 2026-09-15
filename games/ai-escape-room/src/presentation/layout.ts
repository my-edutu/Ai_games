export interface EscapeRect{x:number;y:number;width:number;height:number;}
export interface EscapeViewport{width:number;height:number;}
export interface EscapeLayoutMode{cleanFeed:boolean;phoneLandscape:boolean;}
export interface EscapeLayout{header:EscapeRect;stage:EscapeRect;sidebar:EscapeRect;caption:EscapeRect;safe:EscapeRect;}
function rect(x:number,y:number,width:number,height:number):EscapeRect{return{x,y,width:Math.max(0,width),height:Math.max(0,height)};}
export function computeEscapeLayout(viewport:EscapeViewport,mode:EscapeLayoutMode):EscapeLayout{
  if(!Number.isFinite(viewport.width)||!Number.isFinite(viewport.height)||viewport.width<320||viewport.height<180)throw new RangeError('viewport');
  const width=viewport.width,height=viewport.height;
  if(mode.cleanFeed){const margin=Math.max(8,Math.round(Math.min(width,height)*0.022));const captionHeight=Math.max(40,Math.round(height*0.08));return{header:rect(margin,margin,width-margin*2,Math.max(40,Math.round(height*0.075))),stage:rect(margin,margin,width-margin*2,height-margin*2),sidebar:rect(width-margin,margin,0,0),caption:rect(margin,height-margin-captionHeight,width-margin*2,captionHeight),safe:rect(margin,margin,width-margin*2,height-margin*2)};}
  const phone=mode.phoneLandscape||height/width<0.55;const margin=phone?8:24;const gap=phone?8:18;const headerHeight=phone?44:82;const captionHeight=phone?38:64;const contentY=margin+headerHeight+gap;const contentHeight=height-contentY-captionHeight-gap-margin;
  const sidebarWidth=phone?Math.max(190,Math.round(width*0.25)):Math.max(330,Math.round(width*0.245));const stageWidth=width-margin*2-gap-sidebarWidth;
  return{header:rect(margin,margin,width-margin*2,headerHeight),stage:rect(margin,contentY,stageWidth,contentHeight),sidebar:rect(margin+stageWidth+gap,contentY,sidebarWidth,contentHeight),caption:rect(margin,height-margin-captionHeight,width-margin*2,captionHeight),safe:rect(margin,margin,width-margin*2,height-margin*2)};
}
