'use strict';
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'.',testMatch:'dungeon-spectator-continuity.spec.cjs',workers:1,fullyParallel:false,retries:0,timeout:60000,expect:{timeout:6000},use:{headless:true,viewport:{width:390,height:844},launchOptions:{executablePath:process.env.DUNGEON_BROWSER_EXECUTABLE,args:['--no-sandbox','--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader']}},reporter:[['list'],['json',{outputFile:'artifacts/session9/browser-results.json'}]]});
