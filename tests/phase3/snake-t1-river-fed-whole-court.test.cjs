'use strict';
const {test}=require('node:test'),assert=require('node:assert/strict');

test('T1 all ten full-court root terraces physically attach to authentic living 3D riparian banks, rather than floating painted islands',async()=>{
  const THREE=await import('three');
  const {createCourtyardEcology,sculptRiparianBank}=await import('../../public/snake-stream/courtyard-ecology.mjs');
  for(const [width,height] of [[8,8],[28,16],[40,24]]){
    const stage=createCourtyardEcology(THREE,{width,height});
    try{
      const state=stage.stats();
      assert.equal(state.meshCount,1);assert.equal(state.textures,0);
      assert.equal(state.publicCellsMoved,0);
      assert.equal(state.mosaicBedCount,10);
      assert.equal(state.mosaicConnections?.length,20,'two physical shoreline branches per original site');
      const geometry=stage.group.children[0].geometry.getAttribute('position');
      const start=3*(state.braidedSurfaceTriangles+state.islandSurfaceTriangles);
      const count=state.reclaimedMosaicTriangles*3;
      for(const connection of state.mosaicConnections){
        assert.ok(Number.isInteger(connection.channel)&&connection.channel>=0&&connection.channel<=2);
        const p=connection.bankAnchor,q=connection.groveEnd;
        assert.ok(p.every(Number.isFinite)&&q.every(Number.isFinite));
        const progress=(p[0]+width/2-.86)/(width-1.72);
        assert.ok(progress>=0&&progress<=1,'source backed stream x range');
        const bank=sculptRiparianBank(p[0],connection.channel,width,height,progress);
        assert.ok(Math.abs(p[2]-bank.centre)<=bank.widthAt*.55+.025,
          'branch begins inside real preexisting 3D riverbed, not at a fake texture point');
        const realRiverCrown=.01125+.00935*.96*(.78+.22*bank.oxbow)
          +.00022*Math.sin(p[0]*.65+p[2]*.45);
        assert.ok(Math.abs(p[1]-realRiverCrown)<.0015,
          'actual 3D bank-root junction must meet the native planted crown, not hide beneath it');
        assert.ok(Math.hypot(p[0]-q[0],p[2]-q[2])>.30,
          'each tributary has physical extension toward an exterior forest sector');
        for(const pt of [p,q]){
          assert.ok(Math.abs(pt[0])<=width/2-.68&&Math.abs(pt[2])<=height/2-.68);
          assert.ok(pt[1]>=.011&&pt[1]<=.021,'actual habitat below public collision/cue clearance');
          const u=pt[0]/Math.max(.45,width*.16),v=pt[2]/Math.max(.45,height*.20);
          assert.ok(u*u+v*v>=1,'central garden marker remains uncovered');
          let matched=false;
          for(let i=start;i<start+count;i++){
            if(Math.hypot(geometry.getX(i)-pt[0],geometry.getZ(i)-pt[2])<.0001&&
               Math.abs(geometry.getY(i)-pt[1])<.0001){matched=true;break;}
          }
          assert.ok(matched,'both actual endpoints must be present in submitted 3D mesh');
        }
      }
      assert.ok(state.triangles<3100,'same original native world budget');
    }finally{stage.dispose();}
  }
});
