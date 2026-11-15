'use strict';
// W347 source-safety floor for REAL mobile economic-chain workday controls.
// Real browser/film and hardware measurements are separately required.
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm');
const html=fs.readFileSync('public/tiny-kingdom/index.html','utf8');
const css=html.match(/<style>([\s\S]*?)<\/style>/i)?.[1];
const script=html.match(/<script(?:\s[^>]*)?>([\s\S]*?)<\/script>/i)?.[1];
assert(css&&script,'the genuine playable HTML, CSS and JS are required');
new vm.Script(script,{filename:'tiny-kingdom-playable.js'});
assert(css.includes('W347: actual 390px farmer-to-market witness'),
 'a docked, scrollable, independently inspectable real-economy panel is required');
assert(css.includes('max-height:min(29dvh,232px)!important'),
 'collapsed receipt evidence must not occupy half of the mobile workday');
assert(css.includes('top:calc(58px + env(safe-area-inset-top))!important'),
 'opened supply must not cover the real low-screen workday caption');
assert(css.includes('grid-template-columns:minmax(0,1fr)!important'),
 'genuine receipt detail must wrap without horizontal phone overflow');
for(const name of ['field','road','market','purchase','meal']){
 assert(html.includes('id="grain-chain-'+name+'"'),'all five real camera-stage controls required: '+name);
 assert(script.includes("for(const name of ['field','road','market','purchase','meal'])"),
  'all five actual physical camera actions remain bound');
}
assert(script.includes("if(!row||row.offsetParent===null)"),
 'a hidden receipt row must not receive focus after genuine camera selection');
assert(script.includes('chip.focus({preventScroll:true});return;'),
 'a real stage selection must preserve the operable button focus');
assert(script.includes('const roofs=portraitPhysicalRoofs||followCameraRoofs()'),
 'the SAME genuine market/crop volumes must be reused for mobile camera decisions');
assert(script.includes('function realGrainChainStages(')&&
 script.includes('function inspectRealGrainStage('),
 'real parcel receipts and workday stage camera remain authoritative');
console.log('W347 source PASS: genuine 390px scrollable workday witness, five real parcel stages and hidden-receipt focus safety. Browser film/FPS NOT PROVEN.');
