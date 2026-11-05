'use strict';
const {defineConfig,chromium}=require('@playwright/test');
module.exports=defineConfig({
  testDir:'tests/browser',testMatch:'battle-royale-stream.spec.cjs',workers:1,
  timeout:60000,expect:{timeout:20000},reporter:[['list']],
  use:{headless:true,baseURL:'http://127.0.0.1:4287',viewport:{width:1280,height:800},trace:{mode:'retain-on-failure',screenshots:false,snapshots:true},launchOptions:{executablePath:chromium.executablePath(),args:['--no-sandbox','--disable-dev-shm-usage','--disable-gpu']}},
  webServer:{command:'node scripts/serve-battle-royale-stream.cjs --port=4287',url:'http://127.0.0.1:4287/royale/health',timeout:30000,reuseExistingServer:false}
});
