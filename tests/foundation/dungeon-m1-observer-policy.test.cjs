'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const journey=require('../browser/dungeon-m1-journey.playwright.config.cjs');
const assay=require('../browser/dungeon-m1-renderer-assay.playwright.config.cjs');

test('organic source film is not duplicated by a continuous Playwright screenshot recorder',()=>{
 assert.equal(journey.use.video,'off');
 assert.equal(journey.use.trace.mode,'retain-on-failure');
 assert.equal(journey.use.trace.screenshots,false);
 assert.equal(journey.use.trace.snapshots,true,'retain network/DOM failure diagnostics');
 assert.equal(journey.retries??0,0,'never retry until a performance result becomes green');
});
test('renderer baseline does not start an implicit Playwright trace or video',()=>{
 assert.equal(assay.use.video,'off');
 assert.equal(assay.use.trace,'off');
 assert.equal(assay.use.screenshot,'off');
 assert.equal(assay.workers,1);
 assert.equal(assay.fullyParallel,false);
});
