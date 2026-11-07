'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const { pathToFileURL } = require('node:url');
const path = require('node:path');
const file = pathToFileURL(path.resolve(__dirname,
  '../../public/infinite-tower-climb/visuals/landing-shot-span.mjs')).href;
const source = () => ({lifecycle:'running',tick:87,
  player:{state:'airborne',health:75,halfWidth:9000},
  intent:{targetPlatformId:'f8:cap',mode:'air-control',
    summary:'Steering for a clear landing lane'}});
const cap = {id:'f8:cap',x:30000,width:280000};

test('real declared airborne landing narrows only a wide deck camera bound', async () => {
  const {observedLandingShotSpan:f} = await import(file);
  const span=f(source(),cap,95000);
  assert.equal(span.x,95000);
  assert.equal(span.sourceTick,87);
  assert.ok(span.left>=cap.x && span.left<=span.x);
  assert.ok(span.right<=cap.x+cap.width && span.right>=span.x);
  assert.ok(span.right-span.left<120000,
    'actual local braking area should not force a 280k-wide panorama');
});

test('real edge arrival remains inside the physical deck', async () => {
  const {observedLandingShotSpan:f}=await import(file);
  const span=f(source(),cap,31500);
  assert.equal(span.left,cap.x);
  assert.ok(span.right>span.x && span.right<=cap.x+cap.width);
});

test('short decks and unknown intent keep the original entire platform shot', async () => {
  const {observedLandingShotSpan:f}=await import(file);
  assert.equal(f(source(),{...cap,width:60000},50000),null);
  const unknown=source();unknown.intent.summary='Avoiding an unclear route';
  assert.equal(f(unknown,cap,95000),null);
  unknown.intent.mode=234;
  assert.equal(f(unknown,cap,95000),null);
});

test('does not fabricate a route from grounded, stale, or wrong-target source', async () => {
  const {observedLandingShotSpan:f}=await import(file);
  const standing=source();standing.player.state='standing';
  assert.equal(f(standing,cap,95000),null);
  const stale=source();stale.stale=true;
  assert.equal(f(stale,cap,95000),null);
  const changed=source();changed.intent.targetPlatformId='f8:p3';
  assert.equal(f(changed,cap,95000),null);
  assert.equal(f(source(),cap,500000),null);
});

test('observed pilot brake and oracle safe-lane route preserve the same window', async () => {
  const {observedLandingShotSpan:f}=await import(file);
  const brake=source();brake.intent.mode='settling-landing';
  brake.intent.summary='Braking into a clear landing lane';
  const oracle=source();oracle.intent.mode='oracle-air-control';
  assert.ok(f(brake,cap,95000));
  assert.ok(f(oracle,cap,95000));
});
