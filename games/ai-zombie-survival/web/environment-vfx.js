// Environmental animation for the 3D Gauntlet. Everything is visual-only and deterministic
// under the same simulation time; destruction decals do not affect collision or AI tactics.
const emberColors=['#ffad5c','#ff7849','#ffd17b'];
const smokeColors=['#44555d','#647074','#7f7870'];
function smokeColumn(m,x,z,age,intensity){
  const sway=Math.sin(age*.32+x*.13+z*.17)*.8;
  for(let layer=0;layer<3;layer++){
    const t=age*.31+layer*2.1;
    const rise=((t%6)+6)%6;
    const rad=(.28+rise*.16)*intensity;
    m.ball(x+sway*rise*.16,1.8+rise*1.17,z+sway*.3,rad,smokeColors[layer]);
  }
}
function fire(m,x,z,t,brightness){
  // Unequal flame branches to avoid the 2D 'single orange box' silhouette.
  for(let i=0;i<4;i++){
    const oscillate=Math.sin(t*(2.8+i*.44)+i*2.21);
    const dx=Math.cos(i*1.75)*(.12+.07*oscillate);
    const dz=Math.sin(i*2.14)*(.12+.08*oscillate);
    const h=(.7+(i%3)*.29+Math.max(0,oscillate)*.22)*brightness;
    m.bone([x+dx*.5,.18,z+dz*.5],[x+dx,.18+h,z+dz],.065+(i%2)*.032,emberColors[i%3]);
  }
  m.ball(x,.25,z,.18,'#ffbb69');
}
function embers(m,x,z,t,seed){
  for(let i=0;i<6;i++){
    const p=(t*(.31+(i%4)*.04)+i*1.137+seed*.31)%1;
    const a=(i*2.399+seed*.26),r=.18+p*.62;
    const px=x+Math.cos(a)*r,zp=z+Math.sin(a)*r;
    m.box(px,.34+p*2.6,zp,.075-p*.025,.08-p*.027,.052,emberColors[i%3]);
  }
}
function brightFlare(m,x,z,t,color){
  const wave=.83+.17*Math.sin(t*4.8);
  m.ball(x,2.90,z,.25*wave,color);
  m.cylinder(x,1.56,z,.055,2.90,'#2c4750',8);
  m.box(x,3.16,z,.56,.14,.51,color);
}
export function drawEnvironmentVfx(m,game,time,cameraX,cameraZ){
  let sites=0;
  for(const [index,b] of game.buildings.entries()){
    if(b.kind==='safehouse'||b.damage<.41)continue;
    const dist=Math.hypot(b.x-cameraX,b.y-cameraZ);
    if(dist>31)continue;
    // More severe building damage increases smoldering, independent of gameplay fires.
    if(sites>=7)break;
    sites++;
    const x=b.x+b.w*.28,z=b.y+b.h*.33;
    const intensity=Math.max(.3,Math.min(1,(b.damage-.3)*2.5));
    smokeColumn(m,x,z,time+index*.2,intensity);
    if(b.damage>.53){
      fire(m,x,z,time+index,Math.max(.6,intensity));
      embers(m,x,z,time,index);
    }
  }
  // Quarantine strobes guide camera readability in rain or night; no synthetic events.
  const night=game.time.phase==='night',rain=game.weather.kind==='storm';
  if(night||rain)for(const [x,z] of [[-8,-7],[8,-7],[-8,7],[8,7]]){
    if(Math.hypot(x-cameraX,z-cameraZ)>32)continue;
    brightFlare(m,x,z,time,'#f96670');
  }
  // On heavy horde events, light particulate debris remains bounded to the local action.
  const recent=game.events.filter(e=>e.type==='horde'||e.type==='barricade-hit').slice(-4);
  for(const e of recent){
    const age=game.time.elapsed-e.time;
    if(age<0||age>1.5||Math.hypot(e.x-cameraX,e.y-cameraZ)>28)continue;
    for(let i=0;i<8;i++){
      const a=i*Math.PI*.75+age,travel=.26+age*(.85+(i%3)*.20);
      m.box(e.x+Math.cos(a)*travel,.25+age*.6,e.y+Math.sin(a)*travel,.08,.10,.12,
        i%2?'#f1ca7f':'#9b8e7a',a);
    }
  }
}
