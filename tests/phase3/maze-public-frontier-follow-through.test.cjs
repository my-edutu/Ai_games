'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const {chooseMazeAction}=require('../../dist/games/ai-maze-escape/src/ai/policy.js');

// The only legal destinations are the PUBLIC frontier cells 1 and 3.
// Both routes use currently learned reciprocal edges; neither tip's
// undisclosed neighbors, any hidden treasure or engine world are supplied.
const cell=(id,neighbors,visits=0)=>({cell:id,neighbors,lastSeenTick:1,
  confidencePermille:1000,visits,trap:false,blocked:false,
  checkpoint:false,clue:false,exit:false});
const scenario=(priorTarget=3,priorMode='exploring',threats=[],recentCells=[])=>{
  const known=[cell(0,[4,1]),cell(4,[0,5]),cell(5,[4,6],1),
    cell(6,[5,7]),cell(7,[6,3])];
  const belief={schemaVersion:1,
    cells:Object.fromEntries(known.map(c=>[String(c.cell),c])),
    doors:{},keys:{},threats:{},frontiers:[1,3],revision:2,lastUpdatedTick:1};
  const observation={schemaVersion:1,tick:1,currentCell:5,
    visibleCells:[4,5],rememberedCells:[0,6,7],
    cells:known.map(c=>({...c,visible:c.cell===5 || c.cell===4})),
    doors:[],keys:[],threats,inventory:[],health:3,timeRemaining:100,
    exitCell:null,recentCells};
  const state={config:{width:4},explorer:{steps:5},
    ai:{mode:priorMode,targetCell:priorTarget,recentCells}};
  return {belief,observation,state};
};
test('keep a previous safely learned frontier rather than reversing at equal-distance fork',()=>{
  const s=scenario(),d=chooseMazeAction(s.state,s.observation,s.belief);
  assert.equal(d.targetCell,3);
  assert.deepEqual(d.plannedPath,[5,6,7,3]);
  assert.deepEqual(d.action,{kind:'move',targetCell:6});
  assert.equal(d.intent.mode,'exploring');
});
test('no prior exploratory target means the existing closest-first behavior wins',()=>{
  for(const [goal,mode] of [[null,'exploring'],[3,'returning-key'],[99,'exploring']]){
    const s=scenario(goal,mode);
    const d=chooseMazeAction(s.state,s.observation,s.belief);
    assert.equal(d.targetCell,1);
    assert.deepEqual(d.action,{kind:'move',targetCell:4});
  }
});
test('actual currently observed threat occupancy invalidates the old target route',()=>{
  const s=scenario(3,'exploring',[{id:'observed-guardian',cell:6,lastSeenTick:1}]);
  const d=chooseMazeAction(s.state,s.observation,s.belief);
  assert.equal(d.targetCell,1);
  assert.deepEqual(d.action,{kind:'move',targetCell:4});
});
test('a genuine repeated path cycle abandons the remembered goal and explores elsewhere',()=>{
  const s=scenario(1,'exploring',[],[5,6,5,6,5,6,5]);
  const d=chooseMazeAction(s.state,s.observation,s.belief);
  assert.equal(d.targetCell,3);
  assert.equal(d.intent.mode,'revising-map');
});

test('prefer a NEW safe public corridor over repeated marching through familiar tiles',()=>{
  const s=scenario(null);
  s.belief.cells['4'].visits=7;
  s.belief.cells['0'].visits=6;
  const d=chooseMazeAction(s.state,s.observation,s.belief);
  assert.equal(d.targetCell,3,'equally short frontier with fewer actual revisits must win');
  assert.deepEqual(d.plannedPath,[5,6,7,3]);
  assert.deepEqual(d.action,{kind:'move',targetCell:6});
});
test('do not chase a distant imagined novelty over an actual nearby frontier',()=>{
  const s=scenario(null);
  s.belief.cells['4'].visits=7;
  s.belief.cells['0'].visits=6;
  // All these links are PUBLIC, but the newly discovered branch has become
  // at least three legal steps longer than the closest safe frontier.
  s.belief.cells['7'].neighbors=[6,8];
  for(const [id,neighbors] of [
    [8,[7,9]],[9,[8,10]],[10,[9,3]]
  ])s.belief.cells[String(id)]=cell(id,neighbors);
  const d=chooseMazeAction(s.state,s.observation,s.belief);
  assert.equal(d.targetCell,1,'two-step candidate cap protects ordinary route length');
  assert.deepEqual(d.action,{kind:'move',targetCell:4});
});
