#!/usr/bin/env node
const {runPhase5Chaos}=require('../dist/packages/chaos-harness/src/index.js');
const seed=process.argv[2]||'phase5-evidence';
process.stdout.write(JSON.stringify(runPhase5Chaos(seed),null,2)+'\n');
