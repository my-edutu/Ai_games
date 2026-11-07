/**
 * A three-river, branched root system authored in actual board coordinates.
 * These are terrain / plant staging curves, NOT navigable routes or false
 * gameplay water. The same world-space field drives real interstitial fronds,
 * baked ground pigment, vertex-coloured flagstones, and shallow physical beds.
 * It is deterministic, seed-independent presentation work; no frame evaluation.
 */
const clamp=(value,min,max)=>Math.max(min,Math.min(max,value));
const smooth=(a,b,value)=>{
  const t=clamp((value-a)/(b-a),0,1);
  return t*t*(3-2*t);
};
const BASE=Object.freeze([-.57,.02,.59]);

export function watercourseCentre(nx,course){
  if(!Number.isFinite(nx)||!Number.isInteger(course)||course<0||course>2)
    throw new RangeError('A real garden watercourse requires a finite board coordinate and one of its three roots');
  const x=clamp(nx,-1,1);
  const long=.245*Math.sin((x+.28)*3.35+course*1.75);
  const cross=.165*Math.sin((x+.70)*5.65-course*1.27);
  const sweep=[-.14,.17,.09][course]*x;
  const fork=.105*Math.sin((x+.84)*10.1+course*2.2);
  // The middle course curls around the protected sunstone, preserving the
  // exact ancient clearing and enough original triangles for all rooted ferns.
  const middleClearing=course===1?1-.52*(1-smooth(.30,.71,Math.abs(x))):1;
  // The two woodland tributaries approach the original protected central
  // sunstone glade, leaving their banks broken by real raised stone rather
  // than drawn in three ruler-straight parallel rows.
  const heart=1-smooth(.23,.68,Math.abs(x));
  const approach=[.085,0,-.095][course]*heart;
  return clamp((BASE[course]+long+cross+sweep+fork)*middleClearing+approach,-.86,.86);
}

/**
 * Two deeply weathered, winding root galleries cross the old horizontal
 * wetland channels and connect their lower, middle and upper growing zones.
 * This is a physical habitat location, NOT a new path, hazard or portal.
 * Both curves remain outside the protected sunstone and carry the SAME
 * material, ground pigment and fern site system as the original three beds.
 */
export function rootBridgeCentre(nz,side){
  if(!Number.isFinite(nz)||(side!==-1&&side!==1))
    throw new RangeError('Cross-valley roots require finite elevation and an existing bank');
  const z=clamp(nz,-1,1);
  return side<0
    ? -.56+.114*Math.sin(z*4.55+.32)+.067*Math.sin(z*9.15-.37)
    : .55+.123*Math.sin(z*5.15+1.42)-.064*Math.sin(z*8.75+.83);
}

export function sampleGardenWatershed(nx,nz,width,height){
  if(![nx,nz,width,height].every(Number.isFinite)||width<2||height<2)
    throw new RangeError('A real planted garden needs finite public board dimensions');
  const x=clamp(nx,-1,1), z=clamp(nz,-1,1);
  let distance=2,course=0,branch=false;
  for(let i=0;i<3;i++){
    const main=watercourseCentre(x,i);
    const bank=Math.abs(z-main);
    if(bank<distance){distance=bank;course=i;branch=false;}
    // Two split tributaries meet the original trunk at their narrower mouths.
    // Their ends open into real limestone glades instead of drawing three
    // parallel stripes from one side of the complete garden to the other.
    for(let arm=0;arm<2;arm++){
      const start=-.88 + i*.13 + arm*.30;
      const end=Math.min(.94,start+1.07);
      const t=(x-start)/(end-start);
      if(t<=0||t>=1)continue;
      const lift=smooth(0,.29,t)*(1-smooth(.72,1,t));
      const side=(arm===0?-1:1)*(.28+.075*Math.sin(x*5.7+i*1.3)) *lift;
      const bend=.04*Math.sin(x*12.2+i*2.1+arm*1.4)*lift;
      const branchCentre=clamp(main+side+bend,-.91,.91);
      const dist=Math.abs(z-branchCentre);
      if(dist<distance){distance=dist;course=i;branch=true;}
    }
  }
  // Each gallery crosses and truly CONNECTS the three original wild beds.
  // Convert X to the Z-domain metric so the planted banks retain comparable
  // physical breadth at phone, 28x16 and 40x24 board dimensions.
  let crosslink=false;
  for(const side of [-1,1]){
    const centre=rootBridgeCentre(z,side);
    const dx=Math.abs(x-centre)*width/height;
    const end=Math.max(0,Math.abs(z)-.89)*2.4;
    const dist=Math.hypot(dx,end);
    if(dist<.046)crosslink=true;
    if(dist<distance){
      distance=dist;
      course=z<-.27?0:z>.30?2:1;
      branch=true;
    }
  }
  return { distance, course, branch, crosslink };
}
