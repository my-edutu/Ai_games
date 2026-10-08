// Purely visual, bounded, deterministic environment art: no authoritative game state mutation.
// Warm, high-contrast quarantine-city styling and distinct districts instead of repeated boxes.
const SEGMENTS={
 A:'abcefg',B:'cdefg',C:'adef',D:'bcdeg',E:'adefg',F:'aefg',G:'acdef',H:'bcefg',I:'bc',L:'def',
 M:'abcef',N:'abcef',O:'abcdef',P:'abefg',R:'abefg',S:'acdfg',T:'defg',U:'bcdef',V:'bcdef',
 X:'bcefg',Y:'bcdfg',Z:'abdeg',0:'abcdef',1:'bc',2:'abdeg',3:'abcdg',4:'bcfg',5:'acdfg',6:'acdefg',7:'abc',8:'abcdefg',9:'abcdfg'
};
const SIGNAL={hospital:'#ff566b',police:'#4bd9f2',supermarket:'#f4b743',shop:'#30e6b0',fuel:'#ff8b45',warehouse:'#6c9df7',safehouse:'#ffe0a1',apartment:'#b4b6ee'};
function box(m,x,y,z,w,h,d,c,yaw=0){m.box(x,y,z,w,h,d,c,yaw);}
function lamp(m,x,z,color){
  m.cylinder(x,2.85,z,.085,5.7,'#25383f',7);
  box(m,x,5.78,z,.76,.14,.61,'#203c46');
  box(m,x,5.63,z,.62,.15,.45,color);
}
function glyph(m,letter,x,y,z,c,scale=.72){
  const seg=SEGMENTS[letter]||'';
  const sx=scale*.57,sy=scale*.86,thin=scale*.11;
  const horizontal=(dy)=>box(m,x,y+dy*sy,z,sx,thin,.075,c);
  const vertical=(dx,dy)=>box(m,x+dx*sx*.50,y+dy*sy*.5,z,thin,sy*.48,.07,c);
  if(seg.includes('a'))horizontal(1);
  if(seg.includes('g'))horizontal(0);
  if(seg.includes('d'))horizontal(-1);
  if(seg.includes('b'))vertical(1,1);
  if(seg.includes('c'))vertical(1,-1);
  if(seg.includes('e'))vertical(-1,-1);
  if(seg.includes('f'))vertical(-1,1);
}
function word(m,value,x,y,z,color,scale=.72){
  const chars=value.slice(0,9).toUpperCase().split('');
  const advance=scale*.76,start=x-(chars.length-1)*advance*.5;
  for(const [i,ch] of chars.entries())glyph(m,ch,start+i*advance,y,z,color,scale);
}
function hazardStripe(m,x,y,z,w,h,d,angle=0){
  box(m,x,y,z,w,h,d,'#fcb849',angle);
  for(let i=0;i<4;i++)box(m,x-w*.37+w*.245*i,y+h*.51,z,.13,h*.025,d*.94,'#26353d',angle);
}
function canopy(m,b,palette){
  const front=b.y+b.h/2;
  box(m,b.x,2.72,front+.64,b.w*.76,.16,1.35,palette);
  box(m,b.x,2.92,front+.25,b.w*.85,.19,.13,'#243946');
  for(let i=0;i<5;i++)box(m,b.x+(i-2)*b.w*.139,2.73,front+1.32,.18,.06,.15,i%2?'#fff0ca':palette);
  box(m,b.x-b.w*.3,1.28,front+.85,.085,2.4,.085,'#243946');
  box(m,b.x+b.w*.3,1.28,front+.85,.085,2.4,.085,'#243946');
}
function balcony(m,b,i,floor){
  const h=1.45+floor*1.27,z=b.y+b.h*.5+.26,x=b.x+(i-1)*b.w*.24;
  box(m,x,h-.53,z,.94,.12,.73,'#384e55');
  box(m,x,h-.02,z+.29,.92,.075,.07,'#9ed7d0');
  for(const j of [-.38,0,.38])box(m,x+j,h-.28,z+.29,.05,.44,.06,'#4c6566');
}
function shutter(m,b,palette){
  const z=b.y+b.h/2+.18;
  box(m,b.x,1.04,z,2.35,1.88,.12,'#243943');
  for(let j=0;j<7;j++)box(m,b.x,.26+j*.21,z+.069,2.24,.045,.035,j%2?palette:'#49626a');
  box(m,b.x,2.04,z+.12,2.70,.16,.18,palette);
}
function industrial(m,b){
  const roof=2.7+b.floors*1.25,side=b.x+b.w/2;
  box(m,side+.38,roof*.54,b.y,.65,roof*.90,.55,'#465d63');
  for(let y=1.1;y<roof-1;y+=1.1)box(m,side+.77,y,b.y,.12,.11,.79,'#f2ad60');
  m.cylinder(b.x+b.w*.19,roof+.76,b.y-b.h*.25,.35,1.52,'#8c7266',8);
  m.cylinder(b.x+b.w*.19,roof+1.72,b.y-b.h*.25,.25,.55,'#e1b984',8);
  box(m,b.x,roof+.44,b.y,.45,.55,.48,'#222e37');
}
export function decorateBuilding(m,b,state){
  if(b.kind==='safehouse'){return;}
  const z=b.y+b.h*.5,color=SIGNAL[b.kind]||'#eeb77f',floors=b.floors;
  if(!b.roofVisible) {
    // Cutaway building keeps internal rescue paths readable.
    box(m,b.x,1.02,b.y-b.h*.18,1.08,.85,.82,'#679e9b');
    box(m,b.x-b.w*.31,.39,b.y+.3,.65,.65,.62,'#c5a16d');
    return;
  }
  // Every facade gets identity, windows, trim and utility; denser detail is reserved for foreground heroes.
  const frontColor=b.kind==='hospital'?'#cfe9e6':color;
  const signY=Math.min(3.5,1.65+floors*.25);
  box(m,b.x,signY,z+.16,b.w*.63,.90,.16,'#1e3442');
  const lettering=b.kind==='hospital'?'MED':b.kind==='police'?'POL':b.kind==='supermarket'?'FOOD':
    b.kind==='warehouse'?'DEPOT':b.kind==='fuel'?'FUEL':b.kind==='shop'?'OPEN':'APT';
  word(m,lettering,b.x,signY,z+.28,frontColor,.43);
  if(b.kind==='hospital'||b.kind==='police'||b.kind==='supermarket'||b.kind==='shop'||b.kind==='fuel'){
    canopy(m,b,color);
  }else if(b.kind==='apartment'){
    for(let level=1;level<Math.min(4,floors);level++)for(let i=0;i<3;i+=2)balcony(m,b,i,level);
  }else if(b.kind==='warehouse')industrial(m,b);
  if(b.damage>.24){
    for(let i=0;i<3;i++){
      const x=b.x-b.w*.31+i*b.w*.29;
      box(m,x,b.floors>2?3.2:2.2,z+.19,.28,.12,.12,'#2b3940',(i-.7)*.19);
    }
  }
  if(b.kind==='shop'||b.kind==='supermarket'||b.kind==='warehouse')shutter(m,b,color);
  // Intermittent color-accent facade bands prevent a uniform grey repeated-grid appearance.
  box(m,b.x,z?Math.min(3.8,floors*1.2+1.2):3,z+.035,b.w*.90,.065,.07,color);
  for(let floor=0;floor<Math.min(4,floors);floor++){
    const y=1.5+floor*1.27;
    for(let i=-1;i<=1;i++){
      if(((i+floor+b.id.length)%4)===0)continue;
      box(m,b.x+i*b.w*.23,y,z+.14,.68,.57,.065,((floor+i+12)%5===0&&state.time.phase==='night')?'#ffd8a5':'#6ca9b7');
      box(m,b.x+i*b.w*.23,y+.34,z+.21,.86,.075,.07,'#d3d4c8');
    }
  }
  // Utility geometry at consistent positions: vents, cables, crates, courtyard trees and signage.
  box(m,b.x-b.w*.40,1.4,b.y+b.h*.4,.11,2.5,.12,'#37464c');
  if(b.kind!=='hospital')box(m,b.x+b.w*.38,.38,z+.34,.68,.62,.66,'#c5a777');
  if(b.district==='industrial'&&b.floors>2)box(m,b.x,2.5,z+.29,b.w*.87,.23,.30,'#1b4248');
}
function post(m,x,z,color='#f8c15c'){
  box(m,x,.63,z,.20,1.26,.2,'#283a3c');
  box(m,x,1.34,z,.38,.16,.38,color);
}
function cafe(m,x,z){
  box(m,x,.42,z,2.9,.12,1.75,'#bb895e');
  for(const dx of [-1.22,1.22])box(m,x+dx,.22,z,.15,.36,.14,'#4d6261');
  box(m,x,.98,z-.35,1.65,.1,.9,'#d2c0a1');
  for(const dx of [-.65,.65])box(m,x+dx,.7,z-.35,.085,.55,.09,'#374e53');
  box(m,x,2.05,z+.25,2.25,.15,1.4,'#e27f53');
  for(const dx of [-1,1])box(m,x+dx,1.40,z+.25,.11,1.3,.12,'#547e78');
}
function emergencyVehicle(m,x,z,dir=0){
  m.contactShadow(x+.24,z-.08,2.2,1.2,'#384947');
  box(m,x,.74,z,3.15,.93,1.6,'#f3e2bc',dir);
  box(m,x-.22,1.35,z,1.7,.48,1.46,'#507d8c',dir);
  box(m,x+1.0,.78,z,1.05,.55,1.59,'#db544d',dir);
  box(m,x+1.0,1.11,z,.57,.09,.77,'#fff3d8',dir);
  box(m,x-.39,1.7,z,.42,.16,.55,'#52d7f9');
  for(const dx of [-1.1,1.04])for(const dz of [-.74,.74])m.cylinder(x+dx,.36,z+dz,.34,.32,'#203443',8);
}
function deadTree(m,x,z,height=3.3){
  m.contactShadow(x+.3,z-.3,.65,.5,'#40504b');
  m.bone([x,.2,z],[x,height,z],.17,'#514e49');
  for(let i=0;i<4;i++){
    const theta=i*Math.PI*.63;
    m.bone([x,height*.63,z],[x+Math.cos(theta)*(1+i*.18),height*(.95+.04*(i%2)),z+Math.sin(theta)*.8],.06,'#615f53');
  }
}
export function decorateWorld(m,state){
  const phase=state.time.phase,night=phase==='night',b=state.safeHouse;
  const bx=b.x,bz=b.y;
  // Iconic quarantine headquarters: this illuminated extraction beacon is visible from every camera mode.
  m.contactShadow(bx+.7,bz-.4,8.3,6.7,'#405449');
  for(const angle of [0,Math.PI*.5,Math.PI,Math.PI*1.5]){
    const x=bx+Math.cos(angle)*6.7,z=bz+Math.sin(angle)*5.9;
    m.cylinder(x,3.8,z,.17,7.6,'#324953',8);
    box(m,x,7.55,z,.85,.30,.78,night?'#ffeebd':'#ffb54a');
    box(m,x,7.83,z,1.13,.10,1.12,'#e75b55');
  }
  // Visual-only rooftop command gantry and cyan signal mast.
  for(const x of [-3.4,3.4]){
    box(m,x,6.58,bz,.23,3.4,.22,'#456b78');
    box(m,x,8.10,bz,.62,.18,3.85,'#48dbdc');
  }
  box(m,bx,8.16,bz,7.5,.28,.40,'#193541');
  word(m,'SAFE',bx,8.72,bz+.30,'#fff0aa',1.2);
  m.cylinder(bx,10.55,bz,.20,2.9,'#cce9e2',9);
  m.ball(bx,12.20,bz,.52,night?'#ffb26b':'#ffe2a2');
  // Distinct staging zones (not colliders) with supply containers and hazard markings.
  for(const [i,[x,z]] of [[-10,-8],[11,-8],[-12,9],[13,10]].entries()){
    post(m,x,z,i%2?'#51d7e7':'#ffad63');
    box(m,x+1.1,.34,z,.80,.68,.74,i%2?'#58a2b1':'#d3a061');
  }
  for(let i=0;i<4;i++){
    const x=-6.1+i*4.1;
    box(m,x,.14,-11.45,2.4,.18,.52,i%2?'#eeb04f':'#32434b');
    for(let k=0;k<3;k++)box(m,x-1+i*.02+k*.75,.26,-11.39,.22,.10,.12,'#f0ce79');
  }
  // Block-scale landmarks, storefront kiosks, transport stops and elevated comms towers.
  const storefronts=[[-42,-13],[-32,26],[0,-27],[31,29],[43,-4]];
  for(const [i,[x,z]] of storefronts.entries())cafe(m,x,z);
  for(const [i,[x,z]] of [[-19,-22],[19,19],[-21,32],[21,-15],[0,37]].entries()){
    lamp(m,x,z,i%2?'#49e2da':'#ffcc83');
    box(m,x+.9,.15,z,1.0,.27,.66,'#b5a795');
  }
  for(const [x,z] of [[-22,-8],[23,26],[18,-8]])emergencyVehicle(m,x,z);
  for(let i=0;i<13;i++){
    const x=-51+(i*19)%104,z=i%2?-42:42;
    deadTree(m,x,z,3.3+(i%4)*.34);
  }
  // Vertical checkpoint banners and recognizable quarantine boundary silhouette.
  for(let i=0;i<6;i++){
    const x=-44+i*17.1,z=i%2?-35:35;
    box(m,x,3.6,z,.27,7.1,.28,'#384b52');
    box(m,x,5.48,z+.08,1.85,2.2,.13,i%3===0?'#e86754':i%3===1?'#0f909d':'#e3a94c');
    box(m,x,4.10,z+.16,1.6,.19,.16,'#f3e5c1');
    box(m,x,3.68,z+.16,1.3,.13,.18,'#f3e5c1');
  }
}
