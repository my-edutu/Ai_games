'use strict';
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'tests/browser',testMatch:'city-traffic*.spec.cjs',timeout:90000,workers:1,
 expect:{timeout:20000},
 use:{headless:true,baseURL:'http://127.0.0.1:4311',viewport:{width:1440,height:1000},
  launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader','--enable-unsafe-swiftshader'],
   ...(process.env.CITY_BROWSER_PATH?{executablePath:process.env.CITY_BROWSER_PATH}:{})},
  trace:'retain-on-failure'},
 webServer:{command:'node scripts/serve-city-traffic.cjs',url:'http://127.0.0.1:4311/traffic/health',reuseExistingServer:!process.env.CI,timeout:30000},
 reporter:[['list']]
});
