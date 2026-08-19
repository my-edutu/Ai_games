from __future__ import annotations
from dataclasses import dataclass
import numpy as np
import pandas as pd
from sklearn.linear_model import LogisticRegression
from sklearn.ensemble import HistGradientBoostingClassifier
from sklearn.calibration import CalibratedClassifierCV
from sklearn.metrics import average_precision_score, brier_score_loss, precision_score, recall_score, roc_auc_score, f1_score
from sklearn.pipeline import make_pipeline
from sklearn.preprocessing import StandardScaler, PolynomialFeatures
from .synthetic import FEATURES

@dataclass
class SuitabilityModel:
    estimator: object
    name: str
    decision_threshold: float = .5
    version: str = '2026.1'

    def predict_proba(self, X):
        return self.estimator.predict_proba(X)


def _xy(df: pd.DataFrame):
    return df[FEATURES], df['label'].to_numpy()

def train_candidates(train: pd.DataFrame):
    X, y = _xy(train)
    logistic_est = make_pipeline(StandardScaler(), LogisticRegression(max_iter=2000, class_weight='balanced', random_state=0))
    logistic_est.fit(X, y)
    interaction_base = make_pipeline(
        PolynomialFeatures(degree=4, include_bias=False),
        StandardScaler(),
        LogisticRegression(max_iter=7000, class_weight='balanced', C=.2, random_state=0),
    )
    interaction_est = CalibratedClassifierCV(interaction_base, method='sigmoid', cv=4)
    interaction_est.fit(X, y)
    tree_base = HistGradientBoostingClassifier(max_iter=160, learning_rate=.06, max_leaf_nodes=15, l2_regularization=1.0, random_state=0)
    tree_est = CalibratedClassifierCV(tree_base, method='sigmoid', cv=4)
    tree_est.fit(X, y)
    return {
        'logistic': SuitabilityModel(logistic_est, 'logistic', .5, 'baseline-1'),
        'calibrated_interaction': SuitabilityModel(interaction_est, 'calibrated_interaction', .5, 'interaction-1'),
        'calibrated_gbdt': SuitabilityModel(tree_est, 'calibrated_gbdt', .5, 'gbdt-1'),
    }

def evaluate_classifier(model, df: pd.DataFrame, threshold: float | None = None) -> dict[str,float]:
    if len(df) == 0:
        return {'pr_auc':0.0,'roc_auc':0.0,'brier':1.0,'precision':0.0,'recall':0.0,'positive_rate':0.0,'threshold':float(threshold or .5)}
    X, y = _xy(df)
    p = model.predict_proba(X)[:,1]
    threshold = model.decision_threshold if threshold is None and hasattr(model, 'decision_threshold') else (.5 if threshold is None else threshold)
    pred = (p >= threshold).astype(int)
    roc = roc_auc_score(y,p) if len(np.unique(y)) > 1 else .5
    pr = average_precision_score(y,p) if y.sum() else 0.0
    return {
        'pr_auc':float(pr), 'roc_auc':float(roc), 'brier':float(brier_score_loss(y,p)),
        'precision':float(precision_score(y,pred,zero_division=0)), 'recall':float(recall_score(y,pred,zero_division=0)),
        'positive_rate':float(pred.mean()), 'threshold':float(threshold),
    }

def _tune_threshold(candidate: SuitabilityModel, baseline: SuitabilityModel, validation: pd.DataFrame) -> float:
    high_cost = validation[(validation['gpa_4'] < 3.2) & (validation['financial_need_score'] > .7)]
    baseline_all = evaluate_classifier(baseline, validation)
    baseline_cohort = evaluate_classifier(baseline, high_cost)
    X, y = _xy(validation)
    probs = candidate.predict_proba(X)[:,1]
    cohort_probs = candidate.predict_proba(high_cost[FEATURES])[:,1] if len(high_cost) else np.array([])
    best = None
    for threshold in np.arange(.18, .501, .01):
        pred = (probs >= threshold).astype(int)
        overall_recall = recall_score(y, pred, zero_division=0)
        cohort_recall = 1.0
        if len(high_cost):
            cohort_pred = (cohort_probs >= threshold).astype(int)
            cohort_recall = recall_score(high_cost['label'], cohort_pred, zero_division=0)
        if overall_recall < baseline_all['recall'] - .03:
            continue
        if cohort_recall < baseline_cohort['recall'] - .02:
            continue
        f1 = f1_score(y, pred, zero_division=0)
        if best is None or f1 > best[0]:
            best = (f1, float(threshold))
    return best[1] if best else .25

def select_model(candidates: dict, validation: pd.DataFrame):
    baseline = candidates['logistic']
    baseline_metrics = evaluate_classifier(baseline, validation)
    scored = {name:evaluate_classifier(model, validation, .5) for name,model in candidates.items()}
    eligible = {
        n:m for n,m in scored.items()
        if n != 'logistic' and m['brier'] <= baseline_metrics['brier'] + .01 and m['pr_auc'] > baseline_metrics['pr_auc']
    }
    if not eligible:
        return 'logistic', baseline
    name = max(eligible, key=lambda n: eligible[n]['pr_auc'])
    selected = candidates[name]
    selected.decision_threshold = _tune_threshold(selected, baseline, validation)
    return name, selected
