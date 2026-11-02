'use strict';
const path=require('node:path');
const {defineConfig}=require('@playwright/test');
module.exports=defineConfig({
 testDir:'.',testMatch:['dungeon-stream.spec.cjs','dungeon-materials.spec.cjs','dungeon-interface.spec.cjs','dungeon-setpieces.spec.cjs','dungeon-facing.spec.cjs','dungeon-authored-motion.spec.cjs','dungeon-warden-regalia.spec.cjs','dungeon-role-silhouettes.spec.cjs','dungeon-sculpted-reality.spec.cjs','dungeon-vaulted-gallery.spec.cjs','dungeon-fabric-drape.spec.cjs','dungeon-rig-attachments.spec.cjs','dungeon-floor-ruins.spec.cjs','dungeon-party-visibility.spec.cjs','dungeon-heal-clarity.spec.cjs','dungeon-ground-signal.spec.cjs','dungeon-soundstage.spec.cjs','dungeon-melee-travel.spec.cjs','dungeon-warden-seal.spec.cjs','dungeon-impact-choreography.spec.cjs'],
 // One renderer per runner; fullyParallel distributes individual tests across CI shards.
 workers:1,fullyParallel:true,
 // Shared software WebGL runners can spend 40-60s on live scene/screenshot setup;
 // leave explicit assertion and poll timeouts unchanged while bounding test runtime.
 timeout:120000,expect:{timeout:15000},
 use:{baseURL:'http://127.0.0.1:4181',headless:true,viewport:{width:1440,height:900},trace:'retain-on-failure',video:'on',launchOptions:{args:['--enable-webgl','--use-gl=angle','--use-angle=swiftshader']}},
 webServer:{command:'node scripts/serve-dungeon-stream.cjs --port=4181',cwd:path.resolve(__dirname,'../..'),url:'http://127.0.0.1:4181/dungeon/health',reuseExistingServer:false,timeout:60000},
 reporter:[['list']]
});
