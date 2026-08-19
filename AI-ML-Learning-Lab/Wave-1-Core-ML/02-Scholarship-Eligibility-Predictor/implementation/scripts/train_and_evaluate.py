from __future__ import annotations
from datetime import date
from pathlib import Path
import json
import joblib

from scholarship_eligibility.synthetic import generate_representative_applications
from scholarship_eligibility.dataset import temporal_split, build_snapshot
from scholarship_eligibility.model import train_candidates, select_model, evaluate_classifier
from scholarship_eligibility.robustness import fairness_report, predictive_feature_names
from scholarship_eligibility.pilot import run_representative_pilot

ROOT = Path(__file__).resolve().parents[1]

def main():
    df = generate_representative_applications(1800, seed=10)
    train, rest = temporal_split(df, date(2026, 7, 1))
    validation, test = temporal_split(rest, date(2026, 10, 1))
    snapshot = build_snapshot(df)
    candidates = train_candidates(train)
    selected_name, selected = select_model(candidates, validation)
    baseline = candidates['logistic']
    benchmark = {
        'representative_only': True,
        'dataset_snapshot_hash': snapshot.snapshot_hash,
        'rows': snapshot.row_count,
        'train_rows': len(train), 'validation_rows': len(validation), 'test_rows': len(test),
        'selected_model': selected_name,
        'selected_threshold': selected.decision_threshold,
        'baseline': evaluate_classifier(baseline, test),
        'selected': evaluate_classifier(selected, test),
        'fairness_by_region': fairness_report(selected, test, 'region'),
        'predictive_features': predictive_feature_names(),
        'note': 'Deterministic representative benchmark; not real-world acceptance evidence.',
    }
    ROOT.joinpath('reports').mkdir(exist_ok=True)
    ROOT.joinpath('models').mkdir(exist_ok=True)
    ROOT.joinpath('evidence').mkdir(exist_ok=True)
    ROOT.joinpath('reports/BENCHMARK.json').write_text(json.dumps(benchmark, indent=2, sort_keys=True), encoding='utf-8')
    pilot = run_representative_pilot(seed=9)
    ROOT.joinpath('evidence/PILOT_REPORT.json').write_text(json.dumps(pilot, indent=2, sort_keys=True), encoding='utf-8')
    joblib.dump(selected, ROOT/'models/suitability.joblib')
    print(json.dumps(benchmark, indent=2, sort_keys=True))

if __name__ == '__main__':
    main()
