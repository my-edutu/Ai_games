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
  function vertex(layer,point,index) {
    const b=bands.get(layer),colors=rgb.get(layer);
    // Ruin shelves can request a fractional palette phase. Quantize before
    // indexing: JS arrays do not accept numeric fractional property keys.
    // A missing tint previously threw during world creation and silently
    // forced every real WebGL game view onto the safety canvas.
    const paletteIndex=((Math.floor(index)%colors.length)+colors.length)%colors.length;
    const tint=colors[paletteIndex];
    b.p.push(point[0],point[1],point[2]);
    b.c.push(tint.r,tint.g,tint.b);
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
  const features={shoreSections:shorelines.length,plantBlades:0,ruinBlocks:0,waterlineSegments:0};
  const bankPoint=(s,t,v)=>{
    const warp=(Math.sin(t*.43+v*1.7)+Math.sin(t*.91-1.2))*.27*v;
    const outer=s.near+(s.far-s.near)*v+warp;
    const x=s.axis==='x'?t:outer,z=s.axis==='x'?outer:t;
    const relief=.11*Math.sin(t*.57+v*4.2)+.16*(smooth(t*.39+12,v*3+21)-.5);
    const y=-.42-.95*v+.14*Math.sin(t*.31+2)+relief;
    return [x,y,z];
  };
  function leaf(x,y,z,height,angle,shade) {
    // Three blades form a small fan with folded blade ridges and visible depth.
    for(let i=0;i<3;i++){
      const a=angle+(i-1)*.46,dx=Math.cos(a),dz=Math.sin(a),side=.13+height*.08;
      const base=[x+(i-1)*.12,y,z],mid=[x+dx*height*.34,y+height*.62,z+dz*height*.34];
      const tip=[x+dx*height*.54,y+height,z+dz*height*.54];
      const left=[mid[0]-dz*side,mid[1]-.055,mid[2]+dx*side];
      const right=[mid[0]+dz*side,mid[1]-.055,mid[2]-dx*side];
      tri('foliage',base,left,tip,shade+i);
      tri('foliage',base,tip,right,shade+i+1);
      features.plantBlades++;
    }
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
        leaf(p[0],p[1],p[2],tall,t*.2+n*2.4,(i+n)%5);
      }
      // Rocky shelf projections break long coast strips into believable
      // chunks while remaining fully outside the board collision envelope.
      if(i%6===0){
        const p=bankPoint(shore,t,.75),size=.32+hash(i,13)*.44;
        block(p[0],p[1]-.22,p[2],size*1.35,.34,size,1,hash(i,4)*.3);
        features.ruinBlocks++;
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
  for(const [key,b] of bands){
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(b.p,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(b.c,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(b.uv,2));
    g.computeVertexNormals();g.computeBoundingBox();g.computeBoundingSphere();
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
      plantBlades:features.plantBlades,ruinBlocks:features.ruinBlocks,
      waterlineSegments:features.waterlineSegments,
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
