/* Infinite Tower — Wayfinder contact posing.
 * Presentation only. Targets come from real public snapshot ledges;
 * no fabricated holds, gameplay authority, physics or collision changes.
 * No Three.js dependency so analytical IK can be verified independently.
 */
const finite=(x)=>typeof x==='number'&&Number.isFinite(x);
const clamp=(v,min,max)=>Math.max(min,Math.min(max,v));
export const WAYFINDER_ARM={upper:Math.hypot(1.3,9.1),lower:9,shoulderY:8.2,shoulderOffset:8.2};

export function selectVisibleLedge(snapshot,{actorX,actorY,scale,facing=1}={}){
  if(!snapshot||!Array.isArray(snapshot.platforms)||!snapshot.player||!finite(actorX)||!finite(actorY)||!finite(scale)||scale<=0)return null;
  const player=snapshot.player;
  // An actual upward ascent or near-top falling recovery; not perpetual hovering.
  if(player.state!=='airborne'||player.vy< -1000)return null;
  let best=null;
  for(const p of snapshot.platforms){
    if(!p||!finite(p.x)||!finite(p.y)||!finite(p.width)||!finite(p.height)||p.width<=0||p.height<=0)continue;
    const py=(p.y+p.height)/1000;
    const dy=(py-actorY)/scale;
    if(dy<3||dy>28)continue;
    for(const worldX of [p.x/1000,(p.x+p.width)/1000]){
      const localX=(worldX-actorX)/(scale*(facing===-1?-1:1));
      if(Math.abs(localX)>26)continue;
      const sign=localX>=0?1:-1;
      const dx=localX-sign*WAYFINDER_ARM.shoulderOffset;
      const reach=Math.hypot(dx,dy-WAYFINDER_ARM.shoulderY);
      // The renderer cannot pretend to grasp an edge if the articulated hand
      // cannot actually reach it from the shoulder.
      if(reach<2.2||reach>WAYFINDER_ARM.upper+WAYFINDER_ARM.lower-.5)continue;
      const score=reach+Math.abs(localX)*.16+Math.abs(dy-14)*.12;
      if(!best||score<best.score)best={
        platformId:String(p.id),side:sign,localX,localY:dy,
        worldX,worldY:py,score,reach
      };
    }
  }
  return best;
}

export function solveGrip2D({side=1,targetX,targetY,bend=1}={}){
  if(!finite(targetX)||!finite(targetY))return null;
  const sign=side===-1?-1:1;
  const sx=sign*WAYFINDER_ARM.shoulderOffset,sy=WAYFINDER_ARM.shoulderY;
  const dx=targetX-sx,dy=targetY-sy;
  const l1=WAYFINDER_ARM.upper,l2=WAYFINDER_ARM.lower;
  const reach=Math.hypot(dx,dy);
  if(reach<.5||reach>l1+l2-.1)return null;
  const uX=dx/reach,uY=dy/reach;
  const along=(l1*l1-l2*l2+reach*reach)/(2*reach);
  const normal=Math.sqrt(Math.max(0,l1*l1-along*along));
  const b=bend===-1?-1:1;
  const ex=sx+along*uX-b*normal*uY;
  const ey=sy+along*uY+b*normal*uX;
  const restUpper=Math.atan2(-9.1,sign*1.3);
  const first=Math.atan2(ey-sy,ex-sx)-restUpper;
  const second=Math.atan2(targetY-ey,targetX-ex)+Math.PI/2-first;
  const normalized=a=>Math.atan2(Math.sin(a),Math.cos(a));
  return{
    shoulderZ:normalized(first),elbowZ:normalized(second),
    elbowX:ex,elbowY:ey,side:sign,reach,
    endX:ex+Math.cos(first+second-Math.PI/2)*l2,
    endY:ey+Math.sin(first+second-Math.PI/2)*l2
  };
}

export function applyContactPose(character,contact,{reducedMotion=false}={}){
  const arms=character?.userData?.arms;
  if(!arms||!contact)return false;
  const index=contact.side===-1?0:1,arm=arms[index];
  if(!arm)return false;
  const solved=solveGrip2D({
    side:contact.side,targetX:contact.localX,targetY:contact.localY,
    bend:contact.side===-1?-1:1
  });
  if(!solved)return false;
  arm.shoulder.rotation.x=.25;
  arm.shoulder.rotation.z=solved.shoulderZ;
  arm.elbow.rotation.x=.16;
  arm.elbow.rotation.z=solved.elbowZ;
  arm.hand.rotation.z=-.21*contact.side;
  // The other arm remains a freely animated reaching counterweight.
  // This is a visual contact pose, NOT a physical grab or climbing state.
  return true;
}
