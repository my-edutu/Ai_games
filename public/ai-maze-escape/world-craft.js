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
    return theme;
  }
  function populate({world,snapshot,cells,queue,put,point,grid,glow}){
    const p=palettes[theme];
    let clusters=0;
    let beacons=0;
    let glyphs=0;
    let fragments=0;
    // Each prop is deterministic for a public cell index. Props sit on the cell edges:
    // never on the central traversal lane, and never reveal unknown topology.
    const publicKnown=new Set(cells.map(x=>x.cell));
    for(const cell of cells){
      if(!cell.visible||cell.blocked)continue;
      const pos=point(cell.cell,snapshot.width);
      const col=cell.cell%snapshot.width,row=Math.floor(cell.cell/snapshot.width);
      const marker=noise(col,row,9);
      const leafMat=m[p.leaf],crystalMat=m[p.crystal];
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
        // Do not build false maze walls or pretend to know unknown cells.
        if(side.inside||publicKnown.has(side.id))continue;
        if(noise(col+side.x,row+side.z,41)<.58)continue;
        if(fragments>40)break;
        const x=pos.x+side.x*(grid*.95),z=pos.z+side.z*(grid*.95);
        const size=.4+noise(col,row,31)*.45;
        queue(g.rock,m.weatheredRock,[x,-.30,z],[size,.3,size]);
        for(let n=0;n<2;n++){
          queue(g.pebble,m.mossRock,[x+(n?-.3:.27),-.29,z+.1*n],
            [.22,.12,.17]);
        }
        fragments++;
      }
    }
    world.userData.artStats={clusters,beacons,glyphs,fragments,biome:theme};
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
  return {geometries:g,materials:m,setTheme,populate,addHeroSurroundings};
}
