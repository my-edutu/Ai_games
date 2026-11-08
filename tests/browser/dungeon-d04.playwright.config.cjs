'use strict';
const {defineConfig}=require('@playwright/test');
const original=require('./dungeon.playwright.config.cjs');
module.exports=defineConfig({
 ...original,
 testMatch:['dungeon-physical-feedback-preview.spec.cjs'],
 // Keep the ordinary game browser suite unchanged; this is a separate,
 // explicit opt-in verification command for the isolated D04 branch.
 timeout:240000,fullyParallel:false,workers:1
});