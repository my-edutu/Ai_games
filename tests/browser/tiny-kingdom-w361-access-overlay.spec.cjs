'use strict';
const {test,expect}=require('@playwright/test');
const fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.resolve(__dirname,'../../public/tiny-kingdom/index.html'),'utf8');
const match=html.match(/function planGroundAccessOverlayPaint\\([\\s\\S]*?\\n\\}/);
if(!match)throw Error('W361 retained real access-overlay painter missing');
const plan=Function('return ('+match[0]+')')();
test('W361 real home streets preserve safe old pixels on append-only growth',()=>{
 const a={path:[[0,0],[1,1],[2,2]]};
 const b={path:[[2,2],[3,3],[4,4]]};
 const c={path:[[3,3],[4,4],[5,5]]};
 const previous=new Map([['a',a],['b',b]]);
 const added=new Map([...previous,['c',c]]);
 const append=plan(['a','b'],['a','b','c'],previous,added);
 expect(append.mode).toBe('append');
 expect(append.drawKeys).toEqual(['c']);
 expect(append.preservedRoutes).toBe(2);
 expect(append.authorityModified).toBe(false);
 const blocked=plan(['a','b'],['a','b','c'],previous,
  new Map([['a',c],['b',b],['c',c]]));
 expect(blocked.mode).toBe('full');
 expect(blocked.drawKeys).toEqual(['a','b','c']);
 const restored=plan(['a','b'],['b','a','c'],previous,added);
 expect(restored.mode).toBe('full');
 const removed=plan(['a','b'],['a','b','c'],previous,
  new Map([['b',b],['c',c]]));
 expect(removed.mode).toBe('full');
 const gaining=plan(['a','b'],['a','b','c'],
  new Map([['a',a]]),added);
 expect(gaining.mode).toBe('append');
 expect(gaining.drawKeys).toEqual(['b','c']);
 const first=plan([],['a','b'],new Map(),previous);
 expect(first.mode).toBe('full');
 expect(first.drawKeys).toEqual(['a','b']);
});
test('W361 genuine GPU atlas source retains capacity and physical validation',()=>{
 expect(html).toContain('planGroundAccessOverlayPaint(');
 expect(html).toContain('validResidentAccessPath(previous,walkable,clearSegment)');
 expect(html).toContain('groundAtlasAccessPathsPreserved');
 expect(html).toContain('groundAtlasGpuPartialUploads');
 expect(html).toContain('groundAtlasHomeRoadKey!==civicActiveKey');
 expect(html).toContain('groundAtlasAccessRoutes=validRoutes');
});
