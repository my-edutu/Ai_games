export interface ZombieRect{x:number;y:number;width:number;height:number}
export interface ZombieLayout{
  viewport:ZombieRect;
  arena:ZombieRect;
  hud:ZombieRect;
  caption:ZombieRect;
  controls:ZombieRect;
  minimumCellPixels:number;
  compact:boolean;
  cleanFeed:boolean;
}

function validDimension(name:string,value:number){
  if(!Number.isFinite(value)||value<240)throw new RangeError(name);
  return Math.floor(value);
}

export function computeZombieLayout(width:number,height:number,options:{cleanFeed?:boolean}={}):ZombieLayout{
  const viewportWidth=validDimension('width',width),viewportHeight=validDimension('height',height),cleanFeed=options.cleanFeed===true;
  const compact=viewportWidth<900||viewportHeight<520;
  const outer=compact?8:16,gap=compact?8:16,captionHeight=compact?52:60,controlsHeight=cleanFeed?0:compact?34:44;
  const hudWidth=cleanFeed?0:compact?Math.min(228,Math.max(210,Math.floor(viewportWidth*0.27))):Math.min(420,Math.max(320,Math.floor(viewportWidth*0.22)));
  const contentBottom=viewportHeight-outer-controlsHeight-(controlsHeight?gap:0);
  const arenaHeight=Math.max(180,contentBottom-outer-captionHeight-gap);
  const arenaWidth=Math.max(240,viewportWidth-outer*2-hudWidth-(hudWidth?gap:0));
  const arena={x:outer,y:outer,width:arenaWidth,height:arenaHeight};
  const hud={x:outer+arenaWidth+(hudWidth?gap:0),y:outer,width:hudWidth,height:arenaHeight+captionHeight+gap};
  const caption={x:outer,y:outer+arenaHeight+gap,width:arenaWidth,height:captionHeight};
  const controls={x:outer,y:viewportHeight-outer-controlsHeight,width:viewportWidth-outer*2,height:controlsHeight};
  return Object.freeze({
    viewport:{x:0,y:0,width:viewportWidth,height:viewportHeight},arena,hud,caption,controls,
    minimumCellPixels:Math.max(8,Math.floor(Math.min(arena.width/32,arena.height/20))),compact,cleanFeed,
  });
}
