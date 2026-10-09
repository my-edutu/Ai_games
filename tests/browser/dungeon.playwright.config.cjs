'use strict';
const path=require('node:path');
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'.',testMatch:'dungeon-stream.spec.cjs',
 timeout:60000,expect:{timeout:15000},
 use:{baseURL:'http://127.0.0.1:4181',headless:true,viewport:{width:1440,height:900},trace:'retain-on-failure',video:'on',launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']}},
 webServer:{command:'node scripts/serve-dungeon-stream.cjs --port=4181',cwd:path.resolve(__dirname,'../..'),url:'http://127.0.0.1:4181/dungeon/health',reuseExistingServer:false,timeout:60000},
 reporter:[['list']]
});
