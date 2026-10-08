// Deterministic, dependency-free 3-axis climbing physics and autonomous route planner.
// No rendering, timers, network, Math.random or mutable external state.
export function createVolumetricCore(seedInput=0x00a3f914){
  const config=Object.freeze({gravity:24,jump:14.2,speed:9.4,acceleration:45,halfHeight:1.5,maxFall:-27,worldX:18,worldZ:16});
  let seed=seedInput>>>0,tick=0,time=0,highestGenerated=-1,highestReached=0,mode='INIT';
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
  const player={x:0,y:2.05,z:0,vx:0,vy:0,vz:0,grounded:true,at:0,checkpoint:0,deaths:0,health:5};
  const platforms=[];
  function addLanding(i){
    const prev=platforms[platforms.length-1];
    const x=i===0?0:clamp(prev.x+(random()-.5)*11,-13,13);
    const z=i===0?0:clamp(prev.z+(random()-.5)*10,-11,11);
    const y=i===0?0:prev.y+3.05+(random()-.5)*.28;
    const width=i===0?11:6.8+random()*1.8,depth=i===0?11:6.3+random()*1.8,height=.95;
    platforms.push({i,x,y,z,width,depth,height,kind:i%7===0?'moving':'solid'});
    highestGenerated=i;
  }
  for(let i=0;i<17;i++)addLanding(i);
  const landingHeight=p=>p.y+p.height/2+.08;
  const currentTheme=()=>['foundry','ruins','clockwork','storm','void'][Math.floor(player.at/12)%5];
  function respawn(){
    const target=platforms.find(p=>p.i===player.checkpoint)||platforms[0];
    Object.assign(player,{x:target.x,z:target.z,y:landingHeight(target)+config.halfHeight+.02,
      vx:0,vy:0,vz:0,at:target.i,grounded:true,deaths:player.deaths+1,health:Math.max(1,player.health-1)});
    mode='RECOVERING';
  }
  function step(dt=1/60,input){
    if(!Number.isFinite(dt)||dt<=0||dt>1/30)throw new RangeError('fixed-step dt');
    tick++;time+=dt;mode='CLIMBING';
    const target=platforms.find(p=>p.i===player.at+1);
    let dx=target?target.x-player.x:0,dz=target?target.z-player.z:0;
    if(input){dx=Number(Boolean(input.right))-Number(Boolean(input.left));dz=Number(Boolean(input.back))-Number(Boolean(input.forward));}
    const dist=Math.hypot(dx,dz),speed=dist>.15?config.speed:0;
    const desiredX=dist>.15?dx/dist*speed:0,desiredZ=dist>.15?dz/dist*speed:0;
    player.vx+=clamp(desiredX-player.vx,-config.acceleration*dt,config.acceleration*dt);
    player.vz+=clamp(desiredZ-player.vz,-config.acceleration*dt,config.acceleration*dt);
    if(player.grounded&&((!input&&target)||(input&&input.jump))){
      const nextDelta=target?landingHeight(target)-(landingHeight(platforms.find(p=>p.i===player.at)||platforms[0])):0;
      const reach=config.speed*(config.jump+Math.sqrt(Math.max(0,config.jump*config.jump-2*config.gravity*Math.max(0,nextDelta))))/config.gravity;
      if(input||dist<=reach*.9){player.vy=config.jump;player.grounded=false;mode='JUMPING';}
    }
    const oldFoot=player.y-config.halfHeight;
    player.vy=Math.max(config.maxFall,player.vy-config.gravity*dt);
    player.x=clamp(player.x+player.vx*dt,-config.worldX,config.worldX);
    player.z=clamp(player.z+player.vz*dt,-config.worldZ,config.worldZ);
    player.y+=player.vy*dt;
    const newFoot=player.y-config.halfHeight;
    if(player.vy<=0){
      for(let i=platforms.length-1;i>=0;i--){
        const p=platforms[i],top=landingHeight(p);
        if(oldFoot>=top-.08&&newFoot<=top&&Math.abs(player.x-p.x)<p.width/2+.4&&Math.abs(player.z-p.z)<p.depth/2+.4){
          player.y=top+config.halfHeight;player.vy=0;player.grounded=true;
          if(p.i>player.at){player.at=p.i;player.checkpoint=Math.floor(p.i/5)*5;highestReached=Math.max(highestReached,p.i);mode='LANDED';}
          break;
        }
      }
    }
    const anchor=platforms.find(p=>p.i===player.at);
    if(anchor&&player.y<landingHeight(anchor)-13)respawn();
    while(highestGenerated<player.at+15)addLanding(highestGenerated+1);
    while(platforms.length>24&&platforms[0].i<player.at-8)platforms.shift();
    return snapshot();
  }
  function snapshot(){
    return {tick,time,mode,theme:currentTheme(),highestReached,highestGenerated,
      player:{...player},platforms:platforms.map(p=>({...p})),dimensionality:3};
  }
  return {step,snapshot,platforms,player,landingHeight,config};
}
