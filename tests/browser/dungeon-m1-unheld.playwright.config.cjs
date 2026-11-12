'use strict';
const base=require('./dungeon-m1-journey.playwright.config.cjs');
// A second, separate film that never holds combat/boss/floor milestones. Do not
// replace the existing held diagnostic capture; assess BOTH independently.
module.exports={...base,testMatch:['dungeon-m1-unheld-journey.spec.cjs'],
 timeout:25*60*1000};
