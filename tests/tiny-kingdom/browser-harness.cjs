'use strict';
const fs = require('node:fs');
const path = require('node:path');
const { chromium } = require(process.env.PLAYWRIGHT_NODE_PATH || '@playwright/test');
const root = path.resolve(__dirname, '../..');
function markup() {
 let html = fs.readFileSync(path.join(root, 'public/tiny-kingdom/index.html'), 'utf8');
 const hook = `window.__tkInspection={citizens:()=>people,world:()=>state,pose:citizenRigPose,
 equipment:p=>typeof citizenEquipment==='function'?citizenEquipment(p,citizenRigPose(p)):null,
 captureHouse:()=>{const old=data;try{data=[];house(0,0,1,0);return data.slice()}finally{data=old}},
 captureCitizen:index=>{const old=data;try{data=[];villager(people[index]);return data.slice()}finally{data=old}},
 checksum,ground:terrain};`;
 const marker = 'requestAnimationFrame(render);window.__tinyKingdom=';
 if (!html.includes(marker)) throw new Error('Game inspection anchor changed; update the test harness.');
 html = html.replace(marker, hook + marker);
 return html.replace('<script>', `<script>
 window.requestAnimationFrame = callback => { window.__pendingFrame = callback; return 1; };
 window.__drawFrame = time => window.__pendingFrame?.(time);
 `);
}
async function launch() {
 return chromium.launch({headless:true,...(process.env.TINY_CHROMIUM?{executablePath:process.env.TINY_CHROMIUM}:{}),args:['--no-sandbox','--disable-dev-shm-usage','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
}
async function open(browser,viewport={width:1280,height:720}) {
 const page=await browser.newPage({viewport});const errors=[];
 page.on('pageerror',error=>errors.push(error.message));await page.setContent(markup());
 await page.waitForFunction(()=>!!window.__tinyKingdom);
 await page.evaluate(()=>{window.__tinyKingdom.setSpeed(0);window.__tinyKingdom.reset()});
 return {page,errors};
}
module.exports={root,launch,open,markup};
