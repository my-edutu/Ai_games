// P0 source-authentic F8->9 footprint bridge: same REAL f9:ground, not a
// second bridge, render-only player, forecast platform or altered collision.
// Separate only the TRUE roof's two distant wings from its retained F8 cap.
const i=Number.isSafeInteger,f=Number.isFinite;
const clamp=x=>Math.min(1,Math.max(0,x));
export function sourceRealGroundForecourtSections(p,width,exit,old,arc=2.2){
 if(p?.id!=='f9:ground'||old?.id!=='f8:cap'||
    ![p.x,p.width,width,exit,old.x,old.width].every(i)||
    p.x!==0||p.width!==width||width<120000||old.x<=0||
    old.width<=0||old.x+old.width>=width||
    exit!==old.x+Math.floor(old.width*.76)||
    width-exit<65000||!f(arc)||arc<=0||arc>Math.PI)return null;
 const rise=Math.min(48000,Math.floor((width-exit)*.45));
 const cuts=[0,old.x,exit,exit+rise,old.x+old.width,width]
   .sort((a,b)=>a-b).filter((v,j,a)=>j===0||v>a[j-1]);
 const sections=[];
 for(let n=1;n<cuts.length;n++){
   const startX=cuts[n-1],endX=cuts[n],mid=(startX+endX)/2;
   sections.push({startX,endX,
     kind:mid<exit?'approach':mid<exit+rise?'threshold':'successor',
     wing:endX<=old.x?'before':startX>=old.x+old.width?'after':null,
     sourceBound:true,angle:(endX-startX)/width*arc,
     offset:(mid-width/2)/width*arc});
 }
 return sections.length>=4?sections:null;
}
// The presently WALKABLE source region and the next 35,000 source units
// are never muted. Only truly distant roof scenery waits for actual returned
// frames. A stale, dead, restarted or retired original gateway reveals all.
export function sourceRealRoofWingExposure(s,h,side){
 if(side!=='before'&&side!=='after')return 1;
 const p=s?.player;
 if(s?.floor!==9||s.theme!=='void'||s.lifecycle!=='running'||
    !(p?.health>0)||h?.floor!==9||h.oldCapId!=='f8:cap'||
    h.guardianGateRetained!==true||h.runToken!==s.runToken||
    !(h.originalGatewayOpacity>.035)||
    ![p.x,p.halfWidth,h.oldCapX,h.oldCapWidth,h.submittedFrames].every(i)||
    !f(h.visibleSeconds)||h.visibleSeconds<0||
    p.halfWidth<=0||h.oldCapWidth<=0)return 1;
 const edge=side==='before'?h.oldCapX:h.oldCapX+h.oldCapWidth;
 const distance=side==='before'?
    p.x-p.halfWidth-edge:edge-p.x-p.halfWidth;
 if(distance<=35000)return 1;
 const t=Math.min(clamp((h.submittedFrames-2)/12),
   clamp((h.visibleSeconds-.18)/1.05));
 return .16+.84*(t*t*(3-2*t));
}
export function syncSourceRealRoofWingMaterials(palette,snapshot,held){
 const rows=palette?.roofJoin?.wingMaterials;
 if(!Array.isArray(rows))return false;
 for(const {material,parent,wing} of rows){
   if(!material||!parent)continue;
   if(material.color&&parent.color)material.color.copy(parent.color);
   if(material.emissive&&parent.emissive)material.emissive.copy(parent.emissive);
   const alpha=sourceRealRoofWingExposure(snapshot,held,wing);
   const opaque=alpha>=.999;
   if(material.transparent===opaque||material.depthWrite!==opaque){
     material.transparent=!opaque;
     material.depthWrite=opaque;
     material.needsUpdate=true;
   }
   material.opacity=alpha;
 }
 return true;
}
