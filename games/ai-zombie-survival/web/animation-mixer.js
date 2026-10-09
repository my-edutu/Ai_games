import {actionPose} from './animation-pose.js';

// Render-only animation cross-fade: smooth role/action transitions, suppress snaps in
// observer/OBS close-ups, and retain deterministic gait from simulation time.
export function createPoseMixer({responseSeconds=.12,maxActors=800,ttlSeconds=20}={}){
  const cache=new Map();
  const finite=(x,fallback)=>Number.isFinite(x)?x:fallback;
  function sample(entity,infected,time){
    const id=(infected?'z:':'s:')+String(entity.id||entity.role||'unknown');
    const goal=actionPose(entity,infected,time);
    const prior=cache.get(id);
    if(!prior||time<prior.time||time-prior.time>ttlSeconds){
      cache.set(id,{pose:goal,time,seen:time});
      if(cache.size>maxActors){
        const first=cache.keys().next().value;cache.delete(first);
      }
      return goal;
    }
    const dt=Math.max(0,time-prior.time);
    const alpha=dt<=0?0:Math.min(1,1-Math.exp(-dt/Math.max(.015,responseSeconds)));
    const mixed={};
    for(const key of Object.keys(goal)){
      const prev=finite(prior.pose[key],goal[key]);
      mixed[key]=prev+(goal[key]-prev)*alpha;
    }
    const pose=Object.freeze(mixed);
    // Refresh chronological insertion ordering so retired agents are evicted first.
    cache.delete(id);cache.set(id,{pose,time,seen:time});
    if(cache.size>maxActors)cache.delete(cache.keys().next().value);
    return pose;
  }
  return {sample,reset(){cache.clear()},get size(){return cache.size}};
}
