// Authored city landmarks for 3D outbreak cinematography.
// No random calls, physics, pathfinding changes, simulation writes or loaded third-party assets.
function b(m,x,y,z,w,h,d,c,a=0){m.box(x,y,z,w,h,d,c,a);}
function girder(m,a,c,width,col){m.bone(a,c,width,col);}
const GOLD='#ffc65b',CORAL='#fa6a57',CYAN='#59e8e0',STEEL='#344c57',INK='#263841';
function digit(m,n,x,y,z,scale,color){
  const paths={0:[0,1,2,3,4,5],1:[1,2],2:[0,1,6,4,3],3:[0,1,6,2,3],4:[5,6,1,2],5:[0,5,6,2,3],6:[0,5,4,3,2,6],7:[0,1,2],8:[0,1,2,3,4,5,6],9:[0,1,2,3,5,6]};
  const lines=[[-.25,.48,.5,.07],[.25,.25,.07,.48],[.25,-.25,.07,.48],[-.25,-.48,.5,.07],[-.75,-.25,.07,.48],[-.75,.25,.07,.48],[-.25,0,.5,.07]];
  for(const id of paths[n]||[]){
    const [ox,oy,w,h]=lines[id];
    b(m,x+ox*scale,y+oy*scale,z,w*scale,h*scale,.055,color);
  }
}
function waterTower(m,x,z){
  const h=12;
  for(const sx of [-1,1])for(const sz of [-1,1]){
    const a=[x+sx*1.7,.35,z+sz*1.7],top=[x+sx*1.3,h,z+sz*1.3];
    girder(m,a,top,.10,STEEL);
  }
  for(const y of [3,6,9,11])for(const sz of [-1,1])girder(m,[x-1.5,y,z+sz*1.5],[x+1.5,y,z+sz*1.5],.065,'#8a7769');
  m.cylinder(x,13.4,z,2.0,3.4,'#638d97',12);
  m.cylinder(x,15.2,z,2.24,.30,GOLD,12);
  m.cylinder(x,11.7,z,1.75,.35,'#324953',12);
  m.cylinder(x,17.0,z,.08,.9,CORAL,6);
  m.ball(x,17.58,z,.25,CORAL);
}
function helipad(m,x,z){
  m.contactShadow(x+.8,z-.4,6.6,6.0,'#3a5149');
  b(m,x,.22,z,11,.35,11,'#29495b');
  b(m,x,.44,z,10.5,.055,10.5,'#537986');
  b(m,x,.49,z,8.5,.015,.10,'#ffe3a6');
  b(m,x,.49,z,.10,.015,8.5,'#ffe3a6');
  for(const side of [-1,1]){
    b(m,x+side*2,.55,z,.28,.11,3.9,'#ffffff');
    b(m,x,.55,z,.28,.11,3.0,'#ffffff');
  }
  for(const [dx,dz] of [[-5,-5],[-5,5],[5,5],[5,-5]]){
    b(m,x+dx,1.6,z+dz,.11,2.8,.11,'#344f62');
    b(m,x+dx,3.02,z+dz,.32,.20,.32,CORAL);
  }
  b(m,x,.70,z+5.8,11,.32,1.0,'#e6a752');
  for(let i=-5;i<=5;i+=2)b(m,x+i,.88,z+5.88,.42,.08,.90,'#1b323d');
}
function commandBillboard(m,x,z){
  b(m,x,6.2,z,9.5,3.7,.35,'#1b354c');
  b(m,x,6.25,z+.24,8.75,3.1,.08,'#385e79');
  for(let i=0;i<7;i++){
    const c=[CORAL,CYAN,GOLD,'#5fbaff'][i%4];
    b(m,x-3.6+i*1.20,7.2,z+.32,.65,.39,.065,c);
    b(m,x-3.65+i*1.20,6.45,z+.33,.72,.25,.06,c);
    b(m,x-3.65+i*1.20,5.65,z+.33,.72,.27,.06,'#d9e4d6');
  }
  for(const sx of [-3.5,3.5]){
    b(m,x+sx,2.6,z,.21,5.2,.23,'#415c6a');
    b(m,x+sx,3.1,z+.16,.40,2.8,.06,'#1d414c');
  }
  b(m,x,8.36,z,.55,.55,.58,GOLD);
  m.ball(x,8.78,z,.2,CORAL);
}
function metroEntrance(m,x,z){
  b(m,x,.18,z,8.6,.32,5.8,'#758b88');
  b(m,x,.42,z,7.1,.16,4.5,'#294251');
  b(m,x,2.6,z-1.2,7.1,.32,.68,'#eccb83');
  for(const sx of [-3.3,3.3]){
    b(m,x+sx,1.55,z-.95,.23,2.4,.26,'#3d666e');
    b(m,x+sx,.85,z+1.5,.16,1.4,.18,'#6a9ca6');
  }
  for(let i=0;i<4;i++){
    b(m,x,.15-i*.02,z-.92+i*.75,6.0-i*.4,.14,.52,i%2?'#a9b8a3':'#53666d');
  }
  for(let i=0;i<5;i++){
    b(m,x-2.3+i*1.15,2.62,z-.77,.74,.095,.16,i%2===0?GOLD:CYAN);
  }
  m.ball(x-3.1,3.07,z-1.32,.28,CYAN);
}
function evacuationCheckpoint(m,x,z){
  // The city is still navigable; gatework is decorative and placed off major movement lanes.
  const gate=[-5.1,5.1];
  for(const dx of gate){
    b(m,x+dx,3.55,z,.60,7.1,.65,'#315161');
    b(m,x+dx,7.28,z,1.15,.45,1.1,CORAL);
    b(m,x+dx,1.46,z+1.1,1.45,2.8,2.1,'#bc986d');
    b(m,x+dx,2.81,z+1.1,1.45,.18,2.18,'#f0d58a');
  }
  b(m,x,7.10,z,10.2,.52,.50,'#314d5e');
  b(m,x,7.46,z+0.3,8.8,.64,.19,'#e79c52');
  for(let i=-3;i<=3;i++)b(m,x+i*1.24,7.50,z+.45,.48,.16,.07,i%2?INK:'#ffd89a');
  for(const [dx,dz] of [[-7,-1],[7,-1],[-7,1],[7,1]]){
    b(m,x+dx,1.04,z+dz,1.7,1.10,.76,'#e6af59');
    b(m,x+dx,1.62,z+dz,1.7,.22,.76,'#263e4d');
  }
}
function excavator(m,x,z){
  m.contactShadow(x+.3,z-.5,3.1,2.2,'#395047');
  b(m,x,.76,z,3.3,1.15,2.1,'#dc9952',.08);
  b(m,x,1.52,z-.4,1.6,.85,1.9,'#668da1',.08);
  for(const sx of [-.85,.85])b(m,x+sx,.24,z,1.0,.45,2.5,INK);
  girder(m,[x+1,1.5,z],[x+3.5,4.2,z-.55],.20,'#f3b852');
  girder(m,[x+3.5,4.2,z-.55],[x+5.2,2.5,z-.6],.15,'#f1b047');
  b(m,x+5.3,2.20,z-.7,1.3,.65,1.42,'#354d58',.30);
}
function plazaFountain(m,x,z){
  m.contactShadow(x+.7,z-.4,4,3.1,'#394c4b');
  m.cylinder(x,.31,z,3.1,.55,'#7f9b9e',18);
  m.cylinder(x,.65,z,2.6,.09,'#70c1ca',18);
  m.cylinder(x,1.05,z,.8,.9,'#b6bbb3',12);
  m.ball(x,1.71,z,.6,'#e3cb8c');
  for(const a of [0,1.57,3.14,4.71]){
    m.bone([x,1.73,z],[x+Math.cos(a)*1.5,.9,z+Math.sin(a)*1.5],.045,'#90edeb');
  }
  for(const a of [0,1.57,3.14,4.71]){
    const sx=Math.cos(a)*4.5,sz=Math.sin(a)*3.9;
    b(m,x+sx,.45,z+sz,1.9,.6,.70,'#d3aa6a',a);
    b(m,x+sx,1.22,z+sz,.13,1.15,.13,'#42a2a3');
  }
}
function collapsedBridge(m,x,z){
  for(const dx of [-6.9,6.9]){
    b(m,x+dx,3.20,z,1.2,6.30,2.25,'#6b8384');
    b(m,x+dx,6.38,z,2.5,.35,2.55,'#a3b5b1');
  }
  b(m,x,6.20,z,12.8,.56,3.2,'#888e8a',-.06);
  b(m,x,6.60,z,10.8,.12,2.2,'#37464d',-.06);
  b(m,x,6.61,z,10.8,.045,.15,'#eac881',-.06);
  for(let i=-5;i<=5;i+=2){
    b(m,x+i,7.15,z-.95,.15,.95,.14,'#b5c8ba');
    b(m,x+i,7.15,z+.95,.15,.95,.14,'#b5c8ba');
  }
  b(m,x+3,5.55,z+1.45,3.9,.4,2.5,'#a3826f',-.25);
  for(let i=0;i<8;i++){
    const dx=x-6+i*1.75,offset=(i%3)*.16;
    b(m,dx,.28,z+2.6+offset,.70,.42,.51,i%2?'#887965':'#c59d78',i*.19);
  }
}
export function decorateSetpieces(mesh){
  // Each major district has a uniquely identifiable skyline or focal prop.
  waterTower(mesh,-53,35);
  helipad(mesh,36,-37);
  commandBillboard(mesh,50,-27);
  metroEntrance(mesh,-50,-33);
  evacuationCheckpoint(mesh,0,-44);
  plazaFountain(mesh,42,40);
  excavator(mesh,-36,41);
  collapsedBridge(mesh,48,11);
  // Survivor-approved bright focal props across the world, off core AI routes.
  for(const [i,[x,z]] of [[-47,-19],[38,-18],[-46,10],[45,30],[9,40]].entries()){
    b(mesh,x,.32,z,3.8,.51,1.7,i%2?CYAN:CORAL);
    b(mesh,x,1.11,z,3.3,.18,1.5,INK);
    for(const sx of [-1.4,1.4])b(mesh,x+sx,.70,z,.16,1.15,.19,GOLD);
  }
}
