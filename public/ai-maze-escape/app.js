'use strict';

const MAX_TRAIL=240;
const POLL_DELAY_MS=180;
const POLL_TIMEOUT_MS=2500;
const canvas=document.getElementById('maze');
const context=canvas.getContext('2d',{alpha:false});
const elements={
  broadcast:document.getElementById('broadcast'),
  hud:document.getElementById('hud'),
  tick:document.getElementById('tick'),
  steps:document.getElementById('steps'),
  time:document.getElementById('time'),
  keys:document.getElementById('keys'),
  progress:document.getElementById('progress'),
  progressFill:document.getElementById('progress-fill'),
  intentMode:document.getElementById('intent-mode'),
  intentCopy:document.getElementById('intent-copy'),
  confidence:document.getElementById('confidence-fill'),
  inventory:document.getElementById('inventory'),
  caption:document.getElementById('caption'),
  profile:document.getElementById('profile'),
  integrity:document.getElementById('integrity'),
  sceneCard:document.getElementById('scene-card'),
  sceneTitle:document.getElementById('scene-title'),
  sceneMessage:document.getElementById('scene-message'),
};
const query=new URLSearchParams(location.search);
const settings={
  reducedMotion:query.get('reducedMotion')==='1'||matchMedia('(prefers-reduced-motion: reduce)').matches,
  highContrast:query.get('highContrast')==='1',
  muted:query.get('muted')==='1',
  cleanFeed:query.get('cleanFeed')==='1',
};
document.body.dataset.reducedMotion=String(settings.reducedMotion);
document.body.dataset.highContrast=String(settings.highContrast);
if(settings.cleanFeed)elements.broadcast.classList.add('clean-feed');

let frame=null;
let lastCaption='The explorer is mapping the nearest frontier.';
let animationTime=0;
let pollTimer=0;
let stopped=false;

function clamp(value,min,max){return Math.max(min,Math.min(max,value))}

function resize(){
  const ratio=Math.min(devicePixelRatio||1,2);
  const rect=canvas.getBoundingClientRect();
  const width=Math.max(1,Math.round(rect.width*ratio));
  const height=Math.max(1,Math.round(rect.height*ratio));
  if(canvas.width!==width||canvas.height!==height){canvas.width=width;canvas.height=height}
}

function computePublicView(snapshot,camera){
  const cells=snapshot.cells.length?snapshot.cells:[{cell:snapshot.currentCell}];
  const columns=cells.map(cell=>cell.cell%snapshot.width);
  const rows=cells.map(cell=>Math.floor(cell.cell/snapshot.width));
  const minCol=Math.min(...columns),maxCol=Math.max(...columns);
  const minRow=Math.min(...rows),maxRow=Math.max(...rows);
  const knownWidth=maxCol-minCol+1,knownHeight=maxRow-minRow+1;
  const minimumWidth=Math.min(snapshot.width,7),minimumHeight=Math.min(snapshot.height,5);
  const overview=snapshot.progressPermille>=850||camera?.mode==='overview'||camera?.mode==='result';
  const widthCells=overview
    ? clamp(knownWidth+2,minimumWidth,snapshot.width)
    : clamp(Math.min(knownWidth+2,11),minimumWidth,snapshot.width);
  const heightCells=overview
    ? clamp(knownHeight+2,minimumHeight,snapshot.height)
    : clamp(Math.min(knownHeight+2,8),minimumHeight,snapshot.height);
  const requestedCenter=Number.isInteger(camera?.centerCell)?camera.centerCell:snapshot.currentCell;
  const centerCell=cells.some(cell=>cell.cell===requestedCenter)?requestedCenter:snapshot.currentCell;
  const centerCol=centerCell%snapshot.width,centerRow=Math.floor(centerCell/snapshot.width);
  const startCol=clamp(centerCol-Math.floor(widthCells/2),0,snapshot.width-widthCells);
  const startRow=clamp(centerRow-Math.floor(heightCells/2),0,snapshot.height-heightCells);
  const currentCol=snapshot.currentCell%snapshot.width,currentRow=Math.floor(snapshot.currentCell/snapshot.width);
  return{
    startCol,
    startRow,
    widthCells,
    heightCells,
    centerCell,
    mode:camera?.mode??'local',
    containsCurrentCell:currentCol>=startCol&&currentCol<startCol+widthCells&&currentRow>=startRow&&currentRow<startRow+heightCells,
  };
}

function inView(snapshot,cell,view){
  const col=cell%snapshot.width,row=Math.floor(cell/snapshot.width);
  return col>=view.startCol&&col<view.startCol+view.widthCells&&row>=view.startRow&&row<view.startRow+view.heightCells;
}

function mapBounds(width,height,ratio,view){
  const pad=Math.max(20*ratio,Math.min(width,height)*.055);
  const availableWidth=width-pad*2,availableHeight=height-pad*2;
  const cellSize=Math.max(1,Math.min(availableWidth/view.widthCells,availableHeight/view.heightCells));
  const mapWidth=cellSize*view.widthCells,mapHeight=cellSize*view.heightCells;
  return{x:(width-mapWidth)/2,y:(height-mapHeight)/2,width:mapWidth,height:mapHeight,cellSize};
}

function cellPoint(snapshot,cell,bounds,view){
  if(!inView(snapshot,cell,view))return null;
  const col=cell%snapshot.width,row=Math.floor(cell/snapshot.width);
  return{
    x:bounds.x+(col-view.startCol+.5)*bounds.cellSize,
    y:bounds.y+(row-view.startRow+.5)*bounds.cellSize,
    w:bounds.cellSize,
    h:bounds.cellSize,
  };
}

function drawGrid(bounds,view,ratio){
  context.strokeStyle=settings.highContrast?'rgba(255,255,255,.12)':'rgba(92,181,160,.055)';
  context.lineWidth=Math.max(.5*ratio,1);
  for(let row=0;row<=view.heightCells;row+=1){
    const y=bounds.y+row*bounds.cellSize;
    context.beginPath();context.moveTo(bounds.x,y);context.lineTo(bounds.x+bounds.width,y);context.stroke();
  }
  for(let col=0;col<=view.widthCells;col+=1){
    const x=bounds.x+col*bounds.cellSize;
    context.beginPath();context.moveTo(x,bounds.y);context.lineTo(x,bounds.y+bounds.height);context.stroke();
  }
}

function draw(snapshot,scene,camera){
  resize();
  const width=canvas.width,height=canvas.height,ratio=canvas.width/Math.max(1,canvas.clientWidth);
  const view=window.__MAZE_VIEW__??computePublicView(snapshot,camera);
  const bounds=mapBounds(width,height,ratio,view);
  context.fillStyle=settings.highContrast?'#000':'#030809';
  context.fillRect(0,0,width,height);

  const gradient=context.createRadialGradient(
    bounds.x+bounds.width*.5,bounds.y+bounds.height*.5,bounds.cellSize,
    bounds.x+bounds.width*.5,bounds.y+bounds.height*.5,Math.max(bounds.width,bounds.height)*.72,
  );
  gradient.addColorStop(0,settings.highContrast?'#070707':'#0a1818');
  gradient.addColorStop(1,settings.highContrast?'#010101':'#040b0c');
  context.save();
  context.shadowBlur=28*ratio;
  context.shadowColor='rgba(78,255,194,.14)';
  context.fillStyle=gradient;
  context.fillRect(bounds.x,bounds.y,bounds.width,bounds.height);
  context.restore();
  drawGrid(bounds,view,ratio);

  const drawnCells=snapshot.cells.filter(cell=>inView(snapshot,cell.cell,view));
  const known=new Map(snapshot.cells.map(cell=>[cell.cell,cell]));
  const visibleKnown=new Set(drawnCells.map(cell=>cell.cell));
  const cellWidth=bounds.cellSize,cellHeight=bounds.cellSize;

  for(const cell of drawnCells){
    const point=cellPoint(snapshot,cell.cell,bounds,view);
    if(!point)continue;
    const alpha=cell.visible?1:Math.max(.22,cell.confidencePermille/1600);
    context.fillStyle=cell.visible
      ?`rgba(35,108,88,${.46*alpha})`
      :`rgba(18,49,45,${.34*alpha})`;
    context.fillRect(point.x-cellWidth*.45,point.y-cellHeight*.45,cellWidth*.9,cellHeight*.9);
    if(cell.checkpoint){
      context.strokeStyle='rgba(104,220,255,.82)';
      context.lineWidth=Math.max(1*ratio,cellWidth*.06);
      context.strokeRect(point.x-cellWidth*.28,point.y-cellHeight*.28,cellWidth*.56,cellHeight*.56);
    }
    if(cell.clue){
      context.fillStyle='#68dcff';
      context.beginPath();context.arc(point.x,point.y,Math.max(2*ratio,cellWidth*.12),0,Math.PI*2);context.fill();
    }
    const frontier=cell.neighbors.some(neighbor=>!known.has(neighbor));
    if(frontier){
      context.fillStyle='rgba(104,220,255,.85)';
      context.beginPath();context.arc(point.x+cellWidth*.31,point.y-cellHeight*.31,Math.max(1.5*ratio,cellWidth*.055),0,Math.PI*2);context.fill();
    }
  }

  context.lineCap='round';
  context.lineJoin='round';
  context.lineWidth=Math.max(1.2*ratio,cellWidth*.12);
  context.strokeStyle=settings.highContrast?'#fff':'rgba(126,255,208,.78)';
  for(const cell of drawnCells){
    const point=cellPoint(snapshot,cell.cell,bounds,view);
    if(!point)continue;
    const neighbors=new Set(cell.neighbors);
    const row=Math.floor(cell.cell/snapshot.width),col=cell.cell%snapshot.width;
    const left=cell.cell-1,right=cell.cell+1,up=cell.cell-snapshot.width,down=cell.cell+snapshot.width;
    const x0=point.x-cellWidth*.5,x1=point.x+cellWidth*.5,y0=point.y-cellHeight*.5,y1=point.y+cellHeight*.5;
    context.beginPath();
    if(row===0||!neighbors.has(up)){context.moveTo(x0,y0);context.lineTo(x1,y0)}
    if(col===snapshot.width-1||!neighbors.has(right)){context.moveTo(x1,y0);context.lineTo(x1,y1)}
    if(row===snapshot.height-1||!neighbors.has(down)){context.moveTo(x1,y1);context.lineTo(x0,y1)}
    if(col===0||!neighbors.has(left)){context.moveTo(x0,y1);context.lineTo(x0,y0)}
    context.stroke();
  }

  const drawRoute=(route,color,widthScale)=>{
    const visible=route.filter(cell=>visibleKnown.has(cell)).slice(-MAX_TRAIL);
    if(visible.length<2)return;
    context.strokeStyle=color;
    context.lineWidth=Math.max(1*ratio,cellWidth*widthScale);
    context.beginPath();
    visible.forEach((cell,index)=>{
      const point=cellPoint(snapshot,cell,bounds,view);
      if(!point)return;
      if(index===0)context.moveTo(point.x,point.y);else context.lineTo(point.x,point.y);
    });
    context.stroke();
  };
  drawRoute(snapshot.travelledRoute,'rgba(104,220,255,.38)',.12);
  drawRoute(snapshot.plannedRoute,'rgba(255,202,107,.82)',.17);

  for(const door of snapshot.doors){
    const a=cellPoint(snapshot,door.a,bounds,view),b=cellPoint(snapshot,door.b,bounds,view);
    if(!a||!b)continue;
    context.strokeStyle=door.open?'rgba(120,255,199,.48)':'#ffca6b';
    context.lineWidth=Math.max(2*ratio,cellWidth*.28);
    const midX=(a.x+b.x)/2,midY=(a.y+b.y)/2;
    context.beginPath();
    context.moveTo(midX-(b.y-a.y)*.16,midY+(b.x-a.x)*.16);
    context.lineTo(midX+(b.y-a.y)*.16,midY-(b.x-a.x)*.16);
    context.stroke();
  }

  for(const key of snapshot.keys){
    if(key.collected)continue;
    const point=cellPoint(snapshot,key.cell,bounds,view);
    if(!point)continue;
    context.fillStyle='#ffca6b';context.shadowColor='#ffca6b';context.shadowBlur=12*ratio;
    context.beginPath();context.arc(point.x,point.y,Math.max(3*ratio,cellWidth*.2),0,Math.PI*2);context.fill();context.shadowBlur=0;
  }

  for(const cell of drawnCells.filter(item=>item.trap)){
    const point=cellPoint(snapshot,cell.cell,bounds,view);
    if(!point)continue;
    context.strokeStyle='#ff6f91';context.lineWidth=Math.max(1.5*ratio,cellWidth*.12);
    context.beginPath();context.moveTo(point.x,point.y-cellHeight*.24);context.lineTo(point.x+cellWidth*.22,point.y+cellHeight*.2);context.lineTo(point.x-cellWidth*.22,point.y+cellHeight*.2);context.closePath();context.stroke();
  }

  if(snapshot.exitCell!==null){
    const point=cellPoint(snapshot,snapshot.exitCell,bounds,view);
    if(point){
      const pulse=settings.reducedMotion?1:1+Math.sin(animationTime*.004)*.08;
      context.strokeStyle='#78ffc7';context.lineWidth=3*ratio;context.shadowColor='#78ffc7';context.shadowBlur=18*ratio;
      context.strokeRect(point.x-cellWidth*.3*pulse,point.y-cellHeight*.3*pulse,cellWidth*.6*pulse,cellHeight*.6*pulse);context.shadowBlur=0;
    }
  }

  for(const threat of snapshot.threats){
    const point=cellPoint(snapshot,threat.cell,bounds,view);
    if(!point)continue;
    const radius=Math.max(4*ratio,cellWidth*.28);
    context.fillStyle='#ff6f91';context.shadowColor='#ff6f91';context.shadowBlur=18*ratio;
    context.beginPath();context.arc(point.x,point.y,radius,0,Math.PI*2);context.fill();context.shadowBlur=0;
  }

  const explorer=cellPoint(snapshot,snapshot.currentCell,bounds,view);
  if(explorer){
    const radius=Math.max(5*ratio,cellWidth*.32);
    context.fillStyle=settings.highContrast?'#baff00':'#78ffc7';context.shadowColor=context.fillStyle;context.shadowBlur=22*ratio;
    context.beginPath();context.arc(explorer.x,explorer.y,radius,0,Math.PI*2);context.fill();context.shadowBlur=0;
    context.strokeStyle='#04110d';context.lineWidth=2*ratio;
    context.beginPath();context.moveTo(explorer.x-radius*.35,explorer.y);context.lineTo(explorer.x+radius*.35,explorer.y);context.stroke();
  }

  context.font=`${Math.max(9*ratio,Math.min(width,height)*.014)}px ui-monospace, SFMono-Regular, Menlo, monospace`;
  context.fillStyle=settings.highContrast?'#fff':'rgba(126,255,208,.72)';
  context.textBaseline='top';
  context.fillText(`${view.mode.toUpperCase()} MAP  •  ${view.widthCells}×${view.heightCells} PUBLIC CELLS`,bounds.x,bounds.y-Math.max(16*ratio,bounds.cellSize*.32));

  if(scene==='danger'){
    context.fillStyle='rgba(255,73,110,.06)';context.fillRect(0,0,width,height);
  }
}

function update(frameValue){
  frame=frameValue;
  const snapshot=frameValue.snapshot;
  if(!snapshot)return;
  window.__MAZE_PUBLIC_STATE__=snapshot;
  window.__MAZE_VIEW__=computePublicView(snapshot,frameValue.camera);
  elements.tick.textContent=String(snapshot.tick);
  elements.steps.textContent=String(Math.max(0,snapshot.travelledRoute.length-1));
  elements.time.textContent=String(snapshot.timeRemaining);
  elements.keys.textContent=String(snapshot.inventory.length);
  elements.progress.textContent=`${Math.floor(snapshot.progressPermille/10)}%`;
  elements.progressFill.style.width=`${snapshot.progressPermille/10}%`;
  elements.intentMode.textContent=snapshot.intent.mode.replaceAll('-',' ');
  elements.intentCopy.textContent=snapshot.intent.explanation;
  elements.confidence.style.width=`${Math.round(snapshot.intent.confidence*100)}%`;
  elements.inventory.textContent=snapshot.inventory.length?snapshot.inventory.join(' • '):'No keys collected';
  elements.profile.textContent=`PROFILE: ${snapshot.profile.toUpperCase()} • L${snapshot.level}`;
  elements.integrity.textContent=`INTEGRITY: ${snapshot.authorityChecksum?'VERIFIED':'CHECKING'}`;
  const captions=frameValue.audio?.captions??[];
  if(captions.length)lastCaption=captions.at(-1);
  elements.caption.textContent=lastCaption;
  const scene=frameValue.scene;
  if(scene==='result'||scene==='intermission'||scene==='recovery'){
    elements.sceneCard.hidden=false;
    elements.sceneTitle.textContent=scene==='result'
      ?(snapshot.result?.reason==='escape'?'ESCAPE COMPLETE':'RUN COMPLETE')
      :scene==='intermission'?'NEXT MAZE LOADING':'RECOVERING VIEW';
    elements.sceneMessage.textContent=scene==='recovery'
      ?'Restoring the latest verified public snapshot.'
      :scene==='intermission'
        ?'A new deterministic challenge is being prepared.'
        :snapshot.result?.reason==='escape'
          ?'The explorer found the exit without oracle access.'
          :`Outcome: ${snapshot.result?.reason??'complete'}.`;
  }else elements.sceneCard.hidden=true;
}

async function poll(){
  if(stopped)return;
  const controller=new AbortController();
  const timeout=setTimeout(()=>controller.abort(),POLL_TIMEOUT_MS);
  try{
    const response=await fetch(
      `/maze/state?w=${innerWidth}&h=${innerHeight}&reducedMotion=${settings.reducedMotion?1:0}&cleanFeed=${settings.cleanFeed?1:0}`,
      {cache:'no-store',signal:controller.signal},
    );
    if(!response.ok)throw new Error(`state ${response.status}`);
    update(await response.json());
  }catch{
    elements.integrity.textContent='INTEGRITY: RECOVERING';
    elements.sceneCard.hidden=false;
    elements.sceneTitle.textContent='RECOVERING VIEW';
    elements.sceneMessage.textContent='The public source is reconnecting to verified state.';
  }finally{
    clearTimeout(timeout);
    if(!stopped)pollTimer=setTimeout(poll,POLL_DELAY_MS);
  }
}

function animate(now){
  animationTime=now;
  if(frame?.snapshot)draw(frame.snapshot,frame.scene,frame.camera);
  requestAnimationFrame(animate);
}

addEventListener('resize',resize,{passive:true});
addEventListener('pagehide',()=>{stopped=true;clearTimeout(pollTimer)},{once:true});
poll();
requestAnimationFrame(animate);
