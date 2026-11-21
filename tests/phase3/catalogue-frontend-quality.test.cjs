'use strict';
const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');

const surfaces=[
  ['Autonomous Snake','public/snake-stream'],
  ['AI Maze Escape','public/ai-maze-escape',4],
  ['Infinite Tower Climb','public/infinite-tower-climb'],
  ['AI Ant Colony','public/ai-ant-colony'],
];

for(const [name,dir,revision=2] of surfaces){
  test(`${name} exposes the catalogue frontend quality contract`,()=>{
    const html=fs.readFileSync(path.join(dir,'index.html'),'utf8');
    const baseCss=fs.readFileSync(path.join(dir,'styles.css'),'utf8');
    const uxPath=path.join(dir,'ux-v2.css');
    assert.equal(fs.existsSync(uxPath),true,'game-specific UX layer exists');
    const css=baseCss+'\n'+fs.readFileSync(uxPath,'utf8');
    assert.match(html,new RegExp(`data-ux-revision="${revision}"`),'frontend revision marker');
    assert.match(html,/ux-v2\.css/,'frontend loads the UX layer');
    if(name==='AI Maze Escape') {
      assert.match(html,/gameplay-hud\.css/,'game-first visual layer is explicitly loaded');
      assert.equal(fs.existsSync(path.join(dir,'gameplay-hud.css')),true,'game-first visual layer exists');
      const server=fs.readFileSync('scripts/serve-maze-stream.cjs','utf8');
      assert.match(server,/['\"]gameplay-hud\.css['\"]/, 'maze stream explicitly serves the game-first visual layer');
    }
    assert.match(css,/--color-bg\s*:/,'semantic background token');
    assert.match(css,/--color-surface\s*:/,'semantic surface token');
    assert.match(css,/--color-progress\s*:/,'semantic progress token');
    assert.match(css,/--color-danger\s*:/,'semantic danger token');
    assert.match(css,/:focus-visible/,'keyboard focus treatment');
    assert.match(css,/@media\s*\(prefers-reduced-motion:\s*reduce\)/,'reduced-motion support');
    assert.match(css,/@media[^\{]*(max-width|max-height)/,'responsive compression rules');
  });
}
