# Viewer Interaction — AI vs 1,000 Floors

## Viewer roles

- **Strategist:** votes among game-generated legal routes/modules.
- **Supporter:** schedules bounded resource or information opportunities.
- **Challenger:** schedules a telegraphed, capped future complication.
- **Spectator:** follows public tally, consequence and cooldown.

The audience matters without owning the result.

## Initial effect catalogue

| Effect | Class | Bounded consequence |
|---|---|---|
| `route-scan` | information | reveals one eligible route feature |
| `supply-cache` | support | schedules one modest cache at a safe future anchor |
| `hazard-pulse` | challenge | adds one telegraphed non-terminal hazard pattern |
| `elite-contract` | trade-off | upgrades one eligible encounter and its reward |
| `sector-theme` | presentation | changes presentation theme only |
| `module-choice` | vote | selects among game-generated legal module options |

## Eligibility pipeline

Authenticate where applicable → normalize provider payload outside game → validate schema/size → tokenize identity → entitlement and policy → moderation → rate/idempotency → game-state eligibility → cooldown/conflict/intensity → durable schedule → acknowledgement.

## Invariants

- raw provider payloads and exact payment data never enter game state;
- duplicate, delayed, reordered or retried input applies at most once;
- paid and free requests share safety and cannot guarantee victory/death/record/survival;
- fixed-choice interaction works with moderation service unavailable;
- raw names/text never reach public render snapshots;
- votes use logical ticks and named RNG tie-breaks;
- consequence is visible before a competing window opens;
- queue, per-user, per-run and global caps are finite;
- provider outage leaves autonomous play complete.

## Chat vs AI

Eligible challenge effects contribute a visible pressure level from 0–5. Pressure is a summary of already scheduled bounded effects, not a hidden difficulty multiplier. It decays after consequence and cannot create unavoidable spawn damage or revise resolved outcomes.

## Status

Phase 4 implements and verifies this contract. Phase 1 contains only an inert serializable influence state so the authority schema has an explicit future boundary.
