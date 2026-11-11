'use strict';
const {defineConfig}=require('@playwright/test');
const original=require('./dungeon.playwright.config.cjs');
// GitHub-hosted Ubuntu already supplies Chrome and its runtime dependencies.
// Only the isolated D04 CI job opts in, avoiding fragile network apt font
// installation. Local/legacy Playwright behavior is unchanged.
const useHostChrome=process.env.D04_BROWSER_CHANNEL==='chrome';
module.exports=defineConfig({
 ...original,
 use:useHostChrome?{...original.use,channel:'chrome'}:original.use,
 testMatch:['dungeon-physical-feedback-preview.spec.cjs'],
 // Keep the ordinary game browser suite unchanged; this is a separate,
 // explicit opt-in verification command for the isolated D04 branch.
 timeout:240000,fullyParallel:false,workers:1
});
