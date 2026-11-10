'use strict';
const base=require('./dungeon.playwright.config.cjs');
// The original canvas/WebAudio film is the sole continuous visual recorder.
// retain-on-failure otherwise runs a screenshot screencast even for passing tests.
// Preserve network, console and DOM trace diagnostics, plus deliberate milestone
// screenshots in the spec, without duplicating every moving WebGL presentation.
module.exports={...base,testMatch:['dungeon-m1-organic-journey.spec.cjs'],fullyParallel:false,
 workers:1,timeout:22*60*1000,use:{...base.use,video:'off',screenshot:'off',
  trace:{mode:'retain-on-failure',screenshots:false,snapshots:true,sources:true}},
 reporter:[['list']]};
