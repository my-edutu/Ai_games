# AI Dungeon Phase 2 Evidence

Reviewed on 2026-08-17.

## Automated evidence

- Strict build: pass.
- Focused Node suites: 18 passed, 0 failed.
- Same-seed campaigns: exact checksum equality.
- Entity, relic, memory, path-search and event collections remained within configured caps.
- Enemy and boss actions resolve in stable ID order and communicate telegraphs before high-impact attacks.
- Zero-audience mode is complete; no provider or model service is required.

## Campaign evidence

A 50-seed campaign ran up to 12,000 logical ticks per seed:

- cleared at least one floor: 50 / 50;
- reached a chapter boss: 50 / 50;
- total bosses defeated: 338;
- terminal runs: 6 (5 hero-fallen, 1 timer-expired);
- minimum / median / maximum floor: 5 / 35 / 35;
- maximum AI fallback count: 16.

The pre-fix campaign reached a maximum of 1,817 fallbacks. The corrected reachable-frontier policy and regression seed demonstrate the review loop rather than hiding the initial failure.

## Review disposition

Closed P1 findings:

1. remove transient RNG handles from serializable authority;
2. stop the policy mutating authoritative state;
3. replace disconnected Manhattan frontier choice with bounded reachable-frontier search.

No production, provider, browser, endurance or canary evidence is claimed by this bundle.