from __future__ import annotations
import json
from pathlib import Path
import sys

ROOT = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(ROOT / "src"))

from opportunity_matching.synthetic import make_training_rows, make_benchmark_queries
from opportunity_matching.model import train_model, LearnedRanker
from opportunity_matching.baseline import BaselineRanker
from opportunity_matching.evaluation import evaluate_ranker
from opportunity_matching.pilot import run_representative_pilot
from opportunity_matching.release import validate_release_evidence


def main():
    model_path = ROOT / "models" / "ranker.joblib"
    metadata = train_model(make_training_rows(120, 24, seed=7), model_path, random_state=7)
    queries = make_benchmark_queries(seed=13, n_users=40, n_opportunities=24)
    baseline = evaluate_ranker(BaselineRanker(), queries, k=5)
    learned = evaluate_ranker(LearnedRanker.load(model_path), queries, k=5)
    benchmark = {"baseline": baseline, "learned": learned, "metadata": metadata}
    (ROOT / "reports").mkdir(exist_ok=True)
    (ROOT / "reports" / "BENCHMARK.json").write_text(json.dumps(benchmark, indent=2, sort_keys=True))
    pilot = run_representative_pilot(LearnedRanker.load(model_path), seed=41)
    (ROOT / "evidence" / "PILOT_REPORT.json").write_text(json.dumps(pilot, indent=2, sort_keys=True))
    gate = validate_release_evidence(ROOT / "evidence")
    print(json.dumps({"benchmark": benchmark, "pilot": pilot, "release_gate": gate}, indent=2, sort_keys=True))


if __name__ == "__main__":
    main()
