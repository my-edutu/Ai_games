// World-space tactical graphics derived exclusively from authoritative AI game state.
const RESCUE='#55ffcf',CRISIS='#ff6d78',OBJECTIVE='#ffe397',SHIELD='#77d7fc',DIM='#49687d';
function beam(m,x,z,y,color,radius=.8,time=0){
  const pulse=.88+.12*Math.sin(time*2.8),r=radius*pulse;
  for(let i=0;i<12;i++){
    const a=i*Math.PI/6,b=(i+1)*Math.PI/6;
    const x0=x+r*Math.cos(a),z0=z+r*Math.sin(a);
    const x1=x+r*Math.cos(b),z1=z+r*Math.sin(b);
    m.bone([x0,y,z0],[x1,y,z1],.037,color);
  }
  m.bone([x,y+.25,z],[x,y+2.10+.13*Math.sin(time*2),z],.045,color);
  m.ball(x,y+2.30+.15*Math.sin(time*2),z,.21,color);
}
function bar(m,x,y,z,value,max,color,width=1.2){
  const p=Math.max(0,Math.min(1,max>0?value/max:0));
  m.box(x,y,z,width,.095,.09,DIM);
  if(p>.001)m.box(x-width*.5+width*p*.5,y,z+.085,Math.max(.02,width*p),.12,.07,color);
}
function objectivePoint(game){
  const id=game.objective.targetId;
  const list=[...game.civilians,...game.loot,...game.barricades,...game.survivors,...game.buildings];
  const target=id?list.find(entity=>entity.id===id):null;
  return target?{x:target.x,z:target.y}:{x:game.safeHouse.x,z:game.safeHouse.y};
}
// All phone/close-camera mission, civilian and horde signals stay on the ground:
// tall rings and pillars otherwise pass through hero faces in real phone captures.
function groundSignal(m,x,z,radius,color,time){
  const r=radius*(1+.055*Math.sin(time*2.8));
  for(let i=0;i<16;i++){
    if(i%4===3)continue; // broken quadrants read as a threat, not a selection halo
    const a=i*Math.PI/8,b=(i+1)*Math.PI/8;
    m.bone([x+r*Math.cos(a),.16,z+r*Math.sin(a)],
      [x+r*Math.cos(b),.16,z+r*Math.sin(b)],.031,color);
  }
  for(let i=0;i<4;i++){
    const a=(i+.5)*Math.PI/2;
    m.bone([x+(r+.27)*Math.cos(a),.18,z+(r+.27)*Math.sin(a)],
      [x+(r+.08)*Math.cos(a),.18,z+(r+.08)*Math.sin(a)],.029,color);
  }
}
export function decorateTacticalWorld(m,game,elapsed,focusX,focusZ,{compactSignals=false}={}){
  const point=objectivePoint(game);
  const missionColor=game.objective.kind==='rescue'?RESCUE:game.objective.kind==='fortify'?SHIELD:OBJECTIVE;
  if(Math.hypot(point.x-focusX,point.z-focusZ)<65){
    if(compactSignals){
      groundSignal(m,point.x,point.z,1.05,missionColor,elapsed);
    }else{
      beam(m,point.x,point.z,3.05,missionColor,1.25,elapsed);
      // High overview cameras can read the mission chevron from above.
      m.bone([point.x-0.55,5.8,point.z],[point.x,5.25,point.z],.075,missionColor);
      m.bone([point.x,5.25,point.z],[point.x+.55,5.8,point.z],.075,missionColor);
    }
  }
  // Critical health and infection have persistent visible world-space indicators.
  for(const s of game.survivors){
    if(!s.alive||Math.hypot(s.x-focusX,s.y-focusZ)>24)continue;
    if(s.health<65||s.infection>30){
      const color=s.health<30||s.infection>70?CRISIS:OBJECTIVE;
      bar(m,s.x,2.96,s.y,s.health,100,color);
      if(s.infection>30)bar(m,s.x,3.16,s.y,s.infection,100,'#ce86f1');
      if(s.health<35){
        const pulse=.17+.08*Math.sin(elapsed*4);
        m.ball(s.x,3.47,s.y,pulse,CRISIS);
      }
    }
  }
  for(const b of game.barricades){
    if(b.hp<=0||b.hp>=b.maxHp*.72||Math.hypot(b.x-focusX,b.y-focusZ)>35)continue;
    bar(m,b.x,1.9,b.y,b.hp,b.maxHp,b.hp<b.maxHp*.25?CRISIS:OBJECTIVE,2.8);
  }
  for(const c of game.civilians){
    if(c.state==='safe'||c.state==='dead')continue;
    if(Math.hypot(c.x-focusX,c.y-focusZ)>31)continue;
    const color=c.state==='trapped'?CRISIS:RESCUE;
    if(compactSignals)groundSignal(m,c.x,c.y,.43,color,elapsed+c.panic*3);
    else beam(m,c.x,c.y,2.58,color,.48,elapsed+c.panic*3);
  }
  // Actual nearby horde centroid becomes an amber/coral cluster signal.
  let count=0,x=0,z=0;
  for(const zombie of game.zombies){
    if(zombie.health<=0||Math.hypot(zombie.x-focusX,zombie.y-focusZ)>19)continue;
    count++;x+=zombie.x;z+=zombie.y;
  }
  if(count>=28){
    x/=count;z/=count;
    const intensity=Math.min(1,count/100);
    if(compactSignals){
      groundSignal(m,x,z,.65+intensity*.55,CRISIS,elapsed);
    }else{
      beam(m,x,z,3.20,CRISIS,.65+intensity*.75,elapsed);
      m.ball(x,5.85,z,.17+intensity*.3,CRISIS);
    }
  }
}
