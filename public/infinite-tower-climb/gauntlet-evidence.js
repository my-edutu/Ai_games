import {listTowerEvidence,addTowerCritique} from '/tower/evidence3d.js';
const $=id=>document.getElementById(id);
const liveURLs=[];
function clearURLs(){for(const u of liveURLs)URL.revokeObjectURL(u);liveURLs.length=0;}
function node(tag,text,className){
  const el=document.createElement(tag);
  if(text!==undefined)el.textContent=text;
  if(className)el.className=className;
  return el;
}
const fmt=date=>new Date(date).toLocaleString();
function createCard(item){
  const card=node('article',undefined,'proof-card'),head=node('div',undefined,'proof-meta');
  head.append(node('strong',(item.state?.biome||'UNKNOWN').toUpperCase()+' • FLOOR '+String(item.state?.floor??'—')));
  head.append(node('small',fmt(item.createdAt)+' / '+item.reason));
  card.append(head);
  const url=URL.createObjectURL(item.media);liveURLs.push(url);
  const media=node(item.kind==='video'?'video':'img');
  media.src=url;media.className='proof-media';
  if(item.kind==='video'){media.controls=true;media.playsInline=true;media.preload='metadata';}
  else{media.alt='Actual WebGL frame captured in the running Infinite Tower 3D game';media.loading='lazy';}
  card.append(media);
  const more=node('div',undefined,'proof-meta');
  more.append(node('span',item.kind==='video'?'GAMEPLAY VIDEO':'REAL 3D FRAME'));
  const link=node('a','Open evidence ↗');link.href=url;link.target='_blank';link.rel='noopener';
  link.download='tower-'+item.id+(item.kind==='video'?'.webm':'.jpg');
  more.append(link);card.append(more);
  return card;
}
async function render(){
  clearURLs();
  const wall=$('proof-wall'),rows=await listTowerEvidence();
  rows.sort((a,b)=>b.createdAt-a.createdAt);
  wall.replaceChildren();
  if(rows.length){for(const item of rows.slice(0,15))wall.append(createCard(item));}
  else wall.append(node('p','No verified image has been captured in this browser yet. Open the autonomous 3D game and wait for the first biome screenshot; GitHub Actions screenshots remain in workflow artifacts.','empty'));
  $('proof-count').textContent=String(rows.filter(x=>x.kind==='image').length);
  $('clip-count').textContent=String(rows.filter(x=>x.kind==='video').length);
  $('last-proof').textContent=rows.length?fmt(rows[0].createdAt):'NONE YET';
  const menu=$('critic-capture');
  menu.replaceChildren();
  menu.append(new Option('Choose a screenshot to evaluate',''));
  for(const item of rows.filter(x=>x.kind==='image'))menu.append(new Option(
    item.state?.biome+' / floor '+item.state?.floor+' / '+fmt(item.createdAt),item.id));
  const critiques=await listTowerEvidence('critiques');
  critiques.sort((a,b)=>b.createdAt-a.createdAt);
  const area=$('critic-history');area.replaceChildren();
  if(!critiques.length)area.append(node('p','NO BLIND EVALUATION SUBMITTED — visual Gauntlet is NOT passed.','empty'));
  else for(const entry of critiques.slice(0,15)){
    const article=node('article',undefined,'critic-card');
    article.append(node('strong',entry.reviewer+' / '+entry.benchmark+' / '+entry.score+'/10'));
    article.append(node('p','SINGLE BIGGEST GAP: '+entry.biggestGap));
    if(entry.verdict)article.append(node('p','BLIND A/B: '+(entry.oursWon===null?'TIE':entry.oursWon?'Our game selected':'Reference selected')));
    article.append(node('small',fmt(entry.createdAt)+' · '+(entry.independent?'Independence declared':'Independence unverified')
      +' · '+(entry.blind?'Blind review declared':'NOT blind')));
    area.append(article);
  }
  // Genuine pass requires evaluated gameplay, not test count or a self-assessed score.
  const independent=critiques.filter(x=>x.independent&&x.blind&&x.snapshotId&&rows.some(y=>y.id===x.snapshotId));
  $('review-score').textContent=independent.length>=3?'REVIEWS PRESENT — HUMAN APPROVAL STILL REQUIRED':independent.length+' / 3 VERIFIED-DECLARED BLIND REVIEWS';
}
$('refresh-evidence')?.addEventListener('click',()=>void render().catch(err=>{console.error(err);$('evidence-status').textContent=String(err)}));
$('critic-form')?.addEventListener('submit',async(event)=>{
  event.preventDefault();
  const form=event.currentTarget;
  const data=new FormData(form);
  try{
    const entry=await addTowerCritique({
      reviewer:data.get('reviewer'),benchmark:data.get('benchmark'),
      biggestGap:data.get('biggestGap'),nextAction:data.get('nextAction'),
      snapshotId:data.get('snapshotId'),score:Number(data.get('score')),
      independent:form.querySelector('[name="independent"]').checked,
      blind:form.querySelector('[name="blind"]').checked,
      approved:false
    });
    $('evidence-status').textContent='Critic feedback saved locally: '+entry.id+'. No Gauntlet pass declared.';
    form.reset();await render();
  }catch(err){$('evidence-status').textContent=String(err)}
});
fetch('/tower/gauntlet-findings.json',{cache:'no-store'}).then(r=>r.json()).then(report=>{
  const issue=report.baselineCriticFinding;
  $('historical-gap').textContent=issue.biggestGap;
  $('historical-fix').textContent='Attempted correction, NOT screenshot-verified: '+issue.specificFixAttempted;
  $('historical-light').textContent=issue.meanLuminance+' / 255';
  $('historical-dark').textContent=(issue.fractionBelow34*100).toFixed(1)+'%';
  const cycle=report.latestCriticCycle;
  if(cycle){
    const panel=node('section',undefined,'historical-critic');
    panel.setAttribute('aria-label','Latest evidence-based Gauntlet cycle');
    panel.append(node('span','CRITIC ROUND 1 · '+cycle.date+' · NO VISUAL PASS','eyebrow'));
    panel.append(node('h3',cycle.largestIndependentlyVerifiableGap));
    panel.append(node('p','CI finding: '+cycle.observedLog,'evidence-copy'));
    panel.append(node('p','Verified correction: '+cycle.change,'evidence-copy'));
    panel.append(node('p','Independent critic: '+cycle.freshIndependentCritic,'evidence-copy'));
    const link=node('a','Inspect failed CI evidence ↗');
    link.href='https://github.com/my-edutu/Ai_games/actions/runs/'+cycle.evidenceWorkflowRun;
    link.target='_blank';link.rel='noopener';panel.append(link);
    document.querySelector('.historical-critic')?.insertAdjacentElement('afterend',panel);
  }
}).catch(error=>console.warn('Quality report unavailable',error));
render().catch(error=>{$('evidence-status').textContent='Evidence unavailable: '+error.message});
setInterval(()=>{if(!document.hidden)void render().catch(()=>{})},12000);
