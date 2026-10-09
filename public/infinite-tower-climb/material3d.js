// Original procedural physically-based surface texture library.
// Deterministic grained metal, chipped ceramic and ancient limestone.
// No image downloads and no Canvas required; works in browser and Node Three.js tests.
export function createTowerSurfaceLibrary(THREE){
  const size=256;
  const hash=(x,y,seed)=>{
    let h=Math.imul((x|0)^Math.imul((y|0),0x45d9f3b),0x27d4eb2d)^seed;
    h=Math.imul(h^(h>>>15),0x85ebca6b);h^=h>>>13;
    return (h>>>0)/4294967296;
  };
  const clamp=v=>Math.max(0,Math.min(255,Math.round(v)));
  const textures={};
  for(const style of ['forged-alloy','hand-hewn-stone','inlaid-ceramic']){
    const tone=new Uint8Array(size*size*4),height=new Float32Array(size*size),
      roughness=new Uint8Array(size*size*4),normal=new Uint8Array(size*size*4);
    const seed=style==='forged-alloy'?0x139fed:style==='hand-hewn-stone'?0x528aba:0x4cd0ac;
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=y*size+x,index=i*4;
      const grain=hash(x>>2,y>>2,seed),pitting=hash(x,y,seed+39),
        striation=Math.sin(x*.8+y*.19)*.5+.5,
        xTile=x%64,yTile=y%64;
      let h=0,shade=216,rough=.75;
      if(style==='forged-alloy'){
        const brushed=Math.sin(y*1.4)+Math.sin(y*5.6)*.3;
        const rivet=((xTile-8)**2+(yTile-8)**2)<10;
        const joint=yTile<2||xTile<2;
        h=brushed*.08+(grain-.5)*.24+(pitting>.982?-.5:0)+(rivet?.15:0);
        shade=224+brushed*7+(grain-.5)*16+(pitting>.982?-45:0)+(joint?-24:0)+(rivet?23:0);
        rough=.38+grain*.27+(pitting>.982?.27:0);
      }else if(style==='hand-hewn-stone'){
        const seam=(yTile<2||((x+(Math.floor(y/64)%2)*32)%64)<2);
        const crack=Math.abs(Math.sin(x*.073+y*.21+Math.sin(y*.13)*2.3))<.025;
        h=(grain-.5)*.43+(pitting-.5)*.14-(seam?.45:0)-(crack?.19:0);
        shade=211+(grain-.5)*34+(pitting-.5)*16-(seam?68:0)-(crack?24:0);
        rough=.72+grain*.2;
      }else{
        const grout=(xTile<2||yTile<2);
        const chip=pitting>.993;
        const mosaic=Math.sin((x>>6)*1.6+(y>>6)*.79)*7;
        h=(grain-.5)*.13-(grout?.34:0)-(chip?.46:0);
        shade=229+mosaic+(grain-.5)*13-(grout?65:0)-(chip?76:0);
        rough=.28+grain*.24+(grout?.28:0);
      }
      height[i]=h;
      tone[index]=clamp(shade);tone[index+1]=clamp(shade*.975);
      tone[index+2]=clamp(shade*.94);tone[index+3]=255;
      const rm=clamp(rough*255);
      roughness.set([rm,rm,rm,255],index);
    }
    for(let y=0;y<size;y++)for(let x=0;x<size;x++){
      const i=y*size+x,j=i*4,
        left=height[y*size+((x+size-1)%size)],
        right=height[y*size+((x+1)%size)],
        up=height[((y+size-1)%size)*size+x],
        down=height[((y+1)%size)*size+x];
      const nx=(left-right)*1.8,ny=(up-down)*1.8,nz=1;
      const length=Math.hypot(nx,ny,nz);
      normal[j]=clamp((nx/length*.5+.5)*255);
      normal[j+1]=clamp((ny/length*.5+.5)*255);
      normal[j+2]=clamp((nz/length*.5+.5)*255);
      normal[j+3]=255;
    }
    const make=(array,isColor)=>{
      const texture=new THREE.DataTexture(array,size,size,THREE.RGBAFormat,THREE.UnsignedByteType);
      texture.wrapS=THREE.RepeatWrapping;texture.wrapT=THREE.RepeatWrapping;
      texture.magFilter=THREE.LinearFilter;texture.minFilter=THREE.LinearMipmapLinearFilter;
      texture.generateMipmaps=true;texture.flipY=false;
      texture.colorSpace=isColor?THREE.SRGBColorSpace:THREE.NoColorSpace;
      texture.needsUpdate=true;return texture;
    };
    textures[style]={albedo:make(tone,true),roughness:make(roughness,false),normal:make(normal,false)};
  }
  function apply(material,kind='forged-alloy'){
    const maps=textures[kind];if(!maps)throw new RangeError('Unknown art surface '+kind);
    material.map=maps.albedo;material.normalMap=maps.normal;
    material.roughnessMap=maps.roughness;material.normalScale=new THREE.Vector2(.25,.25);
    material.needsUpdate=true;return material;
  }
  return {textures,apply,size,signature:'deterministic-pbr-surface-atlas-v1'};
}
