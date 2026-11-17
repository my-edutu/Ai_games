// P0 actual-geometry gateway clearance. The original 390x844 1x source-
// pinned tick479 camera ray (11.62,4.14,44.28) -> real opened-gate centre
// (7.107,0.4,23.185) struck the non-colliding OUTER GuardianGateInset
// masonry post at (8.02,1.15,27.44), even after the separate inner stone
// sill was split. The lip ray struck the SAME original post at y2.11.
// Preserve its masonry load path but set the radial OUTER post back along
// the gate's tangential/transmission axis, so it no longer hides the source
// gateway from an exterior camera. The other, INNER pier stays in place.
// All numbers are 3D visual metres, never source centimetres/physics.
// The guardian's real HP/locked state and the floor collider remain intact.
export function originalGuardianGatewayClearSightlineFrame() {
  const outer={side:-1,x:-4.15,z:-3.3};
  const inner={side:1,x:4.15,z:-.42};
  // The outboard upper shoulder tie physically reconnects the recessed
  // post to the ORIGINAL overhead crowned beam. It remains above the
  // current 5m source crossing, not a second floor or decorative roof.
  return Object.freeze({
    piers:Object.freeze([Object.freeze(outer),Object.freeze(inner)]),
    upperOuterTie:Object.freeze({x:outer.x,y:5.34,z:-1.87,
      width:.34,height:.20,depth:3.0}),
    crown:Object.freeze({x:0,y:5.34,z:-.44,width:8.65,height:.22,depth:.46})
  });
}
