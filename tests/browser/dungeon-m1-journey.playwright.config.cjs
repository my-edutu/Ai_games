'use strict';
const base=require('./dungeon.playwright.config.cjs');
module.exports={...base,testMatch:['dungeon-m1-organic-journey.spec.cjs'],fullyParallel:false,
 workers:1,timeout:22*60*1000,use:{...base.use,video:'off',trace:'retain-on-failure'},
 reporter:[['list']]};
