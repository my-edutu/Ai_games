/**
 * Real camera projection only: keep the current hero and actual nearby danger
 * readable in narrow mobile views and dense Warden melee. This changes no
 * entity location, combat event, 3D depth, authority or accessibility HUD.
 * The HUD retains all three heroes and the dedicated boss strip reports HP.
 */
const clamp=(n,min,max)=>Math.min(max,Math.max(min,n));
const options=Object.freeze([[0,0],[0,-30],[0,30],[0,-60],[-28,-30],[28,-30],
 [-28,0],[28,0],[0,60],[0,-88]]);
export function planReadableNameplates(projections,{width=1440,height=832,focusId=null}={}){
 if(!Array.isArray(projections)||!Number.isFinite(width)||!Number.isFinite(height)||
  width<240||width>5000||height<200||height>5000)return Object.freeze({labels:[],suppressed:0});
 const portrait=width<620,max=portrait?3:14,safeTop=portrait?92:72,safeBottom=Math.max(safeTop+18,height-(portrait?54:34));
 const candidates=projections.slice(0,48).filter(p=>p&&
  typeof p.id==='string'&&p.id.length>0&&p.id.length<=128&&
  [p.x,p.y,p.width].every(Number.isFinite)&&p.width>=42&&p.width<=180&&
  p.x>=-100&&p.x<=width+100&&p.y>=-100&&p.y<=height+100).map(p=>({
   ...p,priority:p.id===focusId?130:p.faction==='enemy'?(p.danger?110:56):p.focused?120:75
 }));
 candidates.sort((a,b)=>b.priority-a.priority||a.id.localeCompare(b.id,'en'));
 const labels=[],bounds=[];let suppressed=0;
 for(const c of candidates){
  if(labels.length>=max){suppressed++;continue;}
  // Avoid making a separate permanent UI card in the middle of combat.
  // Mobile already has full-health hero cards, so a third distant hero label
  // can be hidden instead of obscuring the live boss and dangerous floor.
  if(portrait&&c.faction==='party'&&c.id!==focusId&&
   labels.some(p=>p.faction==='party')&&c.y<height*.7){suppressed++;continue;}
  let found=null;
  for(const [dx,dy] of options){
   const x=clamp(c.x+dx,c.width/2+6,width-c.width/2-6);
   const y=clamp(c.y+dy,safeTop,safeBottom);
   if(Math.hypot(x-c.x,y-c.y)>96)continue;
   const rect={l:x-c.width/2-4,r:x+c.width/2+4,t:y-14,b:y+22};
   if(bounds.some(b=>rect.l<b.r&&rect.r>b.l&&rect.t<b.b&&rect.b>b.t))continue;
   found={id:c.id,faction:c.faction,x,y};bounds.push(rect);break;
  }
  if(!found){suppressed++;continue;}
  labels.push(found);
 }
 return {labels,suppressed};
}
