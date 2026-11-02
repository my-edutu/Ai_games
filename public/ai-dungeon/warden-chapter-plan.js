/** Authored, deterministic PHYSICAL Warden court chapter, visual-only. */
const clip=(x,a,b)=>Math.max(a,Math.min(b,Number.isFinite(x)?x:a));
export const WARDEN_COURT_STONES=28, WARDEN_RIFT_SEGMENTS=18;
const phaseOpen=Object.freeze({SENTINEL:0,RUPTURE:.60,ECLIPSE:1,VANQUISHED:1.05});
export function planWardenCourtChapter({phase='SENTINEL',guardianWard=false,hp=1,maxHp=1}={}){
 const stage=Object.hasOwn(phaseOpen,phase)?phase:'SENTINEL';
 const health=maxHp>0&&Number.isFinite(hp)&&Number.isFinite(maxHp)?clip(hp/maxHp,0,1):1;
 const base=guardianWard?0:stage==='SENTINEL'?.10:phaseOpen[stage];
 return Object.freeze({phase:stage,health,sealed:!!guardianWard,
  openness:clip(base+(stage==='RUPTURE'||stage==='ECLIPSE'?(1-health)*.055:0),0,1.1)});
}
export function planWardenCourtStone(i,open=0){
 if(!Number.isInteger(i)||i<0||i>=WARDEN_COURT_STONES)return null;
 const o=clip(open,0,1.1),a=(i+.15*(i%3))*Math.PI*2/WARDEN_COURT_STONES;
 const radius=2.33+(i%4-1.5)*.025+o*(i%2===0?.104:-.073);
 return Object.freeze({x:Math.cos(a)*radius,z:Math.sin(a)*radius,
  y:.005+o*(.018+(i%5)*.012),yaw:-a+Math.PI/2+o*(i%2?-.065:.065),
  pitch:o*(i%2?-.085:.085),roll:o*(i%3-1)*.065,
  sx:.91+(i%4)*.03,sz:.96+(i%3)*.025});
}
export function planWardenRift(i,open=0){
 if(!Number.isInteger(i)||i<0||i>=WARDEN_RIFT_SEGMENTS)return null;
 const o=clip(open,0,1.1),a=(i+.34*(i%3))*2*Math.PI/WARDEN_RIFT_SEGMENTS;
 const r=1.40+(i%4)*.29;
 return Object.freeze({x:Math.cos(a)*r,z:Math.sin(a)*r,
  yaw:-a+(i%2?-.26:.23),width:o*(.42+(i%3)*.12),
  length:.58+(i%4)*.08});
}
export function planWardenRegaliaMotion(id,phase='SENTINEL',charge=0,reducedMotion=false){
 const stage=Object.hasOwn(phaseOpen,phase)?phaseOpen[phase]:0;
 const warning=reducedMotion?0:clip(charge,0,1),side=id?.startsWith('left-')?-1:id?.startsWith('right-')?1:0;
 let x=0,y=0,roll=0,scale=1;
 if(id?.includes('pauldron')||id?.includes('talon')){
  x=side*(stage*.036+warning*.015);roll=side*(stage*.105+warning*.085);
 }else if(id?.startsWith('back-spine'))roll=(id.endsWith('1')||id.endsWith('2')?-1:1)*(stage*.078+warning*.035);
 else if(id==='crown-finial'){y=-stage*.065;roll=-warning*.09;}
 else if(id==='ember-heart')scale=1+stage*.13+warning*.11;
 return Object.freeze({x,y,roll,scale});
}
