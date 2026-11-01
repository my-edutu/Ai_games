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
    ruinBlocks:0,roundedBoulders:0,rootRibbons:0,waterlineSegments:0};
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
