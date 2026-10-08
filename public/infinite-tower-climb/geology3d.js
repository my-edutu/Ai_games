// Original procedural 3D limestone cliffs. Vertex-displaced geology with biome-specific
// stratification creates an actual parallax landscape, not a flat panorama.
export function createTowerGeology(THREE,scene){
  const group=new THREE.Group();group.name='Sculpted canyon geology';scene.add(group);
  const rockMaterial=new THREE.MeshStandardMaterial({
    color:0xffffff,vertexColors:true,roughness:1,metalness:0.01,
    flatShading:true,side:THREE.DoubleSide
  });
  const palettes={
    foundry:[0xcf835b,0xecb17e,0x79514e,0x4e414a],
    ruins:[0x74816a,0xa2a88c,0x495c53,0x33483f],
    clockwork:[0x948876,0xc9ac7d,0x586379,0x3c465c],
    storm:[0x819dbe,0xc5c8ce,0x435b7c,0x34405f],
    void:[0x655783,0x9d86ae,0x443759,0x211d41]
  };
  const rand=(x,y,seed)=>{
    const v=Math.sin((x*127.1+y*311.7+seed*89.17)*.73839)*43758.5453;
    return v-Math.floor(v);
  };
  const smooth=(a,b,t)=>a+(b-a)*(t*t*(3-2*t));
  const noise=(x,y,s)=>{
    const px=Math.floor(x),py=Math.floor(y),u=x-px,v=y-py;
    return smooth(smooth(rand(px,py,s),rand(px+1,py,s),u),
      smooth(rand(px,py+1,s),rand(px+1,py+1,s),u),v);
  };
  // One distinct irregular wall for each canyon segment, all with high-frequency faceting.
  function makeCliff({seed,side,depth,width,height}){
    const cols=28,rows=52,positions=[],uvs=[],indices=[],colors=[];
    for(let row=0;row<=rows;row++){
      const vy=row/rows,y=(vy-.5)*height;
      for(let col=0;col<=cols;col++){
        const vx=col/cols;
        const n1=noise(vx*4,vy*6,seed),n2=noise(vx*18,vy*23,seed+8);
        const band=Math.sin(vy*38+seed*.9+vx*1.5);
        const slant=(vy-.5)*(Math.sin(seed*1.4)*3.3);
        const outside=(1-vx)*side;
        // Vertices swing into deep relief. Irregular edges expose side silhouettes.
        const x=side*(19+vx*width)+slant+n1*2.2+Math.sin(vy*9+seed)*1.8;
        const z=depth+(n1-.5)*8+(n2-.5)*2.5+band*.45
          +Math.abs(outside)*(Math.sin(vy*7+seed)*.2);
        positions.push(x,y,z);
        uvs.push(vx,vy);
        colors.push(1,1,1);
      }
    }
    for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
      const a=row*(cols+1)+col,b=a+cols+1;
      if((row+col)%2===0){indices.push(a,a+1,b,b,a+1,b+1);}
      else{indices.push(a,a+1,b+1,a,b+1,b);}
    }
    const g=new THREE.BufferGeometry();
    g.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));
    g.setAttribute('color',new THREE.Float32BufferAttribute(colors,3));
    g.setAttribute('uv',new THREE.Float32BufferAttribute(uvs,2));
    g.setIndex(indices);g.computeVertexNormals();
    const mesh=new THREE.Mesh(g,rockMaterial);
    mesh.receiveShadow=true;mesh.castShadow=false;
    mesh.name='Sculpted strata #'+seed;
    mesh.userData={seed,side,depth,width,height};
    group.add(mesh);return mesh;
  }
  const rocks=[];
  for(const side of [-1,1]){
    for(let layer=0;layer<2;layer++){
      for(let section=-1;section<=1;section++){
        const seed=32+layer*40+section*9+(side+1)*13;
        const rock=makeCliff({seed,side,depth:-19-layer*18,width:17+layer*8,height:53});
        rock.position.y=section*53;
        rocks.push(rock);
      }
    }
  }
  // Smaller original surface boulders create local silhouettes and credible parallax.
  const boulderGeo=new THREE.DodecahedronGeometry(1,1);
  const boulders=new THREE.InstancedMesh(boulderGeo,rockMaterial,70);
  const m=new THREE.Object3D(),random=s=>noise(s*.43,s*.17,19);
  for(let i=0;i<70;i++){
    const side=i%2?-1:1,layer=Math.floor(i/2)%3;
    const x=side*(18+layer*5+random(i*3)*8),y=(random(i*9)-.5)*140;
    const z=-11-layer*7-random(i*5)*3;
    m.position.set(x,y,z);m.rotation.set(random(i+1)*3,random(i+3)*3,random(i+5)*3);
    const scale=.8+random(i+7)*2.1;m.scale.set(scale*1.1,scale*1.5,scale*.75);m.updateMatrix();
    boulders.setMatrixAt(i,m.matrix);
    const shade=.68+random(i+6)*.3;
    boulders.setColorAt(i,new THREE.Color().setRGB(shade,shade*.94,shade*.86));
  }
  boulders.name='Rock shards in real 3D';boulders.instanceMatrix.needsUpdate=true;
  group.add(boulders);
  let currentTheme='';
  function setTheme(name){
    if(name===currentTheme)return;
    currentTheme=name;
    const colors=(palettes[name]||palettes.foundry).map(v=>new THREE.Color(v));
    for(const rock of rocks){
      const {seed,side,depth}=rock.userData;
      const mesh=rock.geometry,attribute=mesh.getAttribute('color'),position=mesh.getAttribute('position');
      for(let i=0;i<attribute.count;i++){
        const vy=position.getY(i),vx=position.getX(i);
        const band=Math.sin(vy*.34+seed*.8)*.5+.5;
        const speck=noise(vx*.24,vy*.31,seed+3);
        const mix=band>.7?colors[1]:speck<.2?colors[2]:colors[0];
        const c=mix.clone().lerp(colors[3],Math.max(0,(1-speck)*.28));
        c.multiplyScalar(.87+.19*speck+.16*Math.max(0,Math.cos(vy*.66+seed*.5)));
        attribute.setXYZ(i,c.r,c.g,c.b);
      }
      attribute.needsUpdate=true;
    }
    boulders.material.color.copy(colors[0]).multiplyScalar(1.07);
  }
  function update(playerY=0){
    // The world geometry moves as an origin-shifted stream. Keeps GPU distance stable.
    const center=Math.floor(Number(playerY||0)/53)*53;
    group.position.y=center;
  }
  setTheme('foundry');
  return {root:group,setTheme,update,rocks,signature:'sculpted-stratified-geology-v1'};
}
