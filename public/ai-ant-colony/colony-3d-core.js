/* Read-only public-frame adapter and dependency-free 3D math. */
(function(root,factory){'use strict';const api=factory();if(typeof module==='object'&&module.exports)module.exports=api;else root.Ant3D=api;})(typeof globalThis!=='undefined'?globalThis:this,function(){
  'use strict';
  const clamp=(n,a,b)=>Math.max(a,Math.min(b,n));
  const finite=(n,a=0,b=1e12)=>typeof n==='number'&&Number.isFinite(n)&&n>=a&&n<=b;
  const roles=new Set(['worker','scout','nurse','digger','soldier']);
  const walkable=t=>t===1||t===2||t===3;
  function hash(n){let x=n|0;x=Math.imul(x^(x>>>16),0x45d9f3b);return ((x^(x>>>16))>>>0)/4294967296;}
  function validateSnapshot(s){
    if(!s||s.schemaVersion!==1||!Number.isSafeInteger(s.revision)||s.revision<0||!Number.isSafeInteger(s.runIndex)||s.runIndex<0||typeof s.runToken!=='string'||!s.runToken||s.runToken.length>128)return false;
    const w=s.world;if(!w||!Number.isInteger(w.width)||!Number.isInteger(w.height)||w.width<4||w.height<4||w.width>128||w.height>128||w.width*w.height>8192)return false;
    const n=w.width*w.height;
    if(!Number.isInteger(w.surfaceRow)||w.surfaceRow<0||w.surfaceRow>=w.height||!Number.isInteger(w.nestCenter)||w.nestCenter<0||w.nestCenter>=n)return false;
    for(const key of ['tiles','food','moisture','discovered'])if(!Array.isArray(w[key])||w[key].length!==n||!w[key].every(v=>finite(v,0,key==='tiles'?5:1e6)))return false;
    if(!s.environment||!['spring','summer','autumn','winter'].includes(s.environment.season)||!['clear','rain','heat','drought'].includes(s.environment.weather)||!finite(s.environment.dayProgress,0,1))return false;
    if(!s.queen||!finite(s.queen.health)||!finite(s.queen.maxHealth,1)||!s.colony||!s.colony.broodByStage||!s.goal)return false;
    for(const key of ['foodStore','brood','threat','population'])if(!finite(s.colony[key],0,1e6))return false;
    for(const key of ['egg','larva','pupa'])if(!finite(s.colony.broodByStage[key],0,1e6))return false;
    if(!finite(s.goal.population)||!finite(s.goal.targetPopulation,1)||!finite(s.goal.progress,0,1))return false;
    if(!['active','result','intermission','quarantined'].includes(s.lifecycle)||!finite(s.tick))return false;
    for(const [key,limit] of [['ants',512],['predators',32]]){
      if(!Array.isArray(s[key])||s[key].length>limit)return false;const ids=new Set();
      for(const e of s[key]){
        if(!e||!Number.isSafeInteger(e.id)||e.id<0||ids.has(e.id)||!finite(e.x,0,w.width-1)||!finite(e.y,0,w.height-1)||!finite(e.health,0,100))return false;ids.add(e.id);
        if(key==='ants'&&(!roles.has(e.role)||!finite(e.carryingFood,0,4)))return false;
        if(key==='predators'&&!['beetle','spider'].includes(e.kind))return false;
      }
    }
    return true;
  }
  class FrameStore {
    constructor(){this.current=null;this.previous=null;this.tracks=new Map();this.retired=new Set();this.acceptedAt=0;this.duration=100;}
    accept(next,now){
      if(!validateSnapshot(next))return'invalid';
      if(this.retired.has(next.runToken)||this.current&&next.runIndex<this.current.runIndex)return'stale';
      const same=this.current?.runToken===next.runToken;
      if(same&&next.revision<this.current.revision)return'stale';
      if(same&&next.revision===this.current.revision)return'duplicate';
      if(this.current&&!same){this.retired.add(this.current.runToken);while(this.retired.size>16)this.retired.delete(this.retired.values().next().value);}
      this.previous=same?this.current:null;
      const old=new Map((this.previous?.ants||[]).map(a=>[a.id,a])),tracks=new Map();
      for(const a of next.ants){
        const b=old.get(a.id),dx=b?a.x-b.x:0,dy=b?a.y-b.y:0;
        const oldTile=b?next.world.tiles[Math.floor(b.y)*next.world.width+Math.floor(b.x)]:0,newTile=next.world.tiles[Math.floor(a.y)*next.world.width+Math.floor(a.x)];
        const moving=Boolean(b&&Math.abs(dx)+Math.abs(dy)>0&&Math.abs(dx)+Math.abs(dy)<=1&&walkable(oldTile)&&walkable(newTile));
        const heading=moving?Math.atan2(dx,dy):(same?this.tracks.get(a.id)?.heading:undefined)??hash(a.id*97)*Math.PI*2;
        tracks.set(a.id,{x:moving?b.x:a.x,y:moving?b.y:a.y,heading,moving});
      }
      this.duration=same?clamp(now-this.acceptedAt,40,250):100;this.acceptedAt=now;this.current=next;this.tracks=tracks;return'accepted';
    }
    entities(now,reducedMotion=false){
      if(!this.current)return[];const t=reducedMotion?1:clamp((now-this.acceptedAt)/this.duration,0,1);
      return this.current.ants.map(a=>{const b=this.tracks.get(a.id);return{...a,x:b.x+(a.x-b.x)*t,y:b.y+(a.y-b.y)*t,heading:b.heading,moving:b.moving&&t<1&&this.current.lifecycle==='active'};});
    }
  }
  const rigs=Object.freeze({
    worker:{legs:6,scale:.62,head:1,abdomen:1,color:[.24,.095,.035]},
    scout:{legs:6,scale:.53,head:.9,abdomen:.82,color:[.31,.16,.065]},
    nurse:{legs:6,scale:.59,head:.94,abdomen:1.1,color:[.40,.21,.09]},
    digger:{legs:6,scale:.66,head:1.12,abdomen:1,color:[.29,.13,.055]},
    soldier:{legs:6,scale:.82,head:1.4,abdomen:1.06,color:[.19,.055,.025]},
    queen:{legs:6,scale:1.65,head:1.15,abdomen:1.7,color:[.28,.10,.035]},
    beetle:{legs:6,scale:1.25,head:.8,abdomen:1.8,color:[.16,.22,.085]},
    spider:{legs:8,scale:1.05,head:.9,abdomen:1.25,color:[.26,.15,.065]}
  });
  function rig(role){return rigs[role]||rigs.worker;}
  function position(snapshot,x,y){return[x+.5,y<=snapshot.world.surfaceRow?0:-1.55,y+.5];}
  function normalize(v){const l=Math.hypot(...v)||1;return v.map(n=>n/l);}
  const cross=(a,b)=>[a[1]*b[2]-a[2]*b[1],a[2]*b[0]-a[0]*b[2],a[0]*b[1]-a[1]*b[0]];
  const dot=(a,b)=>a.reduce((s,n,i)=>s+n*b[i],0);
  function multiply(a,b){const o=new Float32Array(16);for(let c=0;c<4;c++)for(let r=0;r<4;r++)for(let k=0;k<4;k++)o[c*4+r]+=a[k*4+r]*b[c*4+k];return o;}
  function perspective(fov,aspect,near,far){const f=1/Math.tan(fov/2),nf=1/(near-far);return new Float32Array([f/aspect,0,0,0,0,f,0,0,0,0,(far+near)*nf,-1,0,0,2*far*near*nf,0]);}
  function lookAt(eye,target,up=[0,1,0]){const z=normalize(eye.map((n,i)=>n-target[i])),x=normalize(cross(up,z)),y=cross(z,x);return new Float32Array([x[0],y[0],z[0],0,x[1],y[1],z[1],0,x[2],y[2],z[2],0,-dot(x,eye),-dot(y,eye),-dot(z,eye),1]);}
  function ortho(left,right,bottom,top,near,far){return new Float32Array([2/(right-left),0,0,0,0,2/(top-bottom),0,0,0,0,-2/(far-near),0,-(right+left)/(right-left),-(top+bottom)/(top-bottom),-(far+near)/(far-near),1]);}
  function mesh(kind){
    const v=[],idx=[],push=(p,n)=>v.push(...p,...n);
    if(kind==='sphere'){
      const rows=10,cols=16;
      for(let j=0;j<=rows;j++)for(let i=0;i<=cols;i++){const a=j/rows*Math.PI,b=i/cols*Math.PI*2,p=[Math.sin(a)*Math.cos(b),Math.cos(a),Math.sin(a)*Math.sin(b)];push(p,p);}
      for(let j=0;j<rows;j++)for(let i=0;i<cols;i++){const a=j*(cols+1)+i,b=a+cols+1;idx.push(a,a+1,b,b,a+1,b+1);}
    }else if(kind==='tube'){
      const sides=8;for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2,n=[Math.cos(a),0,Math.sin(a)];push([n[0],-.5,n[2]],n);push([n[0],.5,n[2]],n);}
      for(let i=0;i<sides;i++){const a=i*2;idx.push(a,a+1,a+2,a+1,a+3,a+2);}
      for(const side of [-1,1]){const c=v.length/6;push([0,side*.5,0],[0,side,0]);for(let i=0;i<=sides;i++){const a=i/sides*Math.PI*2;push([Math.cos(a),side*.5,Math.sin(a)],[0,side,0]);if(i<sides){if(side===1)idx.push(c,c+i+2,c+i+1);else idx.push(c,c+i+1,c+i+2);}}}
    }else if(kind==='leaf'){
      for(let i=0;i<=6;i++){const t=i/6,width=Math.sin(t*Math.PI)*.5;push([-width,Math.sin(t*Math.PI)*.12,t-.5],[0,1,0]);push([width,Math.sin(t*Math.PI)*.12,t-.5],[0,1,0]);}
      for(let i=0;i<6;i++){const a=i*2;idx.push(a,a+2,a+1,a+1,a+2,a+3);}
    }else if(kind==='box'){
      const faces=[[[1,0,0],[1,-1,-1],[1,1,-1],[1,1,1],[1,-1,1]],[[-1,0,0],[-1,-1,1],[-1,1,1],[-1,1,-1],[-1,-1,-1]],[[0,1,0],[-1,1,-1],[-1,1,1],[1,1,1],[1,1,-1]],[[0,-1,0],[-1,-1,1],[-1,-1,-1],[1,-1,-1],[1,-1,1]],[[0,0,1],[1,-1,1],[1,1,1],[-1,1,1],[-1,-1,1]],[[0,0,-1],[-1,-1,-1],[-1,1,-1],[1,1,-1],[1,-1,-1]]];
      for(const [n,...ps]of faces){const o=v.length/6;for(const p of ps)push(p.map(x=>x*.5),n);idx.push(o,o+1,o+2,o,o+2,o+3);}
    }else throw new Error('Unknown mesh');
    return{vertices:new Float32Array(v),indices:new Uint16Array(idx)};
  }
  class Batch {
    constructor(capacity=8192){this.capacity=capacity;this.data=new Float32Array(capacity*20);this.count=0;this.dropped=0;}
    reset(){this.count=0;this.dropped=0;}
    write(matrix,color,roughness=.65){if(this.count>=this.capacity){this.dropped++;return false;}const at=this.count++*20;this.data.set(matrix,at);this.data.set([color[0],color[1],color[2],roughness],at+16);return true;}
    add(p,s,c,angle=0,roughness=.65){const co=Math.cos(angle),si=Math.sin(angle);return this.write([co*s[0],0,-si*s[0],0,0,s[1],0,0,si*s[2],0,co*s[2],0,...p,1],c,roughness);}
    beam(a,b,r,c,roughness=.8){const d=b.map((n,i)=>n-a[i]),length=Math.hypot(...d);if(length<1e-6)return false;const y=d.map(n=>n/length),x=normalize(cross(Math.abs(y[2])<.9?[0,0,1]:[1,0,0],y)),z=cross(x,y),p=a.map((n,i)=>(n+b[i])*.5);return this.write([x[0]*r,x[1]*r,x[2]*r,0,y[0]*length,y[1]*length,y[2]*length,0,z[0]*r,z[1]*r,z[2]*r,0,...p,1],c,roughness);}
  }
  return{clamp,hash,validateSnapshot,FrameStore,rig,position,normalize,multiply,perspective,lookAt,ortho,mesh,Batch};
});
