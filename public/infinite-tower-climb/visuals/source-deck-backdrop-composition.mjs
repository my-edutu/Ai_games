// Screen composition of the actual two closest successor gameplay decks.
// The source's x/y/width/height drives the SAME annular sector mesh geometry
// in World. No prediction, authored proxy, collider, alpha or route change.
const i=Number.isSafeInteger,f=Number.isFinite;
export function genuineRaisedDeckCorners(s,h,arc,scale){
  if(s?.floor!==9||s.theme!=='void'||s.lifecycle!=='running'||
     !i(s.tick)||!i(s.worldWidth)||s.worldWidth<=0||
     !i(s.chunkBaseY)||!i(s.player?.x)||!(s.player?.health>0)||
     !Array.isArray(s.platforms)||h?.floor!==9||h.guardianGateRetained!==true||
     h.oldCapId!=='f8:cap'||s.runToken!==h.runToken||
     !i(h.sourceTick)||s.tick<h.sourceTick||!i(h.oldRoofY)||
     !(h.originalGatewayOpacity>.035&&h.originalGatewayOpacity<=1)||
     !f(arc)||arc<=0||!f(scale)||scale<=0)return null;
  const g=s.platforms.find(p=>p?.id==='f9:ground');
  if(!g||![g.y,g.height,g.width].every(i)||g.width<=0||
     g.y+g.height!==h.oldRoofY)return null;
  return s.platforms.filter(p=>p?.id?.startsWith('f9:')&&p.id!==g.id&&
      [p.x,p.y,p.width,p.height].every(i)&&p.width>0&&p.height>0&&
      p.x>=0&&p.x+p.width<=s.worldWidth&&
      p.y+p.height>h.oldRoofY+12000&&p.y+p.height<h.oldRoofY+280000)
    .sort((a,b)=>Math.abs(a.x+a.width/2-s.player.x)-Math.abs(b.x+b.width/2-s.player.x))
    .slice(0,2).map(p=>{
      const center=(p.x+p.width/2)/s.worldWidth*arc-arc/2;
      const half=p.width/s.worldWidth*arc/2;
      const top=(p.y+p.height-s.chunkBaseY)/scale;
      const points=[];
      for(const angle of [center-half,center,center+half])
        for(const r of [22.4,27.18])
          for(const y of [top-.16,top-1.66])
            points.push({x:Math.sin(angle)*r,y,z:Math.cos(angle)*r});
      return {id:p.id,points};
    });
}
export function projectedRaisedDeckDominance(decks,project){
  if(!Array.isArray(decks)||typeof project!=='function')return null;
  let coverage=0,owner=null,examined=0;
  for(const deck of decks){
    if(deck?.points?.length!==12)continue;
    let l=Infinity,r=-Infinity,b=Infinity,t=-Infinity,n=0;
    for(const p of deck.points){
      const q=project(p);
      if(!q||![q.x,q.y,q.z].every(f)||q.z<-1||q.z>1)continue;
      n++;l=Math.min(l,q.x);r=Math.max(r,q.x);
      b=Math.min(b,q.y);t=Math.max(t,q.y);
    }
    if(n<4)continue;
    examined++;
    const area=Math.max(0,Math.min(1,r)-Math.max(-1,l))*
      Math.max(0,Math.min(1,t)-Math.max(-1,b))*.25;
    if(area>coverage){coverage=area;owner=deck.id;}
  }
  return {active:true,coverage,owner,examined,
    limitation:'Current real annular-deck projected screen envelope, not native pixels or a physics/route decision'};
}
