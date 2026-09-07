'use strict';
const MAX_PARTICLES=180,MAX_FLOATERS=12,MAX_AUDIO_VOICES=12,MIN_CAMERA_CELLS_X=15,MIN_CAMERA_CELLS_Y=9;
const QUALITY_PRESETS=Object.freeze({
  low:Object.freeze({name:'low',maxDpr:1,particleBudget:48,floaterBudget:5,detail:0,lightLayers:0,shadowBlur:0}),
  balanced:Object.freeze({name:'balanced',maxDpr:1.35,particleBudget:96,floaterBudget:8,detail:1,lightLayers:1,shadowBlur:8}),
  high:Object.freeze({name:'high',maxDpr:1.75,particleBudget:140,floaterBudget:10,detail:2,lightLayers:2,shadowBlur:14}),
  ultra:Object.freeze({name:'ultra',maxDpr:2,particleBudget:180,floaterBudget:12,detail:3,lightLayers:3,shadowBlur:20})
});
const AUDIO_COOLDOWNS=Object.freeze({step:280,combat:90,'hero-damaged':240,'enemy-defeated':180,reward:520,milestone:900,'boss-telegraph':650,'result-failure':2200,'integrity-warning':1800,ambient:1200});
const AMBIENCE_STATES=Object.freeze({calm:{low:62,high:93,gain:.010},exploration:{low:55,high:82,gain:.014},danger:{low:46,high:69,gain:.024},boss:{low:34,high:51,gain:.032},reward:{low:98,high:147,gain:.015},result:{low:41,high:61,gain:.010},recovery:{low:72,high:108,gain:.008}});
const canvas=document.getElementById('game'),ctx=canvas.getContext('2d',{alpha:false,desynchronized:true}),caption=document.getElementById('caption'),connection=document.getElementById('connection'),summary=document.getElementById('sr-summary');
const audioToggle=document.getElementById('audio-toggle'),motionToggle=document.getElementById('motion-toggle'),cleanToggle=document.getElementById('clean-toggle');
const mediaReduced=matchMedia('(prefers-reduced-motion: reduce)'),initialParams=new URLSearchParams(location.search);
function chooseQuality(requested){if(requested&&requested!=='auto'&&QUALITY_PRESETS[requested])return requested;const memory=Number(navigator.deviceMemory||0),cores=Number(navigator.hardwareConcurrency||0),pixels=Math.max(1,innerWidth)*Math.max(1,innerHeight)*(devicePixelRatio||1);if(memory&&memory<=4||cores&&cores<=4||pixels>6500000)return'low';if(memory>=8&&cores>=8&&pixels<4200000)return'high';return'balanced'}
const quality=QUALITY_PRESETS[chooseQuality(initialParams.get('quality')||'auto')];
let frame=null,lastFrame=null,lastPoll=0,lastCueIds=new Set(),lastAudioCueAt=new Map(),audioContext=null,audioMaster=null,ambience=null,audioEnabled=initialParams.get('muted')==='0',manualReduced=initialParams.get('reducedMotion')==='1',cleanFeed=initialParams.get('cleanFeed')==='1',particles=[],floaters=[],shake={x:0,y:0,power:0},camera={x:null,y:null,runToken:null},requestInFlight=false,connectionFailures=0;
const palette={background:'#090b0a',panel:'rgba(16,18,16,.88)',panelEdge:'rgba(194,163,104,.22)',floor:'#343832',floorSeen:'#222621',wall:'#171a17',grid:'rgba(217,205,176,.055)',hero:'#f0d39a',heroCore:'#a6e6dc',danger:'#f06f68',warning:'#e2ad5d',safe:'#86c79b',violet:'#a99ade',text:'#f2eee3',muted:'#aaa494',gold:'#d8a85f',moss:'#6d8060',bronze:'#9a7249',damp:'#566763',stoneEdge:'#55594e'};
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),lerp=(a,b,t)=>a+(b-a)*t;
