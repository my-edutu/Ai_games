'use strict';
// Original browser game is standalone inline HTML via page.setContent(html).
// Do not start four unrelated build-dependent stream web servers.
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'.',
 testMatch:/tiny-kingdom-w(?:126-lived-household|180-home-nourishment)\.spec\.cjs$/,
 timeout:900000,
 expect:{timeout:15000},
 workers:1,
 use:{headless:true,trace:'retain-on-failure'},
 reporter:[['list']]
});
