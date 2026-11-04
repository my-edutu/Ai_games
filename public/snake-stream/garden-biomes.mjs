/**
 * Original, authored weathered-terrace landscape. Pure, deterministic,
 * presentation-only, shared by the existing flagstone vertex colours and the
 * existing world-owned once-baked material atlas. Neither the snake nor any
 * real food, hazard, portal, or public cell is moved. No per-frame evaluation.
 *
 * The original three rooted fern gullies remain continuous. Rocky sunward
 * terraces, cool rain-cut slate, and fallen-leaf woodland break the huge
 * uniformly beige/green playing field into legible ground-level habitats.
 * Mask edges are irregular but continuous across stone seams, avoiding an
 * invented route/goal marker or separate overlay pass.
 */
const clamp = value => Math.max(0, Math.min(1, value));
const smooth = (a,b,value) => {
  const t=clamp((value-a)/(b-a));
  return t*t*(3-2*t);
};
export function sampleWeatheredTerrace(u,v,width,height){
  if(![u,v,width,height].every(Number.isFinite) || width<2 || height<2)
    throw new RangeError('A weathered garden needs finite public board dimensions');
  const nx=u*2-1,nz=v*2-1;
  // Vary the exposed rock edge on two scales. Never gate its visibility on a
  // simulation event or a camera: the material is a stable physical place.
  const edgeWarp=.083*Math.sin(nx*7.2+nz*3.6+width*.025)
    +.067*Math.sin(nz*9.1-nx*4.4-height*.035)
    +.029*Math.sin(nx*17.2+nz*11.7);
  const shelf=(cx,cz,sx,sz)=>1-smooth(.51,.91,
    Math.hypot((nx-cx)/sx,(nz-cz)/sz)+edgeWarp);
  const sunnyWest=shelf(-.70,-.52,.69,.68);
  const farRuin=shelf(.71,-.58,.62,.65);
  const floodRock=shelf(.75,.63,.70,.71);
  const softLoam=shelf(-.55,.48,.71,.69);
  const lowerRoot=shelf(.15,.87,.68,.57);
  // World-space greens continue into natural soil and beyond the three
  // original fern courses, but do not cover the protected real sunstone.
  const heart=1-smooth(.23,.57,Math.hypot(nx/.53,nz/.70));
  const tear=.05*Math.sin(nx*15.5-nz*5.2)+.035*Math.sin(nx*4.3+nz*12.1);
  let courseDistance=Infinity;
  for(let i=0;i<3;i++){
    const centre=[-.57,.02,.59][i]+.20*Math.sin(nx*3.7+i*1.67)
      +.07*Math.sin(nx*8.3-i*.91);
    courseDistance=Math.min(courseDistance,Math.abs(nz-centre));
  }
  const planted=1-smooth(.045,.225,Math.max(0,courseDistance+tear));
  const protectedSunstone=heart;
  const wooded=smooth(.12,.85,planted+.24*softLoam+.16*lowerRoot);
  const terrace=clamp(Math.max(sunnyWest,farRuin*.87,floodRock*.85)
    * (1-heart*.94) * (.90+.10*Math.sin(nx*6+nz*3)));
  const litter=clamp(Math.max(softLoam,lowerRoot*.92)
    *(.42+.58*wooded)*(1-heart*.97));
  const coolSlate=clamp((.68*planted+.42*floodRock+.19*farRuin)
    * (1-heart*.91) * (1-terrace*.39));
  return { terrace,litter,coolSlate,protectedSunstone,planted };
}
