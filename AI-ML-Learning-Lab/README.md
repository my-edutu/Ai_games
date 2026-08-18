# AI/ML Learning Lab

A 20-project, build-and-learn AI/ML curriculum embedded inside the `my-edutu/Ai_games` repository.

The goal is not to collect toy notebooks. Every project is structured as a production-minded learning journey: understand the problem, govern the data, build a baseline, train and evaluate models, test robustness and fairness, expose the model through a usable interface, add monitoring, run a pilot, and complete a production-readiness review.

## How to use this lab

Each project contains:

- `README.md` — project mission, expected outcome, suggested stack, success criteria, and final deliverable.
- `PHASES/01...10.md` — ten implementation phases. Complete them in order; do not advance while the current phase's exit criteria are unmet.
- `TEACHING/README.md` — what to learn while building.
- `TEACHING/CURRICULUM.md` — concepts, exercises, checkpoints, and evidence to retain.

## Standard 10-phase build loop

1. Problem Discovery and Safety Contract
2. Data Contract and Governance
3. Data Pipeline and Exploration
4. Baseline and Evaluation Harness
5. Model Development and Experimentation
6. Robustness, Fairness, and Explainability
7. Serving and Product Integration
8. MLOps, Monitoring, and Retraining
9. Pilot, Human Review, and Impact Validation
10. Production Readiness and Handover

## Waves

### Wave 1 — Core ML
Projects 01, 02, 03, 09, 13, 18. Learn supervised learning, ranking, classification, regression, forecasting, calibration, evaluation, data leakage prevention, and practical ML engineering.

### Wave 2 — NLP and Document AI
Projects 04, 05, 07, 19. Learn embeddings, text classification, retrieval, document extraction, multilingual NLP, fraud signals, evaluation, and human review.

### Wave 3 — Vision and Geospatial AI
Projects 15, 16, 17. Learn computer vision, transfer learning, geospatial features, time-series/environmental signals, uncertainty, mapping, and field validation.

### Wave 4 — Advanced AI
Projects 06, 08, 10, 11, 12, 14, 20. Learn speech, multimodal systems, ranking/matching, forecasting, high-stakes decision support, simulation, human-in-the-loop design, safety, and production governance.

## Completion rule

A phase is complete only when its required artifacts exist, its tests/checks pass, and the learner can explain the main design decisions. A project is complete only when all ten phases are complete and the final model/system has reproducible evidence, documented limitations, monitoring, rollback/recovery guidance, and a clear human-oversight policy where appropriate.

> Important: The guides are implementation plans and teaching material. They do not claim that the trained models are already production-ready. Production evidence must be earned during implementation.