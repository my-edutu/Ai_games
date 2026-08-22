# TARI — Applied Readiness Intelligence

TARI is an adapter, not a gameplay dependency.

## Local deterministic mode

- Introduces tasks from scenario data.
- Explains construction terms from a local glossary.
- Offers context-aware hints based on known evidence and current blockers.
- Tracks hint usage.
- Produces deterministic supervisor-style feedback from assessment evidence.

## Mock demo mode

Returns polished canned-but-state-aware responses for pitch reliability.

## External adapter contract

An optional server-side adapter may later call an LLM. Browser code must never contain secret keys. External failure falls back to local TARI without blocking progression.

## Evaluation boundary

The authoritative score is produced by deterministic rubric logic. External AI may enrich narrative explanation but cannot silently rewrite scored evidence.
