'use strict';
const { defineConfig } = require('@playwright/test');
module.exports = defineConfig({
  testDir:'tests/browser',
  timeout:60000,
  expect:{timeout:10000},
  workers:process.env.CI?1:undefined,
  use:{headless:true,trace:'retain-on-failure',baseURL:'http://127.0.0.1:4173'},
  webServer:[
    {command:'node scripts/serve-snake-stream.cjs',url:'http://127.0.0.1:4173/health',timeout:60000,reuseExistingServer:false,stdout:'pipe',stderr:'pipe'},
    {command:'node scripts/serve-maze-stream.cjs',url:'http://127.0.0.1:4174/maze/health',timeout:60000,reuseExistingServer:false,stdout:'pipe',stderr:'pipe'},
    {command:'node scripts/serve-ant-colony-stream.cjs',url:'http://127.0.0.1:4175/ant/health',timeout:60000,reuseExistingServer:false,stdout:'pipe',stderr:'pipe'},
    {command:'node scripts/serve-tower-stream.cjs --port=4176',url:'http://127.0.0.1:4176/tower/health',timeout:60000,reuseExistingServer:false,stdout:'pipe',stderr:'pipe'}
  ],
  reporter:[['list']]
});
