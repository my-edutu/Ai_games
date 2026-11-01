import {listTowerEvidence,addTowerCritique} from '/tower/evidence3d.js';
const $=id=>document.getElementById(id),feedback=$('feedback');
const OFFICIAL_JUSANT='https://xboxwire.thesourcemediaassets.com/sites/2/2023/10/scmwn8-fecdc1e0ad8ca21dc604.jpg';
let images=[],ours=null,reference=null,sideA=null,locked=false,oursURL=null,referenceURL=null;
function message(text){feedback.textContent=text;}
function externalURL(){return $('benchmark').value==='Jusant'?OFFICIAL_JUSANT:null;}
function makeURL(blob){return URL.createObjectURL(blob);}
function cleanup(){if(oursURL)URL.revokeObjectURL(oursURL);if(referenceURL)URL.revokeObjectURL(referenceURL);oursURL=referenceURL=null;}
function ready(){
 const selected=$('ours').value,needsFile=$('benchmark').value!=='Jusant';
 $('begin').disabled=!selected||(needsFile&&!$('benchmark-file').files?.[0]);
}
async function load(){
 images=(await listTowerEvidence()).filter(x=>x.kind==='image'&&x.media instanceof Blob)
   .sort((a,b)=>b.createdAt-a.createdAt);
 const select=$('ours');select.replaceChildren();
 if(!images.length){select.append(new Option('No locally captured gameplay yet',''));ready();return;}
 for(const item of images)select.append(new Option(
   item.state.biome.toUpperCase()+' · Floor '+item.state.floor+' · '+new Date(item.createdAt).toLocaleTimeString(),item.id));
 ready();
}
$('ours').addEventListener('change',ready);
$('benchmark').addEventListener('change',()=>{ready();$('blind-stage').hidden=true;locked=false;});
$('benchmark-file').addEventListener('change',ready);
$('begin').addEventListener('click',async()=>{
 const chosen=images.find(x=>x.id===$('ours').value);
 if(!chosen){message('A real WebGL screenshot must be selected.');return;}
 const file=$('benchmark-file').files?.[0],remote=externalURL();
 if(!file&&!remote){message('Upload an unchanged real gameplay screenshot from your chosen benchmark.');return;}
 cleanup();ours=chosen;oursURL=makeURL(chosen.media);
 referenceURL=file?makeURL(file):remote;
 const myLeft=Boolean(crypto.getRandomValues(new Uint8Array(1))[0]&1);
 sideA=myLeft?'ours':'benchmark';reference={name:$('benchmark').value,fromFile:Boolean(file)};
 const a=$('frame-a'),b=$('frame-b');
 a.parentElement.querySelector('span').textContent='FRAME A';b.parentElement.querySelector('span').textContent='FRAME B';
 a.src=myLeft?oursURL:referenceURL;b.src=myLeft?referenceURL:oursURL;
 for(const el of [a,b]){el.onload=null;el.onerror=null;}
 a.onerror=()=>{message('One image failed to load. The blind round cannot be recorded until both real images are visible.');$('submit').disabled=true;};
 b.onerror=a.onerror;
 Promise.all([a.decode(),b.decode()]).then(()=>{$('submit').disabled=false;message('Both actual screenshots loaded. Labels are hidden. Compare carefully, inspect real gameplay, then lock your verdict.');})
   .catch(()=>{$('submit').disabled=true;message('A screenshot could not be decoded. Upload an unchanged local reference image and retry.');});
 $('blind-stage').hidden=false;
 $('verdict-form').reset();
 $('submit').disabled=true;locked=false;
 $('begin').disabled=true;
});
$('verdict-form').addEventListener('submit',async(event)=>{
 event.preventDefault();if(locked||!ours||!reference)return;
 const form=event.currentTarget,values=new FormData(form),v=values.get('winner');
 if(!['a','b','tie'].includes(v)){message('Select A, B or Tie.');return;}
 const oursWon=v==='tie'?null:(v==='a'&&sideA==='ours')||(v==='b'&&sideA!=='ours');
 try{
  const result=await addTowerCritique({
   reviewer:values.get('reviewer'),score:Number(values.get('score')),
   benchmark:reference.name,blind:true,independent:form.querySelector('[name="independent"]').checked,
   biggestGap:values.get('biggestGap'),nextAction:values.get('nextAction'),
   snapshotId:ours.id,verdict:v,oursWon,
   referenceUrl:reference.fromFile?'Reviewer-provided unchanged screenshot':OFFICIAL_JUSANT,
   gameplayChecked:form.querySelector('[name="sawGameplay"]').checked
  });
  locked=true;
  $('submit').disabled=true;
  $('begin').disabled=false;
  $('frame-a').parentElement.querySelector('span').textContent='FRAME A — '+(sideA==='ours'?'INFINITE TOWER':'REFERENCE / '+reference.name);
  $('frame-b').parentElement.querySelector('span').textContent='FRAME B — '+(sideA==='ours'?'REFERENCE / '+reference.name:'INFINITE TOWER');
  message('Independent verdict recorded locally: '+(oursWon===null?'TIE':oursWon?'OUR GAME WON':'REFERENCE WON')+
    '. Biggest remaining gap saved. This single vote does NOT pass the Gauntlet. '+result.id);
 }catch(error){message('Review NOT recorded: '+String(error.message||error));}
});
addEventListener('pagehide',cleanup);
load().catch(error=>message('Evidence archive unavailable: '+error.message));
