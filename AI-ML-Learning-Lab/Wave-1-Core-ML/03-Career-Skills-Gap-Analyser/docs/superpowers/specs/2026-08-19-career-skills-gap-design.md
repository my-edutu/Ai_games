# Career Skills Gap Analyser — Design

## Goal
Build an explainable service that compares demonstrated skills with target-role requirements, distinguishes observed/inferred/unknown evidence, and prioritizes learning without treating absent resume text as proof of absence.

## Architecture
1. Versioned skill ontology with canonical skills, aliases, categories and prerequisite relations.
2. Evidence extraction that records source text, evidence state (`observed`, `inferred`, `unknown`) and confidence.
3. Versioned role profiles containing required/preferred skills and proficiency targets.
4. Gap analysis that never collapses `unknown` into `missing` and returns traceable evidence.
5. Learning-priority engine using role importance, proficiency gap, prerequisites, effort and uncertainty.
6. Transparent lexical/taxonomy baseline, then an embedding-style semantic matcher only when benchmark gains survive robustness checks.
7. Typed FastAPI output with ontology/role/model versions and human-readable explanations.
8. Fairness and robustness checks for sparse profiles, aliases, unseen terms, career changers and protected-attribute exclusion.
9. Independent ontology/model registries, drift monitoring, audit logging and rollback.
10. Representative pilot plus model/data/ontology cards, runbook, SLOs, security/privacy, limitations and release gate.

## Safety constraints
- Do not infer competence from demographic or other protected proxies.
- Missing evidence means `unknown`, not `absent`.
- Inferred evidence must be labelled and lower-confidence than directly observed evidence.
- Recommendations are learning priorities, not guarantees of employability.
- Real-world impact claims require genuine user evidence; synthetic/representative pilots are labelled as such.
