'use strict';
const {test}=require('node:test');
const assert=require('node:assert/strict');
const path=require('node:path');
const {pathToFileURL}=require('node:url');
const load=()=>import(pathToFileURL(path.resolve(__dirname,
 '../../public/ai-dungeon/original-combat-foley.js')).href);

test('explicit opt-in and mute stay truthful within the page without storage',async()=>{
 const {createCombatMutePreference}=await load();
 const pref=createCombatMutePreference(null);
 assert.equal(pref.read(),true,'fresh page defaults to mute');
 assert.equal(pref.write(false),false);
 assert.equal(pref.read(),false,'user did turn sound on');
 assert.equal(pref.write(true),true);
 assert.equal(pref.read(),true,'manual mute takes effect');
});

test('storage permission errors degrade to volatile preference without throwing',async()=>{
 const {createCombatMutePreference}=await load();
 const blocked={getItem(){throw Error('blocked')},setItem(){throw Error('quota')}};
 const pref=createCombatMutePreference(blocked);
 assert.equal(pref.read(),true);
 assert.equal(pref.write(false),false);
 assert.equal(pref.read(),false);
 assert.equal(pref.write(true),true);
 assert.equal(pref.read(),true);
});

test('valid persisted preference takes precedence over volatile fallback on a fresh page',async()=>{
 const {createCombatMutePreference,COMBAT_MUTE_PREFERENCE_KEY}=await load();
 const memory=new Map([[COMBAT_MUTE_PREFERENCE_KEY,'false']]);
 const storage={getItem:k=>memory.get(k)??null,setItem:(k,v)=>memory.set(k,v)};
 const pref=createCombatMutePreference(storage);
 assert.equal(pref.read(),false,'remember preference, do not auto-start synthesis');
 pref.write(true);
 assert.equal(memory.get(COMBAT_MUTE_PREFERENCE_KEY),'true');
 memory.set(COMBAT_MUTE_PREFERENCE_KEY,'false');
 assert.equal(pref.read(),false,'reflect external preference change');
});
