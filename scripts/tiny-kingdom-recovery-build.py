from pathlib import Path
import hashlib
p=Path('public/tiny-kingdom/index.html')
s=p.read_text()
expected='f7ae295be845aaa45d885e80d75b3820d69ca3838acd81f2ac4c425f0988c44a'
actual=hashlib.sha256(p.read_bytes()).hexdigest()
if actual==expected:
 print('Verified recovery implementation already present');raise SystemExit(0)
if actual!='587b53033771768bd4e621bae082533660d1622598a66cebf30abc6de96d4215':
 raise RuntimeError('Refusing to modify a different game source: '+actual)
def change(a,b):
 global s
 if a not in s: raise RuntimeError('Missing anchor '+a[:100])
 s=s.replace(a,b,1)
change('quad([xx,y+h,zy],[x,y+ridge,zy],[x,y+ridge,zz],[xx,y+h,zz],col);quad([x,y+ridge,zy],[xr,y+h,zy],[xr,y+h,zz],[x,y+ridge,zz],col);',
       'quad([xx,y+h,zz],[x,y+ridge,zz],[x,y+ridge,zy],[xx,y+h,zy],col);quad([x,y+ridge,zz],[xr,y+h,zz],[xr,y+h,zy],[x,y+ridge,zy],col);')
change('tri([xx,y+h,zy],[xr,y+h,zy],[x,y+ridge,zy],rgb(0xd1bf9e));tri([xr,y+h,zz],[xx,y+h,zz],[x,y+ridge,zz],rgb(0xd1bf9e));',
       'tri([xx,y+h,zy],[x,y+ridge,zy],[xr,y+h,zy],rgb(0xd1bf9e));tri([xr,y+h,zz],[x,y+ridge,zz],[xx,y+h,zz],rgb(0xd1bf9e));')
change('materialScope(MATERIAL.ROOF,()=>quad([outer0[0],outer0[1]+lift,z0],[outer1[0],outer1[1]+lift,z0],[outer1[0],outer1[1]+lift,z1],[outer0[0],outer0[1]+lift,z1],color));',
'''const corners=[[outer0[0],outer0[1]+lift,z0],[outer1[0],outer1[1]+lift,z0],[outer1[0],outer1[1]+lift,z1],[outer0[0],outer0[1]+lift,z1]];
   if(slope===0)corners.reverse();
   materialScope(MATERIAL.ROOF,()=>quad(...corners,color));''')
change('const working=/harvest|cutting|craft|construct|making|forag/.test(action);\n const traveling=/travel|explor/.test(action);\n const intensity=traveling?.72:working?.34:.11;',
'''const traveling=/^travel|^explor/.test(action);
 const working=!traveling&&/harvest|cutting|construct|making|forag|barter|tending|importing/.test(action);
 const intensity=traveling?.72:0;''')
a=s.index(' const arms=[-1,1].map(side=>{',s.index('function citizenRigPose'))
b=s.index('\nfunction limbSegment',a)
s=s[:a]+''' const arms=[-1,1].map(side=>{
  // Walking counter-swing; working feet stay planted while hands perform the job.
  const swing=-Math.sin(phase+(side<0?0:Math.PI))*intensity*.27;
  const shoulder=[side*.30,1.015,0];
  let wrist=[side*.33,.565,swing];
  if(working){
   const beat=Math.sin(p.phase*4.1),reach=(beat+1)*.5;
   if(p.job==='farmer')wrist=[side*.22,.61+reach*.17,.28+reach*.15];
   else if(p.job==='forester')wrist=[side*.23,.71+reach*.39,.26+reach*.12];
   else if(p.job==='builder'||p.job==='craftsperson')wrist=side>0?[.31,.65+reach*.35,.24]:[-.27,.68,.27];
   else if(p.job==='merchant')wrist=[side*.30,.67+reach*.07,.24+side*beat*.06];
   else if(p.job==='gatherer')wrist=side>0?[.32,.42+reach*.18,.22+reach*.09]:[-.28,.67,.26];
  }
  const elbow=[side*.36,(shoulder[1]+wrist[1])*.5-.04,wrist[2]*.53];
  return {shoulder,elbow,wrist};
 });
 return {legs,arms,working,traveling,stride:Math.sin(phase)*intensity};
}
// Equipment and mesh construction share these joints. No world-space props
// masquerade as a held tool, and baskets do not imply a simulated cargo inventory.
function citizenEquipment(p,rig=citizenRigPose(p)){
 const kind={farmer:'hoe',forester:'axe',builder:'mallet',merchant:'coin-pouch',craftsperson:'hammer',gatherer:'basket'}[p.job];
 const hand=p.job==='merchant'?0:1,grip=rig.arms[hand].wrist.slice();
 const length=p.job==='farmer'?.64:p.job==='forester'?.43:.31;
 const angle=rig.working?Math.sin(p.phase*4.1)*.55:.15;
 const direction=[0,Math.cos(angle),Math.sin(angle)];
 const tip=grip.map((v,k)=>v+direction[k]*length);
 return {kind,hand,grip,tip,direction};
}
function renderCitizenEquipment(p,rig,worldJoint,size){
 const item=citizenEquipment(p,rig),grip=worldJoint(item.grip),tip=worldJoint(item.tip);
 const woodColor=rgb(0x795035),metal=rgb(0xa9b4b0),leather=rgb(0x8a633d);
 if(item.kind==='coin-pouch'){
  const center=worldJoint([item.grip[0],item.grip[1]-.15,item.grip[2]]);
  ellipsoid(...center,.105*size,.15*size,.09*size,leather,8);
  limbSegment(grip,[grip[0],grip[1]-.06*size,grip[2]],.032*size,rgb(0xd8b874),6);
 }else if(item.kind==='basket'){
  const center=worldJoint([item.grip[0],item.grip[1]-.25,item.grip[2]]);
  cylinder(...center,.16*size,.22*size,rgb(0xb89960),9);
  for(const side of [-1,1])limbSegment(grip,[center[0]+side*.14*size,center[1]+.2*size,center[2]],.018*size,woodColor,5);
  for(let ring=0;ring<3;ring++)cylinder(center[0],center[1]+(.04+ring*.07)*size,center[2],.165*size,.018*size,woodColor,9);
 }else{
  const heel=worldJoint(item.grip.map((v,k)=>v-item.direction[k]*.17));
  limbSegment(heel,tip,.025*size,woodColor,7);
  const width=item.kind==='hoe'?.27:item.kind==='axe'?.21:.24;
  const left=[tip[0]-width*size/2,tip[1],tip[2]],right=[tip[0]+width*size/2,tip[1],tip[2]];
  limbSegment(left,right,(item.kind==='mallet'?.085:.05)*size,item.kind==='mallet'?woodColor:metal,6);
  if(item.kind==='axe'||item.kind==='hoe'){
   const edge=[tip[0]+width*.65*size,tip[1]-.11*size,tip[2]];
   limbSegment(right,edge,.055*size,metal,5);
  }
 }
}
''' + s[b:]
change('const foot=worldJoint(leg.ankle);box(foot[0],foot[1]-.045*size,', 'const foot=worldJoint(leg.ankle);box(foot[0],foot[1]-.11*size,')
a=s.index("if(p.job==='forester'){cone",s.index('function villager'))
b=s.index('// Every character actually faces',a)
s=s[:a]+'''if(p.job==='forester')cone(x,y+1.65*size,z,.255*size,.25*size,rgb(0x526a49),8);
if(p.job==='builder')box(x,y+1.73*size,z,.48*size,.10*size,.43*size,rgb(0xa78a5e));
renderCitizenEquipment(p,rig,worldJoint,size);
''' + s[b:]
change("p.activity='Resting and gathering food'", "p.activity='Traveling home to rest'")
idx=s.index('function work(p){')
s=s[:idx]+'''function citizenWorkActivity(p,time=state.t){
 if(p.energy<30||p.hunger>88)return 'Resting at home';
 return p.job==='farmer'?(climateAt(time).season===3?'Tending winter stores':'Harvesting grain'):
  p.job==='forester'?'Cutting timber':p.job==='merchant'?'Bartering at market':
  p.job==='builder'?'Constructing cottages':p.job==='craftsperson'?'Making household goods':'Foraging the hillside';
}
function beginCitizenWork(p){p.workTimer=0;p.activity=citizenWorkActivity(p)}
''' + s[idx:]
a=s.index('function step(dt){')
b=s.index('// Relationships are generated',a)
s=s[:a]+'''function step(dt){state.t+=dt;for(let i=0;i<people.length;i++){
 const p=people[i];p.phase+=dt*2.2;p.hunger=Math.min(100,p.hunger+dt*.14);
 // A failed path is not arrival. Retry with a bounded interval and never pay
 // a work reward at the accidental position where navigation failed.
 if(p.activity==='Waiting for a safe route'){
  p.workTimer+=dt;if(p.workTimer>=1){p.workTimer=0;choose(p)}continue;
 }
 const wp=p.path&&p.path.length?p.path[0]:p.target;
 const wx=wp[0]-p.x,wz=wp[1]-p.z,remaining=Math.hypot(wx,wz);
 if(remaining>.24){
  const move=Math.min(remaining,dt*(.75+i%4*.09));
  const nx=p.x+wx/remaining*move,nz=p.z+wz/remaining*move;
  if(move<=.04?walkable(nx,nz):clearSegment([p.x,p.z],[nx,nz])){
   p.x=nx;p.z=nz;p.energy=Math.max(0,p.energy-dt*.10);p.workTimer=0;
  }else{p.workTimer+=dt;if(p.workTimer>=1){routeCitizen(p);p.workTimer=0}}
 }else if(p.path&&p.path.length){
  p.path.shift();if(!p.path.length)beginCitizenWork(p);
 }else if(/^Traveling|^Exploring|^Finding/.test(p.activity)){
  beginCitizenWork(p);
 }else{
  p.workTimer+=dt;if(p.workTimer>=2.5){work(p);p.workTimer=0;choose(p)}
 }
}
''' + s[b:]
change("algorithm:'seeded-v1',payload", "algorithm:'seeded-work-v2',payload")
change("snapshot.algorithm!=='seeded-v1'||!snapshot.payload", "!['seeded-v1','seeded-work-v2'].includes(snapshot.algorithm)||!snapshot.payload")
change("const q=cloneData(snapshot.payload);selectedCitizen", """const q=cloneData(snapshot.payload);
 // v1 accumulated travel time as work. Migrate once without touching resources
 // or RNG; v2 saves preserve a partially completed work interval exactly.
 if(snapshot.algorithm==='seeded-v1')for(const person of q.people){
  person.workTimer=0;
  if(person.activity!=='Waiting for a safe route'&&!person.path.length&&Math.hypot(person.target[0]-person.x,person.target[1]-person.z)<=.24)
   person.activity=citizenWorkActivity(person,q.state.t);
 }
 selectedCitizen""")
result=hashlib.sha256(s.encode()).hexdigest()
if result!=expected:raise RuntimeError('Implementation checksum mismatch: '+result)
p.write_text(s)
print('Applied exact locally tested game source '+result)
