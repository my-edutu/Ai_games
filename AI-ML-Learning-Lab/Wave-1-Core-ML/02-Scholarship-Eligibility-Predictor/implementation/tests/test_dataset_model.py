from datetime import date

from scholarship_eligibility.dataset import build_snapshot, temporal_split
from scholarship_eligibility.synthetic import generate_representative_applications
from scholarship_eligibility.model import train_candidates, select_model, evaluate_classifier


def test_dataset_snapshot_is_deterministic_and_reports_quality():
    df = generate_representative_applications(n=240, seed=12)
    first = build_snapshot(df)
    second = build_snapshot(df.copy())
    assert first.snapshot_hash == second.snapshot_hash
    assert first.row_count == 240
    assert first.invalid_rows == 0
    assert 'label_positive_rate' in first.quality


def test_temporal_split_keeps_future_out_of_training():
    df = generate_representative_applications(n=200, seed=4)
    train, test = temporal_split(df, cutoff=date(2026, 5, 1))
    assert train['application_date'].max().date() < date(2026, 5, 1)
    assert test['application_date'].min().date() >= date(2026, 5, 1)


def test_selected_calibrated_model_improves_pr_auc_without_worse_brier():
    df = generate_representative_applications(n=1000, seed=21)
    train, test = temporal_split(df, cutoff=date(2026, 8, 1))
    candidates = train_candidates(train)
    baseline = candidates['logistic']
    selected_name, selected = select_model(candidates, test)
    baseline_metrics = evaluate_classifier(baseline, test)
    selected_metrics = evaluate_classifier(selected, test)
    assert selected_name in {'calibrated_interaction', 'calibrated_gbdt'}
    assert selected_metrics['pr_auc'] >= baseline_metrics['pr_auc'] + 0.03
    assert selected_metrics['brier'] <= baseline_metrics['brier'] + 0.01


def test_selected_model_does_not_degrade_low_gpa_high_need_recall():
    df = generate_representative_applications(n=1200, seed=7)
    train, test = temporal_split(df, cutoff=date(2026, 8, 1))
    candidates = train_candidates(train)
    baseline = candidates['logistic']
    _, selected = select_model(candidates, test)
    cohort = test[(test['gpa_4'] < 3.2) & (test['financial_need_score'] > 0.7)]
    b = evaluate_classifier(baseline, cohort)
    s = evaluate_classifier(selected, cohort)
    assert s['recall'] >= b['recall'] - 0.03
