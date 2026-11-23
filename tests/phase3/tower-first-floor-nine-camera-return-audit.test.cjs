const {test}=require('node:test');
function verifyAudit(create){
  const eq=(a,b,label)=>{if(a!==b)throw new Error(label+': '+a+' != '+b)};
  const witnesses=[
    {sourceTick:527,previousTick:522,previousReturnPerfMs:26592.7,end:26615.8,previousCamera:[15.861,6.749,42.922],next:[19.333,12.232,41.975],previousFocus:[8.569,2.845,23.17],focus:[10.271,8.463,23.609],previousHero:[11.84,6.083,22.018],hero:[12.834,10.311,23.644],previousFov:56.233,fov:55.033,expectedGap:23.1,expectedTickGap:5},
    {sourceTick:584,previousTick:580,previousReturnPerfMs:29290.3,end:29454.3,previousCamera:[37.215,26.416,48.834],next:[22.167,25.057,48.781],previousFocus:[-.866,17.969,23.832],focus:[-4.416,18.269,23.98],previousHero:[-1.748,19.56,24.918],hero:[-5.906,18.251,24.26],previousFov:42,fov:42,expectedGap:164,expectedTickGap:4},
    {sourceTick:623,previousTick:623,previousReturnPerfMs:31433.5,end:31454,previousCamera:[-6.846,36.883,54.527],next:[-.609,37.221,54.714],previousFocus:[6.691,30.587,24.616],focus:[6.472,30.912,24.657],previousHero:[7.603,31,23.815],hero:[7.578,31,23.823],previousFov:42,fov:42,expectedGap:20.5,expectedTickGap:0}
  ];
  const results=[];
  for(const w of witnesses){
    const a=create({...w,dt:.05});
    // Recorded endpoints are real; intermediate checkpoints here are
    // synthetic fixture inputs, not inferred historical decisions.
    a.checkpoint('before-departure',w.previousCamera,w.previousFocus,w.previousFov,'upstream-final');
    a.checkpoint('after-departure',w.previousCamera,w.previousFocus,w.previousFov,'physical-veto:test');
    a.checkpoint('after-joint',w.previousCamera,w.previousFocus,w.previousFov,'no-joint');
    a.checkpoint('final-after-scale',w.next,w.focus,w.fov,'test-late-change');
    eq(a.finish(w.previousReturnPerfMs-1),null,'backwards return rejected');
    const r=a.finish(w.end);
    eq(r.sourceTickGap,w.expectedTickGap,'source gap');
    eq(r.returnGapMs,w.expectedGap,'render return gap');
    eq(r.checkpoints[2].cameraDeltaFromPriorReturn,0,'no earlier change');
    eq(r.checkpoints[3].cameraDeltaFromPriorReturn,r.checkpoints[3].cameraDeltaFromPriorCheckpoint,'late change attributed');
    eq(r.checkpoints[3].outcome,'test-late-change','decision preserved');
    results.push({ticks:[w.previousTick,w.sourceTick],returnGapMs:r.returnGapMs,heroDelta:r.heroDeltaMetres,finalDelta:r.checkpoints[3].cameraDeltaFromPriorReturn});
  }
  const w=witnesses[0];const incomplete=create({...w,dt:.05});
  incomplete.checkpoint('before-departure',w.previousCamera,w.previousFocus,w.previousFov,'ok');
  eq(incomplete.finish(w.end),null,'partial record rejected');
  const outOfOrder=create({...w,dt:.05});
  outOfOrder.checkpoint('after-joint',w.previousCamera,w.previousFocus,w.previousFov,'invalid');
  eq(outOfOrder.finish(w.end),null,'out of order rejected');
  eq(create({...w,dt:.05,previousTick:w.sourceTick+1}),null,'source rewind rejected');
  eq(create({...w,dt:.05,previousCamera:[NaN,0,0]}),null,'invalid lens rejected');
  return results;
}
test('first-F9 decision witness separates source ticks, render gaps and late camera movement',async()=>verifyAudit((await import('../../public/infinite-tower-climb/visuals/first-floor-nine-camera-return-audit.mjs')).createFloorNineCameraReturnAudit));
