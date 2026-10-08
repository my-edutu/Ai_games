// World art director. Decorative geometry is generated ONLY from public/discovered cells,
// never from the maze authority, hidden passages, seeds or future challenge solutions.
export function makeWorldCraft(THREE) {
  const g={
    rock:new THREE.IcosahedronGeometry(1,1),
    pebble:new THREE.IcosahedronGeometry(1,0),
    leaf:new THREE.ConeGeometry(1,1,5),
    frond:new THREE.PlaneGeometry(1,1),
    trunk:new THREE.CylinderGeometry(.12,.19,1,7),
    slab:new THREE.BoxGeometry(1,1,1),
    prism:new THREE.CylinderGeometry(.46,.58,1,6),
    spire:new THREE.ConeGeometry(1,1,6),
    ring:new THREE.TorusGeometry(.74,.055,6,32),
    disc:new THREE.CylinderGeometry(1,1,.06,32),
    shard:new THREE.TetrahedronGeometry(1,0),
    orb:new THREE.OctahedronGeometry(1,0),
    flag:new THREE.PlaneGeometry(1,1),
    blossom:new THREE.DodecahedronGeometry(1,0),
    water:new THREE.CylinderGeometry(1,1,.055,20),
    arch:new THREE.TorusGeometry(.77,.13,8,22,Math.PI),
  };
  const m={
    weatheredRock:new THREE.MeshStandardMaterial({color:0x889992,roughness:1,flatShading:true}),
    mossRock:new THREE.MeshStandardMaterial({color:0x445e52,roughness:1,flatShading:true}),
    jadeLeaf:new THREE.MeshStandardMaterial({color:0x22a978,roughness:.85,side:THREE.DoubleSide}),
    fern:new THREE.MeshStandardMaterial({color:0x49d6a1,roughness:.82,side:THREE.DoubleSide}),
    autumnLeaf:new THREE.MeshStandardMaterial({color:0xff9965,roughness:.9,side:THREE.DoubleSide}),
    cobaltLeaf:new THREE.MeshStandardMaterial({color:0x608dff,roughness:.91,side:THREE.DoubleSide}),
    bark:new THREE.MeshStandardMaterial({color:0x5d4e42,roughness:1}),
    sandstone:new THREE.MeshStandardMaterial({color:0xc4ad8d,roughness:.94,flatShading:true}),
    whiteMarble:new THREE.MeshStandardMaterial({color:0xe0dfc1,metalness:.07,roughness:.53}),
    sigil:new THREE.MeshBasicMaterial({color:0x53f3d1,transparent:true,opacity:.75,depthWrite:false,side:THREE.DoubleSide}),
    sapphire:new THREE.MeshStandardMaterial({color:0x537aff,emissive:0x2447aa,emissiveIntensity:1.25,metalness:.5,roughness:.18,flatShading:true}),
    hotAmber:new THREE.MeshStandardMaterial({color:0xffb055,emissive:0xff6d2c,emissiveIntensity:1.25,metalness:.18,roughness:.2,flatShading:true}),
    violet:new THREE.MeshStandardMaterial({color:0xb383ff,emissive:0x5e33bf,emissiveIntensity:.9,metalness:.2,roughness:.36,flatShading:true}),
    redCrystal:new THREE.MeshStandardMaterial({color:0xff6577,emissive:0xbc284f,emissiveIntensity:1.2,metalness:.2,roughness:.31,flatShading:true}),
    goldInlay:new THREE.MeshStandardMaterial({color:0xf5d28c,metalness:.75,roughness:.28}),
    shallowWater:new THREE.MeshStandardMaterial({color:0x28889f,emissive:0x136a85,emissiveIntensity:.25,metalness:.48,roughness:.21,transparent:true,opacity:.85}),
    lightRay:new THREE.MeshBasicMaterial({color:0x8affd8,transparent:true,opacity:.095,side:THREE.DoubleSide,depthWrite:false,blending:THREE.AdditiveBlending}),
    hangingCloth:new THREE.MeshStandardMaterial({color:0xdb7058,roughness:.91,side:THREE.DoubleSide}),
    canopyShade:new THREE.MeshStandardMaterial({color:0x166f61,roughness:1,flatShading:true}),
    canopyLight:new THREE.MeshStandardMaterial({color:0x3ccf95,roughness:1,flatShading:true}),
    lanternGlass:new THREE.MeshStandardMaterial({color:0x8dffff,emissive:0x39d3de,emissiveIntensity:1.3,transparent:true,opacity:.9,metalness:.08}),
    carvedRuin:new THREE.MeshStandardMaterial({color:0xe0c4a0,roughness:.79,metalness:.04,flatShading:true}),
    darkMarble:new THREE.MeshStandardMaterial({color:0x48507c,metalness:.35,roughness:.43}),
    royalViolet:new THREE.MeshStandardMaterial({color:0x856df0,emissive:0x4730bd,emissiveIntensity:.75,roughness:.35}),
    bloodBronze:new THREE.MeshStandardMaterial({color:0x9b5260,metalness:.48,roughness:.45}),
    paleGrass:new THREE.MeshStandardMaterial({color:0xb3df8d,roughness:1,side:THREE.DoubleSide}),
    foam:new THREE.MeshBasicMaterial({color:0x8aefff,transparent:true,opacity:.72,side:THREE.DoubleSide}),
  };
  let theme='loops';
  const palettes={
    tree:{leaf:'jadeLeaf',crystal:'hotAmber',rock:0x928e7a,gold:0xfac080,ray:0xfbd5a5,flower:'autumnLeaf'},
    loops:{leaf:'jadeLeaf',crystal:'sapphire',rock:0x89999d,gold:0xf6cf87,ray:0x83ffe0,flower:'autumnLeaf'},
    chambers:{leaf:'autumnLeaf',crystal:'hotAmber',rock:0xc2a483,gold:0xffd88e,ray:0xffbd79,flower:'cobaltLeaf'},
    layers:{leaf:'cobaltLeaf',crystal:'violet',rock:0xaaa6cb,gold:0xd4b8ff,ray:0x9da6ff,flower:'fern'},
    hunter:{leaf:'autumnLeaf',crystal:'redCrystal',rock:0x928890,gold:0xffb17f,ray:0xff7c93,flower:'cobaltLeaf'},
  };
  function noise(x,z,s=0){
    let n=(Math.imul(x+17+s,374761393)+Math.imul(z+13-s,668265263))|0;
    n=Math.imul(n^(n>>>13),1274126177);
    return ((n^(n>>>16))>>>0)/4294967295;
  }
  function setTheme(name){
    theme=palettes[name]?name:'loops';
    const pal=palettes[theme];
    m.weatheredRock.color.setHex(pal.rock);
    m.goldInlay.color.setHex(pal.gold);
    m.sigil.color.setHex(pal.ray);
    m.lightRay.color.setHex(pal.ray);
    m.canopyShade.color.setHex(theme==='hunter'?0x6a284c:theme==='layers'?0x4649a3:theme==='chambers'?0x9b684b:0x166e61);
    m.canopyLight.color.setHex(theme==='hunter'?0xe35673:theme==='layers'?0x6488ee:theme==='chambers'?0xf4aa69:0x39d69b);
    return theme;
  }
  function decorateWall({world,x,z,id,kind,queue,put,height,glow}){
    // Repeated walls receive biome-specific sculpture rather than the same green bricks.
    if(id%4!==0)return;
    const vertical=kind==='NS';
    const dx=vertical?0:.18,dz=vertical?.18:0;
    const face=vertical?0:Math.PI/2;
    if(theme==='tree'||theme==='loops'){
      for(let n=0;n<3;n++){
        const length=.5+n*.22+noise(id,n,15)*.4;
        queue(g.trunk,m.bark,[x+dx+(vertical?(n-1)*.3:0),height-length*.36,z+dz+(vertical?0:(n-1)*.3)],
          [.08,length*.65,.08]);
        queue(g.leaf,n%2?m.canopyLight:m.jadeLeaf,
          [x+dx+(vertical?(n-1)*.3:0),height-length*.52,z+dz+(vertical?0:(n-1)*.3)],
          [.19,length*.45,.15]);
      }
    }else if(theme==='chambers'){
      const sun=put(g.disc,m.goldInlay,world,[x+dx,height*.61,z+dz],[.34,.25,.34]);
      sun.rotation.set(vertical?Math.PI/2:0,0,vertical?0:Math.PI/2);
      queue(g.slab,m.carvedRuin,[x,height*.32,z],vertical?[.8,.2,.29]:[.29,.2,.8]);
      for(let j=-1;j<=1;j++){
        const i=put(g.spire,m.hotAmber,world,
          [x+dx+(vertical?j*.38:0),height*.63,z+dz+(vertical?0:j*.38)],[.08,.37,.08]);
        i.rotation.z=Math.PI;
      }
    }else if(theme==='layers'){
      const crystal=put(g.orb,m.royalViolet,world,[x+dx,height*.65,z+dz],[.27,.57,.14]);
      crystal.rotation.y=face;
      queue(g.slab,m.darkMarble,[x,height*.44,z],vertical?[.59,.10,.28]:[.28,.10,.59]);
      queue(g.slab,m.goldInlay,[x,height*.92,z],vertical?[.70,.05,.30]:[.30,.05,.70]);
    }else if(theme==='hunter'){
      const banner=put(g.flag,m.hangingCloth,world,[x+dx,height*.62,z+dz],[.65,.85,1]);
      banner.rotation.y=face;
      for(let j=-1;j<=1;j++){
        const thorn=put(g.spire,m.redCrystal,world,
          [x+(vertical?j*.37:0),height+.26,z+(vertical?0:j*.37)],[.11,.52,.11]);
        thorn.rotation.z=j*.21;
      }
      queue(g.prism,m.bloodBronze,[x,height*.44,z],vertical?[.26,.17,.43]:[.43,.17,.26]);
    }
  }
  function monumentalJunction({world,cell,pos,queue,put,glow}){
    // Ceremonial rotunda only when three or more passages are already known.
    // Raised ornament remains above traversal clearance; it does not alter the maze.
    const columns=[
      [-.88,-.88],[.88,-.88],[-.88,.88],[.88,.88]
    ];
    const landmarkMat=theme==='layers'?m.darkMarble:
      theme==='hunter'?m.bloodBronze:theme==='chambers'?m.sandstone:m.carvedRuin;
    for(const [dx,dz] of columns){
      queue(g.prism,landmarkMat,[pos.x+dx,1.4,pos.z+dz],[.29,2.8,.29]);
      queue(g.slab,m.goldInlay,[pos.x+dx,2.82,pos.z+dz],[.48,.17,.48]);
      queue(g.slab,landmarkMat,[pos.x+dx,.19,pos.z+dz],[.53,.32,.53]);
    }
    for(const [a,b,rotation] of [[-1,-1,0],[1,1,0],[-1,1,Math.PI/2],[1,-1,Math.PI/2]]){
      const arc=put(g.arch,m.goldInlay,world,[pos.x+a*.86,2.58,pos.z+b*.86],[.73,.67,.73]);
      arc.rotation.y=rotation;
    }
    const cupola=put(g.ring,m.goldInlay,world,[pos.x,3.18,pos.z],[1.54,1.54,1.54]);
    cupola.rotation.x=Math.PI/2;
    const inner=put(g.ring,m.sigil,world,[pos.x,3.13,pos.z],[1.16,1.16,1.16]);
    inner.rotation.x=Math.PI/2;
    const jewel=put(g.orb,m[palettes[theme].crystal],world,[pos.x,2.96,pos.z],[.22,.42,.22]);
    jewel.rotation.y=.34;
    glow(world,[pos.x,2.97,pos.z],2.1,palettes[theme].ray);
    if((world.userData.artLightCount||0)<4){
      const coloredLight=new THREE.PointLight(palettes[theme].ray,6.2,8,2);
      coloredLight.position.set(pos.x,2.82,pos.z);
      world.add(coloredLight);
      world.userData.artLightCount=(world.userData.artLightCount||0)+1;
    }
    world.userData.artAnimators??=[];
    world.userData.artAnimators.push({jewel,inner,phase:cell.cell*.51});
  }
  function populate({world,snapshot,cells,queue,put,point,grid,glow,centerCell=null}){
    const p=palettes[theme];
    let clusters=0;
    let beacons=0;
    let glyphs=0;
    let fragments=0;
    let monumentalProps=0;
    let ambientFlares=0;
    let junctions=0;
    world.userData.artAnimators=[];
    world.userData.artLightCount=0;
    // Each prop is deterministic for a public cell index. Props sit on the cell edges:
    // never on the central traversal lane, and never reveal unknown topology.
    const publicKnown=new Set(cells.map(x=>x.cell));
    for(const cell of cells){
      if(!cell.visible||cell.blocked)continue;
      const pos=point(cell.cell,snapshot.width);
      const col=cell.cell%snapshot.width,row=Math.floor(cell.cell/snapshot.width);
      const marker=noise(col,row,9);
      const leafMat=m[p.leaf],crystalMat=m[p.crystal];
      if(cell.neighbors?.length>=3 && cell.cell%4===0 && junctions<4){
        monumentalJunction({world,cell,pos,queue,put,glow});
        junctions++;
      }
      if(marker<.72){
        // Sculpted clump of botanicals, stones, flowers and roots in the floor margin.
        const side=noise(row,col,19)<.5?-1:1;
        const corner=noise(col,row,2)<.5?-1:1;
        const ox=side*.89,oz=corner*.87;
        const height=.24+noise(col,row,5)*.31;
        queue(g.rock,m.weatheredRock,[pos.x+ox,-.04,pos.z+oz],[.31,.2,.35]);
        queue(g.pebble,m.mossRock,[pos.x+ox*.78,.06,pos.z+oz*.8],[.16,.12,.20]);
        for(let n=0;n<4;n++){
          const angle=(n/4)*Math.PI*2+noise(col,row,7)*.4;
          const offset=.13+noise(n,col+row,27)*.13;
          const gx=pos.x+ox+Math.cos(angle)*offset;
          const gz=pos.z+oz+Math.sin(angle)*offset;
          queue(g.leaf,leafMat,[gx,height*.33,gz],
            [.095,height*(.9+n*.13),.11]);
        }
        if(noise(col,row,18)<.38){
          const flower=m[p.flower];
          queue(g.orb,flower,[pos.x+ox,.38,pos.z+oz],[.13,.13,.13]);
        }
        clusters++;
      }
      if(cell.visits>1&&marker>.65) {
        const x=pos.x+(noise(col,row,3)-.5)*1.25;
        const z=pos.z+(noise(row,col,11)-.5)*1.25;
        queue(g.slab,m.sandstone,[x,.006,z],[.46,.016,.03]);
      }
      if((cell.checkpoint||cell.clue||cell.cell%11===0)&&glyphs<18){
        const markerGroup=new THREE.Group();
        markerGroup.position.set(pos.x,.04,pos.z);
        world.add(markerGroup);
        const glyph=put(g.ring,m.sigil,markerGroup,[0,0,0],[.7,.7,.7]);
        glyph.rotation.x=Math.PI/2;
        for(let n=0;n<8;n++){
          const a=n*Math.PI/4;
          const d=put(g.slab,m.goldInlay,markerGroup,
            [Math.cos(a)*.72,0,Math.sin(a)*.72],[.16,.024,.035]);
          d.rotation.y=-a;
        }
        glyphs++;
      }
      // World diversity: five physically different architectural/flora grammars.
      // Everything occupies the CORNER of a KNOWN traversable cell, never its route centre.
      const variation=noise(col,row,103);
      if(variation>.36&&monumentalProps<34){
        const side=noise(col,row,61)<.5?-1:1;
        const corner=noise(col,row,63)<.5?-1:1;
        const x=pos.x+side*.94,z=pos.z+corner*.92;
        if(theme==='tree'||theme==='loops'){
          // Multi-tiered luminous canopy and root system; distant silhouette ≠ plain box.
          const height=1.35+noise(col,row,52)*.68;
          queue(g.trunk,m.bark,[x,height*.46,z],[.90,height*.95,.88]);
          queue(g.rock,m.canopyShade,[x,height+.42,z],[.75,.56,.66]);
          queue(g.rock,m.canopyLight,[x+.31,height+.66,z-.16],[.52,.37,.47]);
          queue(g.rock,m.canopyShade,[x-.27,height+.62,z+.26],[.47,.39,.49]);
          for(let q=0;q<4;q++){
            const ang=q*Math.PI*.5+noise(col,row,78);
            queue(g.spire,m[p.leaf],[x+Math.cos(ang)*.48,.34,z+Math.sin(ang)*.48],[.08,.7,.09]);
          }
          if(variation>.84 && ambientFlares<10){
            glow(world,[x,height+.68,z],2.25,p.ray);
            ambientFlares++;
          }
        }else if(theme==='chambers'){
          // Gold-capped collapsed sandstone sanctuaries with reflective water basins.
          const height=.9+noise(col,row,58)*.7;
          queue(g.prism,m.carvedRuin,[x,height*.48,z],[.41,height,.41]);
          queue(g.slab,m.goldInlay,[x,height+.05,z],[.74,.11,.74]);
          if(variation>.67){
            queue(g.water,m.shallowWater,[x,.05,z],[.54,1,.54]);
            queue(g.ring,m.foam,[x,.09,z],[.58,.58,.58]);
          }
          queue(g.rock,m.sandstone,[x+.42,.14,z-.22],[.31,.24,.38]);
        }else if(theme==='layers'){
          // Arcane crystal forests, not recycled brick-and-plants across every biome.
          queue(g.prism,m.darkMarble,[x,.26,z],[.55,.48,.51]);
          for(let n=0;n<5;n++){
            const a=n*Math.PI*2/5+variation,dist=(n%2?.28:.12);
            const h=.74+noise(n+col,row,74)*1.1;
            queue(g.spire,n%2?m.royalViolet:m[p.crystal],
              [x+Math.cos(a)*dist,h*.46,z+Math.sin(a)*dist],
              [.15+n*.017,h,.13+n*.016]);
          }
          if(ambientFlares<10){
            glow(world,[x,1.2,z],2.15,p.ray);
            ambientFlares++;
          }
        }else if(theme==='hunter'){
          // Blood-bronze obelisks, ceremonial torches and sinister spire ruin.
          const height=1.2+noise(col,row,45)*.7;
          queue(g.prism,m.bloodBronze,[x,height*.48,z],[.34,height,.36]);
          queue(g.slab,m.goldInlay,[x,height,z],[.5,.11,.52]);
          queue(g.spire,m.redCrystal,[x,height+.42,z],[.22,.85,.2]);
          queue(g.pebble,m.weatheredRock,[x-.38,.13,z+.34],[.42,.17,.31]);
          if(ambientFlares<10){
            glow(world,[x,height+.35,z],1.85,p.ray);
            ambientFlares++;
          }
        }
        monumentalProps++;
      }
      if(marker>.92&&beacons<6){
        // Six-sided ancient waystones with an independent low-intensity glow.
        const sx=pos.x+(noise(col,row,12)<.5?-.83:.83);
        const sz=pos.z+(noise(col,row,13)<.5?-.8:.8);
        queue(g.prism,m.sandstone,[sx,.56,sz],[.34,1.02,.34]);
        queue(g.slab,m.whiteMarble,[sx,1.13,sz],[.57,.14,.51]);
        const crystal=put(g.orb,crystalMat,world,[sx,1.58,sz],[.26,.43,.26]);
        crystal.rotation.y=.48;
        glow(world,[sx,1.6,sz],1.8,p.ray);
        beacons++;
      }
    }
    // Decorative ruined landscape around the known cells. This ring is placed ONLY on
    // the outskirts of currently observed cells, never drawn inside undiscovered cells
    // as a supposed passage or preview of the maze.
    const visibleCells=cells.filter(c=>c.visible&&!c.blocked);
    for(const cell of visibleCells){
      const pos=point(cell.cell,snapshot.width);
      const col=cell.cell%snapshot.width,row=Math.floor(cell.cell/snapshot.width);
      const candidate=[
        {x:-1,z:0,id:cell.cell-1,inside:col>0},
        {x:1,z:0,id:cell.cell+1,inside:col<snapshot.width-1},
        {x:0,z:-1,id:cell.cell-snapshot.width,inside:row>0},
        {x:0,z:1,id:cell.cell+snapshot.width,inside:row<snapshot.height-1},
      ];
      for(const side of candidate){
        // Edge dressing references only the current observation footprint; never tests hidden links.
        if(publicKnown.has(side.id))continue;
        if(noise(col+side.x,row+side.z,41)<.58)continue;
        if(fragments>40)break;
        const x=pos.x+side.x*(grid*.45),z=pos.z+side.z*(grid*.45);
        const size=.4+noise(col,row,31)*.45;
        queue(g.rock,m.weatheredRock,[x,-.30,z],[size,.3,size]);
        for(let n=0;n<2;n++){
          queue(g.pebble,m.mossRock,[x+(n?-.3:.27),-.29,z+.1*n],
            [.22,.12,.17]);
        }
        fragments++;
      }
    }
    // Visible scenic horizon follows the PUBLIC explorer position, not hidden maze
    // topology. Previous full-map bounds placed scenery too far away to render.
    // These non-interactive distant ruins are deliberately NOT gameplay passages.
    const fallbackCell=cells[Math.floor(cells.length/2)]?.cell??0;
    const anchor=point(Number.isInteger(centerCell)?centerCell:fallbackCell,snapshot.width);
    const originX=anchor.x,originZ=anchor.z;
    const outerX=grid*6.35,outerZ=grid*5.9;
    let skyline=0;
    for(let i=0;i<18;i++){
      const angle=(i/18)*Math.PI*2;
      const x=originX+Math.cos(angle)*outerX;
      const z=originZ+Math.sin(angle)*outerZ;
      const shape=noise(i,77,31);
      const size=1.5+shape*1.9;
      queue(g.rock,m.weatheredRock,[x,-.62,z],[size*1.4,.7+size*.3,size]);
      queue(g.rock,m.mossRock,[x+size*.57,-.18,z-size*.19],[size*.66,.49,size*.42]);
      if(i%3===0){
        const h=3.1+noise(i,54,23)*3.0;
        queue(g.prism,m.carvedRuin,[x,h*.48,z],[.6,h,.64]);
        queue(g.slab,m.goldInlay,[x,h+.03,z],[1.03,.14,1.03]);
        queue(g.spire,theme==='layers'?m.violet:theme==='hunter'?m.redCrystal:m.carvedRuin,
          [x,h+.75,z],[.63,1.45,.63]);
      }
      skyline++;
    }
    const offsetDist=Math.max(10,grid*4.5);
    for(let i=0;i<8;i++){
      // Colossal but distant scenic arches; no physical gameplay collision.
      const a=Math.PI*.8+(i/7)*Math.PI*1.02;
      const x=originX+Math.cos(a)*offsetDist;
      const z=originZ+Math.sin(a)*offsetDist;
      const height=2.6+noise(i,43,22)*2;
      queue(g.prism,m.carvedRuin,[x,height*.45,z],[.36,height,.36]);
      queue(g.slab,m.goldInlay,[x,height+.01,z],[.71,.12,.71]);
      if(i%2===0){
        queue(g.spire,m[p.crystal],[x,height+.41,z],[.31,.83,.31]);
      }
    }
    world.userData.artStats={clusters,beacons,glyphs,fragments,monumentalProps,ambientFlares,skyline,junctions,biome:theme};
  }
  function addHeroSurroundings({scene,hero,put,glow}){
    // Exterior lantern flares respond to the explorer's real position in scene3d;
    // no hidden-game state is ever read here.
    const sign=new THREE.Group();
    const shard=put(g.orb,m.sapphire,sign,[0,0,0],[.32,.46,.29]);
    shard.rotation.y=.6;
    glow(sign,[0,0,0],1.1,0x58cfff);
    hero.add(sign);
    sign.position.set(-.47,.55,-.23);
    return sign;
  }
  return {geometries:g,materials:m,setTheme,populate,decorateWall,addHeroSurroundings};
}
