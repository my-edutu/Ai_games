let revision='';
function list(id,items){document.getElementById(id).replaceChildren(...items.map(text=>{const li=document.createElement('li');li.textContent=text;return li;}));}
async function refresh(){
  try{
    const response=await fetch('/royale/dev/progress.json',{cache:'no-store'});if(!response.ok)throw new Error('unavailable');const data=await response.json();
    document.getElementById('connection').textContent='Live progress refresh: every 3 seconds.';
    if(revision===data.updated)return;revision=data.updated;
    document.getElementById('status').textContent=data.status;document.getElementById('summary').textContent=data.summary;document.getElementById('updated').textContent=`Last updated: ${data.updated}`;
    list('verified',data.verified);list('gaps',data.gaps);
    document.getElementById('captures').replaceChildren(...data.captures.map(item=>{const figure=document.createElement('figure'),img=document.createElement('img'),caption=document.createElement('figcaption');img.src=item.url;img.alt=item.caption;img.loading='lazy';caption.textContent=item.caption;figure.append(img,caption);return figure;}));
    document.getElementById('reviews').replaceChildren(...data.reviews.map(item=>{const article=document.createElement('article');article.className='card';const title=document.createElement('h3'),p=document.createElement('p');title.textContent=`${item.piece} — ${item.verdict}`;p.textContent=item.finding;article.append(title,p);return article;}));
  }catch{document.getElementById('connection').textContent='Progress connection interrupted. Retrying automatically.';}
  setTimeout(refresh,3000);
}
refresh();
