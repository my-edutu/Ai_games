// Deterministic, dependency-free 3-axis climbing physics and autonomous route planner.
// No rendering, timers, network, Math.random or mutable external state.
export function createVolumetricCore(seedInput=0x00a3f914){
  const config=Object.freeze({gravity:24,jump:14.2,speed:9.4,acceleration:45,halfHeight:1.5,maxFall:-27,worldX:18,worldZ:16});
  let seed=seedInput>>>0,tick=0,time=0,highestGenerated=-1,highestReached=0,mode='INIT',guardianKills=0,score=0,intent='ASSESSING ROUTE';
  const build={stride:0,grip:0,ward:0,salvage:0};
  let shields=0,upgradesTaken=0,wallClimbs=0;
  const climbing={active:false,targetFloor:-1,progress:0,stamina:100,fromX:0,fromY:0,fromZ:0};
  const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
  const clamp=(value,low,high)=>Math.min(high,Math.max(low,value));
  const player={x:0,y:2.05,z:0,vx:0,vy:0,vz:0,grounded:true,at:0,checkpoint:0,deaths:0,health:5};
  const platforms=[];
  const isWallClimb=i=>i>0&&i%23===0;
  const events=[];
  const emit=(type,text,extra={})=>{
    events.push({id:tick+':'+type+':'+events.length,tick,floor:player.at,type,text,...extra});
    if(events.length>32)events.shift();
  };
  emit('run-start','A new climber enters the infinite tower.');
  function addLanding(i){
    const prev=platforms[platforms.length-1];
    const x=i===0?0:clamp(prev.x+(random()-.5)*11,-13,13);
    const z=i===0?0:clamp(prev.z+(random()-.5)*10,-11,11);
    const kind=isWallClimb(i)?'wall-climb':i===0?'solid':i%10===0?'guardian':i%17===0?'crumbling':
      i%13===0?'narrow':i%11===0?'wind':i%7===0?'moving':i%19===0?'spring':'solid';
    const y=i===0?0:prev.y+(kind==='wall-climb'?5.15:3.05)+(random()-.5)*.28;
    const width=i===0?11:kind==='narrow'?5.4+random():6.8+random()*1.8;
    const depth=i===0?11:kind==='narrow'?5.2+random():6.3+random()*1.8,height=.95;
    platforms.push({i,x,y,z,baseX:x,baseZ:z,width,depth,height,kind,structuralIntegrity:kind==='crumbling'?1:2,
      guardian:i>0&&i%10===0,guardianHealth:i>0&&i%10===0?(i%30===0?7:5):0,
      guardianClock:0,guardianTelegraph:false,
      guardianClass:i%30===0?'titan':i%20===0?'stormcaller':'warden',
      pickup:i>0&&i%6===0,collected:false});
    highestGenerated=i;
  }
  for(let i=0;i<17;i++)addLanding(i);
  const landingHeight=p=>p.y+p.height/2+.08;
  const currentTheme=()=>['foundry','ruins','clockwork','storm','void'][Math.floor(player.at/12)%5];
  const speedLimit=()=>config.speed+Math.min(4,build.stride)*.55;
  const jumpImpulse=()=>config.jump+Math.min(4,build.grip)*.32;
  function chooseUpgrade(floor){
    if(player.health<=2&&build.ward<4){build.ward++;shields+=2;return 'Aegis Ward';}
    const order=['stride','grip','salvage','ward'];
    const key=order[Math.floor(floor/8-1)%order.length];
    if(build[key]>=4){
      if(build.salvage<4){build.salvage++;return 'Fortune Recovery';}
      shields=Math.min(6,shields+1);return 'Veteran Shield';
    }
    build[key]++;
    if(key==='ward')shields+=2;
    return {stride:'Swift Ascender',grip:'Skyward Grip',salvage:'Salvage Instinct',ward:'Aegis Ward'}[key];
  }
  function registerLanding(p){
    const newlyReached=p.i>player.at;
  player.y=landingHeight(p)+config.halfHeight;player.vy=0;player.grounded=true;
          if(p.i>player.at){
            const before=player.checkpoint,oldTheme=currentTheme();
            player.at=p.i;player.checkpoint=Math.floor(p.i/5)*5;
            highestReached=Math.max(highestReached,p.i);score+=25+build.salvage*5;mode='LANDED';
            if(p.i>0&&p.i%8===0){upgradesTaken++;const chosen=chooseUpgrade(p.i);emit('upgrade','The AI selected '+chosen+' at floor '+p.i+'.',{chosen,build:{...build}});}
            if(p.i%5===0)emit('checkpoint','Checkpoint secured on floor '+p.i+'.',{checkpoint:player.checkpoint});
            if(p.kind==='moving')emit('moving-platform','The AI intercepted a moving platform at floor '+p.i+'.');
            if(p.kind==='narrow')emit('precision-landing','Narrow ledge secured at floor '+p.i+'.');
            if(p.kind==='spring')emit('updraft','The climber found a powerful jump pad.');
            if(p.kind==='crumbling')emit('unstable-ground','Unstable masonry: must move before it collapses.');
            if(currentTheme()!==oldTheme)emit('biome','Entering the '+currentTheme()+' sector.',{theme:currentTheme()});
          }
          if(p.pickup&&!p.collected){p.collected=true;player.health=Math.min(5,player.health+1);score+=100+build.salvage*20;
            emit('recovery-item','Recovered equipment on floor '+p.i+'.',{health:player.health});}

    if(p.kind==='wall-climb'&&newlyReached){wallClimbs++;emit('wall-mantle','Climbed a vertical handhold section on floor '+p.i+'.',{stamina:climbing.stamina});}
  }
  function respawn(){
    const target=platforms.find(p=>p.i===player.checkpoint)||platforms[0];
    Object.assign(player,{x:target.x,z:target.z,y:landingHeight(target)+config.halfHeight+.02,
      vx:0,vy:0,vz:0,at:target.i,grounded:true,deaths:player.deaths+1,health:Math.max(1,player.health-1)});
    climbing.active=false;
    mode='RECOVERING';
    emit('recovery','The climber fell and returned to checkpoint '+player.checkpoint+'.');
  }
  function step(dt=1/60,input){
    if(!Number.isFinite(dt)||dt<=0||dt>1/30)throw new RangeError('fixed-step dt');
    tick++;time+=dt;mode='CLIMBING';
    // Moving landings have real simulated 3D trajectories, not cosmetic animation.
    for(const platform of platforms)if(platform.kind==='moving'){
      platform.x=clamp(platform.baseX+Math.sin(tick*.016+platform.i*.51)*1.25,-13.5,13.5);
      platform.z=clamp(platform.baseZ+Math.cos(tick*.013+platform.i*.24)*1.15,-11.5,11.5);
    }
    if(player.grounded&&!climbing.active)climbing.stamina=Math.min(100,climbing.stamina+dt*17);
    if(climbing.active){
      const p=platforms.find(p=>p.i===climbing.targetFloor);
      if(!p){respawn();return snapshot();}
      const duration=Math.max(1.05,1.85-build.grip*.11),easing=(t)=>t*t*(3-2*t);
      climbing.progress=Math.min(1,climbing.progress+dt/duration);
      const k=climbing.progress,eased=easing(k);
      player.x=climbing.fromX+(p.x-climbing.fromX)*eased;
      player.z=climbing.fromZ+(p.z-climbing.fromZ)*eased;
      player.y=climbing.fromY+(landingHeight(p)+config.halfHeight-climbing.fromY)*eased;
      player.vx=(p.x-climbing.fromX)/duration;player.vz=(p.z-climbing.fromZ)/duration;
      player.vy=(landingHeight(p)+config.halfHeight-climbing.fromY)/duration;
      climbing.stamina=Math.max(0,climbing.stamina-dt*(14-build.grip*1.2));
      player.grounded=false;
      mode=k>.83?'WALL MANTLE':'WALL CLIMBING';
      intent=k>.83?'MANTLE THE UPPER LEDGE':'ASCEND VERTICAL HANDHOLDS';
      if(climbing.stamina<=0){climbing.active=false;player.vy=-2;mode='FALLING';emit('slip','Grip exhausted on the ascent wall.');}
      else if(k>=1){climbing.active=false;registerLanding(p);mode='WALL MANTLE COMPLETE';}
      while(highestGenerated<player.at+15)addLanding(highestGenerated+1);
      while(platforms.length>24&&platforms[0].i<player.at-8)platforms.shift();
      return snapshot();
    }
    const current=platforms.find(p=>p.i===player.at);
    const guardian=current&&current.guardianHealth>0&&player.grounded?current:null;
    if(current?.kind==='crumbling'&&player.grounded&&tick%40===0){
      current.structuralIntegrity--;
      if(current.structuralIntegrity<=0)emit('crumble','The stones gave way beneath the climber.');
    }
    if(guardian)guardian.guardianClock++;
    const threatPhase=guardian?guardian.guardianClock%78:0;
    const evading=!!guardian&&threatPhase>=20&&threatPhase<=36;
    if(guardian){
      guardian.guardianTelegraph=evading;
      if(threatPhase===20)emit('guardian-telegraph','The '+guardian.guardianClass+' charges a crushing attack.',{guardianClass:guardian.guardianClass});
    }
    const target=guardian||platforms.find(p=>p.i===player.at+1);
    // Predict the landing surface at the DOWNWARD intersection time, not its current position.
    // This makes our decisions sensitive to moving targets rather than blind reactive pursuit.
    let landingLeadTicks=0;
    if(target&&!guardian){
      const ownPlatform=platforms.find(p=>p.i===player.at);
      const heightDifference=ownPlatform?landingHeight(target)-landingHeight(ownPlatform):3.05;
      const discriminant=Math.max(0,config.jump*config.jump-2*config.gravity*Math.max(0,heightDifference));
      landingLeadTicks=Math.max(0,Math.round((config.jump+Math.sqrt(discriminant))/config.gravity/dt));
    }
    const futureX=target?.kind==='moving'?clamp(target.baseX+Math.sin((tick+landingLeadTicks)*.016+target.i*.51)*1.25,-13.5,13.5):target?.x;
    const futureZ=target?.kind==='moving'?clamp(target.baseZ+Math.cos((tick+landingLeadTicks)*.013+target.i*.24)*1.15,-11.5,11.5):target?.z;
    let dx=target?futureX-player.x:0,dz=target?futureZ-player.z:0;
    // Predict strike timing; step beyond the projected radius, then counterattack.
    if(evading){
      const dir=guardian.i%20===0?-1:1;
      dx=guardian.x+dir*3.05-player.x;
      dz=guardian.z+(dir*.9)-player.z;
    }
    if(input){dx=Number(Boolean(input.right))-Number(Boolean(input.left));dz=Number(Boolean(input.back))-Number(Boolean(input.forward));}
    if(player.grounded&&!guardian&&target?.kind==='wall-climb'&&Math.hypot(dx,dz)<8.2&&climbing.stamina>=25){
      Object.assign(climbing,{active:true,targetFloor:target.i,progress:0,fromX:player.x,fromY:player.y,fromZ:player.z});
      player.grounded=false;player.vy=0;mode='WALL GRAB';intent='TAKE THE FIRST HANDHOLD';
      emit('wall-grab','A vertical face blocks the route; the AI engages climbing handholds.');
      return snapshot();
    }
    const dist=Math.hypot(dx,dz),speed=dist>.15?speedLimit():0;
    intent=guardian?(evading?'DODGE GUARDIAN TELEGRAPH':'NEUTRALIZE GUARDIAN'):target?.kind==='moving'?'PREDICT MOVING LANDING':target?'SECURE NEXT PLATFORM':'SEARCHING FOR ROUTE';
    const desiredX=dist>.15?dx/dist*speed:0,desiredZ=dist>.15?dz/dist*speed:0;
    player.vx+=clamp(desiredX-player.vx,-config.acceleration*dt,config.acceleration*dt);
    if(current?.kind==='wind'&&!player.grounded){
      player.vx+=Math.sin(tick*.068+current.i)*2.8*dt;
      intent='STABILIZE AGAINST CROSSWIND';
    }
    player.vz+=clamp(desiredZ-player.vz,-config.acceleration*dt,config.acceleration*dt);
    if(guardian){
      mode=evading?'GUARDIAN TELEGRAPH':'GUARDIAN ENGAGED';
      const opponentDist=Math.hypot(player.x-guardian.x,player.z-guardian.z);
      if(!evading&&opponentDist<4.4&&guardian.guardianClock%13===0){
        guardian.guardianHealth--;mode='STRIKING GUARDIAN';score+=50+build.salvage*10;
      }
      if(guardian.guardianHealth>0&&threatPhase===37){
        if(opponentDist<(guardian.guardianClass==='titan'?3.15:2.45)){
          if(shields>0)shields--;else player.health--;
          mode='GUARDIAN RETALIATION';
          emit('guardian-hit','The '+guardian.guardianClass+' strike connected.',{health:player.health});
        }else{
          mode='GUARDIAN DODGED';
          score+=30;emit('guardian-evaded','The climber escaped the '+guardian.guardianClass+' impact.');
        }
      }
      if(guardian.guardianHealth<=0){
        guardian.guardianHealth=0;guardian.guardianTelegraph=false;
        guardianKills++;score+=500;mode='GUARDIAN DEFEATED';
        emit('guardian-defeated','Guardian '+player.at+' defeated. The ascent continues.',{score,guardianClass:guardian.guardianClass});
      }
      if(player.health<=0)respawn();
    }
    if(player.grounded&&!guardian&&target?.kind!=='wall-climb'&&((!input&&target)||(input&&input.jump))){
      const nextDelta=target?landingHeight(target)-(landingHeight(platforms.find(p=>p.i===player.at)||platforms[0])):0;
      const leap=jumpImpulse();
      const reach=speedLimit()*(leap+Math.sqrt(Math.max(0,leap*leap-2*config.gravity*Math.max(0,nextDelta))))/config.gravity;
      if(input||dist<=reach*.9){
        player.vy=leap+(current?.kind==='spring'?1.3:0);
        player.grounded=false;mode='JUMPING';
        intent=current?.kind==='spring'?'EXPLOIT UPDRAFT':'EXECUTE VERTICAL LEAP';
      }
      else{intent='POSITION FOR SAFE JUMP';}
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
        if(p.structuralIntegrity>0&&oldFoot>=top-.08&&newFoot<=top&&Math.abs(player.x-p.x)<p.width/2+.4&&Math.abs(player.z-p.z)<p.depth/2+.4){
          registerLanding(p);
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
    return {tick,time,mode,intent,theme:currentTheme(),highestReached,highestGenerated,guardianKills,score,
      events:events.slice(-12),build:{...build},shields,upgradesTaken,wallClimbs,
      climbing:{...climbing},
      player:{...player},platforms:platforms.map(p=>({...p})),dimensionality:3};
  }
  return {step,snapshot,platforms,player,landingHeight,config};
}
