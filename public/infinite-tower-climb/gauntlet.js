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
ledger();live();setInterval(live,1300);
})();
