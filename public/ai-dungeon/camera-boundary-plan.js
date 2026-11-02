/**
 * Presentation-only bounded camera composition for the authored 3D dungeon.
 * Grid, walls, enemies, replay and AI decisions remain under DungeonRuntime.
 *
 * At the east/south map edge the previous fixed +X/+Z camera sat over the
 * unbuilt perimeter and filmed a black foreground wedge. Orbit the shot
 * toward the interior with a continuous cubic easing instead. Neither the
 * aim point nor any authoritative position is changed.
 */
const clamp=(value,min,max)=>Math.min(max,Math.max(min,value));
const finite=(value,fallback=0)=>Number.isFinite(value)?value:fallback;
const smoothstep=t=>{const p=clamp(t,0,1);return p*p*(3-2*p)};

export function planBoundaryCamera(look,mapSize,offsets){
 const size=Number.isInteger(mapSize)&&mapSize>=5&&mapSize<=129&&mapSize%2===1?mapSize:19;
 const half=(size-1)/2,limit=half-.65;
 const x=clamp(finite(look?.x),-half,half),z=clamp(finite(look?.z),-half,half);
 const source=Array.isArray(offsets)?offsets:[];
 const dx=clamp(finite(source[0]),-30,30),height=clamp(finite(source[1],9.05),3,30),dz=clamp(finite(source[2]),-30,30);
 const start=Math.max(0,half-6),end=Math.max(start+1,half-3);
 // A combat director can now select a signed side-quarter shot. A negative
 // offset at the eastern edge is ALREADY looking toward the playable dungeon:
 // flipping it out toward the void would erase the heroes. Flip only when
 // this offset points toward its own corresponding positive/negative edge.
 const turnX=smoothstep(((dx<0?-x:x)-start)/(end-start));
 const turnZ=smoothstep(((dz<0?-z:z)-start)/(end-start));
 return {
  look:{x,z},
  position:{
   x:clamp(x+dx*(1-2*turnX),-limit,limit),
   y:height,
   z:clamp(z+dz*(1-2*turnZ),-limit,limit)
  },
  turn:{x:turnX,z:turnZ},
  boundaryLimit:limit
 };
}
