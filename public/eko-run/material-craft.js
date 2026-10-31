// Original baked-in procedural textures: no external image assets or runtime networking.
// Textures are bounded, reusable presentation resources, never gameplay authority.
export function createEkoSurfaceKit(THREE) {
  const canvases=new Map();
  const materials=new Map();
  function hash(n){let x=Math.imul((n+1)^0xabc983,0x9e3779b9)>>>0;x^=x>>>15;x=Math.imul(x,0x85ebca6b)>>>0;return(x>>>0)/4294967295;}
  function texture(name,size,draw){
    if(canvases.has(name))return canvases.get(name);
    const canvas=document.createElement('canvas');canvas.width=size;canvas.height=size;
    const ctx=canvas.getContext('2d',{alpha:false});draw(ctx,size);
    const map=new THREE.CanvasTexture(canvas);
    map.wrapS=map.wrapT=THREE.RepeatWrapping;
    map.colorSpace=THREE.SRGBColorSpace;
    map.anisotropy=2;
    map.name='Eko original '+name;
    canvases.set(name,map);return map;
  }
  const road=texture('speckled asphalt',256,(ctx,n)=>{
    ctx.fillStyle='#b2b2ac';ctx.fillRect(0,0,n,n);
    for(let i=0;i<4400;i++){
      const x=hash(i+19)*n,y=hash(i+923)*n,sz=.35+hash(i+19*33)*1.8;
      const shade=hash(i+1238)>.5?235:78;
      ctx.fillStyle='rgba('+shade+','+shade+','+(shade-4)+','+(.025+hash(i+6)*.22)+')';
      ctx.fillRect(x,y,sz,sz);
    }
    for(let i=0;i<7;i++){
      ctx.strokeStyle='rgba(70,70,64,.19)';ctx.lineWidth=.5+hash(i+20)*1.1;
      const x=hash(i+101)*n,y=hash(i+202)*n;
      ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x+10+hash(i+900)*19,y-3+hash(i+500)*8);ctx.stroke();
    }
  });
  const concrete=texture('sidewalk tile',256,(ctx,n)=>{
    ctx.fillStyle='#e1dfd4';ctx.fillRect(0,0,n,n);
    for(let i=0;i<2200;i++){
      const x=hash(i+9)*n,y=hash(i+255)*n,v=Math.floor(150+hash(i+28)*70);
      ctx.fillStyle='rgba('+v+','+(v-7)+','+(v-16)+',.075)';
      ctx.fillRect(x,y,1.1+hash(i)*1.7,1.1+hash(i+82)*1.8);
    }
    ctx.strokeStyle='rgba(96,99,88,.38)';ctx.lineWidth=2;
    for(let y=0;y<n;y+=64){
      ctx.beginPath();ctx.moveTo(0,y);ctx.lineTo(n,y);ctx.stroke();
      for(let x=(Math.floor(y/64)%2)*32;x<n;x+=64){
        ctx.beginPath();ctx.moveTo(x,y);ctx.lineTo(x,y+64);ctx.stroke();
      }
    }
  });
  const plaster=texture('rough coastal facade plaster',256,(ctx,n)=>{
    ctx.fillStyle='#f6f4ec';ctx.fillRect(0,0,n,n);
    for(let i=0;i<2700;i++){
      const x=hash(i+438)*n,y=hash(i+781)*n,alpha=.018+hash(i+231)*.15;
      ctx.fillStyle='rgba(60,66,64,'+alpha+')';
      ctx.fillRect(x,y,.6+hash(i+39)*3,.6+hash(i+29)*3);
    }
    for(let i=0;i<10;i++){
      ctx.strokeStyle='rgba(99,92,77,.08)';
      ctx.lineWidth=.4;
      const x=hash(i+89)*n;
      ctx.beginPath();ctx.moveTo(x,hash(i+3)*n);
      ctx.lineTo(x+hash(i+42)*18,hash(i+50)*n);ctx.stroke();
    }
  });
  const paintedMap=(id,color,map,roughness=.92,metalness=0)=>{
    const key=id+':'+color;
    if(!materials.has(key))materials.set(key,new THREE.MeshStandardMaterial({color,roughness,metalness,map}));
    return materials.get(key);
  };
  return Object.freeze({
    asphalt:paintedMap('road',0x636e70,road,.98),
    sidewalk:paintedMap('walk',0xc1ac92,concrete,.94),
    plaster(color){return paintedMap('plaster',color,plaster,.96);},
    configureRoadLength(length){
      road.repeat.set(Math.max(1,length/6),1);
      concrete.repeat.set(Math.max(1,length/9),1);
      road.needsUpdate=true;concrete.needsUpdate=true;
    },
    stats(){return Object.freeze({textures:canvases.size,materials:materials.size,source:'generated-original'});}
  });
}
