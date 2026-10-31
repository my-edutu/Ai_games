// Static finishing inside existing collision envelopes. Plants, masonry and
// cloth are presentation, never extra inventory, buildings or population.
const districtStats={plantedBorders:0,plants:0,landscapeTriangles:0};
function cottageFinish(x,z,scale,variant){
 const y=terrain(x,z),w=(2.4+variant*.42)*scale,d=(2.1+variant*.18)*scale,h=1.9*scale;
 const dark=rgb(0x514336),ochre=rgb(0xc0aa80),shutter=rgb([0x455d55,0x684b40,0x505d69][variant%3]);
 materialScope(MATERIAL.WOOD,()=>{
  for(const side of [-1,1]){
   const face=z+side*(d/2+.19*scale);
   limbSegment([x-w*.43,y+h+.03*scale,face],[x,y+h+1.10*scale,face],.045*scale,dark,5);
   limbSegment([x+w*.43,y+h+.03*scale,face],[x,y+h+1.10*scale,face],.045*scale,dark,5);
   box(x,y+h,face,.09*scale,1.10*scale,.10*scale,dark);
   box(x,y+h+.34*scale,face,w*.64,.07*scale,.08*scale,dark);
   for(const post of [-.29,.29])box(x+post*w,y+h,face,.055*scale,.43*scale,.075*scale,dark);
  }
  // Side windows and recessed shutters provide detail from every camera angle.
  for(const side of [-1,1])for(const offset of [-.25,.25]){
   const wx=x+side*(w/2+.055*scale),wz=z+offset*d;
   box(wx,y+.68*scale,wz,.07*scale,.69*scale,.55*scale,ochre);
   box(wx+side*.04*scale,y+.75*scale,wz,.04*scale,.53*scale,.42*scale,rgb(0x314648));
   box(wx+side*.07*scale,y+.75*scale,wz,.04*scale,.54*scale,.032*scale,ochre);
   for(const s of [-1,1])box(wx,y+.72*scale,wz+s*.34*scale,.10*scale,.62*scale,.19*scale,shutter);
  }
 });
 if(scale>1.5){
  // A gallery distinguishes the central hall, within its existing solid footprint.
  const f=z-d*.5-.21;
  materialScope(MATERIAL.WOOD,()=>{
   box(x,y+1.83,f,w*.79,.13,.41,dark);
   for(let i=0;i<12;i++)box(x-w*.37+i*w*.74/11,y+1.96,f-.17,.045,.63,.045,ochre);
   box(x,y+2.58,f-.17,w*.80,.075,.08,dark);
   for(const side of [-1,1])box(x+side*w*.35,y+.12,f,.13,1.75,.13,dark);
  });return;
 }
 for(const side of [-1,1]){
  const px=x+side*(w*.5+.17*scale);districtStats.plantedBorders++;
  materialScope(MATERIAL.ROAD,()=>box(px,terrain(px,z)+.012,z,.29*scale,.055*scale,d*.81,rgb(0x514833)));
  materialScope(MATERIAL.FOLIAGE,()=>{
   for(let i=0;i<7;i++){
    const pz=z+(i-3)*d*.105,py=terrain(px,pz),height=(.22+.09*Math.sin(i*2.1+variant))*scale;
    const leaf=rgb([0x547248,0x6b8050,0x455f3f][(i+variant)%3]);
    ellipsoid(px,py+height*.65,pz,.16*scale,height,.15*scale,leaf,6);districtStats.plants++;
    if(i%3===variant%3&&climateAt(state.t).season!==3){
     for(const sign of [-1,1]){
      const fx=px+sign*.055*scale,fz=pz+sign*.06*scale;
      limbSegment([fx,py+.1,fz],[fx,py+height*1.7,fz],.009*scale,leaf,4);
      ellipsoid(fx,py+height*1.7,fz,.045*scale,.065*scale,.045*scale,rgb([0xb3a3c1,0xe5d4a1,0xb17b71][variant%3]),6);
     }
    }
   }
  });
 }
}
function distantLandscape(){
 const before=data.length;const center=.05,inner=43.05,bands=8,segments=41;
 const point=(side,t,ring)=>{
  const r=inner+ring*6;let x,z;
  if(side===0){x=-r+2*r*t;z=-r}else if(side===1){x=r;z=-r+2*r*t}else if(side===2){x=r-2*r*t;z=r}else{x=-r;z=r-2*r*t}
  x+=center;z+=center;const lift=Math.pow(ring/bands,1.4)*(5+4*Math.sin(x*.045+z*.019)*Math.cos(z*.065));
  return [x,terrain(x,z)-.09+lift,z];
 };
 materialScope(MATERIAL.GRASS,()=>{
  for(let side=0;side<4;side++)for(let ring=0;ring<bands;ring++)for(let i=0;i<segments;i++){
   const a=point(side,i/segments,ring),b=point(side,(i+1)/segments,ring),c=point(side,(i+1)/segments,ring+1),d=point(side,i/segments,ring+1);
   const color=turfColor((a[0]+c[0])*.5,(a[2]+c[2])*.5).map(v=>Math.min(.8,v));
   quad(a,b,c,d,color);
  }
 });districtStats.landscapeTriangles=(data.length-before)/30;
}
function marketCanopy(x,z){
 const y=terrain(x,z);const point=(u,v)=>[x+u*1.55,y+1.65+.61*(1-Math.abs(u))-.09*Math.sin(Math.abs(u)*Math.PI)+.025*Math.cos(v*5),z+v*.94];
 materialScope(MATERIAL.GENERAL,()=>{
  for(let i=0;i<12;i++)for(let j=0;j<8;j++){
   const a=point(-1+i/6,-1+j/4),b=point(-1+i/6,-1+(j+1)/4),c=point(-1+(i+1)/6,-1+(j+1)/4),d=point(-1+(i+1)/6,-1+j/4);
   const col=rgb(j%2?0xd8c7a5:0x8f5145);quad(a,b,c,d,col);quad(d,c,b,a,col);
  }
  for(const side of [-1,1])for(let j=0;j<12;j++){
   const a=point(side,-1+j/6),b=point(side,-1+(j+1)/6),c=[b[0],b[1]-.16,b[2]],d=[a[0],a[1]-.16,a[2]];
   const col=rgb(j%2?0xd8c7a5:0x8f5145);quad(a,b,c,d,col);quad(d,c,b,a,col);
  }
 });
 for(let i=0;i<7;i++){const px=x-1.17+i*.4;ellipsoid(px,y+1.01,z+.45,.15,.13,.14,rgb(i%2?0xb69551:0x75904c),7)}
}
