# Tower PR68 — source-observed alternative ascent and recovery decision

**Initiative:** Existing continuous 3D ascent → genuine AI decisions → survival/recovery → guardian lock → witnessed outcome/restart.  
**Frozen before:** `1731b380851162741761c5569e2bc152a0869ca9` (unchanged).  
**Gameplay change:** `4c8c7ddd950b9b61edc94d040d0835abefc38c53` on draft PR #68.  
**Experience quality:** **NOT EVALUATED**; 0/5 blind judges for each of LOOKS, FEELS and PLAYS.

## Cross-system experience problem

The tactical climber inherited a traversal graph that sorted all reachable next decks by height and always took the first. When a visible hazard or living enemy currently occupied its landing area, the agent might continue pursuing that same deck; its existing 3D route stones and camera would faithfully reinforce the unsafe plan. Also, a wounded climber did not prefer a reachable health-containing alternate ascent. The improvement must arise from real autonomous choices in the game, not another cosmetic screen cue.

## Integrated source change

- Retain the old `nextTowerPlatform` unchanged for historical policy and replay; tactical-v2 gains `nextTowerTacticalPlatform`.
- Inspect only **present observable** platform graph, active spike envelopes, active enemy body colliders and health pickups; no hidden future floor, future hazard phases or patrol prediction.
- When the first visible deck has no body-clear landing, take a real graph-connected alternative that remains viable toward this floor's observed cap (if one exists). When there is no safe alternative, retain the original physical choice rather than promising rescue.
- Keep an already selected safe alternate committed while temporary spike phases change, preventing oscillating routes. Critically wounded climbers may prefer a real unblocked health deck while ordinary ascent preserves the familiar first safe option.
- Existing 3D route-stone batch, target-platform composition and minimal HUD naturally follow the **actual chosen** target ID. No new HUD text, rendering passes, physics impulses, seeds, replay fields or collision rules.
- Five adversarial source-observation tests cover ordinary replay-compatible routing, live/inactive spike walls, living/dead/remote enemies, authentic health detours and fully blocked graph fallbacks.

## Safety and experience evidence

Previous-head `1d58917` [technical workflow 41629137034](https://github.com/my-edutu/Ai_games/actions/runs/41629137034) **PASS**. The current 4c8c7ddd [technical workflow 41636620488](https://github.com/my-edutu/Ai_games/actions/runs/41636620488) and [real-game capture workflow 41636620319](https://github.com/my-edutu/Ai_games/actions/runs/41636620319) were **in progress at inspection**, not claimed passing. The preceding source 2f1465 [real game workflow 41628386839](https://github.com/my-edutu/Ai_games/actions/runs/41628386839) completed nine source-pinned recording jobs; their gameplay source predates these autonomous choices.

**Independent worker/browser:** connector returned disconnected tunnel-client; cannot fabricate blind judges or watch full-motion files here. **Hardware:** no supported device p50/p95/p99, memory or final accessibility/replay/recovery evidence. **Gameplay critique:** test a source-observed fork with an active deck-wide hazard, a living guardian near a cap, a wounded health-collecting detour and a real outcome/restart on desktop and phone; detect regression in AI dead ends, oscillation or camera-hidden routes. Capture >=60 seconds per scenario with matched settings and source-event anchors before grading.

**Rollback:** Revert only the tactical-v2 route selector invocation and helper commit if campaign or full-motion evidence shows dead ends or regression; leave PR58 and frozen baseline untouched. Never merge/deploy or mark the quality initiative complete from CI alone.
