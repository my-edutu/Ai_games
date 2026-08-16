#!/usr/bin/env node
const {createCurrentValidationBundle}=require('../dist/packages/release-validation/src/index.js');
const source=process.env.CANDIDATE_SOURCE_SHA||process.argv[2];
if(!source){
  console.error('CANDIDATE_SOURCE_SHA or a full Git commit SHA argument is required.');
  process.exit(2);
}
process.stdout.write(JSON.stringify(createCurrentValidationBundle(source),null,2)+'\n');
