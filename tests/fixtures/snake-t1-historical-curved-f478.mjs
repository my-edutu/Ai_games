/**
 * The Living Garden, T1 production vertical slice.
 * Presentation-only original geometry: no game RNG, board/collision mutation,
 * external artwork, per-frame allocations or asynchronous runtime activity.
 * Four shoreline ecosystems, fractured ruins and rooted vegetation share four
 * static batches and one deterministic procedural weathering atlas.
 */
export function createLivingGarden(THREE, {width,height}) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2)
    throw new Error('Living garden requires a valid immutable public board size');
  const W=width/2,H=height/2;
  const group=new THREE.Group();
  group.name='Living shoreline / ruined garden';
  const ownGeometry=[],ownMaterials=[];
  let disposed=false;
  const bands=new Map([
    ['moss',{p:[],c:[],uv:[],color:0xb7d1a0,roughness:.92}],
    ['cliff',{p:[],c:[],uv:[],color:0xc2b9a0,roughness:.98}],
    ['ruin',{p:[],c:[],uv:[],color:0xcbd4bd,roughness:.88}],
    ['foliage',{p:[],c:[],uv:[],color:0xb2d1ac,roughness:.79}]
  ]);
  const clamp=(n,a,b)=>Math.min(b,Math.max(a,n));
  const hash=(x,z)=>{const n=Math.sin(x*127.1+z*311.7)*43758.5453;return n-Math.floor(n);};
  const smooth=(x,z)=>{
    const a=Math.floor(x),b=Math.floor(z),u=x-a,v=z-b;
    const U=u*u*(3-2*u),V=v*v*(3-2*v);
    return (hash(a,b)*(1-U)+hash(a+1,b)*U)*(1-V)+(hash(a,b+1)*(1-U)+hash(a+1,b+1)*U)*V;
  };
  const palette={
    moss:[0x335b36,0x56894a,0x79a65a,0xa2b877,0x7a8355],
    cliff:[0x53665a,0x7d8775,0xa3a497,0xc1b69b,0x677c6e],
    ruin:[0x66786d,0x929e8b,0xbec0ac,0xd6c9aa,0x8c956e],
    foliage:[0x2d5a3e,0x3c8653,0x81a54c,0xa8be68,0x4c7952]
  };
  const rgb=new Map();
  for(const [key,arr] of Object.entries(palette))
    rgb.set(key,arr.map(hex=>new THREE.Color(hex)));
  // T1 ecology: broad continuous biome values, not a fresh contrasting tint
  // on EACH triangle. Stone courses retain a small per-face mineral shift;
  // ground banks share exactly the same tint at each repeated world vertex.
  function vertex(layer,point,index) {
    const b=bands.get(layer),colors=rgb.get(layer);
    const cloud=smooth(point[0]*.125+29,point[2]*.125+47);
    const lichen=smooth(point[0]*.37+81,point[2]*.36+17);
    const wet=clamp((-point[1]-.65)/2.8,0,1);
    const faceShade=(layer==='ruin'||layer==='foliage')
      ? (((Math.floor(index)%5)+5)%5-2)*.065:0;
    let shade=layer==='moss'?1.08+cloud*1.91+(lichen-.5)*.28
      :layer==='cliff'?.62+cloud*2.75-wet*.45+(lichen-.5)*.16
      :layer==='ruin'?1.11+cloud*1.67+(lichen-.5)*.30
      :.70+cloud*2.43+(lichen-.5)*.42;
    shade=clamp(shade+faceShade,0,colors.length-1);
    const low=Math.floor(shade),high=Math.min(colors.length-1,low+1),mix=shade-low;
    const a=colors[low],c=colors[high];
    b.p.push(point[0],point[1],point[2]);
    b.c.push(a.r*(1-mix)+c.r*mix,a.g*(1-mix)+c.g*mix,a.b*(1-mix)+c.b*mix);
    b.uv.push(point[0]*.11,point[2]*.11);
  }
  function tri(layer,a,b,c,shade=0){vertex(layer,a,shade);vertex(layer,b,shade+1);vertex(layer,c,shade);}
  function quad(layer,a,b,c,d,shade=0) {
    tri(layer,a,c,b,shade);
    tri(layer,a,d,c,shade);
  }
  // Small weathering pores and broad mineral cloud, both seeded by coordinates.
  // This texture is original, reused by soil, cliff and masonry; no external asset.
  const texSize=128,texData=new Uint8Array(texSize*texSize*4);
  for(let z=0;z<texSize;z++)for(let x=0;x<texSize;x++){
    const broad=smooth(x/21+19,z/17+7);
    const grain=smooth(x/4+71,z/4+31);
    const wash=clamp(.73+broad*.21+grain*.07+(hash(x,z)-.5)*.04,.12,.99);
    const wet=Math.max(0,smooth(x/12+40,z/15+60)-.57);
    const k=(z*texSize+x)*4;
    texData[k]=Math.round(245*wash*(1-.21*wet));
    texData[k+1]=Math.round(249*wash*(1-.13*wet));
    texData[k+2]=Math.round(232*wash*(1-.27*wet));
    texData[k+3]=255;
  }
  const weathering=new THREE.DataTexture(texData,texSize,texSize);
  weathering.colorSpace=THREE.SRGBColorSpace;
  weathering.wrapS=weathering.wrapT=THREE.RepeatWrapping;
  weathering.minFilter=THREE.LinearMipmapLinearFilter;
  weathering.magFilter=THREE.LinearFilter;
  weathering.generateMipmaps=true;
  weathering.needsUpdate=true;
  // Stone courses are 3D solid masonry, not projected textures or screen quads.
  function block(x,y,z,sx,sy,sz,shade=0,angle=0){
    const cs=Math.cos(angle),sn=Math.sin(angle),corners=[];
    for(const yy of [-.5,.5])for(const xx of [-.5,.5])for(const zz of [-.5,.5]){
      const px=xx*sx,pz=zz*sz;
      corners.push([x+px*cs-pz*sn,y+yy*sy,z+px*sn+pz*cs]);
    }
    const q=(a,b,c,d,face)=>quad('ruin',corners[a],corners[b],corners[c],corners[d],shade+face);
    q(2,3,7,6,0);q(0,4,5,1,2);q(4,6,7,5,1);
    q(0,1,3,2,3);q(1,5,7,3,4);q(0,2,6,4,1);
  }
  // The old rectangular stage remains exact; all new shore mesh starts beyond
  // its corner/coping, and cannot be interpreted as obstacle/portal/collision.
  const shorelines=[
    {id:'sunlit-foreshore',axis:'x',start:-W-2.7,end:W+2.7,near:H+2.65,far:H+9.15},
    {id:'shaded-cove',axis:'x',start:-W-2.7,end:W+2.7,near:-H-5.25,far:-H-11.1},
    {id:'fern-west',axis:'z',start:-H-2.9,end:H+3.1,near:-W-2.75,far:-W-9.3},
    {id:'reeds-east',axis:'z',start:-H-2.9,end:H+3.1,near:W+2.75,far:W+9.3}
  ];
  const features={shoreSections:shorelines.length,plantBlades:0,fernFronds:0,
    ruinBlocks:0,roundedBoulders:0,rootRibbons:0,waterlineSegments:0,
    canopyTrees:0,canopyLeaflets:0,arcadeArches:0,arcadeStones:0,hangingVines:0};
  const bankPoint=(s,t,v)=>{
    const warp=(Math.sin(t*.29+v*2.1)*.37+Math.sin(t*.65-1.3)*.13)*v;
    const outer=s.near+(s.far-s.near)*v+warp;
    const x=s.axis==='x'?t:outer,z=s.axis==='x'?outer:t;
    const relief=.08*Math.sin(t*.38+v*3.6)+.13*(smooth(t*.23+12,v*2+21)-.5);
    // Wide turf banks fall into darker rock shelves, rather than identical
    // sharply creased sawtooth terraces in each coastal compass direction.
    const y=-.43-.42*v-.54*v*v+.11*Math.sin(t*.24+2)*(.25+.75*v)+relief;
    return [x,y,z];
  };
  function leaf(x,y,z,height,angle,shade,species='fern') {
    // Individually folded, back-curved lamina with a visible midrib and
    // tapered silhouette. Short broad fern fronds and taller reeds share
    // ONE bounded static 3D batch. No billboards, sprites or per-frame work.
    const reeds=species==='reeds',count=reeds?4:5;
    for(let i=0;i<count;i++){
      const a=angle+(i-(count-1)*.5)*(reeds?.29:.45);
      const dx=Math.cos(a),dz=Math.sin(a),span=height*(reeds?.32:.64);
      const heightScale=height*(1-Math.abs(i-(count-1)/2)*.065);
      const base=[x+Math.sin(a)*.06,y,z-Math.cos(a)*.06];
      const middle=[base[0]+dx*span*.39,y+heightScale*.64,base[2]+dz*span*.39];
      const upper=[base[0]+dx*span*.77,y+heightScale*.93,base[2]+dz*span*.77];
      const tip=[base[0]+dx*span,y+heightScale*(reeds?.96:.68),base[2]+dz*span];
      const radius=(reeds?.045:.10)+height*.055;
      const left=[middle[0]-dz*radius,middle[1]-.065,middle[2]+dx*radius];
      const right=[middle[0]+dz*radius,middle[1]-.065,middle[2]-dx*radius];
      tri('foliage',base,left,upper,shade+i);
      tri('foliage',base,upper,right,shade+i+1);
      tri('foliage',left,tip,upper,shade+i+2);
      tri('foliage',right,upper,tip,shade+i+3);
      features.plantBlades++;features.fernFronds++;
    }
  }
  function boulder(x,y,z,radius,height,phase) {
    // Three asymmetrical weathered rock rings, original vertex-color geology.
    // The silhouette carries its faceting, rather than flat cubic shelf blocks.
    const sides=7,steps=3;
    const at=(ring,i)=>{
      const a=i*2*Math.PI/sides+phase;
      const scale=ring===0?.90:ring===1?1:.56;
      const bulge=.91+.16*hash(i+phase*13,ring+17);
      return [x+Math.cos(a)*radius*scale*bulge,y+ring*height/steps,
        z+Math.sin(a)*radius*scale*(.86+.15*hash(i,phase+29))];
    };
    for(let ring=0;ring<steps-1;ring++)for(let i=0;i<sides;i++){
      const next=(i+1)%sides;
      quad('cliff',at(ring,i),at(ring,next),at(ring+1,next),at(ring+1,i),i+ring);
    }
    for(let i=0;i<sides;i++)tri('cliff',at(steps-1,i),at(steps-1,(i+1)%sides),
      [x,y+height,z],i);
    features.roundedBoulders++;
  }
  function rootRibbon(x,y,z,length,angle,phase) {
    // Arching roots make masonry belong to the biome. Every strip has a
    // tapered sculptural cross section, not a flat overlay or collision path.
    const dx=Math.cos(angle),dz=Math.sin(angle),segments=7;
    const ring=t=>{
      const bend=Math.sin(t*Math.PI)*(.28+.13*hash(phase,13));
      const xx=x+dx*length*t-dz*bend*.5,zz=z+dz*length*t+dx*bend*.5;
      const cy=y+Math.sin(t*Math.PI)*(.65+.23*hash(phase,17))-.24*t;
      const width=(.18*(1-t)+.025)*(.9+hash(phase,27)*.2);
      return [[xx-dz*width,cy,zz+dx*width],
        [xx,cy+width*.32,zz], [xx+dz*width,cy,zz-dx*width]];
    };
    for(let j=0;j<segments;j++){
      const a=ring(j/segments),b=ring((j+1)/segments);
      quad('cliff',a[0],b[0],b[1],a[1],phase+j);
      quad('cliff',a[1],b[1],b[2],a[2],phase+j+1);
    }
    features.rootRibbons++;
  }
  for(const shore of shorelines){
    const segments=Math.ceil((shore.end-shore.start)/.85),rows=7;
    // Wavy terrain terraces. Each contour has two slope regimes and an
    // actual undercut rocky waterline, avoiding the old geometric slab edge.
    for(let j=0;j<rows;j++)for(let i=0;i<segments;i++){
      const u=shore.start+(shore.end-shore.start)*i/segments;
      const next=shore.start+(shore.end-shore.start)*(i+1)/segments;
      const a=bankPoint(shore,u,j/rows),b=bankPoint(shore,next,j/rows);
      const c=bankPoint(shore,next,(j+1)/rows),d=bankPoint(shore,u,(j+1)/rows);
      quad(j<rows-2?'moss':'cliff',a,b,c,d,(Math.floor(i/3)+j)%4);
    }
    for(let i=0;i<segments;i++){
      const u=shore.start+(shore.end-shore.start)*i/segments;
      const next=shore.start+(shore.end-shore.start)*(i+1)/segments;
      const top=bankPoint(shore,u,1),topNext=bankPoint(shore,next,1);
      const low=[top[0],-3.52,top[2]],lowNext=[topNext[0],-3.52,topNext[2]];
      quad('cliff',top,topNext,lowNext,low,i%5);
      features.waterlineSegments++;
    }
    // Dense but bounded volumetric fern/reed silhouettes at differentiated
    // shoreline elevations, never on active game cells or over the snake.
    for(let i=0;i<segments;i+=2){
      const t=shore.start+(shore.end-shore.start)*(i+.43)/segments;
      for(let n=0;n<2;n++){
        const v=.19+n*.31+hash(i+n,shore.id.length)*.11;
        const p=bankPoint(shore,t+(hash(i+31,n)-.5)*.48,v);
        const tall=.44+hash(i*3+n,shore.id.length+2)*.67;
        leaf(p[0],p[1],p[2],tall,t*.2+n*2.4,(i+n)%5,
          shore.id==='reeds-east'?'reeds':'fern');
      }
      // Rocky shelf projections break long coast strips into believable
      // chunks while remaining fully outside the board collision envelope.
      if(i%6===0){
        const p=bankPoint(shore,t,.75),size=.32+hash(i,13)*.44;
        block(p[0],p[1]-.22,p[2],size*1.35,.34,size,1,hash(i,4)*.3);
        features.ruinBlocks++;
      }
      // Slow-changing stone silhouettes interrupt otherwise long triangular
      // banks. Roots run OUTWARD from the board and never form a false path.
      if(i%4===0){
        const p=bankPoint(shore,t,.68),angle=shore.axis==='x'
          ?Math.sign(shore.far-shore.near)*Math.PI/2
          :shore.far>shore.near?0:Math.PI;
        boulder(p[0],p[1]-.22,p[2],.34+hash(i,19)*.20,
          .42+hash(i,21)*.30,hash(i,23)*Math.PI);
        if(i%10===0)rootRibbon(p[0],p[1]-.02,p[2],1.3+hash(i,41)*.5,
          angle,i+shore.id.length);
      }
    }
  }
  // Two overgrown bastions, fragmented arcade and a lower viewpoint: a
  // deliberate foreground-midground-backdrop hierarchy, not repeating pillars.
  const bastions=[[-W-4.4,H+4.1,1], [W+4.65,H+4.35,-1],
    [-W-5.9,-H-7.8,.6], [W+5.75,-H-8,-.7]];
  for(let n=0;n<bastions.length;n++){
    const [x,z,lean]=bastions[n],courseCount=n<2?5:3;
    block(x,-.56,z,2.4,.42,2.2,n);features.ruinBlocks++;
    for(let course=0;course<courseCount;course++){
      const cy=.02+course*.54,shift=lean*course*.055;
      for(let half=-1;half<=1;half+=2){
        if(n===1&&half===1&&course===4)continue; // broken silhouette
        if(n===2&&course===2&&half<0)continue;
        block(x+half*.55+shift,cy,z+(course%2)*.08,
          .92,.52,.88,(course+n+half+7)%5,(half*course)*.014);
        features.ruinBlocks++;
      }
    }
    block(x+lean*.22,courseCount*.54+.12,z,2.0,.24,1.8,(n+2)%5);
    features.ruinBlocks++;
    for(let i=0;i<9;i++){
      const a=i*2.399,rad=.55+hash(i,n+8)*.75;
      leaf(x+Math.cos(a)*rad,courseCount*.54+.27,z+Math.sin(a)*rad,
        .58+hash(i+n,4)*.36,a,n+i);
    }
    for(let i=0;i<4;i++){
      const a=(Math.sign(x)===1?0:Math.PI)+(i-1.5)*.39;
      rootRibbon(x,-.1,z+(i-1.5)*.25,1.15+hash(i,n)*.65,a,i+n*11);
      if(i%2===0)boulder(x+Math.cos(a)*1.2,-.42,z+Math.sin(a)*1.2,
        .35,.57,hash(n,i));
    }
  }
  // Broken low garden walls and substantial root/ivy pockets connect
  // architecture to banks without bridging the actual board.
  for(const side of [-1,1]){
    for(let k=0;k<10;k++){
      const x=side*(W+3.05+k*.35),z=H+4.1+k*.35;
      block(x,-.55-k*.045,z,.65,.43+hash(k,side)*.3,1.2,(k+2)%5,side*k*.02);
      features.ruinBlocks++;
      if(k%2===0)leaf(x,-.27-k*.045,z+.18,.8,side*.7,k);
    }
    for(let k=0;k<19;k++){
      const z=-H-7.3+k*.62,x=side*(W+4.2+Math.sin(k*.7)*.32);
      const y=-.4+Math.sin(k*.9)*.08;
      leaf(x,y,z,.55+hash(k,side)*.6,k*.9,k%5);
    }
  }
  // T1 canopy-and-arcade whole-shot composition: one continuous weathered
  // forest frame behind the *actual* board, not sprites or foreground UI.
  // Deterministic original 3D geometry is baked into existing four bands.
  function woodySegment(ax,ay,az,bx,by,bz,r0,r1,phase){
    const sides=6,dx=bx-ax,dy=by-ay,dz=bz-az,length=Math.hypot(dx,dy,dz)||1;
    const right=[dz/length,0,-dx/length];
    const size=Math.hypot(...right)||1;
    if(size<.1){right[0]=1;right[2]=0;}else{right[0]/=size;right[2]/=size;}
    const across=[dy*right[2]/length,(dz*right[0]-dx*right[2])/length,-dy*right[0]/length];
    const point=(t,i)=>{
      const a=2*Math.PI*i/sides+phase;
      const radius=t?r1:r0,cs=Math.cos(a),sn=Math.sin(a);
      return [ax+dx*t+radius*(right[0]*cs+across[0]*sn),
        ay+dy*t+radius*(right[1]*cs+across[1]*sn),
        az+dz*t+radius*(right[2]*cs+across[2]*sn)];
    };
    for(let i=0;i<sides;i++)quad('cliff',point(0,i),point(0,(i+1)%sides),
      point(1,(i+1)%sides),point(1,i),i+phase*13);
  }
  function canopyLeaf(x,y,z,a,span,phase){
    const dx=Math.cos(a),dz=Math.sin(a),side=[-dz,dx];
    const dip=.23*Math.sin(phase*1.17),w=span*(.24+.08*hash(phase,47));
    const base=[x,y,z],mid=[x+dx*span*.45,y+dip+.16,z+dz*span*.45];
    const tip=[x+dx*span,y+dip-.18,z+dz*span];
    const left=[mid[0]+side[0]*w,mid[1]-.09,mid[2]+side[1]*w];
    const right=[mid[0]-side[0]*w,mid[1]-.09,mid[2]-side[1]*w];
    // Folded upper blade, elevated midrib and irregular tip: not planar quads.
    tri('foliage',base,left,mid,phase);
    tri('foliage',base,mid,right,phase+1);
    tri('foliage',left,tip,mid,phase+2);
    tri('foliage',mid,tip,right,phase+3);
    features.canopyLeaflets++;
  }
  function hangingVine(x,y,z,phase,length){
    const segments=6,offset=(i)=>{
      const t=i/segments;
      return [x+Math.sin(phase+i*.8)*.14*t,y-length*t,z+Math.cos(phase+i*.72)*.17*t];
    };
    for(let i=0;i<segments;i++){
      const a=offset(i),b=offset(i+1),w=.055*(1-i/segments)+.015;
      quad('foliage',[a[0]-w,a[1],a[2]],[b[0]-w,b[1],b[2]],
        [b[0]+w,b[1],b[2]],[a[0]+w,a[1],a[2]],phase+i);
      if(i%2===0){
        canopyLeaf(a[0],a[1],a[2],phase*1.19+i, .21+.06*hash(i,phase),phase+i*5);
      }
    }
    features.hangingVines++;
  }
  function canopyTree(x,z,h,phase){
    const baseY=-.56,stemTop=baseY+h*.77;
    woodySegment(x,baseY,z,x+.15*Math.sin(phase),stemTop,z+.12*Math.cos(phase),
      .34,.15,phase);
    const crownX=x+.15*Math.sin(phase),crownZ=z+.12*Math.cos(phase);
    for(let branch=0;branch<7;branch++){
      const a=branch*Math.PI*2/7+phase*.31;
      const reach=.84+hash(branch,phase)*.68;
      const bx=crownX+Math.cos(a)*reach,bz=crownZ+Math.sin(a)*reach;
      const by=stemTop+.18+(hash(branch+9,phase)-.5)*.55;
      woodySegment(crownX,stemTop-.23,crownZ,bx,by,bz,.14,.065,phase+branch*.13);
      for(let leafIndex=0;leafIndex<14;leafIndex++){
        const spread=leafIndex*2.39996+branch*.41+phase;
        const rr=.25+hash(leafIndex+5,branch+phase)*.75;
        const heightOffset=(hash(branch*19+leafIndex,phase+44)-.5)*.72;
        const span=.54+hash(leafIndex*2,phase+branch)*.48;
        canopyLeaf(bx+Math.cos(spread)*rr,by+heightOffset,bz+Math.sin(spread)*rr,
          spread,span,phase*41+branch*14+leafIndex);
      }
      if(branch%3===0)hangingVine(bx,by-.23,bz,phase+branch,
        .8+hash(branch,phase)*.65);
    }
    features.canopyTrees++;
  }
  // Six rear trees, staggered in depth, frame the authentic gameplay board.
  // Two near-camera wings make the ocean edge a lush inhabited diorama.
  const forest=[
    [-W*.78,-H-9.25,5.35,.2],[-W*.45,-H-10.15,5.65,1.4],
    [-W*.09,-H-9.45,5.1,2.5],[W*.27,-H-10.4,5.75,3.7],
    [W*.61,-H-9.75,5.35,4.8],[W*.86,-H-10.5,5.5,5.7],
    [-W-5.35,H+4.6,4.4,.65],[W+5.5,H+4.35,4.55,2.3]
  ];
  for(const [x,z,h,p] of forest)canopyTree(x,z,h,p);
  // A fractured, vine-rooted four-bay arched aqueduct gives the rear shore
  // a single recognizable architectural silhouette and a believable history.
  // The arch tunnels remain OPEN; the fake decorative masonry never sits on
  // navigable game coordinates or changes a portal/collision.
  const zArch=-H-8.15,halfBay=Math.min(2.15,Math.max(1.45,W*.135));
  const bayStep=halfBay*2.25;
  const pillarXs=Array.from({length:5},(_,i)=>(i-2)*bayStep);
  for(let i=0;i<pillarXs.length;i++){
    const x=pillarXs[i];
    for(let course=0;course<4;course++){
      const cracked=(i===3&&course===3)?-.28:0;
      block(x+cracked,-.37+course*.55,zArch,.70,.55,.84,i+course,course*.012);
      features.arcadeStones++;
    }
    if(i%2===0){
      rootRibbon(x,-.2,zArch+.32,1.15,Math.PI*.46+i*.07,100+i);
      hangingVine(x,-.04+4*.55,zArch+.3,14+i,.91+i*.13);
    }
  }
  for(let bay=0;bay<4;bay++){
    const center=(pillarXs[bay]+pillarXs[bay+1])/2;
    const archRadius=bayStep*.48,outerRadius=archRadius+.35;
    const steps=12,archZ=zArch;
    const point=(radius,angle,z)=>[center+Math.cos(angle)*radius,
      2.05+Math.sin(angle)*radius,z];
    for(let j=0;j<steps;j++){
      // Two damaged keystones break an otherwise too-perfect repeated arcade.
      if((bay===1&&j===4)||(bay===3&&j===7))continue;
      const a=j*Math.PI/steps,b=(j+1)*Math.PI/steps;
      const front=archZ+.43,back=archZ-.43;
      quad('ruin',point(archRadius,a,front),point(outerRadius,a,front),
        point(outerRadius,b,front),point(archRadius,b,front),bay+j);
      quad('ruin',point(archRadius,a,back),point(archRadius,b,back),
        point(outerRadius,b,back),point(outerRadius,a,back),bay+j+1);
      quad('ruin',point(archRadius,a,front),point(archRadius,b,front),
        point(archRadius,b,back),point(archRadius,a,back),bay+j+2);
      quad('ruin',point(outerRadius,a,back),point(outerRadius,b,back),
        point(outerRadius,b,front),point(outerRadius,a,front),bay+j+3);
      features.arcadeStones++;
    }
    for(let j=0;j<3;j++){
      const theta=(j+.5)*Math.PI/3,xx=center+Math.cos(theta)*outerRadius;
      const yy=2.05+Math.sin(theta)*outerRadius;
      hangingVine(xx,yy,zArch+.42,bay*5+j,
        .68+hash(bay,j)*.73);
    }
    features.arcadeArches++;
  }
  // BEGIN T1 LIVING WATER GARDEN
  // Four full-length riparian planting belts soften the former bright-green
  // rectilinear bank, joining the broken aqueduct and main courtyard to the
  // surrounding TRUE water surface. All rooted rushes live outside gameplay;
  // every sculpted floating leaf is above the real lake, never a fake 2D card.
  // All work bakes into the EXISTING four static material batches: zero new
  // draw calls, materials, textures, shaders, dynamic passes or collisions.
  const lilies=new THREE.Color();
  function tintedTriangle(layer,a,b,c,hex){
    const mesh=bands.get(layer),tint=lilies.setHex(hex);
    const points=[a,b,c];
    for(const pt of points){
      mesh.p.push(pt[0],pt[1],pt[2]);
      mesh.c.push(tint.r,tint.g,tint.b);
      mesh.uv.push(pt[0]*.11,pt[2]*.11);
    }
  }
  function waterLily(x,z,phase,bloom){
    const radius=.27+hash(phase,91)*.19;
    const angle=hash(phase,23)*Math.PI*2;
    const waterY=-3.49;
    const center=[x,waterY+.045,z];
    for(let j=0;j<7;j++){
      const a=angle+j*Math.PI*2/7,b=angle+(j+1)*Math.PI*2/7;
      const r0=radius*(.90+hash(phase+j,6)*.1);
      const r1=radius*(.90+hash(phase+j+1,6)*.1);
      // The small opened notch is a recognizable floating lily leaf; the
      // folded tip is real 3D and breaks the identical-cartoon-disc pattern.
      const t0=[x+Math.cos(a)*r0,waterY+.022*Math.sin(j*2+phase),z+Math.sin(a)*r0];
      const t1=[x+Math.cos(b)*r1,waterY+.022*Math.cos(j+phase),z+Math.sin(b)*r1];
      if(j!==0)tintedTriangle('foliage',center,t0,t1,[0x276b48,0x398353,0x579a58,0x78a665][j%4]);
    }
    features.waterGardenPads++;
    if(!bloom)return;
    const flowerY=waterY+.12;
    for(let i=0;i<6;i++){
      const a=angle+i*Math.PI/3;
      const side=[-Math.sin(a),Math.cos(a)],len=.19+hash(phase,i)*.10;
      const base=[x,flowerY,z];
      const left=[x+Math.cos(a)*len*.54+side[0]*.095,flowerY+.10,z+Math.sin(a)*len*.54+side[1]*.095];
      const tip=[x+Math.cos(a)*len,flowerY+.27,z+Math.sin(a)*len];
      const right=[x+Math.cos(a)*len*.54-side[0]*.095,flowerY+.10,z+Math.sin(a)*len*.54-side[1]*.095];
      tintedTriangle('foliage',base,left,tip,i%2?0xfbd9b1:0xffd7e4);
      tintedTriangle('foliage',base,tip,right,i%2?0xf6b5b7:0xffeed5);
    }
    features.waterGardenBlooms++;
  }
  features.waterGardenBeds=0;
  features.waterGardenPads=0;
  features.waterGardenBlooms=0;
  features.waterGardenRushes=0;
  for(const shore of shorelines){
    // Six staggered wetland beds per bank; individual pads vary in diameter,
    // height, yaw and warm/cool flowering accents. The embedded rushes join
    // each floating group to its actual eroded shoreline and roots.
    for(let bed=0;bed<6;bed++){
      const t=shore.start+(shore.end-shore.start)*(bed+.56)/6;
      const out=Math.sign(shore.far-shore.near);
      const offshore=shore.far+out*(1.03+.12*hash(bed,shore.id.length));
      const ox=shore.axis==='x'?t:offshore;
      const oz=shore.axis==='x'?offshore:t;
      for(let pad=0;pad<8;pad++){
        const phase=bed*29+pad*11+shore.id.length;
        const radius=.20+.26*hash(phase,50);
        const theta=pad*2.39996+hash(phase,15)*.24;
        const xx=ox+Math.cos(theta)*radius*1.9;
        const zz=oz+Math.sin(theta)*radius*1.7;
        waterLily(xx,zz,phase,pad===1||pad===4||pad===7);
      }
      for(let stalk=0;stalk<2;stalk++){
        const p=bankPoint(shore,t+(stalk-.5)*.75,.85);
        leaf(p[0],p[1]-.08,p[2],.93+hash(bed,stalk+7)*.64,
          t*.21+stalk*1.7,bed+stalk, 'reeds');
        features.waterGardenRushes++;
      }
      features.waterGardenBeds++;
    }
  }
  // The distant wetland cannot be credible if its formerly high-key uniform
  // grass remains neon lime. Regrade the existing physically lit batches,
  // preserving each original vertex color, topology and material count.
  bands.get('moss').color=0x839b83;
  bands.get('cliff').color=0xaab19b;
  bands.get('ruin').color=0xd9ccad;
  bands.get('foliage').color=0xb3c4ac;
  // END T1 LIVING WATER GARDEN
  // BEGIN T1 ESCARPMENT AMPHITHEATRE
  // Large sculpted shoreline masses and foreground-scale tree canopies form a
  // readable foreground / midground / ruined-arcade depth progression in the
  // ACTUAL game. All vertices stay outside navigable public cells; no sprites,
  // path hints, simulation changes, new shader passes, meshes or loaded assets.
  const stageTriangles=()=>Array.from(bands.values()).reduce((sum,b)=>sum+b.p.length/9,0);
  const stageBefore=stageTriangles();
  features.terracedPromontories=0;
  features.amphitheatreFerns=0;
  features.amphitheatreRoots=0;
  features.foregroundCanopies=0;
  function sculptPromontory(shore,t,phase){
    const bank=bankPoint(shore,t,.62),segments=9;
    const radius=2.12+.44*hash(phase,94),azimuth=hash(phase,35)*Math.PI*2;
    const levels=[[-.48,1],[.38,.82],[1.68,.53],[3.22,.24]];
    const ring=(level,k)=>{
      const a=k*Math.PI*2/segments+azimuth;
      const [elevation,spread]=levels[level];
      const broken=.83+.32*hash(k+phase*4,level+17);
      const r=radius*spread*broken;
      return [bank[0]+Math.cos(a)*r,
        bank[1]+elevation+(hash(k+phase,level+54)-.5)*.21,
        bank[2]+Math.sin(a)*r];
    };
    // BEGIN T1 TERRACED MASS CAPTURE
    // Track this one promontory's existing packed cliff and moss triangles.
    // Geometry is resculpted in place: exactly zero new triangles or draws.
    const originalCliffStart=bands.get('cliff').p.length;
    const originalMossStart=bands.get('moss').p.length;
    // END T1 TERRACED MASS CAPTURE
    for(let j=0;j<3;j++)for(let k=0;k<segments;k++){
      const next=(k+1)%segments;
      quad(j===2?'moss':'cliff',ring(j,k),ring(j,next),
        ring(j+1,next),ring(j+1,k),phase+k+j);
    }
    const crest=[bank[0]+.19*Math.sin(phase),bank[1]+3.78+(hash(phase,113)-.5)*.85,bank[2]+.14*Math.cos(phase)];
    for(let k=0;k<segments;k++)
      tri('moss',ring(3,k),ring(3,(k+1)%segments),crest,phase+k);
    // BEGIN T1 TERRACED MASS REPROFILE
    // Replace eight identical pointed spoil heaps with cliff-backed terraced
    // outcrops. The upper bands widen into fractured horizontal shelves, with
    // wind-carved relief retained in the existing 1,931 authored triangles.
    for(const [type,start] of [['cliff',originalCliffStart],['moss',originalMossStart]]){
      const points=bands.get(type).p;
      for(let i=start;i<points.length;i+=3){
        const rise=points[i+1]-bank[1];
        if(rise<.30)continue;
        const dx=points[i]-bank[0],dz=points[i+2]-bank[2];
        const angle=Math.atan2(dz,dx),scar=Math.sin(angle*3.1+phase*1.4);
        const strata=Math.sin(angle*6.8-phase*.38)*.10+scar*.13;
        const shelf=rise>2.90?1.62:rise>1.35?1.21:1.05;
        points[i]=bank[0]+dx*shelf;
        points[i+2]=bank[2]+dz*shelf;
        if(rise>2.90){
          points[i+1]=bank[1]+2.45+strata*.52;
        }else if(rise>1.35){
          points[i+1]=bank[1]+1.38+strata*.58;
        }else{
          points[i+1]=bank[1]+.61+strata*.43;
        }
      }
    }
    // BEGIN T1 BROKEN SHORE SHELF STAGING
    // Flatten the eight original cone-like crests into wider old-stone
    // landings with a rugged, genuinely low silhouette. Author into the
    // existing geometry vertices after the parent terrace source is captured:
    // no mesh, draw, texture, triangle, physics or collision allocations.
    for(const [kind,start] of [['cliff',originalCliffStart],['moss',originalMossStart]]){
      const positions=bands.get(kind).p;
      for(let j=start;j<positions.length;j+=3){
        const relative=positions[j+1]-bank[1];
        if(relative<.35)continue;
        const dx=positions[j]-bank[0],dz=positions[j+2]-bank[2];
        const bearing=Math.atan2(dz,dx);
        const bedding=Math.sin(bearing*5.2+phase*1.81)*.045
          +Math.cos(bearing*8.1-phase*.94)*.028;
        if(relative>2.03){
          positions[j+1]=bank[1]+1.71+bedding;
          positions[j]=bank[0]+dx*1.07;
          positions[j+2]=bank[2]+dz*1.07;
        }else if(relative>1.04){
          positions[j+1]=bank[1]+1.02+bedding*.82;
        }else{
          positions[j+1]=bank[1]+.51+bedding*.57;
        }
      }
    }
    // BEGIN T1 CONNECTED COASTAL RIDGES
    // Treat the eight already-authored rocky landforms as four continuous
    // shore-long geological systems rather than eight isolated circular cones.
    // Reuse their exact packed vertices and all existing stone/moss faces:
    // zero new triangles, draw calls, shaders, textures or gameplay surfaces.
    const along=shore.axis==='x'?0:2;
    const shoreLength=shore.end-shore.start;
    const elongation=Math.min(5,shoreLength*.26/(radius*.90));
    for(const [layer,start] of [['cliff',originalCliffStart],['moss',originalMossStart]]){
      const points=bands.get(layer).p;
      for(let i=start;i<points.length;i+=3){
        const rise=points[i+1]-bank[1];
        const local=points[i+along]-bank[along];
        // The broad lowest course links neighboring outcrops while the
        // upper irregular crown remains distinct, readable ruined geology.
        const support=rise<.38?1:rise<.83?.95:rise<1.38?.84:.49;
        const strataFold=.065*Math.sin(local*.91+phase*1.71)
          +.037*Math.sin(local*1.62-phase*.63);
        points[i+along]=bank[along]+local*elongation*support;
        if(rise>.35)points[i+1]+=strataFold*support;
      }
    }
    // END T1 CONNECTED COASTAL RIDGES
    // END T1 BROKEN SHORE SHELF STAGING
    // END T1 TERRACED MASS REPROFILE
    // Vegetation sits on the same authored mass and leans OUTWARD, away
    // from the live snake, hazard/food/portal geometry and game camera.
    const outward=shore.axis==='x'
      ? Math.sign(shore.far-shore.near)*Math.PI/2
      : shore.far>shore.near?0:Math.PI;
    const plantX=bank[0]+Math.cos(outward)*radius*.68;
    const plantZ=bank[2]+Math.sin(outward)*radius*.68;
    leaf(plantX,bank[1]+.47,plantZ,.88+hash(phase,72)*.40,
      outward+.32,phase,'fern');
    features.amphitheatreFerns++;
    if(phase%2===1){
      rootRibbon(bank[0],bank[1]+.08,bank[2],1.19,
        outward,phase+301);
      features.amphitheatreRoots++;
    }
    if(phase===1){
      boulder(bank[0]+Math.cos(outward)*radius*.42,bank[1]-.28,
        bank[2]+Math.sin(outward)*radius*.42,.61,.67,hash(phase,33)*Math.PI);
    }
    features.terracedPromontories++;
  }
  for(let shoreIndex=0;shoreIndex<shorelines.length;shoreIndex++){
    const shore=shorelines[shoreIndex];
    for(let n=0;n<2;n++){
      const t=shore.start+(shore.end-shore.start)*(.24+n*.50);
      sculptPromontory(shore,t,shoreIndex*2+n+1);
    }
  }
  // Two large original branch-and-leaf canopies create near-camera parallax
  // on the OPEN wings; the authentic board and portal coordinates stay clear.
  for(const [x,z,h,phase] of [
    [-W-7.25,H+5.80,7.05,8.1],
    [W+7.1,H+5.65,7.30,9.2]
  ]){
    canopyTree(x,z,h,phase);
    features.foregroundCanopies++;
  }
  // Cooler undergrowth and warm weathered stone tie the added 3D topography
  // back to the original flooded-quarry palette without a new material.
  bands.get('moss').color=0x76907a;
  bands.get('cliff').color=0x879787;
  bands.get('ruin').color=0xc9c4ad;
  bands.get('foliage').color=0xa2c2a6;
  features.amphitheatreTriangles=stageTriangles()-stageBefore;
  // END T1 ESCARPMENT AMPHITHEATRE
  // A shared-vertex terrain should read as rolling soil, not a topographic
  // collection of separate flat triangles. Smooth only organic bands; ruins
  // deliberately keep their masonry edges and foliage retains folded ridges.
  function softenTerrainNormals(g){
    const p=g.getAttribute('position'),n=g.getAttribute('normal');
    const weighted=new Map();
    for(let i=0;i<p.count;i++){
      const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');
      let v=weighted.get(key);
      if(!v)weighted.set(key,v=[0,0,0]);
      v[0]+=n.getX(i);v[1]+=n.getY(i);v[2]+=n.getZ(i);
    }
    for(let i=0;i<p.count;i++){
      const key=[p.getX(i),p.getY(i),p.getZ(i)].map(v=>v.toFixed(5)).join(',');
      const v=weighted.get(key),length=Math.hypot(...v)||1;
      n.setXYZ(i,v[0]/length,v[1]/length,v[2]/length);
    }
    n.needsUpdate=true;
  }
  for(const [key,b] of bands){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));
    g.computeVertexNormals();
    if(key==='moss'||key==='cliff')softenTerrainNormals(g);
    g.computeBoundingBox();g.computeBoundingSphere();
    ownGeometry.push(g);
    const m=new THREE.MeshStandardMaterial({
      color:b.color,vertexColors:true,roughness:b.roughness,
      side:THREE.DoubleSide,map:key==='foliage'?null:weathering,
      metalness:0
    });
    ownMaterials.push(m);
    const mesh=new THREE.Mesh(g,m);
    mesh.name='Living garden / '+key;
    mesh.userData.staticWorld=true;
    mesh.castShadow=false;mesh.receiveShadow=true;
    group.add(mesh);
  }
  function stats(){
    return {meshCount:group.children.length,shoreSections:features.shoreSections,
      plantBlades:features.plantBlades,fernFronds:features.fernFronds,
      ruinBlocks:features.ruinBlocks,roundedBoulders:features.roundedBoulders,
      rootRibbons:features.rootRibbons,waterlineSegments:features.waterlineSegments,
      canopyTrees:features.canopyTrees,canopyLeaflets:features.canopyLeaflets,
      arcadeArches:features.arcadeArches,arcadeStones:features.arcadeStones,
      hangingVines:features.hangingVines,
      // BEGIN T1 AMPHITHEATRE STATS
      terracedPromontories:features.terracedPromontories,
      amphitheatreFerns:features.amphitheatreFerns,
      amphitheatreRoots:features.amphitheatreRoots,
      foregroundCanopies:features.foregroundCanopies,
      amphitheatreTriangles:features.amphitheatreTriangles,
      // END T1 AMPHITHEATRE STATS
      // BEGIN T1 WATER GARDEN STATS
      waterGardenBeds:features.waterGardenBeds,waterGardenPads:features.waterGardenPads,
      waterGardenBlooms:features.waterGardenBlooms,waterGardenRushes:features.waterGardenRushes,
      // END T1 WATER GARDEN STATS
      triangles:ownGeometry.reduce((n,g)=>n+g.attributes.position.count/3,0),
      textures:1,disposed};
  }
  function dispose(){
    if(disposed)return;disposed=true;
    group.clear();
    for(const geometry of ownGeometry)geometry.dispose();
    for(const material of ownMaterials)material.dispose();
    weathering.dispose();
  }
  return {group,stats,dispose};
}
