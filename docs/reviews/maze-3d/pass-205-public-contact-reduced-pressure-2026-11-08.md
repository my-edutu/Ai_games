# Pass205 — prevent false reduced-motion pressure activation (2026-11-08 UTC)

**Scope:** existing open DRAFT PR #53 `feat/maze-3d-gauntlet`. Fixed official *Captain Toad: Treasure Tracker* visual bar remains **NOT MET**.

## Current-HEAD source diagnosis

The published Tide-Shear mechanism's five reduced-motion transform branches were gated by `reduced && visible` rather than current physical contact. Consequently any **visible but distant** pressure tile appeared partly actuated: both relays, ivory shutters, raised piston, diaphragms and jaws showed the same contact pose even though Pip had not approached. This is a misleading physical puzzle signal. The previous Pass202 three-beat clock also superseded the old instant-open jaw behavior, while an older installed-Three test still asserted instant full-opening. Latest exact-HEAD WebGL and whole-repo workflow runs from Pass204 were still **queued** at inspection; no newer native image is available.

## Source change and strict tests

Recompute one `reducedContact` state from the **same currently visible, nonterminal, near-contact public pressure condition** as the normal mechanism. Retain a static readable pose on genuine one-cell approach, but keep visible-distant, diagonal, withdrawn, remembered-only and terminal pressure mechanisms fully closed. Share this same per-frame state across the existing relays, shutters, carriage, diaphragms and jaw hinges. No geometry, materials, allocation, authoritative hazard damage, AI, hidden maze data, navigation, camera, HUD or audio changes.

Added an installed-production-Three regression that checks every real articulated joint at far, diagonal, near, retreat, hidden, terminal and reset in reduced-motion mode, preserving GPU budgets and source snapshot immutability. Updated the older jaw test to require **first warning → partial opening → completed opening**, with the original stronger >.60 full-stroke assertion retained rather than silently accepting the superseded instantaneous animation.

## Evidence and acceptance

Source authored through the GitHub connector after a disconnected approved coding-workspace attempt. **No installed Node/Three tests, Playwright, browser video, fresh-context critic or exact-HEAD PNG hash verification occurred on this new commit.** Existing queued workflow runs are not a verdict. Strict <100 and spread≤8 geometries, ±0.95 NDC envelopes, withdrawal≥0.70, 44px controls, privacy and accessibility gates remain unchanged. Before any visual win, demand real new-HEAD 320/390/844/1280 WebGL and completed pressure chronology with immutable SHA-checked full frames and independent Nintendo comparison. Next biggest visual gap remains the crowded masonry and the unverified Pass204 paired-camera composition.

**Do not merge, deploy, force-push or pause the existing hourly Gauntlet.**
