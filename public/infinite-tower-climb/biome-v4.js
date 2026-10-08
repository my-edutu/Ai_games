/* Infinite Tower / Visual Edition IV
 * A hand-composed, deterministic, painterly 3D backdrop for the autonomous tower.
 * Render-only: it never creates gameplay collisions, routes, or decisions.
 */
import * as THREE from '/tower/three.module.js';
import {buildTowerGeology} from '/tower/geology-v9.js';
export const VISUAL_PALETTES={
  foundry:{stone:0x775344,rim:0xf9ca8b,glow:0xffa350,haze:0x764f49,accent:0xffe0af,shadow:0x453a3a,sky:['#ffe3a9','#eda978','#aa6c68','#5c4854'],moss:0xf6a868},
  ruins:{stone:0x8a8972,rim:0xf4e3b7,glow:0xfecb77,haze:0x66776f,accent:0xffedd1,shadow:0x445e54,sky:['#f8e4b5','#b4d9bb','#81b6a9','#4d817c'],moss:0x65a68a},
  storm:{stone:0x738390,rim:0xffe1b7,glow:0xffd082,haze:0x6b8fa0,accent:0xfff0d2,shadow:0x425a78,sky:['#ffe7ae','#b5dbe2','#79adcb','#546e9a'],moss:0x90dbe9},
  clockwork:{stone:0xa58665,rim:0xffe7b6,glow:0xf8be70,haze:0x9c795b,accent:0xffe4ad,shadow:0x654c44,sky:['#ffe0a4','#e8ac74','#bd855f','#765e5e'],moss:0xd8a35e},
  void:{stone:0x686184,rim:0xe8c4f4,glow:0xf49cca,haze:0x777195,accent:0xffd3f2,shadow:0x3b355b,sky:['#ffe3ed','#b8adf1','#867ab8','#4b467d'],moss:0xbe91db}
};
const rand=n=>{const x=Math.sin(n*96.173+12.779)*14173.67;return x-Math.floor(x)};
const flat=(c,rough=.84,metal=.14)=>new THREE.MeshStandardMaterial({color:c,roughness:rough,metalness:metal});
const lit=(c,strength=.65)=>new THREE.MeshStandardMaterial({color:c,emissive:c,emissiveIntensity:strength,roughness:.4,metalness:.2});
const add=(g,mesh,x,y,z)=>{mesh.position.set(x,y,z);g.add(mesh);return mesh};
const block=(w,h,d,mat)=>new THREE.Mesh(new THREE.BoxGeometry(w,h,d),mat);
function paintScene(theme,floor){
  const pal=VISUAL_PALETTES[theme]||VISUAL_PALETTES.ruins;
  const c=document.createElement('canvas');c.width=768;c.height=1024;const ctx=c.getContext('2d');
  const grad=ctx.createLinearGradient(0,0,0,1024);
  pal.sky.forEach((color,i)=>grad.addColorStop(i/(pal.sky.length-1),color));
  ctx.fillStyle=grad;ctx.fillRect(0,0,768,1024);
  // Great sun / moon with bloom, warm even when the biome is stormy.
  const cx=theme==='void'?535:205,cy=255+rand(floor+9)*85;
  const halo=ctx.createRadialGradient(cx,cy,12,cx,cy,320);
  halo.addColorStop(0,theme==='void'?'rgba(255,230,251,.88)':'rgba(255,249,219,.92)');
  halo.addColorStop(.14,'rgba(255,238,192,.48)');halo.addColorStop(1,'rgba(255,237,216,0)');
  ctx.fillStyle=halo;ctx.fillRect(0,0,768,1024);
  ctx.fillStyle=theme==='void'?'#f8e4ff':'#fff3d0';ctx.beginPath();ctx.arc(cx,cy,theme==='storm'?60:90,0,Math.PI*2);ctx.fill();
  // Multiple distinct ridges, architecture / forest silhouettes and atmospheric haze.
  for(let layer=0;layer<5;layer++){
    const yy=550+layer*90,amp=40+layer*13;
    ctx.beginPath();ctx.moveTo(-40,1050);ctx.lineTo(-40,yy);
    for(let x=-40;x<=808;x+=16){
      const ridge=Math.abs(Math.sin(x*.008+layer*.63+floor*.28))*amp;
      ctx.lineTo(x,yy-ridge-rand(x*.47+layer*45+floor)*15);
    }
    ctx.lineTo(808,1050);ctx.closePath();
    const colors=theme==='void'?['#a7a0d0','#857cae','#6c638e','#524b78','#373459']:
      theme==='foundry'?['#cb9580','#ae7b6d','#99645b','#76504e','#533f43']:
      theme==='ruins'?['#b4bf9e','#90a68a','#708b77','#567665','#3e574c']:
      theme==='clockwork'?['#d6a97c','#b98e69','#9d7357','#80604e','#5f4943']:
      ['#a6c7cf','#88a9b7','#6f94a7','#567c94','#3e5f7b'];
    ctx.fillStyle=colors[layer];ctx.fill();
    // Atmospheric monuments grow between layers, never a repeated window grid.
    if(layer>0&&layer<4){
      const count=2+layer;
      for(let i=0;i<count;i++){
        const px=rand(i*16+layer*47+floor*19)*768;
        const scale=(.48+layer*.15)*(0.7+rand(i*11+layer)*.4);
        const towerH=(65+rand(i*41)*140)*scale;
        ctx.fillStyle=colors[Math.min(layer+1,4)];
        ctx.fillRect(px,yy-towerH,12*scale,towerH+45);
        ctx.beginPath();ctx.moveTo(px-8*scale,yy-towerH);ctx.lineTo(px+6*scale,yy-towerH-22*scale);ctx.lineTo(px+20*scale,yy-towerH);ctx.closePath();ctx.fill();
        if(theme==='storm'||theme==='clockwork'){
          ctx.strokeStyle='rgba(255,238,214,.16)';ctx.lineWidth=2;ctx.beginPath();ctx.moveTo(px+6*scale,yy-towerH);ctx.lineTo(px+6*scale,yy-towerH-46*scale);ctx.stroke();
        }
      }
    }
  }
  for(let i=0;i<10;i++){
    const yy=120+i*71+rand(i+floor)*23;
    const g=ctx.createLinearGradient(0,yy,0,yy+45);
    g.addColorStop(0,'rgba(255,255,245,0)');g.addColorStop(.5,'rgba(255,247,231,.12)');g.addColorStop(1,'rgba(255,255,255,0)');
    ctx.fillStyle=g;ctx.fillRect(0,yy,768,45);
  }
  const tex=new THREE.CanvasTexture(c);tex.colorSpace=THREE.SRGBColorSpace;tex.anisotropy=4;
  return new THREE.MeshBasicMaterial({map:tex,side:THREE.DoubleSide,toneMapped:false,fog:false});
}
function battlement(group,x,y,stone,trim,variant){
  const col=block(18,68+variant*15,32,stone),h=68+variant*15;
  add(group,col,x,y,-68);
  add(group,block(24,5,35,trim),x,y+h/2+2.5,-64);
  add(group,block(22,4,38,trim),x,y-h/2+2,-64);
  const capital=add(group,new THREE.Mesh(new THREE.DodecahedronGeometry(12,0),trim),x,y+h/2+12,-64);
  capital.scale.set(1.2,.65,1);
  // Fine hand-laid seams on the massive stone column.
  for(let j=-2;j<=2;j++){
    const seam=add(group,block(18,.4,33,flat(0x463f42)),x,y+j*(h/6),-67);
    seam.rotation.z=(j%2)*.025;
  }
}
function hangingLamp(group,x,y,palette,index){
  const iron=flat(palette.shadow,.65,.62),gold=lit(palette.glow,.7);
  add(group,block(1.5,31,1.5,iron),x,y+19,-38);
  const body=add(group,new THREE.Mesh(new THREE.OctahedronGeometry(5.5,0),gold),x,y,-37);
  body.scale.set(.78,1.4,.82);
  add(group,new THREE.Mesh(new THREE.TorusGeometry(6,1.2,7,14),iron),x,y+6,-37).rotation.x=Math.PI/2;
  add(group,new THREE.Mesh(new THREE.TorusGeometry(7,1.15,7,14),iron),x,y-5,-37).rotation.x=Math.PI/2;
}
export function buildPainterlyTowerBackdrop({group,snapshot,palette,worldWidth,theme}){
  const y0=snapshot.chunkBaseY/1000,height=snapshot.chunkHeight/1000,mid=y0+height*.5;
  const stone=flat(palette.stone),trim=flat(palette.rim,.4,.35),shadow=flat(palette.shadow,.88,.16);
  const stage=new THREE.Group();stage.name='v4-expedition-scenery';group.add(stage);
  buildTowerGeology({group:stage,snapshot,quality:'auto'});
  const vista=add(stage,new THREE.Mesh(new THREE.PlaneGeometry(worldWidth+340,height+410),paintScene(theme,snapshot.floor)),worldWidth/2,mid,-165);
  // Independently silhouetted masonry spines near the *edges* instead of a flat full-screen wall grid.
  for(let i=0;i<5;i++){
    const y=y0+i*(height/4)+(i%2?14:-16),left=-28+(i%2)*19,right=worldWidth+28-(i%3)*14;
    battlement(stage,left,y,stone,trim,i%3);
    battlement(stage,right,y,stone,trim,(i+1)%3);
  }
  // Distant silhouette buttresses replace former giant fake catwalks.
  // The earlier decorative catwalks looked exactly like gameplay platforms,
  // occluded traversal, and confused the camera's focal hierarchy.
  for(let i=0;i<4;i++){
    const x=worldWidth*(.11+i*.27),y=y0+height*(.21+(i%3)*.3);
    const pillar=add(stage,block(11,30+i*5,11,shadow),x,y,-123);
    pillar.rotation.z=(i%2?1:-1)*.025;
    add(stage,block(18,4,12,stone),x,y+17+i*2.5,-122);
  }
  for(let i=0;i<4;i++){
    const x=worldWidth*(.11+i*.26),y=y0+height*(.16+(i%3)*.28);
    hangingLamp(stage,x,y,palette,i);
  }
  // Huge decorative relic on one side, intentionally asymmetrical for environmental storytelling.
  const relicX=worldWidth*(snapshot.floor%2?.84:.16),relicY=y0+height*.76;
  const ring=new THREE.Mesh(new THREE.TorusGeometry(19,2.7,11,36),shadow);
  add(stage,ring,relicX,relicY,-122);ring.rotation.y=.2;
  const core=add(stage,new THREE.Mesh(new THREE.IcosahedronGeometry(5,1),lit(palette.glow,.35)),relicX,relicY,-121);
  for(let i=0;i<8;i++){
    const angle=i*Math.PI/4;
    const tooth=block(5,11,7,stone);tooth.rotation.z=-angle;
    add(stage,tooth,relicX+Math.sin(angle)*22,relicY+Math.cos(angle)*22,-119);
  }
  // Biome-specific landmark silhouette.
  if(theme==='ruins'){
    const vines=flat(0x327657,.94,.01);
    for(let i=0;i<20;i++){
      const x=rand(i+snapshot.floor*15)*worldWidth,y=y0+rand(i*6+snapshot.floor)*height;
      const leaf=new THREE.Mesh(new THREE.IcosahedronGeometry(2+rand(i*7)*3),vines);
      leaf.scale.set(.8,1.8,.4);leaf.rotation.z=rand(i+12)-.5;add(stage,leaf,x,y,-45);
    }
  }else if(theme==='foundry'){
    for(let i=0;i<8;i++){
      const x=worldWidth*(.06+i*.115),y=y0+height*(.18+(i%4)*.22);
      add(stage,block(24,8,8,shadow),x,y,-48);
      add(stage,block(19,2,10,lit(0xff8245,1.3)),x,y+6,-45);
    }
  }else if(theme==='storm'){
    for(let i=0;i<9;i++){
      const gem=new THREE.Mesh(new THREE.OctahedronGeometry(4+rand(i)*4),lit(0xb2f8ec,.8));
      add(stage,gem,worldWidth*(.04+rand(i*3+2)*.92),y0+height*rand(i*4+1),-53);
    }
  }else if(theme==='void'){
    for(let i=0;i<6;i++){
      const portal=new THREE.Mesh(new THREE.TorusGeometry(10+rand(i)*10,2,8,32),lit(0xf3a3db,.8));
      portal.rotation.z=i*.7;add(stage,portal,worldWidth*(.14+i*.15),y0+height*(.12+rand(i*3)*.78),-58);
    }
  }else if(theme==='clockwork'){
    for(let i=0;i<5;i++){
      const wheel=new THREE.Mesh(new THREE.TorusGeometry(15+i*2,3,9,32),trim);
      add(stage,wheel,worldWidth*(.15+i*.18),y0+height*(.13+i*.17),-53);
    }
  }
  stage.userData.theme=theme;
  return stage;
}
