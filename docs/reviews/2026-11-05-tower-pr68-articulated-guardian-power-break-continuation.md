# Tower PR #68 — source-defeated guardian silhouette and severed power conduit

## Initiative (still OPEN, not a micro-patch verdict)
This is a connected continuation of the same real 3D guardian/crusher/bolt combat → visible defeated armor → physical bronze doorway → floor-nine continuation → real outcome/restart initiative. Frozen comparison baseline **1731b380851162741761c5569e2bc152a0869ca9** remains unchanged; PR #58 remains untouched.

## Playable scene and cause/effect
At the real defeated source position, twelve previously uniform generic blocks have been posed into an original rigid armored guardian silhouette: crest/helmet, chest/waist, two shoulder guards, two articulated arms, thighs and heavy boots. Their deterministic settling makes the entire recognizable boss fall during the same real combat floor before the player reaches its already-earned exit.

One eight-segment source-anchored light conduit now visually links the deceased guardian body to the observed bronze cap lock and disconnects progressively toward the gate. This helps communicate that defeating *this physical opponent* opened *that real doorway* without a HUD explanation. Existing cap/guardian body anchors, ongoing camera and leaf animations provide the real cause/effect framing. A short opt-in original sawtooth discharge accompanies only the observed active→inactive same-floor guardian state, within the existing mute and context lifecycle. No asset copies.

The short-lived link shares existing box geometry and glow material (one additional instanced draw, eight instances), owns no collider or authoritative state, and creates no new lights/shadows/materials/geometry. Inputs remain immutable. The old source contact/guardian/shutter AI and fixed-step authoritative replay are unchanged. Non-running or stale snapshots do not invent passage; reduced-motion shows the final motionless armor and suppresses the animated link; restart and graphics restoration follow existing dispose/clear ownership.

**Source implementation:** https://github.com/my-edutu/Ai_games/commit/6e7a771745e6996fb68e5e71d98d4a4f0954ee17.

## Verification and quality
Added a focused genuine-source geometry/animation/stale/cleanup contract. Existing phase3 contract now accepts the additional draw. Changed the optional discharge sound on a real same-floor defeat, not on speculative guardian contact.

The complete original-host nine-job desktop/portrait WebM run https://github.com/my-edutu/Ai_games/actions/runs/42070503927 succeeded, but captured **previous** candidate source 087ef572904467362db715fbb103c03619d5fab3, not this change. It is not A/B proof. Local browser, worker and terminal were inaccessible with NOT_FOUND tunnel client disconnected. Exact-head CI/source capture and independent complete normal-speed full-motion evaluation are outstanding; no hardware frame-time percentiles or memory. **LOOKS/FEELS/PLAYS votes remain 0/5 each, status NOT EVALUATED**. CI may veto but never award a quality PASS.

**Next:** inspect event-matched source gameplay 60s+ each across ordinary ascent, guardian/crusher danger and full outcome/restart at both 960×600 and 390×844. Preserve seed/tier/motion settings and frozen build. Separate five fresh blind critics, randomized A/B, >=4/5 candidate votes in EACH pillar, plus device p50/p95/p99 and memory. Roll back via reverting this source commit if source safety tests fail; do not merge/deploy/force-push.
