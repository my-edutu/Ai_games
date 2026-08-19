# Career Skills Gap Analyser — Implementation

An evidence-aware role skill-gap service that separates observed evidence, inferred evidence and unknowns. Missing resume text is never treated as proof that a skill is absent.

## Run
```bash
python -m pip install -e '.[dev]'
pytest -q
python scripts/generate_evidence.py
```

Core modules: versioned ontology, evidence extraction, gap analysis, learning prioritization, conservative semantic matching, FastAPI serving, independent version registries/rollback, drift diagnostics, append-only audit and release evidence gates.

The included benchmark/pilot use deterministic representative fixtures and are not real-world impact evidence.
