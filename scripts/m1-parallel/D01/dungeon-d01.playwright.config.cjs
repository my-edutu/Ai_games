'use strict';
// Isolated D01 capture test; does not expand the global dungeon test matrix.
const path=require('node:path');
const base=require('../../../tests/browser/dungeon.playwright.config.cjs');
module.exports={...base,testDir:path.resolve(__dirname,'../../../tests/browser'),
 testMatch:['dungeon-m1-d01-capture.spec.cjs'],fullyParallel:false,
 workers:1,use:{...base.use,video:'off',trace:'retain-on-failure'},
 reporter:[['list']]};
