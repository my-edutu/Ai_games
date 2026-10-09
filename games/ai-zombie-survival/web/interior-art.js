// Distinct read-only 3D interiors revealed when an authoritative building's roof is hidden.
// Interiors add cinematic environmental storytelling; no navigation meshes or AI state changes.
const COLORS={teal:'#40d5cd',blue:'#579bb3',amber:'#ffc37b',coral:'#f97179',light:'#dbe7db',wood:'#9d7557',steel:'#4b6570',dark:'#2d4350',cream:'#ded5bc'};
function box(m,b,x,y,z,w,h,d,color,a=0){m.box(b.x+x,y,b.y+z,w,h,d,color,a)}
function ball(m,b,x,y,z,r,c){m.ball(b.x+x,y,b.y+z,r,c)}
function bone(m,b,a,z,width,c){m.bone([b.x+a[0],a[1],b.y+a[2]],[b.x+z[0],z[1],b.y+z[2]],width,c)}
function bed(m,b,x,z){
  box(m,b,x,.46,z,1.25,.40,2.36,COLORS.steel);
  box(m,b,x,.72,z,.99,.16,2.17,COLORS.light);
  box(m,b,x,.84,z-.75,.76,.21,.42,COLORS.cream);
  box(m,b,x,.79,z+.22,.98,.14,1.10,'#82b9c0');
  for(const dx of [-.55,.55])for(const dz of [-1.05,1.05])box(m,b,x+dx,.19,z+dz,.075,.38,.08,COLORS.dark);
  for(const dx of [-.61,.61])box(m,b,x+dx,.99,z,.065,.52,2.0,'#7a9199');
  box(m,b,x,.95,z+1.1,1.18,.35,.1,COLORS.light);
}
function iv(m,b,x,z){
  box(m,b,x,.08,z,.65,.15,.65,COLORS.dark);
  box(m,b,x,1.25,z,.06,2.40,.06,COLORS.steel);
  box(m,b,x,2.48,z,.65,.06,.06,COLORS.steel);
  box(m,b,x+.28,2.18,z,.35,.5,.20,COLORS.light);
  ball(m,b,x,2.53,z,.09,COLORS.coral);
}
function shelf(m,b,x,z,w=2.1){
  for(const y of [.38,1.05,1.72])box(m,b,x,y,z,w,.16,.53,COLORS.wood);
  for(const sx of [-w*.5,w*.5])box(m,b,x+sx,.91,z,.13,1.80,.60,COLORS.dark);
  for(let i=0;i<12;i++){
    const x0=x-(w*.44)+(i%4)*w*.28,y=.58+Math.floor(i/4)*.67;
    const color=[COLORS.teal,COLORS.amber,COLORS.coral,COLORS.cream][i%4];
    box(m,b,x0,y,z,.22,.34,.28,color);
  }
}
function desk(m,b,x,z){
  box(m,b,x,.83,z,1.60,.14,.77,COLORS.wood);
  for(const dx of [-.65,.65])for(const dz of [-.29,.29])box(m,b,x+dx,.41,z+dz,.09,.73,.09,COLORS.dark);
  box(m,b,x,1.20,z-.13,.69,.47,.08,COLORS.dark);
  box(m,b,x,1.22,z-.08,.58,.35,.10,COLORS.blue);
  box(m,b,x,.97,z-.07,.08,.18,.08,COLORS.steel);
  box(m,b,x,.93,z+.25,.64,.05,.26,COLORS.cream);
}
function lamp(m,b,x,z){
  box(m,b,x,1.47,z,.08,2.93,.08,COLORS.steel);
  ball(m,b,x,2.88,z,.27,COLORS.amber);
  box(m,b,x,2.60,z,.54,.26,.54,COLORS.light);
}
function sofa(m,b,x,z){
  box(m,b,x,.42,z,2.20,.45,.88,'#59747a');
  box(m,b,x,.87,z-.33,2.20,.70,.23,'#456575');
  for(const dx of [-1.04,1.04])box(m,b,x+dx,.62,z,.18,.70,.91,COLORS.dark);
  for(const dx of [-.53,.53])box(m,b,x+dx,.65,z+.15,.76,.11,.52,'#d5c5a4');
}
function table(m,b,x,z){
  box(m,b,x,.79,z,1.43,.16,.92,COLORS.wood);
  for(const dx of [-.57,.57])for(const dz of [-.36,.36])box(m,b,x+dx,.39,z+dz,.09,.68,.09,COLORS.steel);
}
function crates(m,b,x,z){
  for(let i=0;i<4;i++){
    const cx=x+(i%2)*.76,cy=.29+Math.floor(i/2)*.60;
    box(m,b,cx,cy,z,.66,.56,.77,i%2?COLORS.wood:'#bba068');
    for(const dx of [-.29,.29])box(m,b,cx+dx,cy,z+.40,.045,.45,.06,COLORS.dark);
  }
}
function barrels(m,b,x,z){
  for(let i=0;i<3;i++){
    const xi=x+i*.67;
    m.cylinder(b.x+xi,.55,b.y+z,.30,1.04,i%2?COLORS.coral:COLORS.blue,9);
    m.cylinder(b.x+xi,1.09,b.y+z,.33,.07,COLORS.steel,9);
  }
}
function lockers(m,b,x,z){
  for(let i=0;i<3;i++){
    const xx=x+i*.68;
    box(m,b,xx,1.04,z,.59,1.90,.54,COLORS.steel);
    box(m,b,xx,1.14,z+.29,.43,1.57,.07,COLORS.dark);
    for(let j=0;j<3;j++)box(m,b,xx,1.68-j*.16,z+.34,.26,.04,.05,COLORS.light);
    box(m,b,xx+.16,.89,z+.34,.045,.13,.09,COLORS.amber);
  }
}
function paint(m,b,c){
  box(m,b,0,.14,0,Math.max(.5,b.w-.50),.11,Math.max(.5,b.h-.60),c);
  for(const i of [-1,1])box(m,b,i*(b.w/2-.14),1.04,0,.08,1.86,b.h*.97,COLORS.steel);
}
export function decorateInterior(m,b,game){
  if(b.roofVisible||b.kind==='safehouse')return;
  // Use a coherent interior floorplan instead of the same two anonymous cubes per building.
  paint(m,b,b.kind==='hospital'?'#9ac1b5':b.kind==='police'?'#728c9a':b.kind==='apartment'?'#b59e82':'#9d9f8b');
  const x=Math.max(1.1,b.w*.24),z=Math.max(.9,b.h*.21);
  switch(b.kind){
    case 'hospital':
      bed(m,b,-x*.6,-z*.8);bed(m,b,x*.7,-z*.8);
      iv(m,b,-x*.75,.30);iv(m,b,x*.7,.30);
      shelf(m,b,-x,z);desk(m,b,x,z);
      box(m,b,0,1.98,-z*1.65,.15,.68,.12,COLORS.coral);
      box(m,b,0,1.98,-z*1.65,.63,.17,.12,COLORS.coral);
      break;
    case 'apartment':
      sofa(m,b,-x*.7,-z*.6);table(m,b,x*.6,z*.7);
      box(m,b,0,.20,0,3.40,.08,2.30,'#976f60');
      box(m,b,0,1.04,-z*1.4,2.10,1.45,.50,COLORS.wood);
      for(let i=-1;i<=1;i++)box(m,b,i*.65,1.84,-z*1.40,.58,.13,.49,COLORS.cream);
      lamp(m,b,x*.95,-z*.9);shelf(m,b,-x,z);
      break;
    case 'shop':
    case 'supermarket':
      for(let i=-1;i<=1;i++)shelf(m,b,i*x*.65,-z*.65,1.6);
      desk(m,b,x*.7,z*.7);crates(m,b,-x*.80,z*.72);
      for(let i=0;i<3;i++)box(m,b,-x*.9+i*.43,.38,z*.97,.29,.42,.37,i%2?COLORS.coral:COLORS.teal);
      break;
    case 'police':
      desk(m,b,-x*.60,-z*.57);desk(m,b,x*.72,-z*.57);
      lockers(m,b,-x,z);crates(m,b,x*.45,z*.65);
      for(let i=0;i<6;i++)box(m,b,-x*.8+i*.45,1.12,z*.55,.07,2.12,.065,COLORS.steel);
      lamp(m,b,0,.0);
      break;
    case 'fuel':
      desk(m,b,-x*.65,-z*.7);barrels(m,b,x*.54,-z*.5);
      shelf(m,b,0,z);crates(m,b,-x*.6,z*.7);
      break;
    default: // warehouse / heavy machinery
      for(let i=-1;i<=1;i++)crates(m,b,i*x*.78,-z*.7);
      barrels(m,b,-x*.65,z*.86);lockers(m,b,x*.10,z);
      box(m,b,x*.76,1.45,-z*.8,.58,2.8,.61,COLORS.steel);
      box(m,b,x*.75,2.74,-z*.8,1.4,.16,1.22,COLORS.amber);
  }
  // Illuminated extraction marker for a trapped civilian when the authoritative actor is here.
  if(game.civilians.some(c=>c.state==='trapped'&&c.buildingId===b.id)){
    box(m,b,0,2.40,0,.56,.12,.32,COLORS.coral);
    box(m,b,0,2.62,0,.11,.35,.11,COLORS.light);
  }
}
