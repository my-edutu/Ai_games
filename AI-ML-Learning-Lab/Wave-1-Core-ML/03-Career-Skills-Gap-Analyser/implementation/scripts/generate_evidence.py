import json, sys
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'src'))
from career_gap.ontology import SkillOntology, OntologySkill
from career_gap.evaluation import benchmark_matchers
from career_gap.pilot import run_representative_pilot

root=Path(__file__).resolve().parents[1]; e=root/'evidence'; e.mkdir(exist_ok=True)
ont=SkillOntology(version='ont-v1',skills=[OntologySkill(id='python',name='Python',aliases=['py'],category='engineering'),OntologySkill(id='sql',name='SQL',aliases=['postgres database','postgresql'],category='data'),OntologySkill(id='ml',name='Machine Learning',aliases=['predictive modeling','ml'],category='ai',prerequisites=['python'])])
b=benchmark_matchers(ont)
benchmark={'ontology_version':'ont-v1','model_version':'semantic-tfidf-v1','exact_accuracy':b.exact_accuracy,'semantic_accuracy':b.semantic_accuracy,'unknown_false_positive_rate':b.unknown_false_positive_rate,'representative_not_real_world':True}
(e/'BENCHMARK.json').write_text(json.dumps(benchmark,indent=2,sort_keys=True))
(e/'PILOT_REPORT.json').write_text(json.dumps(run_representative_pilot(),indent=2,sort_keys=True))
print(json.dumps({'benchmark':benchmark,'pilot':run_representative_pilot()},indent=2))
