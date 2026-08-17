import type{CivilizationConfig}from'../config/schema';
import type{CivilizationWorld,Terrain,WorldTile}from'../state/types';
import type{NamedRng}from'../../../../packages/seeded-rng/src/index';
export interface WorldValidation{valid:boolean;errors:string[];features:string[];reachableLand:number}
function manhattan(a:number,b:number,w:number){return Math.abs(a%w-b%w)+Math.abs(Math.floor(a/w)-Math.floor(b/w))}
function baseTerrain(rng:NamedRng,index:number):Terrain{const n=rng.nextInt(`world-topology-v1:${index}`,100);if(n<28)return'forest';if(n<48)return'plains';if(n<65)return'hills';if(n<76)return'marsh';if(n<86)return'coast';return'plains'}
function makeTile(index:number,width:number,terrain:Terrain):WorldTile{const x=index%width,y=Math.floor(index/width);return{index,x,y,terrain,fertility:terrain==='plains'?3:terrain==='marsh'?2:terrain==='coast'?2:1,timber:terrain==='forest'?3:terrain==='marsh'?2:0,stone:terrain==='hills'?3:terrain==='coast'?1:0,water:terrain==='river'||terrain==='lake'||terrain==='coast'||terrain==='marsh'?3:0,trade:terrain==='coast'||terrain==='river'?2:0,defence:terrain==='hills'?2:terrain==='forest'?1:0,owner:'neutral'}}
export function generateWorld(config:CivilizationConfig,rng:NamedRng):CivilizationWorld{
  const total=config.width*config.height;const tiles:WorldTile[]=[];
  for(let i=0;i<total;i++)tiles.push(makeTile(i,config.width,baseTerrain(rng,i)));
  const cx=Math.floor(config.width/2),cy=Math.floor(config.height/2),capital=cy*config.width+cx;
  Object.assign(tiles[capital],makeTile(capital,config.width,'plains'),{owner:'player' as const,fertility:3,water:1});
  const riverX=(rng.nextInt('world-topology-v1:river',Math.max(2,config.width-2))+1)%config.width;
  for(let y=0;y<config.height;y++){const i=y*config.width+riverX;if(i!==capital){tiles[i]=makeTile(i,config.width,'river')}}
  const guaranteed=[
    {offset:[-1,0] as const,terrain:'plains' as const,field:'fertility' as const},
    {offset:[1,0] as const,terrain:'forest' as const,field:'timber' as const},
    {offset:[0,-1] as const,terrain:'hills' as const,field:'stone' as const},
  ];
  for(const g of guaranteed){const x=Math.max(0,Math.min(config.width-1,cx+g.offset[0])),y=Math.max(0,Math.min(config.height-1,cy+g.offset[1])),i=y*config.width+x;if(i!==capital){tiles[i]=makeTile(i,config.width,g.terrain);tiles[i][g.field]=3}}
  const corners=[0,config.width-1,(config.height-1)*config.width,total-1].filter(i=>i!==capital).sort((a,b)=>manhattan(b,capital,config.width)-manhattan(a,capital,config.width));
  const rivalCapitals=corners.slice(0,config.maxRivals);rivalCapitals.forEach((i,n)=>{tiles[i].owner=`rival-${n+1}` as WorldTile['owner'];if(tiles[i].terrain==='lake')tiles[i]=makeTile(i,config.width,'plains')});
  return{width:config.width,height:config.height,capitalIndex:capital,tiles,generationAttempts:1,usedFallback:false,rivalCapitals};
}
export function validateWorld(world:CivilizationWorld,config:CivilizationConfig):WorldValidation{
  const errors:string[]=[];const features:string[]=[];if(world.tiles.length!==config.width*config.height)errors.push('tile-count');
  const cap=world.tiles[world.capitalIndex];if(!cap||cap.terrain==='lake')errors.push('capital');
  if(world.tiles.some(t=>t.fertility>=3))features.push('food');else errors.push('food');
  if(world.tiles.some(t=>t.timber>=3))features.push('wood');else errors.push('wood');
  if(world.tiles.some(t=>t.stone>=3))features.push('stone');else errors.push('stone');
  if(world.tiles.some(t=>t.water>0))features.push('water');else errors.push('water');
  const passable=new Set(world.tiles.filter(t=>t.terrain!=='lake').map(t=>t.index));const seen=new Set<number>();const q=[world.capitalIndex];
  while(q.length){const i=q.shift()!;if(seen.has(i)||!passable.has(i))continue;seen.add(i);const x=i%world.width,y=Math.floor(i/world.width);for(const [dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]] as const){const nx=x+dx,ny=y+dy;if(nx>=0&&ny>=0&&nx<world.width&&ny<world.height)q.push(ny*world.width+nx)}}
  if(seen.size!==passable.size)errors.push('connectivity');
  if(world.rivalCapitals.length!==config.maxRivals)errors.push('rivals');
  for(const r of world.rivalCapitals)if(manhattan(r,world.capitalIndex,world.width)<3)errors.push('rival-separation');
  return{valid:errors.length===0,errors:[...new Set(errors)],features,reachableLand:seen.size};
}
