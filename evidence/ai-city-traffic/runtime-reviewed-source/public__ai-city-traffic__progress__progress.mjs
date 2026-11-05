const $=id=>document.getElementById(id);
const date=value=>new Intl.DateTimeFormat('en-GB',{dateStyle:'medium',timeStyle:'short',timeZone:'UTC'}).format(new Date(value))+' UTC';
const element=(tag,text,className)=>{const node=document.createElement(tag);if(text!==undefined)node.textContent=text;if(className)node.className=className;return node;};
let previous='',polling=false;
function list(items){const node=element('ul');for(const item of items||[])node.append(element('li',item));return node;}
function render(data){
 $('build-status').textContent=data.status;$('updated').textContent=date(data.updatedAt);$('updated').dateTime=data.updatedAt;
 $('benchmark-status').textContent=data.benchmark.status;$('benchmark-bar').textContent=data.benchmark.bar;$('benchmark-reason').textContent=data.benchmark.reason;
 $('captures').replaceChildren();$('no-captures').hidden=Boolean(data.captures.length);
 for(const capture of [...data.captures].sort((a,b)=>Date.parse(b.date)-Date.parse(a.date))){
  if(!/^[a-z0-9-]+\.(png|jpg)$/.test(capture.file))continue;
  const figure=element('figure'),link=element('a'),img=element('img'),caption=element('figcaption');
  link.href='./captures/'+capture.file;link.target='_blank';link.rel='noopener';img.src=link.href;img.alt=capture.title;img.loading='lazy';link.append(img);
  caption.append(element('strong',capture.title),element('time',date(capture.date)));figure.append(link,caption);$('captures').append(figure);
 }
 $('checks').replaceChildren();for(const check of data.checks){const item=element('div',undefined,'check'),heading=element('div',undefined,'check-title');item.dataset.status=check.status;heading.append(element('span',check.name),element('span',check.status,'badge'));item.append(heading,element('p',check.detail));$('checks').append(item);}
 $('next').replaceChildren(...data.next.map(item=>element('li',item)));
 $('iterations').replaceChildren();for(const entry of [...data.iterations].reverse()){const item=element('article',undefined,'iteration');item.append(element('time',date(entry.date)),element('h3',entry.title),element('p',entry.detail));if(entry.changes?.length)item.append(list(entry.changes));if(entry.findings?.length){item.append(element('p','Critic findings:','review-verdict'),list(entry.findings));}item.append(element('p',entry.verdict,'review-verdict'));$('iterations').append(item);}
 $('references').replaceChildren();for(const ref of data.references){const row=element('div',undefined,'reference'),body=element('div'),a=element('a',ref.name+' ↗');a.href=ref.url;a.target='_blank';a.rel='noopener';body.append(a,element('small',ref.role));row.append(body,element('span',ref.status,'reference-status'));$('references').append(row);}
 $('tooling').textContent='Independent builders and critics · Ultracode: '+data.tooling.ultracode;
}
async function refresh(){if(polling||document.hidden)return;polling=true;try{const response=await fetch('./data.json',{cache:'no-store'});if(!response.ok)throw new Error('Progress data unavailable');const text=await response.text();if(text!==previous){render(JSON.parse(text));previous=text;}$('load-status').textContent='';}catch{$('load-status').textContent='Updates are temporarily unavailable. The last recorded evidence remains visible.';}finally{polling=false;}}
await refresh();setInterval(refresh,4000);document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh();});
