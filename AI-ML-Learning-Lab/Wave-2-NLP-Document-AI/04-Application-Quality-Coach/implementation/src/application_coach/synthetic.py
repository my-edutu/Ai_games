import random
from dataclasses import dataclass
@dataclass
class ReviewerExample:
    text:str
    criteria:list[str]
    score:float
def make_reviewer_dataset(n=240,seed=4):
    rng=random.Random(seed); rows=[]; actions=["led","built","managed","organized","improved"]; criteria_pool=["leadership","impact","learning","teamwork","service"]
    for i in range(n):
        strength=rng.random(); action=rng.choice(actions); team=rng.randint(2,20); pct=rng.randint(5,70); crit=rng.sample(criteria_pool,2)
        if strength>.55:
            text=f"I {action} a team of {team} volunteers to deliver a community project. We improved participation by {pct}% over three months. I learned to plan, delegate and measure impact."; score=62+strength*30+rng.uniform(-4,4)
        else:
            text="I am passionate and hardworking. This opportunity would help me grow and achieve my dreams."; score=30+strength*30+rng.uniform(-5,5)
        rows.append(ReviewerExample(text=text,criteria=crit,score=max(0,min(100,score))))
    return rows
