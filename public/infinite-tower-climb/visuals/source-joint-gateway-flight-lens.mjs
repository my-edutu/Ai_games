// P0: joint lens for the ACTUAL HP-open guardian doorway, live skinned
// climber, walkable receiving roof and real first raised Floor9 landing.
// Presentation only; no fabricated platform, authority, geometry or draw.
const finite=Number.isFinite,integer=Number.isSafeInteger;
const point=p=>Array.isArray(p)&&p.length===3&&p.every(finite);
const ndc=(p,n)=>Array.isArray(p)&&p.length===n&&p.every(finite)&&p[2]>=-1&&p[2]<=1;
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v));
const gap=(p,m)=>p?Math.max(0,Math.abs(p[0])-m,Math.abs(p[1])-m):Infinity;

export function sourceJointGatewayFlightLens(source,held,o={}){
 const p=source?.player,w=source?.lastGuardianCrossing;
 const roof=source?.platforms?.find(x=>x?.id==='f9:ground');
 const landing=source?.platforms?.find(x=>x?.id===source?.intent?.targetPlatformId);
 if(source?.floor!==9||source.theme!=='void'||source.lifecycle!=='running'||
    source.stale===true||typeof source.runToken!=='string'||!source.runToken||
    !integer(source.tick)||!(p?.health>0)||![p.x,p.y,p.halfHeight].every(integer)||
    p.halfHeight<=0||!roof||![roof.x,roof.y,roof.width,roof.height].every(integer)||
    roof.width<=0||roof.height<=0||
    !landing||!/^f9:p[0-9]+$/.test(landing.id)||
    ![landing.x,landing.y,landing.width,landing.height].every(integer)||
    landing.width<=0||landing.height<=0||
    landing.y+landing.height<=roof.y+roof.height||
    held?.runToken!==source.runToken||held.floor!==9||
    held.guardianGateRetained!==true||held.verifiedObservedFloorAdvance!==true||
    held.oldCapId!=='f8:cap'||!integer(held.crossingTick)||
    !integer(held.oldRoofY)||roof.y+roof.height!==held.oldRoofY||
    source.tick<held.crossingTick||source.tick-held.crossingTick>100||
    !finite(held.originalGatewayOpacity)||held.originalGatewayOpacity<.12||
    held.originalGatewayOpacity>1||!integer(held.submittedFrames)||
    held.submittedFrames<1||held.submittedFrames>28||
    (w!=null&&(w.runToken!==source.runToken||w.fromFloor!==8||
      w.toFloor!==9||w.cap?.id!=='f8:cap'||w.guardian?.kind!=='guardian'||
      w.guardian.active!==false||!finite(w.guardian.health)||w.guardian.health>0||
      !integer(w.sourceTick)||w.sourceTick>source.tick||
      w.sourceTick!==held.crossingTick))||
    !(p.grounded===true&&p.groundedPlatformId==='f9:ground'&&
      p.y-p.halfHeight===roof.y+roof.height||
      p.grounded===false&&p.state==='airborne'&&p.groundedPlatformId==null&&
      p.y-p.halfHeight>=roof.y+roof.height-2500&&
      p.y-p.halfHeight<=landing.y+landing.height+65000)||
    o.cameraMode!=='follow'||o.stale===true||o.reducedMotion===true||
    !finite(o.aspect)||o.aspect<.36||o.aspect>2.45||
    !finite(o.dt)||o.dt<=0||o.dt>.12||!finite(o.fov)||
    o.fov<35||o.fov>70||
    ![o.focus,o.hero,o.gateway,o.roof,o.landing].every(point)||
    !ndc(o.heroNdc,4)||!ndc(o.gatewayNdc,4)||!ndc(o.roofNdc,3)||
    !Array.isArray(o.landingNdc)||o.landingNdc.length!==3||
    !o.landingNdc.every(finite)||o.heroNdc[3]<.045||
    o.steel?.sourceBound!==true||o.steel.projectedPanes<2||
    !finite(o.steel.projectedMetalArea)||o.steel.projectedMetalArea<.009)
      return null;
 for(const x of [o.hero,o.gateway,o.roof])
   if(Math.hypot(...x.map((v,i)=>v-o.landing[i]))>85)return null;
 const raisedOffscreen=gap(o.landingNdc,o.aspect<.85?.72:.80)>.015||
   o.landingNdc[2]<-1||o.landingNdc[2]>1;
 const heroNearCrop=gap(o.heroNdc,o.aspect<.85?.69:.77)>.01;
 if(!raisedOffscreen&&!heroNearCrop)return null;
 const target=o.hero.map((v,i)=>v*.38+o.gateway[i]*.14+
   o.roof[i]*.10+o.landing[i]*.38);
 const delta=target.map((v,i)=>v-o.focus[i]);
 const distance=Math.hypot(...delta),seconds=clamp(o.dt,.001,.07);
 const gazeStep=distance>1e-6?Math.min(distance,seconds*14):0;
 const focus=distance>1e-6?o.focus.map((v,i)=>v+delta[i]*gazeStep/distance):o.focus.slice();
 const fov=Math.min(o.aspect<.85?66:61,o.fov+seconds*68);
 if(gazeStep<=.0001&&fov<=o.fov+.0001)return null;
 return {sourceBound:true,runToken:source.runToken,sourceTick:source.tick,
   landingId:landing.id,focus,fov,gazeStep,
   limitation:'Proposed current real four-subject lens, separately vetoed by projected complete hero, true gate metal, walkable roof, raised landing, actual triangles and solid tower. NOT native film proof.'};
}

// The scene reprojects the four current Three subjects and raycasts real
// structure AFTER the proposed camera, never accepting a fake geometric read.
export function assessSourceJointGatewayLens(before,after){
 if(!before||!after||!ndc(before.heroNdc,4)||!ndc(after.heroNdc,4)||
    !ndc(before.gatewayNdc,4)||!ndc(after.gatewayNdc,4)||
    !ndc(before.roofNdc,3)||!ndc(after.roofNdc,3)||
    ![before.landingNdc,after.landingNdc].every(x=>
      Array.isArray(x)&&x.length===3&&x.every(finite))||
    before.steel?.sourceBound!==true||after.steel?.sourceBound!==true||
    before.steel.projectedPanes<2||after.steel.projectedPanes<2||
    !finite(before.steel.projectedMetalArea)||
    !finite(after.steel.projectedMetalArea))return false;
 const heroSafe=after.heroNdc[3]>=.047&&
   Math.abs(after.heroNdc[0])+after.heroNdc[3]*.14<=.85&&
   Math.abs(after.heroNdc[1])+after.heroNdc[3]<=.87;
 const gateSafe=Math.abs(after.gatewayNdc[0])+after.gatewayNdc[3]*.10<=.89&&
   Math.abs(after.gatewayNdc[1])+after.gatewayNdc[3]<=.88;
 const roofSafe=gap(after.roofNdc,.87)<=Math.max(.02,gap(before.roofNdc,.87))&&
   gap(after.roofNdc,.89)<.08;
 const steelSafe=after.steel.projectedMetalArea>=
   Math.max(.008,before.steel.projectedMetalArea*.78);
 const beforeGap=gap(before.landingNdc,.79),afterGap=gap(after.landingNdc,.79);
 const beforeHero=gap(before.heroNdc,.76),afterHero=gap(after.heroNdc,.76);
 const improved=afterGap+Math.max(0,afterHero)*.5<
   beforeGap+Math.max(0,beforeHero)*.5-.012;
 return heroSafe&&gateSafe&&roofSafe&&steelSafe&&
   after.landingNdc[2]>=-1&&after.landingNdc[2]<=1&&improved;
}
