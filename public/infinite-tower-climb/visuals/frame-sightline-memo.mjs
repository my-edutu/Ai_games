// Bounded exact-current-frame memo for expensive real camera-to-geometry rays.
// This is NOT visibility inference: a fresh camera/body/scene must run its
// full authoritative triangle probes. Reset before each World update and
// after any source-owned material transition.
export function createFrameSightlineMemo(limit=24) {
  if(!Number.isSafeInteger(limit)||limit<1||limit>64)
    throw new RangeError('frame sightline cache must stay bounded');
  const entries=new Map();
  let epoch=0,hits=0,misses=0,invalidations=0;
  const copy=value=>value && typeof value==='object' ? {...value}:value;
  return {
    beginFrame(){entries.clear();epoch++;},
    invalidate(){entries.clear();invalidations++;},
    read(key,probe){
      if(typeof key!=='string'||!key.length||typeof probe!=='function')
        throw new TypeError('exact camera key and ray probe required');
      if(entries.has(key)){hits++;return copy(entries.get(key));}
      misses++;
      const result=probe();
      if(entries.size<limit)entries.set(key,copy(result));
      return result;
    },
    diagnostics(){return {epoch,hits,misses,invalidations,
      retainedEntries:entries.size,maxEntries:limit,
      caveat:'Only identical source-and-camera rays within one World frame; no skipped first-time safety rays or native FPS claims'};}
  };
}
