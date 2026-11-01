'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const surfaces=[
  ['Autonomous Snake','public/snake-stream',2],
  ['AI Maze Escape','public/ai-maze-escape',2],
  ['Infinite Tower Climb','public/infinite-tower-climb',3],
  ['AI Ant Colony','public/ai-ant-colony',2],
];

for(const [name,dir,expectedRevision] of surfaces){
  test(`${name} exposes the catalogue frontend quality contract`,()=>{
    const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
    const baseCss=fs.readFileSync(path.join(dir,'styles.css'),'utf8');
    const uxPath=path.join(dir,'ux-v2.css');
    assert.equal(fs.existsSync(uxPath),true,'game-specific UX layer exists');
    const css=baseCss+'\n'+fs.readFileSync(uxPath,'utf8');
    assert.match(html,new RegExp(`data-ux-revision="${expectedRevision}"`),`frontend revision marker v${expectedRevision}`);
    assert.match(html,/ux-v2\.css/,'frontend loads the UX layer');
    assert.match(css,/--color-bg\s*:/,'semantic background token');
    assert.match(css,/--color-surface\s*:/,'semantic surface token');
    assert.match(css,/--color-progress\s*:/,'semantic progress token');
    assert.match(css,/--color-danger\s*:/,'semantic danger token');
    assert.match(css,/:focus-visible/,'keyboard focus treatment');
    assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/,'reduced-motion support');
    assert.match(css,/@media[^\{]*(max-width|max-height)/,'responsive compression rules');
  });
}
