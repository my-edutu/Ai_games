// Physically-grounded camera recovery across the real HP-zero F8 -> F9
// receiving roof -> first raised p2. No simulation, actor, route or floor edits.
const finite=Number.isFinite,safe=Number.isSafeInteger;
const vec=x=>Array.isArray(x)&&x.length===3&&x.every(finite);
const ndc=x=>Array.isArray(x)&&x.length===4&&x.every(finite);
export function proposeSourceFirstRaisedBodyScale(source,held,o={}) {
 const p=source?.player,w=source?.lastGuardianCrossing;
 const roof=source?.platforms?.find(q=>q.id==='f9:ground');
 const p2=source?.platforms?.find(q=>q.id==='f9:p2');
 if(source?.floor!==9||source.theme!=='void'||
   source.lifecycle!=='running'||source.stale===true||
   !source.runToken||!safe(source.tick)||!(p?.health>0)||
   held?.runToken!==source.runToken||held.floor!==9||
   held.oldCapId!=='f8:cap'||held.guardianGateRetained!==true||
   held.verifiedObservedFloorAdvance!==true||
   !safe(held.crossingTick)||!safe(held.oldRoofY)||
   source.tick<held.crossingTick||source.tick-held.crossingTick>120||
   w?.runToken!==source.runToken||w.fromFloor!==8||w.toFloor!==9||
   w.cap?.id!=='f8:cap'||w.guardian?.kind!=='guardian'||
   w.guardian.active!==false||!finite(w.guardian.health)||
   w.guardian.health>0||w.sourceTick!==held.crossingTick||
   w.exitX!==held.thresholdX||w.cap.y+w.cap.height!==held.oldRoofY||
   !roof||!p2||
   ![roof.x,roof.y,roof.width,roof.height,p2.x,p2.y,p2.width,p2.height,
     p.x,p.y,p.halfHeight].every(safe)||
   roof.width<=0||p2.width<=0||p.halfHeight<=0||
   roof.y+roof.height!==held.oldRoofY||
   p2.y+p2.height<=held.oldRoofY+20000||
   p2.y+p2.height>held.oldRoofY+250000||
   o.cameraMode!=='follow'||o.stale===true||o.reducedMotion===true||
   !finite(o.aspect)||o.aspect<.36||o.aspect>2.45||
   !finite(o.dt)||o.dt<=0||o.dt>.5||
   !vec(o.camera)||!vec(o.hero)||!ndc(o.heroNdc)||
   !finite(o.remaining)||o.remaining<=0)return null;
 const sole=p.y-p.halfHeight,ground=roof.y+roof.height;
 const raised=p2.y+p2.height;
 const roofContact=p.grounded===true&&p.groundedPlatformId==='f9:ground'&&
   sole===ground&&p.vy===0;
 const raisedContact=p.grounded===true&&p.groundedPlatformId==='f9:p2'&&
   sole===raised&&p.vy===0&&p.x>=p2.x&&p.x<=p2.x+p2.width;
 const flight=p.state==='airborne'&&p.grounded===false&&
   p.groundedPlatformId==null&&sole>=ground-2500&&sole<=raised+65000;
 if(!roofContact&&!raisedContact&&!flight)return null;
 const h=o.heroNdc,goal=o.aspect<.85?.135:.105;
 if(h[2]<-1||h[2]>1||h[3]<.023||h[3]>=goal||
    Math.abs(h[0])+h[3]*.15>=.83||Math.abs(h[1])+h[3]>=.83)return null;
 const radius=Math.hypot(o.camera[0],o.camera[2]);
 const delta=o.hero.map((x,i)=>x-o.camera[i]),length=Math.hypot(...delta);
 if(radius<33||radius>150||length<9||length>90)return null;
 const metres=Math.min(1.2,o.remaining,
   Math.max(.12,18*Math.min(o.dt,.07)),length*(1-h[3]/goal));
 if(metres<.05)return null;
 const camera=o.camera.map((x,i)=>x+delta[i]*metres/length);
 if(Math.hypot(camera[0],camera[2])<31)return null;
 return {sourceBound:true,sourceTick:source.tick,
   landingId:'f9:p2',contact:raisedContact?'raised':
   roofContact?'receiving-roof':'source-flight',camera,metres,
   evidence:'Requires actual full-body, gate steel, raised deck and World/core ray acceptance'};
}
export function acceptSourceFirstRaisedBodyScale(a,b,physical={}) {
 if(!ndc(a?.hero)||!ndc(b?.hero)||
   !vec(a?.landing)||!vec(b?.landing)||
   b.hero[2]<-1||b.hero[2]>1||
   b.hero[3]<a.hero[3]+.001||
   Math.abs(b.hero[0])+b.hero[3]*.15>.84||
   Math.abs(b.hero[1])+b.hero[3]>.86||
   physical.active!==true||physical.bodyBlockedRays!==0||
   physical.heroCore!==true||physical.landingCore!==true)return false;
 const hadRaised=a.landing[2]>=-1&&a.landing[2]<=1&&
   Math.abs(a.landing[0])<.89&&Math.abs(a.landing[1])<.89;
 if(hadRaised&&!(b.landing[2]>=-1&&b.landing[2]<=1&&
   Math.abs(b.landing[0])<.93&&Math.abs(b.landing[1])<.93))return false;
 const hadOriginalSteel=a.steel?.sourceBound===true&&
   a.steel.projectedPanes>=2&&a.steel.projectedMetalArea>=.009;
 if(hadOriginalSteel&&!(b.steel?.sourceBound===true&&
   b.steel.projectedPanes>=2&&
   b.steel.projectedMetalArea>=Math.max(.008,
     a.steel.projectedMetalArea*.78)&&
   physical.gatewayBlockedRays===0&&physical.gateCore===true))return false;
 return true;
}
