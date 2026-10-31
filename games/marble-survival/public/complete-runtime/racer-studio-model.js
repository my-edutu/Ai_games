'use strict';
(function(root,factory){const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.MarbleStudioModel=api;})(typeof window==='object'?window:globalThis,()=>{
  const colors=Object.freeze({aurora:[.18,.94,.74],coral:[1,.42,.33],cyan:[.13,.86,1],gold:[1,.78,.19],lime:[.72,.97,.24],magenta:[1,.23,.72],orchid:[.69,.43,1],ruby:[1,.19,.32],sky:[.36,.69,1],violet:[.47,.34,1],amber:[1,.56,.13],mint:[.17,.95,.77]});
  const roles=['navigator','sprinter','bruiser','survivor'];
  const patterns=['dots','chevron','ring','split'];
  const own=(object,key)=>Object.prototype.hasOwnProperty.call(object,key);
  const finite=(n,fallback=0)=>Number.isFinite(n)?n:fallback;
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  function appearance(m){
    if(!m||!Number.isSafeInteger(m.id)||m.id<0)throw new TypeError('A public competitor ID is required');
    const role=roles.includes(m.archetype)?m.archetype:'navigator';
    const pattern=patterns.includes(m.pattern)?m.pattern:'ring';
    return {id:m.id,number:Number.isSafeInteger(m.number)&&m.number>0?m.number:m.id+1,
      name:typeof m.name==='string'?m.name.slice(0,48):`Marble ${m.id+1}`,
      role,pattern,patternId:patterns.indexOf(pattern)+1,
      color:[...(own(colors,m.palette)?colors[m.palette]:colors.cyan)],seed:m.id+1,
      status:typeof m.status==='string'?m.status.slice(0,32):'unknown',
      progress:clamp(finite(m.progressPermille)/10,0,100),elevation:finite(m.elevation)/1000,
      speed:Math.hypot(finite(m.velocityX),finite(m.velocityY))};
  }
  function roster(snapshot){
    if(!Array.isArray(snapshot?.marbles))return [];
    const seen=new Set(),result=[];
    for(const m of snapshot.marbles.slice(0,256)){
      if(!m||!Number.isSafeInteger(m.id)||m.id<0||seen.has(m.id))continue;
      seen.add(m.id);result.push(appearance(m));if(result.length===32)break;
    }
    return result.sort((a,b)=>a.number-b.number||a.id-b.id);
  }
  function segments(a,b){if(!Number.isInteger(a)||!Number.isInteger(b)||a<3||b<3||a>64||b>96)throw new RangeError('Portrait mesh segment budget exceeded');}
  function sphere(latitude=32,longitude=48){
    segments(latitude,longitude);const positions=[],normals=[],indices=[];
    for(let y=0;y<=latitude;y++){const theta=y*Math.PI/latitude;for(let x=0;x<=longitude;x++){
      const phi=x*2*Math.PI/longitude,v=[Math.sin(theta)*Math.cos(phi),Math.cos(theta),Math.sin(theta)*Math.sin(phi)];positions.push(...v);normals.push(...v);
    }}
    for(let y=0;y<latitude;y++)for(let x=0;x<longitude;x++){const a=y*(longitude+1)+x,b=a+longitude+1;indices.push(a,a+1,b,a+1,b+1,b);}
    return {positions,normals,indices};
  }
  function torus(major=40,minor=10){
    segments(major,minor);const positions=[],normals=[],indices=[];
    for(let a=0;a<=major;a++)for(let b=0;b<=minor;b++){
      const u=a*2*Math.PI/major,v=b*2*Math.PI/minor,n=[Math.cos(u)*Math.cos(v),Math.sin(v),Math.sin(u)*Math.cos(v)];
      positions.push(Math.cos(u)*(1+.07*Math.cos(v)),.07*Math.sin(v),Math.sin(u)*(1+.07*Math.cos(v)));normals.push(...n);
    }
    for(let a=0;a<major;a++)for(let b=0;b<minor;b++){const i=a*(minor+1)+b,j=i+minor+1;indices.push(i,i+1,j,j,i+1,j+1);}
    return {positions,normals,indices};
  }
  function box(){
    const positions=[],normals=[],indices=[];
    for(const [u,v,n] of [[[1,0,0],[0,1,0],[0,0,1]],[[-1,0,0],[0,1,0],[0,0,-1]],[[0,0,-1],[0,1,0],[1,0,0]],[[0,0,1],[0,1,0],[-1,0,0]],[[1,0,0],[0,0,-1],[0,1,0]],[[1,0,0],[0,0,1],[0,-1,0]]]){
      const base=positions.length/3;
      for(const [a,b] of [[-1,-1],[1,-1],[1,1],[-1,1]]){positions.push(...n.map((c,i)=>c+a*u[i]+b*v[i]));normals.push(...n);}
      indices.push(base,base+1,base+2,base,base+2,base+3);
    }
    return {positions,normals,indices};
  }
  function roleParts(role){
    const part=(shape,position,scale,rotation=[0,0,0],finish='metal')=>({shape,position,scale,rotation,finish});
    if(role==='sprinter')return [-1,1].flatMap(s=>[
      part('box',[s*.98,.02,-.05],[.10,.12,.54],[0,s*.3,s*-.25]),
      part('sphere',[s*1.06,.02,-.47],[.15,.15,.25],[0,0,0],'light')]);
    if(role==='bruiser')return [-1,1].flatMap(s=>[
      part('box',[s*.91,.03,0],[.16,.36,.48],[0,0,s*.13]),
      part('box',[s*.85,.39,.08],[.17,.10,.46],[0,0,s*.12],'light')]);
    if(role==='survivor')return [
      part('torus',[0,.08,0],[1.2,1.2,1.2],[.15,0,.22],'light'),
      ...[-1,1].map(s=>part('sphere',[s*1.18,.08,0],[.10,.18,.10],[0,0,0],'metal'))];
    return [part('torus',[0,.1,0],[1.12,1.12,1.12],[Math.PI/2,0,.34]),
      part('box',[0,1.14,0],[.11,.18,.11],[0,Math.PI/4,0],'light'),
      part('box',[0,-.94,0],[.08,.12,.08],[0,Math.PI/4,0])];
  }
  return Object.freeze({appearance,roster,sphere,torus,box,roleParts});
});
