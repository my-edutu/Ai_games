'use strict';
const {defineConfig}=require('@playwright/test');
const base=require('./dungeon-d04.playwright.config.cjs');
// Run the genuinely continuous 20-minute session separately: including it in
// the 7-case visual/PCM smoke would exceed the existing 25-minute job budget.
module.exports=defineConfig({
 ...base,
 testMatch:['dungeon-d04-real-20min-cleanup-soak.spec.cjs'],
 timeout:30*60*1000,
 use:{...base.use,video:'off',trace:'off'},
 workers:1,fullyParallel:false
});
