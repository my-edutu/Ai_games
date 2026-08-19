from datetime import datetime, timezone
import pytest
from opportunity_fraud.schemas import OpportunityRecord
from opportunity_fraud.features import normalize_text, normalize_domain, extract_features, FEATURE_NAMES

def sample(**kw):
    base=dict(opportunity_id='o1',campaign_id='c1',title='Graduate Fellowship',description='Apply for a funded fellowship.',url='https://example.org/apply',publisher='Example Foundation',contact_email='apply@example.org',application_fee=0.0,publisher_age_days=1200,prior_verified_posts=20,redirect_count=0,shortener_used=False,created_at=datetime(2026,8,1,tzinfo=timezone.utc)); base.update(kw); return OpportunityRecord(**base)
def test_text_normalization_removes_zero_width_and_leetspeak_for_known_patterns():
    t=normalize_text('G\u200buar4nteed selection - p@y fee now'); assert 'guaranteed' in t and 'pay fee' in t
def test_domain_normalization_handles_case_idna_and_trailing_dot(): assert normalize_domain('https://EXAMPLE.org./x') == 'example.org'
def test_invalid_or_missing_http_url_rejected():
    with pytest.raises(ValueError): sample(url='javascript:alert(1)')
def test_features_capture_evidence_without_legal_label():
    f=extract_features(sample(description='Guaranteed selection. Pay processing fee by WhatsApp.',application_fee=25,contact_email='x@gmail.com',shortener_used=True,redirect_count=4)); assert f['suspicious_phrase_count'] >= 2 and f['application_fee'] == 25 and f['free_email_mismatch'] == 1; assert 'fraud' not in FEATURE_NAMES and 'criminal' not in FEATURE_NAMES
