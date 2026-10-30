/** Original procedural verdant-ruins diorama. No simulation state is retained or changed. */
export function createWorld(THREE, {width, height}) {
  if (!Number.isInteger(width) || !Number.isInteger(height) || width < 2 || height < 2) throw new Error('World requires integer board dimensions');
  const group = new THREE.Group(); group.name = 'Verdant ruins';
  const geometries = new Set(), materials = new Set(), textures = new Set();
  const geometry = g => (geometries.add(g), g);
  const material = p => { const m = new THREE.MeshStandardMaterial(p); materials.add(m); return m; };
  let seed = 827621;
  const random = () => ((seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0) / 4294967296);
  const noise = (x,y) => { const n = Math.sin(x * 127.1 + y * 311.7) * 43758.5453; return n - Math.floor(n); };
  const smoothNoise = (x,y) => {
    const ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy,tx=fx*fx*(3-2*fx),ty=fy*fy*(3-2*fy);
    return (noise(ix,iy)*(1-tx)+noise(ix+1,iy)*tx)*(1-ty)+(noise(ix,iy+1)*(1-tx)+noise(ix+1,iy+1)*tx)*ty;
  };
  const fade = (a,b,v) => { const t=Math.max(0,Math.min(1,(v-a)/(b-a)));return t*t*(3-2*t); };
  // Limestone color lives at the scale of worn blocks, with restrained grain.
  // All detail is baked once into the existing maps; no extra shader channels.
  function stoneTexture(moss = false) {
    const size = 256, data = new Uint8Array(size * size * 4);
    for (let y=0;y<size;y++) for (let x=0;x<size;x++) {
      const u=(x+.5)/size,v=(y+.5)/size,edge=Math.min(u,1-u,v,1-v);
      const cloud=smoothNoise(x/46,y/58),mineral=smoothNoise(x/14+17,y/17+51);
      const warmth=(smoothNoise(x/96+7,y/83+31)-.5)*.12;
      const recess=(1-fade(.008,.055,edge))*.09;
      const chalk=(fade(.012,.04,edge)-fade(.04,.11,edge))*(.018+fade(.35,.65,mineral)*.04);
      const value=.65+cloud*.23+mineral*.09+(noise(x,y)-.5)*.018-recess+chalk;
      const patina=moss?fade(.42,.67,smoothNoise(x/65+51,y/65+31))*.8:0;
      const i = (y*size+x)*4;
      data[i] = Math.min(255,255 * (value+warmth) * (1-patina*.36));
      data[i+1] = Math.min(255,255 * (value*.99-warmth*.13) * (1-patina*.18));
      data[i+2] = Math.min(255,255 * (value*.92-warmth*.48) * (1-patina*.56));
      data[i+3] = 255;
    }
    const t = new THREE.DataTexture(data,size,size); t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.colorSpace=THREE.SRGBColorSpace; t.magFilter=THREE.LinearFilter; t.minFilter=THREE.LinearMipmapLinearFilter; t.generateMipmaps=true; t.needsUpdate=true; textures.add(t); return t;
  }
  const stoneMap=stoneTexture(), mossMap=stoneTexture(true);
  const stone=material({color:0xb5bba0,map:stoneMap,roughness:.93});
  const fieldMap=fieldTexture();
  const tileMat=material({color:0xc3c4ad,map:fieldMap,roughness:.94});
  // Field UVs are baked in world coordinates when static geometry is merged below.
  function fieldTexture(){
    const w=1024,h=512,data=new Uint8Array(w*h*4);
    const slabTones=new Float32Array(width*height*2);
    for(let z=0;z<height;z++)for(let x=0;x<width;x++){
      const i=(z*width+x)*2;
      // Correlated quarry tones prevent a random checkerboard of pale/dark cells.
      slabTones[i]=(noise(x+41,z+37)-.5)*.075+(smoothNoise(x*.54+11,z*.54+9)-.5)*.16;
      slabTones[i+1]=(smoothNoise(x*.5+117,z*.5+53)-.5)*.09+(noise(x+117,z+53)-.5)*.025;
    }
    for(let y=0;y<h;y++)for(let x=0;x<w;x++){
      const gx=(x+.5)/w*width,gz=(y+.5)/h*height,cx=Math.floor(gx),cz=Math.floor(gz),u=gx-cx,v=gz-cz;
      const edge=Math.min(u,1-u,v,1-v),border=Math.min(gx,width-gx,gz,height-gz);
      // Warm/cool slabs share a broad mineral field, keeping color variation
      // larger than grain without implying a different playable elevation.
      const toneIndex=(cz*width+cx)*2,cloud=smoothNoise(gx*.19+5,gz*.20+17);
      const mineral=smoothNoise(gx*2.8+23,gz*2.8+41),warmth=slabTones[toneIndex+1];
      const recess=(1-fade(.006,.045,edge))*.045;
      const chalk=(fade(.018,.05,edge)-fade(.05,.095,edge))*(.012+fade(.35,.7,mineral)*.03);
      const patina=(1-fade(.25,2,border))*(.025+smoothNoise(gx*.8+60,gz*.8+80)*.055);
      const value=.84+slabTones[toneIndex]+(cloud-.5)*.10+(mineral-.5)*.035+(noise(x,y)-.5)*.007-recess+chalk;
      const i=(y*w+x)*4;
      data[i]=Math.min(255,255*(value+warmth*.46-patina*.45));
      data[i+1]=Math.min(255,255*(value-warmth*.08-patina*.24));
      data[i+2]=Math.min(255,255*(value*.94-warmth*.62-patina*.57));
      data[i+3]=255;
    }
    // Sparse hairline fractures stay subordinate to the broad slab treatment.
    for(let c=0;c<38;c++){
      let x=noise(c,52)*(w-2),y=noise(c,98)*(h-2),angle=noise(c,12)*6.28;
      for(let n=0;n<5+noise(c,22)*16;n++){x+=Math.cos(angle);y+=Math.sin(angle);angle+=(noise(c,n)-.5)*.75;const px=Math.floor(x),py=Math.floor(y);if(px>0&&px<w&&py>0&&py<h){const i=(py*w+px)*4;data[i]*=.82;data[i+1]*=.84;data[i+2]*=.85;}}
    }
    const t=new THREE.DataTexture(data,w,h);t.colorSpace=THREE.SRGBColorSpace;t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;textures.add(t);return t;
  }
  const cliff=material({color:0x75816b,map:stoneMap,roughness:1});
  const darkStone=material({color:0x475957,map:stoneMap,roughness:.91});
  const moss=material({color:0x4d702c,map:mossMap,roughness:1});
  const wood=material({color:0x655744,map:stoneMap,roughness:1});
  const leafMat=material({color:0x78a939,roughness:.76,side:THREE.DoubleSide});
  const leafDark=material({color:0x2d663a,roughness:.84,side:THREE.DoubleSide});
  const leafLight=material({color:0xa7bf43,roughness:.72,side:THREE.DoubleSide});
  const flower=material({color:0xefb0c0,roughness:.65});
  const gold=material({color:0xe8c374,metalness:.28,roughness:.43});
  // A bevel around the stone top with an open hidden underside: 18 triangles, versus
  // 108 for the old subdivided cube. Silhouette and top highlights remain intact.
  const cube=geometry(bevelBlock(.08));
  const tile=geometry(bevelBlock(.013));
  function bevelBlock(bevel){
    const p=[],uv=[],indices=[];
    const levels=[{r:.5-bevel,y:.5},{r:.5,y:.5-bevel},{r:.5,y:-.5}];
    for(const {r,y} of levels)for(const [x,z] of [[-r,-r],[-r,r],[r,r],[r,-r]]){p.push(x,y,z);uv.push(x+.5,z+.5);}
    indices.push(0,1,2,0,2,3);
    for(let l=0;l<2;l++)for(let i=0;i<4;i++){const a=l*4+i,b=l*4+(i+1)%4;indices.push(a,a+4,b,b,a+4,b+4);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(p,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);const flat=g.toNonIndexed();g.dispose();flat.computeVertexNormals();
    // The visible side courses need their full stone face, not the single
    // stretched texture row produced by a top-only planar projection.
    const pos=flat.attributes.position,norm=flat.attributes.normal,tex=flat.attributes.uv;
    for(let i=0;i<pos.count;i++){
      const nx=Math.abs(norm.getX(i)),ny=Math.abs(norm.getY(i)),nz=Math.abs(norm.getZ(i));
      if(ny>=nx&&ny>=nz)tex.setXY(i,pos.getX(i)+.5,pos.getZ(i)+.5);
      else if(nx>nz)tex.setXY(i,pos.getZ(i)+.5,pos.getY(i)+.5);
      else tex.setXY(i,pos.getX(i)+.5,pos.getY(i)+.5);
    }
    return flat;
  }
  const rock=geometry(new THREE.IcosahedronGeometry(1,1));
  const sphere=geometry(new THREE.SphereGeometry(1,12,8));
  const petal=geometry(new THREE.OctahedronGeometry(1));
  const stem=geometry(new THREE.CylinderGeometry(.65,1,1,5,1,true));
  const ring=geometry(new THREE.TorusGeometry(.37,.045,4,20));
  const leaf=geometry(makeLeaf());
  function makeLeaf(){
    const vs=[],uv=[],indices=[],N=3;
    for(let j=0;j<=N;j++){const t=j/N,w=Math.sin(t*Math.PI)*.32,z=.23*t*t;vs.push(-w,t,z,w,t,z,0,t,z+.065*Math.sin(t*Math.PI));uv.push(0,t,1,t,.5,t);}
    for(let j=0;j<N;j++){let a=j*3,b=(j+1)*3;if(j>0)indices.push(a,b,a+2,a+2,b+1,a+1);if(j<N-1)indices.push(b,b+2,a+2,a+2,b+2,b+1);}
    const g=new THREE.BufferGeometry();g.setAttribute('position',new THREE.Float32BufferAttribute(vs,3));g.setAttribute('uv',new THREE.Float32BufferAttribute(uv,2));g.setIndex(indices);g.computeVertexNormals();return g;
  }
  const batches=new Map(), obj=new THREE.Object3D(), color=new THREE.Color();
  function add(g,m,x,y,z,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0,tint=null){
    const key=g.uuid+m.uuid;let b=batches.get(key);if(!b){b={g,m,items:[]};batches.set(key,b);}
    obj.position.set(x,y,z);obj.rotation.set(rx,ry,rz);obj.scale.set(sx,sy,sz);obj.updateMatrix();b.items.push({matrix:obj.matrix.clone(),tint});
  }
  function branch(a,b,r1=.13){
    const d=new THREE.Vector3().subVectors(b,a);obj.position.copy(a).add(b).multiplyScalar(.5);obj.quaternion.setFromUnitVectors(new THREE.Vector3(0,1,0),d.clone().normalize());obj.scale.set(r1,d.length(),r1);obj.updateMatrix();
    const key=stem.uuid+wood.uuid; if(!batches.has(key))batches.set(key,{g:stem,m:wood,items:[]});batches.get(key).items.push({matrix:obj.matrix.clone()});
  }
  const W=width/2,H=height/2;
  // A quiet, exact playing field with very fine joints; no foliage is placed inside it.
  add(cube,darkStone,0,-.27,0,width+.18,.46,height+.18);
  for(let z=0;z<height;z++)for(let x=0;x<width;x++){
    const shade=.965+random()*.055;color.setRGB(shade,shade,shade);
    add(tile,tileMat,x-(width-1)/2,-.105,z-(height-1)/2,.994,.21,.994,0,0,0,color.clone());
  }
  // Terraced structural stone, rubble and topsoil form one coherent island silhouette.
  add(cube,cliff,0,-1.6,0,width+2.3,2.8,height+2.4);
  add(cube,moss,0,-.39,0,width+2.6,.38,height+2.8);
  // The rear terrace physically supports the arch and tree roots.
  add(cube,cliff,0,-1.55,-H-2.2,width+2.6,2.8,4.5);
  add(cube,moss,0,-.3,-H-2.2,width+2.9,.24,4.55);
  for(let x=-W;x<=W;x+=1.8) {
    add(cube,stone,x,-.6,-H-4.3,1.7,.75,.7,0,(random()-.5)*.05,0);
    add(cube,cliff,x,-1.5,-H-4.15,1.7,.92,.8,0,(random()-.5)*.04,0);
  }
  for(let tier=0;tier<3;tier++){
    const y=-.6-tier*.87;
    for(let edge=0;edge<4;edge++){
      const horizontal=edge<2,len=horizontal?width+2:height+2;
      for(let i=0;i<len;i+=1.6){const spread=1.4+random()*.5;
        const x=horizontal?i-len/2+.8:(edge===2?-W-1:W+1);
        const z=horizontal?(edge===0?-H-1:H+1):i-len/2+.8;
        add(cube,tier===0?stone:cliff,x+(random()-.5)*.17,y,z+(random()-.5)*.17,horizontal?spread:1.05,.69+random()*.18,horizontal?1.05:spread,0,(random()-.5)*.07,(random()-.5)*.035);
      }
    }
  }
  // An eroded ornamental frieze rewards closer views of the island's front.
  for(let x=-W+1;x<W;x+=2.6){
    add(cube,darkStone,x,-1.48,H+1.53,.65,.63,.045);
    add(ring,stone,x,-1.48,H+1.57,.58,.58,.35,0,0,Math.PI/4);
    add(cube,gold,x,-1.48,H+1.6,.08,.23,.04,0,0,.65);
  }
  // A narrow dressed-stone coping makes board limits unambiguous.
  for(let x=-W+.5;x<W;x+=1){add(cube,stone,x,-.09,-H-.32,.97,.34,.49);add(cube,stone,x,-.09,H+.32,.97,.34,.49);}
  for(let z=-H+.5;z<H;z+=1){add(cube,stone,-W-.32,-.09,z,.49,.34,.97);add(cube,stone,W+.32,-.09,z,.49,.34,.97);}
  // Shallow incised brass corners connect the ruins and board aesthetic.
  for(const sx of [-1,1])for(const sz of [-1,1]){
    add(cube,gold,sx*(W-.7),.016,sz*(H-.1),1.2,.028,.045);add(cube,gold,sx*(W-.1),.016,sz*(H-.7),.045,.028,1.2);
  }
  function fern(x,y,z,scale=1,angle=0){
    for(let n=0;n<7;n++){const a=angle+n*Math.PI*2/7;add(leaf,n%3===0?leafLight:leafDark,x,y,z,.62*scale,1.5*scale,scale,.75,a,0);
      // Paired pinnae give small ferns their articulated silhouette.
      for(let p=1;p<5;p++){const t=p/5,xx=x+Math.sin(a)*t*.75*scale,zz=z+Math.cos(a)*t*.75*scale;
        for(const sign of [-1,1])add(leaf,leafMat,xx,y+t*.54*scale,zz,.31*scale,.4*(1-t*.4)*scale,.6*scale,1.2,a+sign*.85,sign*.35);}
    }
  }
  function rosette(x,y,z,scale=1){for(let n=0;n<9;n++){const a=n*Math.PI*2/9;add(leaf,n%3?leafMat:leafLight,x,y,z,scale*.95,scale*(1+random()*.5),scale,.55+random()*.8,a,0);}}
  function flowers(x,y,z){for(let n=0;n<5;n++){const a=n*2.4,r=.12+random()*.3,xx=x+Math.sin(a)*r,zz=z+Math.cos(a)*r,h=.25+random()*.3;add(stem,leafDark,xx,y+h*.5,zz,.025,h,.025);for(let p=0;p<5;p++)add(petal,flower,xx+Math.sin(p*1.256)*.07,y+h,zz+Math.cos(p*1.256)*.07,.085,.035,.045,0,-p*1.256,0);add(petal,gold,xx,y+h+.025,zz,.035);}}
  // The vegetation rhythm is authored in clumps, leaving the front corners open.
  for(let side=0;side<4;side++){
    const horizontal=side<2,len=horizontal?width:height;
    for(let i=-len/2+.4;i<len/2;i+=1.05){
      const x=horizontal?i:(side===2?-W-1.05:W+1.05),z=horizontal?(side===0?-H-1.03:H+1.03):i;
      if(side===1&&Math.abs(i)<width*.33)continue;
      rosette(x,-.14,z,.40+random()*.35);
      if(random()>.6)fern(x,-.13,z,.36+random()*.25,random()*6.28);
      if(random()>.62)flowers(x,-.05,z);
    }
  }
  // Ivy travels down the stone strata and makes the vertical surface feel inhabited.
  for(let i=0;i<58;i++){
    const front=i<32,x=front?(random()-.5)*(width+1):(i%2?-W-1.45:W+1.45),z=front?H+1.46:(random()-.5)*height;
    const length=.55+random()*2.4;
    for(let p=0;p<length;p+=.22){const sway=Math.sin(p*2+i)*.14;add(leaf,p%1>.5?leafDark:leafMat,x+(front?sway:0),-.27-p,z+(front?0:sway),.38,.40,.4,front?2.8:2.6,front?0:Math.PI/2,(random()-.5)*1.4);}
  }
  // Two aged guardians frame the garden. Their irregular courses and capitals are
  // deliberately behind the playable surface, never over the snake's route.
  function column(x,z,h,lean=0){
    add(cube,stone,x,.13,z,1.7,.42,1.65);
    for(let j=0;j<Math.ceil(h/.57);j++)add(cube,j%3?stone:darkStone,x+j*lean,.5+j*.56,z,1.05+(j%2)*.07,.54,1.05,0,j%2*.035,lean);
    add(cube,stone,x+h/.56*lean,h+.43,z,1.48,.32,1.43);
    add(cube,moss,x+h/.56*lean,h+.62,z,1.42,.1,1.36);
    // Recessed relief plaques and small metallic insets.
    add(cube,darkStone,x,h*.52,z+.544,.53,.78,.035);add(ring,gold,x,h*.52,z+.58,.55,.55,.55,0,0,0);
    for(let p=0;p<8;p++)add(leaf,leafDark,x+.42*Math.sin(p),h+.65-p*.24,z+.69,.5,.65,.6,2.8,0,Math.sin(p)*.6);
  }
  const rz=-H-2.05;
  column(-4.8,rz,3.05,.006);column(1.4,rz,3.05,-.008);
  // A real voussoir arch, with a broken upper silhouette rather than a flat lintel.
  for(let j=0;j<11;j++){const a=Math.PI*j/10;add(cube,stone,-1.7+Math.cos(a)*3.1,3.2+Math.sin(a)*1.62,rz,.88,.67,1.05,0,0,a-Math.PI/2);}
  for(let j=0;j<7;j++)rosette(-4.3+j*.83,3.7+Math.sin(j/6*Math.PI)*1.1,rz,.37);
  column(W+1.7,-H+.5,2.1,.05);
  add(cube,stone,-W-1.8,-.2,H-1.7,1.6,.67,2.1,0,.25,.1);
  add(cube,stone,-W-1.9,.2,H-1.9,.9,.45,1.3,0,.4,-.1);
  function tree(x,z,h,orientation=1){
    const base=new THREE.Vector3(x,-.3,z), mid=new THREE.Vector3(x+orientation*.35,h*.53,z-.12),top=new THREE.Vector3(x+orientation*.5,h,z-.3);
    branch(base,mid,.48);branch(mid,top,.31);
    for(let r=0;r<7;r++){const a=r*.9,tip=new THREE.Vector3(x+Math.sin(a)*1.25,-.33,z+Math.cos(a)*1.05);branch(tip,new THREE.Vector3(x+Math.sin(a)*.25,.5,z+Math.cos(a)*.25),.16);}
    for(let b=0;b<7;b++){
      const a=b*2.399,reach=(b===1?2.25:b===4?.85:1.25)+random()*.55;
      const tier=b===1?-.95:b===4?.62:(b%3-1)*.25;
      const end=new THREE.Vector3(top.x+Math.sin(a)*reach+orientation*.3,h+ tier+random()*.3,top.z+Math.cos(a)*reach-.15);
      branch(mid.clone().lerp(top,.5),end,.13);
      // Many overlapping broad leaves, never a handful of faceted canopy balls.
      for(let l=0;l<38;l++){const q=l*2.399,rad=Math.sqrt(random())*1.05;
        add(leaf,l%5===0?leafLight:l%3===0?leafDark:leafMat,end.x+Math.sin(q)*rad,end.y+random()*.48,end.z+Math.cos(q)*rad,.8+random()*.3,1.1+random()*.45,1.1,.95+random()*.9,q,random()*.3);}
    }
  }
  tree(-W+.3,-H-3.2,5.9,-1);tree(W-2.1,-H-3.6,4.5,1);
  // Rock shelves and detailed low planting connect the trees to the island.
  for(const sx of [-1,1]){
    for(let i=0;i<9;i++){const x=sx*(W+1.2+random()*1.7),z=-H-1+random()*3;add(rock,cliff,x,-1.6,z,.7+random(),.8+random(),.9+random(),random()*.5,random()*3,0);}
    fern(sx*(W+1.4),-.1,-H+2,.95,sx);rosette(sx*(W+1.4),-.15,-H+3,.9);
  }
  // A small run of steps hints at the lost garden entrance without making a false path.
  for(let i=0;i<4;i++)add(cube,stone,0,-.5-i*.4,H+1+i*.4,3.9-i*.36,.45,.8);
  // Atmospheric islets establish depth beyond the formal garden. Their off-center
  // composition and cool material keep the gameplay rectangle as the bright stage.
  const distantRock=material({color:0x3c6967,roughness:1,flatShading:true});
  const distantGreen=material({color:0x447967,roughness:1});
  for(const [x,z,s,h] of [[-21,-28,4.4,2.4],[-15,-33,4.2,3.8],[-9,-35,2.9,1.8],[18,-32,5.2,2.6],[25,-37,4.4,3.2]]){
    // Broad layered banks sit in the water, rather than towering beside the stage.
    add(rock,distantRock,x,-3.5+h*.43,z,s,h*.60,s*.6,0,.4,0);
    add(rock,distantRock,x+s*.55,-3.5+h*.29,z+.4,s*.68,h*.42,s*.55,0,.9,.08);
    add(rock,distantGreen,x,-3.5+h*.97,z,s*.72,.12,s*.47);
    for(let b=0;b<5;b++)add(leaf,distantGreen,x+(random()-.5)*s,-3.4+h*.97,z+(random()-.5)*s*.6,s*.18,s*.27,s*.19,.65,b*1.25,0);
  }
  // Bake the original transforms into indexed geometry once. Thousands of tiny
  // hardware instances are particularly expensive on software WebGL backends;
  // material merging preserves every authored vertex, tint and silhouette while
  // making the per-frame vertex path a conventional mesh transform.
  let staticInstances=0,staticMeshes=0;
  const materialBatches=new Map();
  for(const batch of batches.values()){
    let list=materialBatches.get(batch.m);if(!list){list=[];materialBatches.set(batch.m,list);}list.push(batch);
    staticInstances+=batch.items.length;
  }
  const positionTemp=new THREE.Vector3(),normalTemp=new THREE.Vector3(),normalMatrix=new THREE.Matrix3();
  for(const [sourceMaterial,list] of materialBatches){
    let vertexCount=0,indexCount=0,hasTint=false;
    for(const {g,items} of list){vertexCount+=g.attributes.position.count*items.length;indexCount+=(g.index?.count??g.attributes.position.count)*items.length;hasTint ||= items.some(item=>item.tint);}
    const positions=new Float32Array(vertexCount*3),normals=new Float32Array(vertexCount*3),uvs=new Float32Array(vertexCount*2);
    const colors=hasTint?new Float32Array(vertexCount*3):null;
    const indices=vertexCount>65535?new Uint32Array(indexCount):new Uint16Array(indexCount);
    let vertexOffset=0,indexOffset=0;
    for(const {g,items} of list){
      const p=g.attributes.position,n=g.attributes.normal,uv=g.attributes.uv;
      for(const item of items){
        normalMatrix.getNormalMatrix(item.matrix);
        for(let v=0;v<p.count;v++){
          positionTemp.fromBufferAttribute(p,v).applyMatrix4(item.matrix);
          normalTemp.fromBufferAttribute(n,v).applyMatrix3(normalMatrix).normalize();
          const vi=vertexOffset+v,pi=vi*3,ui=vi*2;
          positions[pi]=positionTemp.x;positions[pi+1]=positionTemp.y;positions[pi+2]=positionTemp.z;
          normals[pi]=normalTemp.x;normals[pi+1]=normalTemp.y;normals[pi+2]=normalTemp.z;
          if(sourceMaterial===tileMat){uvs[ui]=(positionTemp.x+W)/width;uvs[ui+1]=(positionTemp.z+H)/height;}
          else if(uv){uvs[ui]=uv.getX(v);uvs[ui+1]=uv.getY(v);}
          if(colors){colors[pi]=item.tint?.r??1;colors[pi+1]=item.tint?.g??1;colors[pi+2]=item.tint?.b??1;}
        }
        const count=g.index?.count??p.count;
        for(let i=0;i<count;i++)indices[indexOffset++]=vertexOffset+(g.index?g.index.getX(i):i);
        vertexOffset+=p.count;
      }
    }
    const merged=geometry(new THREE.BufferGeometry());
    merged.setAttribute('position',new THREE.BufferAttribute(positions,3));merged.setAttribute('normal',new THREE.BufferAttribute(normals,3));merged.setAttribute('uv',new THREE.BufferAttribute(uvs,2));merged.setIndex(new THREE.BufferAttribute(indices,1));
    let mergedMaterial=sourceMaterial;
    if(colors){merged.setAttribute('color',new THREE.BufferAttribute(colors,3));mergedMaterial=sourceMaterial.clone();mergedMaterial.vertexColors=true;materials.add(mergedMaterial);}
    merged.computeBoundingBox();merged.computeBoundingSphere();
    const mesh=new THREE.Mesh(merged,mergedMaterial);mesh.name='Ruins / '+sourceMaterial.color.getHexString();mesh.userData.staticWorld=true;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);staticMeshes++;
  }
  materialBatches.clear();
  batches.clear();
  // Original seamless water detail is baked once. Slow sampling of two warped
  // fields replaces per-fragment sine interference (which read as a plaid grid).
  function waterTexture(){
    const size=256,data=new Uint8Array(size*size*4);
    const periodicNoise=(u,v,period)=>{
      const x=u*period,y=v*period,ix=Math.floor(x),iy=Math.floor(y),fx=x-ix,fy=y-iy;
      const tx=fx*fx*(3-2*fx),ty=fy*fy*(3-2*fy),wrap=n=>((n%period)+period)%period;
      const a=noise(wrap(ix)+71,wrap(iy)+29),b=noise(wrap(ix+1)+71,wrap(iy)+29);
      const c=noise(wrap(ix)+71,wrap(iy+1)+29),d=noise(wrap(ix+1)+71,wrap(iy+1)+29);
      return (a+(b-a)*tx)*(1-ty)+(c+(d-c)*tx)*ty;
    };
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const u=x/size,v=y/size;
      const warpU=u+(periodicNoise(u+.31,v+.17,4)-.5)*.16;
      const warpV=v+(periodicNoise(u+.63,v+.47,5)-.5)*.16;
      const broad=periodicNoise(warpU,warpV,5)*.62+periodicNoise(warpU,warpV,11)*.28+periodicNoise(warpU,warpV,23)*.1;
      const ripple=periodicNoise(warpU,warpV,13)*.7+periodicNoise(warpU+.2,warpV-.1,7)*.3;
      const contour=Math.max(0,1-Math.abs(ripple-.52)/.032);
      const i=(y*size+x)*4;data[i]=Math.round(broad*255);data[i+1]=Math.round(contour*contour*255);data[i+2]=0;data[i+3]=255;
    }
    const t=new THREE.DataTexture(data,size,size);t.name='Original flowing water field';t.wrapS=t.wrapT=THREE.RepeatWrapping;
    t.magFilter=THREE.LinearFilter;t.minFilter=THREE.LinearMipmapLinearFilter;t.generateMipmaps=true;t.needsUpdate=true;textures.add(t);return t;
  }
  const waterMap=waterTexture();
  const waterMaterial=new THREE.ShaderMaterial({
    uniforms:{...THREE.UniformsUtils.clone(THREE.UniformsLib.fog),time:{value:0},waterField:{value:waterMap}},
    fog:true,
    vertexShader:`
      #include <fog_pars_vertex>
      varying vec2 waterUv;
      void main(){
        waterUv=position.xy*.018;
        vec4 mvPosition=modelViewMatrix*vec4(position,1.0);
        gl_Position=projectionMatrix*mvPosition;
        #include <fog_vertex>
      }`,
    fragmentShader:`
      #include <fog_pars_fragment>
      varying vec2 waterUv;
      uniform float time;
      uniform sampler2D waterField;
      void main(){
        vec2 flow=vec2(time*.0014,time*.00065);
        vec2 a=texture2D(waterField,waterUv+flow).rg;
        vec2 b=texture2D(waterField,mat2(.8,-.6,.6,.8)*waterUv-flow*.63+vec2(.37,.19)).rg;
        float depth=.2+(a.r+b.r)*.3;
        vec3 col=mix(vec3(.035,.24,.27),vec3(.09,.37,.36),depth);
        col+=vec3(.035,.065,.045)*max(0.,a.g+b.g-.55);
        gl_FragColor=vec4(col,1.);
        #include <fog_fragment>
      }`,
  });materials.add(waterMaterial);
  // Extend beyond the renderer's 180-unit far plane even in low-angle head views.
  const waterExtent=Math.max(1024,width*3,height*3);
  const water=new THREE.Mesh(geometry(new THREE.PlaneGeometry(waterExtent,waterExtent)),waterMaterial);water.name='Flowing water';water.rotation.x=-Math.PI/2;water.position.y=-3.62;group.add(water);
  const foamMat=material({color:0xb4e1c5,transparent:true,opacity:.28,roughness:.6,depthWrite:false});
  const foam=new THREE.Group();group.add(foam);
  for(let i=0;i<6;i++){
    const ripple=new THREE.Mesh(geometry(new THREE.TorusGeometry(1,.025,3,28)),foamMat);ripple.rotation.x=-Math.PI/2;ripple.position.set((i<3?-1:1)*(W+1.4),-3.59,(i%3-1)*height*.32);ripple.scale.set(1.4+(i%3)*.2,.7,1);foam.add(ripple);
  }
  const fallMat=material({color:0x95d8c3,transparent:true,opacity:.57,roughness:.25,metalness:.15,side:THREE.DoubleSide,depthWrite:false});
  for(const x of [-W-1.5,W+1.5]){const f=new THREE.Mesh(geometry(new THREE.PlaneGeometry(.43,2.35,3,1)),fallMat);f.position.set(x,-2.2,-H+3);f.rotation.y=x<0?-.5:.5;group.add(f);}
  // Bounded gameplay pools. Every occupied cell can be represented without reallocating.
  const capacity=width*height;
  function pool(g,m,n=capacity){const mesh=new THREE.InstancedMesh(g,m,n);mesh.count=0;mesh.frustumCulled=false;mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);return mesh;}
  const obstacleMat=material({color:0x4e6063,map:stoneMap,roughness:.88});
  const obstacles=pool(cube,obstacleMat),obstacleCaps=pool(cube,moss);
  const hazardBed=pool(geometry(new THREE.CylinderGeometry(.43,.46,.08,6)),darkStone);
  const amber=material({color:0xf2b653,emissive:0xa64c0d,emissiveIntensity:.28,roughness:.5});
  const dangerMat=material({color:0xf06b48,emissive:0xa32412,emissiveIntensity:.31,roughness:.5});
  const hazardWarning=pool(ring,amber),hazardSpikes=pool(geometry(new THREE.ConeGeometry(.15,.64,5)),dangerMat,capacity*3);
  const warningTriangle=geometry(new THREE.BufferGeometry());
  warningTriangle.setAttribute('position',new THREE.Float32BufferAttribute([0,0,-.29,-.25,0,.2,.25,0,.2],3));warningTriangle.computeVertexNormals();
  const hazardSymbols=pool(warningTriangle,amber);
  const hazardSlots=pool(cube,darkStone,capacity*3);
  const portalMat=material({color:0x93caff,emissive:0x356fe1,emissiveIntensity:.65,metalness:.25,roughness:.28});
  const portalRings=pool(ring,portalMat,capacity),portalInner=pool(ring,portalMat,capacity),portalBases=pool(geometry(new THREE.CylinderGeometry(.48,.48,.06,24)),darkStone);
  const portalGlyph=pool(geometry(new THREE.OctahedronGeometry(.09)),portalMat,capacity*4);
  const fruit=new THREE.Group();group.add(fruit);fruit.visible=false;
  const fruitMat=material({color:0xf06c46,roughness:.32,metalness:.02});
  const fruitBody=new THREE.Mesh(sphere,fruitMat);fruitBody.scale.set(.39,.42,.39);fruitBody.position.y=.46;fruitBody.castShadow=true;fruit.add(fruitBody);
  for(const sign of [-1,1]){const l=new THREE.Mesh(leaf,leafLight);l.position.set(0,.85,0);l.rotation.set(.7,sign*1.5,sign*.7);l.scale.set(.46,.46,.46);fruit.add(l);}
  const fruitStem=new THREE.Mesh(stem,wood);fruitStem.position.y=.88;fruitStem.scale.set(.04,.17,.04);fruit.add(fruitStem);
  const fruitRing=new THREE.Mesh(ring,gold);fruitRing.rotation.x=-Math.PI/2;fruitRing.position.y=.06;fruitRing.scale.set(1.2,1.2,1.2);fruit.add(fruitRing);
  const crown=new THREE.Mesh(geometry(new THREE.OctahedronGeometry(.13)),gold);crown.position.y=1.19;fruit.add(crown);
  const dynamicPools=[obstacles,obstacleCaps,hazardBed,hazardWarning,hazardSpikes,hazardSymbols,hazardSlots,portalRings,portalInner,portalBases,portalGlyph];
  const point=cell=>({x:cell%width-(width-1)/2,z:Math.floor(cell/width)-(height-1)/2});
  function put(mesh,x,y,z,sx=1,sy=sx,sz=sx,rx=0,ry=0,rz=0,tint=null){const i=mesh.count;if(i>=mesh.instanceMatrix.count)return;obj.position.set(x,y,z);obj.rotation.set(rx,ry,rz);obj.scale.set(sx,sy,sz);obj.updateMatrix();mesh.setMatrixAt(i,obj.matrix);if(tint)mesh.setColorAt(i,tint);mesh.count++;}
  let lastSignature='',disposed=false;
  function update(snapshot,{time=0,reducedMotion=false}={}){
    if(disposed)return;
    waterMaterial.uniforms.time.value=reducedMotion?0:time;
    const signature=JSON.stringify([snapshot.obstacles,snapshot.hazards,snapshot.portals]);
    if(signature!==lastSignature){
      lastSignature=signature;for(const p of dynamicPools)p.count=0;
      for(const cell of snapshot.obstacles||[]){const p=point(cell);put(obstacles,p.x,.28,p.z,.83,.56,.83,0,noise(cell,2)*.12,0);put(obstacleCaps,p.x,.57,p.z,.73,.045,.70);}
      for(const hazard of snapshot.hazards||[]){const p=point(hazard.cell);put(hazardBed,p.x,.05,p.z);put(hazardWarning,p.x,.11,p.z,1,1,1,-Math.PI/2);
        // A solid triangular caution plate and three retracted slots distinguish
        // dormant traps from circular teleport pools without relying on color.
        if(!hazard.active){put(hazardSymbols,p.x,.102,p.z);for(let n=0;n<3;n++)put(hazardSlots,p.x+(n-1)*.115,.108,p.z+.04,.045,.025,.12);}
        if(hazard.active)for(let n=0;n<3;n++){const a=n*2.094;put(hazardSpikes,p.x+Math.sin(a)*.19,.4,p.z+Math.cos(a)*.19,1,1,1,0,a,0);}}
      (snapshot.portals||[]).forEach((pair,i)=>{
        const tint=new THREE.Color().setHSL((.56+i*.19)%1,.85,.67);
        for(const cell of [pair.entry,pair.exit]){const p=point(cell);put(portalBases,p.x,.07,p.z);put(portalRings,p.x,.16,p.z,1.12,1.12,1.12,-Math.PI/2,0,0,tint);put(portalInner,p.x,.12,p.z,.67,.67,.67,-Math.PI/2,0,0,tint);
          for(let n=0;n<4;n++){const a=n*Math.PI/2;put(portalGlyph,p.x+Math.sin(a)*.36,.33,p.z+Math.cos(a)*.36,1,1,1,0,0,0,tint);}}
      });
      for(const p of dynamicPools){p.instanceMatrix.needsUpdate=true;if(p.instanceColor)p.instanceColor.needsUpdate=true;}
    }
    fruit.visible=!!snapshot.food;
    if(snapshot.food){const p=point(snapshot.food.cell),bonus=snapshot.food.kind==='bonus';fruit.position.set(p.x,reducedMotion?0:Math.sin(time*2.3)*.055,p.z);fruit.rotation.y=reducedMotion?0:Math.sin(time*.7)*.25;fruitMat.color.setHex(bonus?0xffcc55:0xf06c46);fruitMat.emissive.setHex(bonus?0x653008:0x210702);fruitMat.emissiveIntensity=.18;crown.visible=bonus;}
  }
  function dispose(){if(disposed)return;disposed=true;group.traverse(o=>{if(o.isInstancedMesh)o.dispose();});for(const g of geometries)g.dispose();for(const m of materials)m.dispose();for(const t of textures)t.dispose();group.clear();}
  function stats(){return{staticInstances,staticMeshes,drawObjects:group.children.reduce((n,o)=>n+(o.isMesh?1:o.children.filter(c=>c.isMesh).length),0),geometries:geometries.size,materials:materials.size,textures:textures.size,obstacles:obstacles.count,hazards:hazardBed.count,portalEnds:portalBases.count,disposed};}
  return{group,update,dispose,stats};
}
