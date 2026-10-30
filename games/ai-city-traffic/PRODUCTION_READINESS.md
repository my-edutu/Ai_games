# Production readiness

**Current status: development implementation. Production-ready: false. Commercial benchmark: REFERENCE LEADS.**

## Required evidence before promotion

- [ ] Independent simulation and integrated-game reviews have no unresolved important findings.
- [x] Actual Cities: Skylines II screenshots are pinned with provenance and have been directly compared to iteration-2 captures; framing and still-image limitations are recorded.
- [ ] Representative reference footage and real animation/audio comparisons support claims beyond still-image fidelity.
- [ ] Aerial, street, night and mobile captures meet the fixed bar.
- [ ] Target desktop/mobile hardware meets declared frame-time, input latency, memory and thermal budgets.
- [ ] Representative long-duration runs demonstrate bounded resources, continuous valid traffic and honest metrics across the required seed/demand corpus.
- [ ] Renderer/context/audio/recovery failure drills pass on target capture hosts.
- [ ] Accessibility and mobile legibility are checked with real users, including reduced motion and muted audio.
- [ ] Any introduced audience/provider layer passes authentication, moderation, replay, rate-limit, privacy and failure-degradation gates.
- [ ] Deployment ownership, monitoring, canary duration and rollback are rehearsed and independently witnessed.

A completed code implementation, green tests, a visually improved screenshot or a merged PR cannot close these gates by itself. The live journal identifies what has actually been observed. The lead owns unresolved development/review gaps; deployment operators own future provider and host evidence.
