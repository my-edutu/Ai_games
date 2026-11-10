'use strict';
const base=require('./dungeon.playwright.config.cjs');
// The spec enables screenshot and native tracing only in their own labelled
// observer-control blocks. No implicit screencast may contaminate OFF/ON/OFF.
module.exports={...base,testMatch:['dungeon-m1-renderer-assay.spec.cjs'],
 fullyParallel:false,workers:1,timeout:15*60*1000,
 use:{...base.use,video:'off',screenshot:'off',trace:'off'},reporter:[['list']]};
