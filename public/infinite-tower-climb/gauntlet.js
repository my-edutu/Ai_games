'use strict';
(()=>{
const $=id=>document.getElementById(id);
const swapped=Math.random()<.5;
const feeds=swapped?['/tower?cleanFeed=1','/tower?cleanFeed=1&renderer=2d']:['/tower?cleanFeed=1&renderer=2d','/tower?cleanFeed=1'];
$('feed-a').src=feeds[0];$('feed-b').src=feeds[1];
let revealed=false;
$('reveal').addEventListener('click',()=>{
  revealed=!revealed;$('reveal').setAttribute('aria-pressed',String(revealed));
  $('reveal').textContent=revealed?'HIDE VERSIONS':'REVEAL VERSIONS';
  $('label-a').textContent=revealed?(swapped?'A · NEW 3D':'A · ORIGINAL 2D'):'FEED A — HIDDEN';
  $('label-b').textContent=revealed?(swapped?'B · ORIGINAL 2D':'B · NEW 3D'):'FEED B — HIDDEN';
});
async function ledger(){
  try{const r=await fetch('/tower/gauntlet.json',{cache:'no-store'});if(!r.ok)throw Error('ledger unavailable');const d=await r.json();
    $('round').textContent=d.round;$('round-foot').textContent=d.round;$('status').textContent=d.status;
    const history=$('history');history.replaceChildren(...(d.history||[]).map(row=>{const li=document.createElement('li');li.textContent='ROUND '+row.round+' · '+row.summary+' · '+row.verdict;return li}));
    const list=$('lanes');list.replaceChildren(...d.lanes.map(l=>{
      const li=document.createElement('li'),name=document.createElement('strong'),status=document.createElement('span');
      name.textContent=l.name;status.textContent=l.status;li.append(name,status);return li;
    }));
  }catch{ $('status').textContent='Gauntlet ledger is temporarily unavailable.' }
}
async function live(){
  try{const r=await fetch('/tower/state',{cache:'no-store'});if(r.ok){const d=await r.json();$('floor').textContent=d.snapshot.floor;$('tick').textContent=d.tick}}catch{}
}
const form=$('critic-form'),gap=$('critic-gap'),reviewState=$('review-state'),keys=['character','animation','environment','cinematic','readability'];
function reviewData(){
  const values={};for(const key of keys){const input=form.elements.namedItem(key);values[key]=Number(input.value)}
  return{round:Number($('round').textContent)||0,benchmark:'DON’T NOD — Jusant (official gameplay)',scores:values,largestRemainingGap:gap.value.trim(),reviewer:'local browser critique; independent identity not asserted'};
}
function formChanged(){for(const key of keys)$('critic-form').querySelector('[data-score="'+key+'"]').textContent=form.elements.namedItem(key).value+'/10'}
form.addEventListener('input',formChanged);
form.addEventListener('submit',event=>{
  event.preventDefault();if(!form.reportValidity())return;
  const review=reviewData();try{localStorage.setItem('tower-gauntlet-critique-v1',JSON.stringify(review));reviewState.textContent='Review saved in this browser';}catch{reviewState.textContent='Browser storage unavailable; copy the handoff instead'}
});
$('copy-critique').addEventListener('click',async()=>{
  if(!gap.value.trim()){reviewState.textContent='Describe the single biggest gap first';gap.focus();return}
  const review=JSON.stringify(reviewData(),null,2);
  try{await navigator.clipboard.writeText(review);reviewState.textContent='Builder handoff copied';}
  catch{reviewState.textContent='Clipboard unavailable; review remains in the text field'}
});
try{const saved=JSON.parse(localStorage.getItem('tower-gauntlet-critique-v1')||'null');
  if(saved?.scores){for(const key of keys){const value=saved.scores[key];if(Number.isFinite(value)&&value>=0&&value<=10)form.elements.namedItem(key).value=value;}gap.value=saved.largestRemainingGap||'';reviewState.textContent='Previous local review restored';}
}catch{}
formChanged();
ledger();live();setInterval(live,1300);
})();
