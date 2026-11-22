'use strict';
// W422 — genuine receiving-market experience. RED before the original render change.
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const game=fs.readFileSync(path.join(__dirname,'../public/tiny-kingdom/index.html'),'utf8');
const inline=game.match(/<script[^>]*>([\s\S]*?)<\/script>/);
assert.ok(inline,'Full original game script must exist');
new vm.Script(inline[1],{filename:'original-tiny-kingdom.js'});
const match=game.match(/function scorePhysicalMarketReceiptShot\([\s\S]*?\n\}/);
assert.ok(match,'Real-market sightline needs an evidence-weighted, bounded scoring contract');
const score=vm.runInNewContext(match[0]+'\nscorePhysicalMarketReceiptShot');
const frame=(size)=>({visibleShelves:2,minHeightFraction:size,maxAbsX:.18,maxAbsY:.2});
const post={centerCover:.10},tree={faceBlockers:0,cover:.05};
const buildings={cover:.09,cargoCover:.03};
const close=score(frame(.085),post,tree,buildings,.27,3.9,0);
const far=score(frame(.029),post,tree,buildings,.27,7.2,0);
assert.ok(Number.isFinite(close)&&close<far,'An equally clear closer look at real goods must outrank distant miniature stock');
assert.equal(score(frame(.085),{centerCover:.26},tree,buildings,.27,3.9,0),Infinity,
 'Large original timber post blocks a shot, regardless of its attractive apparent stock size');
assert.equal(score({...frame(.085),visibleShelves:1},post,tree,buildings,.27,3.9,0),Infinity,
 'Cannot claim market visibility when an authentic shelf is outside the physical frame');
assert.equal(score(frame(.085),post,tree,{cover:.38,cargoCover:.03},.27,3.9,0),Infinity,
 'Architectural occlusion cannot be hidden to win an improved frame');
assert.match(game,/function updateRealMarketStockTag\(cameraMatrix\)/);
assert.match(game,/id="market-stock-tag" role="status" aria-live="off" hidden/);
const tag=game.slice(game.indexOf('function updateRealMarketStockTag('),
 game.indexOf('function updateWorldActorTag('));
assert.match(tag,/grainJourney\?\.marketWitness/);
assert.match(tag,/creditedAtUnloading===true/);
assert.match(tag,/planMarketReceiptDisplay\(state\.receiptGrainLots\|\|\[\],state\.food\)/);
assert.match(tag,/el\.hidden=true/);
assert.doesNotMatch(tag,/people\.push|deliveryReceipts\.push|state\.food\s*=|Math\.random/);
assert.match(game,/updateRealMarketStockTag\(m\);updateWorldActorTag\(m\)/);
const lens=game.slice(game.indexOf('function chooseRealMarketReceiptLens('),
 game.indexOf('// W359 —'));
assert.match(lens,/scorePhysicalMarketReceiptShot\(/);
assert.match(lens,/surveysNearGoods/);
assert.match(lens,/Math\.min\(180/);
console.log('W422 genuine stock projection, physical close-up and read-only inventory contract PASS');
