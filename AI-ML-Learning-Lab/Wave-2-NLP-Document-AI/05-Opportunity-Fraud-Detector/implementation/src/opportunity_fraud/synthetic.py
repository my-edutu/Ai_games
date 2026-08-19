from dataclasses import dataclass
from datetime import datetime, timezone, timedelta
import numpy as np
from .schemas import OpportunityRecord

@dataclass
class LabeledOpportunity:
    record: OpportunityRecord
    label: int
    severe: int

BENIGN_TITLES=['Graduate Research Fellowship','Open Source Internship','Community Innovation Grant','Climate Leadership Program']
RISK_TITLES=['GUARANTEED FELLOWSHIP','URGENT REMOTE JOB','LIMITED SLOTS GRANT','INSTANT SCHOLARSHIP']

def make_dataset(campaigns=50, per_campaign=12, seed=5):
    rng=np.random.default_rng(seed); rows=[]
    for ci in range(campaigns):
        risky=bool((ci % 7 == 4) or rng.random()<0.18)
        for j in range(per_campaign):
            if risky:
                fee=float(rng.choice([0,10,25,50,100],p=[.08,.12,.28,.27,.25]))
                text=rng.choice(['Guaranteed selection. Pay processing fee by WhatsApp now.','Limited slots. Send registration fee today via Telegram.','Act now for guaranteed remote job. Crypto payment required.','Processing fee required before interview. Contact WhatsApp.'])
                short=bool(rng.random()<.55); redirects=int(rng.integers(2,7)); age=int(rng.integers(1,60)); posts=int(rng.integers(0,3)); domain=rng.choice(['award-now.example','203.0.113.9','bit.ly','quickgrant.example']); scheme='http' if rng.random()<.5 else 'https'; email='opportunitydesk@gmail.com'; label=int(rng.random()<.9); severe=int(label and (fee>=50 or 'Crypto payment' in text)); title=rng.choice(RISK_TITLES)
            else:
                fee=0.0; text=rng.choice(['Applications are assessed against published eligibility criteria. No application fee.','Submit your CV and statement through the official portal before the deadline.','Funded program with transparent selection criteria and contact information.']); short=False; redirects=int(rng.integers(0,2)); age=int(rng.integers(300,4000)); posts=int(rng.integers(8,80)); domain=f'foundation{ci}.org'; scheme='https'; email=f'apply@{domain}'; label=int(rng.random()<.02); severe=0; title=rng.choice(BENIGN_TITLES)
            url=f'{scheme}://{domain}/apply/{j}'
            rows.append(LabeledOpportunity(OpportunityRecord(opportunity_id=f'o{ci}-{j}',campaign_id=f'camp-{ci}',title=title,description=text,url=url,publisher=f'Publisher {ci}',contact_email=email,application_fee=fee,publisher_age_days=age,prior_verified_posts=posts,redirect_count=redirects,shortener_used=short,created_at=datetime(2026,1,1,tzinfo=timezone.utc)+timedelta(days=ci)),label,severe))
    return rows
