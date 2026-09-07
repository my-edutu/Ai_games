const inside=(cell:number,width:number,height:number)=>Number.isInteger(cell)&&cell>=0&&cell<width*height;

export function dungeonDistance(a:number,b:number,width:number){return Math.abs(a%width-b%width)+Math.abs(Math.floor(a/width)-Math.floor(b/width))}

function rayCells(from:number,to:number,width:number){let x0=from%width,y0=Math.floor(from/width),x1=to%width,y1=Math.floor(to/width);const cells:number[]=[];const dx=Math.abs(x1-x0),sx=x0<x1?1:-1,dy=-Math.abs(y1-y0),sy=y0<y1?1:-1;let error=dx+dy;while(true){cells.push(y0*width+x0);if(x0===x1&&y0===y1)break;const twice=2*error;if(twice>=dy){error+=dy;x0+=sx}if(twice<=dx){error+=dx;y0+=sy}}return cells}

export function hasDungeonLineOfSight(tiles:readonly(0|1)[],width:number,height:number,from:number,to:number,maxDistance=Number.POSITIVE_INFINITY){if(!inside(from,width,height)||!inside(to,width,height)||tiles.length!==width*height||dungeonDistance(from,to,width)>maxDistance)return false;const ray=rayCells(from,to,width);for(let index=1;index<ray.length-1;index++)if(tiles[ray[index]]!==1)return false;return true}

export function visibleDungeonCells(tiles:readonly(0|1)[],width:number,height:number,origin:number,radius:number){const visible:number[]=[];if(!inside(origin,width,height)||radius<0)return visible;const ox=origin%width,oy=Math.floor(origin/width),minX=Math.max(0,ox-radius),maxX=Math.min(width-1,ox+radius),minY=Math.max(0,oy-radius),maxY=Math.min(height-1,oy+radius);for(let y=minY;y<=maxY;y++)for(let x=minX;x<=maxX;x++){const cell=y*width+x;if(dungeonDistance(origin,cell,width)>radius)continue;if(hasDungeonLineOfSight(tiles,width,height,origin,cell,radius))visible.push(cell)}return visible}
