'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const moduleUrl=pathToFileURL(path.resolve(__dirname,'../../public/ai-maze-escape/map-view.mjs')).href;
const realApproach={
  hero:{left:-.5776828250373761,right:-.13245576405390722,
    bottom:.04688058444692015,top:.35460569422979665},
  jaw:{left:-.10016746593508503,right:.6820160507089655,
    bottom:-.23708534780659318,top:.20131377797253652},
  halfHeight:6.69270358974359
};
test('Pass273 restores real 390px Pip readable size while keeping both true public physical bodies inside strict native frame',async()=>{
  const {publicPhysicalPressureHeroReadabilityHalfHeight:fit,
    publicPhysicalPressureHorizontalReframe:pan}=await import(moduleUrl);
  const {hero,jaw,halfHeight}=realApproach, aspect=390/844;
  const original=JSON.stringify({hero,jaw});
  const fitted=fit(hero,jaw,halfHeight,aspect,true,false);
  const zoom=halfHeight/fitted;
  assert.ok(fitted<halfHeight*.87,'authentic undersized Pip must produce a consequential original WebGL close-up');
  assert.ok(zoom>1.15 && zoom<=1.20);
  assert.ok((hero.right-hero.left)*zoom>.49,'unchanged real native readability bar');
  assert.ok((jaw.right-jaw.left)*zoom>.70,'whole action must remain legible');
  const offset=pan({left:hero.left*zoom,right:hero.right*zoom},
    {left:jaw.left*zoom,right:jaw.right*zoom},fitted,aspect)/ (fitted*aspect);
  for(const body of [hero,jaw]){
    assert.ok(body.left*zoom-offset>=-.95 && body.right*zoom-offset<=.95,
      'full original connected body remains within hard horizontal NDC limits');
    assert.ok(body.bottom*zoom>=-.95 && body.top*zoom<=.95,
      'full original connected body remains within hard vertical NDC limits');
  }
  assert.equal(JSON.stringify({hero,jaw}),original,'never mutate gameplay or geometry');
  assert.equal(fit(hero,jaw,halfHeight,320/740,true),halfHeight,'keep accepted 320px camera untouched');
  assert.equal(fit(hero,jaw,halfHeight,844/390,true),halfHeight,'no landscape camera takeover');
  assert.equal(fit(hero,jaw,halfHeight,aspect,false),halfHeight,'no non-public pressure zoom');
});
// Pass276: extracted from SHA-verified, unaltered same-WebGL-canvas
// public-tide-shear-pressure-390.png (2026-11-11 15:58:57Z, Pass275
// source 479e77ce). Diagonal approach is NOW .515; the subsequent true
// one-cell pressure stroke still makes Pip .44511063280517116 NDC.
// This is a real gameplay camera regression, not an invented fixed pose.
test('Pass276 original 390px ONE-CELL closing stroke preserves readable Pip AND whole jaw',async()=>{
  const {publicPhysicalPressureHeroReadabilityHalfHeight:fit,
    publicPhysicalPressureHorizontalReframe:pan}=await import(moduleUrl);
  const hero={left:-.2601086316975003,right:.18500200110767082,
    bottom:-.004211231990090847,top:.3770827243799825};
  const jaw={left:-.5448283327262528,right:.4158467620317804,
    bottom:-.3103992736536216,top:.2283988888971686};
  const h=5.449999999999999,aspect=390/844;
  const measured=hero.right-hero.left;
  assert.ok(measured<.49,'real source contact is physically undersized before correction');
  const staged=fit(hero,jaw,h,aspect,true,false);
  const zoom=h/staged;
  assert.ok(zoom>1.15&&zoom<1.20,'real pressure encounter must be visibly restaged, not decorated');
  assert.ok(measured*zoom>.49,'preserve immutable physical 390px Pip width');
  assert.ok((jaw.right-jaw.left)*zoom>.70,'whole authentic closing shear remains legible');
  const pairLeft=Math.min(hero.left,jaw.left)*zoom;
  const pairRight=Math.max(hero.right,jaw.right)*zoom;
  const panNdc=pan({left:hero.left*zoom,right:hero.right*zoom},
    {left:jaw.left*zoom,right:jaw.right*zoom},staged,aspect)/(staged*aspect);
  assert.ok(pairLeft-panNdc>=-.95&&pairRight-panNdc<=.95,
    'both original 3D envelopes must retain original no-crop horizontal limit');
  for(const b of [hero,jaw]){
    assert.ok(b.bottom*zoom>-.95&&b.top*zoom<.95,
      'both original connected bodies must retain original vertical limit');
  }
  assert.equal(fit(hero,jaw,h,aspect,false,false),h,
    'never activate through non-public, gated or inactive pressure');
  assert.equal(fit(hero,jaw,h,320/740,true,false),h,
    'preserve existing native 320px camera');
});

test('one genuine immediately verified withdrawal may preserve Pip and moving-jaw scale without cropping',async()=>{
  const {publicPhysicalPressureHeroReadabilityHalfHeight:fit}=await import(moduleUrl);
  const hero={left:.18,right:.572,bottom:-.02,top:.30};
  const jaw={left:-.70,right:.01,bottom:-.26,top:.22};
  const h=7.15,aspect=390/844;
  const staged=fit(hero,jaw,h,aspect,true,true);
  assert.ok(staged<h,'real retreat deserves readable full-body Pip');
  const zoom=h/staged;
  assert.ok((hero.right-hero.left)*zoom>.49);
  assert.ok((jaw.right-jaw.left)*zoom>.70);
  assert.ok((hero.right-jaw.left)*zoom<1.76);
  assert.equal(fit(hero,jaw,h,aspect,true,false),h,
    'larger withdrawal zoom is forbidden before authenticated withdrawal');
});
test('physical pair fit refuses forged bounds, oversized scene and non-eligible modes',async()=>{
  const {publicPhysicalPressureHeroReadabilityHalfHeight:fit}=await import(moduleUrl);
  const {hero,jaw,halfHeight:h}=realApproach,aspect=390/844;
  assert.equal(fit(hero,{...jaw,right:1.30},h,aspect,true),h,'cannot crop full true jaw');
  assert.equal(fit({...hero,top:1.0},jaw,h,aspect,true),h,'cannot crop Pip vertical volume');
  assert.equal(fit({...hero,left:NaN},jaw,h,aspect,true),h);
  assert.equal(fit(hero,null,h,aspect,true),h);
  assert.equal(fit(hero,jaw,Infinity,aspect,true),Infinity);
  assert.equal(fit(hero,jaw,h,NaN,true),h);
  assert.equal(fit({...hero,right:hero.left+.55},jaw,h,aspect,true),h,
    'already readable Pip must not be repeatedly enlarged');
});
test('production optical fix is bound to actual public diagonal or original verified retreat, not UI or private AI',()=>{
  const source=fs.readFileSync(path.resolve(__dirname,
    '../../public/ai-maze-escape/scene.js'),'utf8');
  assert.match(source,/publicPhysicalPressureHeroReadabilityHalfHeight\(/);
  assert.match(source,/pressurePortraitStage && \(publicDiagonal \|\| activePressureContact \|\| !!verifiedRetreatTrap\)/);
  assert.match(source,/heroSpan=physicalSpan\(explorer\.group\)/);
  assert.match(source,/jawSpan=physicalSpan\(hazard\)/);
  assert.match(source,/publicPhysicalPressureHorizontalReframe\(/);
  assert.doesNotMatch(source,/camera\.zoom\s*=/);
});
