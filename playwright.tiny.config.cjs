'use strict';
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({testDir:'tests/browser',testMatch:'tiny-kingdom*.spec.cjs',workers:1,timeout:60000,expect:{timeout:10000},reporter:[['list']],use:{headless:true,trace:'retain-on-failure',launchOptions:{args:['--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader','--disable-dev-shm-usage']}}});
