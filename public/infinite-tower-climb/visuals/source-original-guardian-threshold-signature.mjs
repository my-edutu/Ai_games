// The one ORIGINAL Floor8 guardian door already exists in source physics and
// in the GPU-resident cap. Give its true opened threshold a distinct forged
// negative-space silhouette, recognizable when that SAME mesh survives the F9
// handoff. Not a second gate, obstacle, floor advance or outcome cue.
// All geometry is local to the authoritative GuardianGateInset, fully behind
// its open human-height corridor. Nothing is built for future floors.
export function sourceOriginalGuardianThresholdSignature({
  platform,worldWidth,guardianExitX
}={}){
  if(platform?.id!=='f8:cap'||
      !Number.isSafeInteger(worldWidth)||worldWidth<400000||
      ![platform.x,platform.y,platform.width,platform.height,guardianExitX]
        .every(Number.isSafeInteger)||
      platform.x<0||platform.width<200000||platform.height<=0||
      platform.x+platform.width>worldWidth||
      guardianExitX!==platform.x+Math.floor(platform.width*.76))
    return null;
  const members=[];
  const add=(name,from,to,radius,material)=>{
    members.push({name,from,to,radius,material});
  };
  for(const side of [-1,1]){
    const wing=side<0?'left':'right';
    add('original-portal-inner-'+wing,
      [side*3.72,.24,-.34],[side*3.72,4.95,-.34],.17,'bronze');
    add('original-portal-highlight-'+wing,
      [side*4.04,.56,-.38],[side*4.04,4.78,-.38],.07,'edge');
    add('original-portal-shoulder-'+wing,
      [side*3.72,4.95,-.34],[side*2.26,6.95,-.34],.18,'bronze');
    add('original-portal-outer-arch-'+wing,
      [side*4.04,5.15,-.38],[side*2.95,7.35,-.38],.12,'edge');
  }
  add('original-portal-crown',
    [-2.26,6.95,-.34],[2.26,6.95,-.34],.19,'bronze');
  add('original-portal-upper-tie',
    [-2.95,7.35,-.38],[2.95,7.35,-.38],.1,'edge');
  add('original-portal-keystone',
    [0,7.09,-.40],[0,7.64,-.40],.17,'bronze');
  return {
    sourceBound:true,oldCapId:'f8:cap',thresholdX:guardianExitX,
    nonColliding:true,openingWidth:7.44,
    members
  };
}
