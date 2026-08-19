import re, unicodedata, ipaddress
from urllib.parse import urlparse

FREE_EMAIL={'gmail.com','yahoo.com','outlook.com','hotmail.com','proton.me','protonmail.com'}
SHORTENERS={'bit.ly','tinyurl.com','t.co','goo.gl','cutt.ly','rb.gy'}
SUSPICIOUS_PHRASES=['guaranteed','pay fee','processing fee','registration fee','whatsapp','telegram','act now','limited slots','send money','crypto payment']
FEATURE_NAMES=['suspicious_phrase_count','application_fee','free_email_mismatch','shortener_used','redirect_count','domain_is_ip','publisher_age_missing','publisher_age_log','verified_posts_missing','prior_verified_posts_log','https_missing','title_all_caps_ratio']

def normalize_text(text:str)->str:
    s=unicodedata.normalize('NFKC',text).lower()
    s=''.join(ch for ch in s if unicodedata.category(ch)!='Cf')
    s=s.translate(str.maketrans({'4':'a','@':'a','0':'o','1':'i','3':'e','$':'s'}))
    s=re.sub(r'[^a-z0-9%+._:/ -]+',' ',s)
    s=re.sub(r'\s+',' ',s).strip()
    return s

def normalize_domain(url:str)->str:
    host=(urlparse(url).hostname or '').rstrip('.').lower()
    try: host=host.encode('idna').decode('ascii')
    except Exception: pass
    return host

def _domain_is_ip(domain):
    try: ipaddress.ip_address(domain); return 1
    except ValueError: return 0

def evidence_codes(record):
    text=normalize_text(record.title+' '+record.description)
    domain=normalize_domain(record.url)
    contact_domain=(record.contact_email or '').split('@')[-1].lower() if '@' in (record.contact_email or '') else ''
    out=[]
    found=[p for p in SUSPICIOUS_PHRASES if p in text]
    if found: out.append(('SUSPICIOUS_LANGUAGE',f'Risk-language indicators: {", ".join(found[:4])}','medium'))
    if record.application_fee>0: out.append(('APPLICATION_FEE',f'Application fee stated: {record.application_fee:g}','medium'))
    if record.shortener_used or domain in SHORTENERS: out.append(('URL_SHORTENER','Shortened/redirecting URL requires destination review','medium'))
    if record.redirect_count>=3: out.append(('MULTIPLE_REDIRECTS',f'{record.redirect_count} redirects observed','medium'))
    if _domain_is_ip(domain): out.append(('IP_HOST','URL uses an IP address rather than a domain','high'))
    if contact_domain in FREE_EMAIL and domain and contact_domain!=domain: out.append(('CONTACT_DOMAIN_MISMATCH','Contact uses a free-mail domain unrelated to website','low'))
    if record.publisher_age_days is not None and record.publisher_age_days<30: out.append(('NEW_PUBLISHER','Publisher history is very recent','low'))
    return out

def extract_features(record):
    import math
    text=normalize_text(record.title+' '+record.description)
    domain=normalize_domain(record.url)
    contact_domain=(record.contact_email or '').split('@')[-1].lower() if '@' in (record.contact_email or '') else ''
    letters=[c for c in record.title if c.isalpha()]
    return {'suspicious_phrase_count':sum(p in text for p in SUSPICIOUS_PHRASES),'application_fee':float(record.application_fee),'free_email_mismatch':int(contact_domain in FREE_EMAIL and contact_domain!=domain),'shortener_used':int(record.shortener_used or domain in SHORTENERS),'redirect_count':record.redirect_count,'domain_is_ip':_domain_is_ip(domain),'publisher_age_missing':int(record.publisher_age_days is None),'publisher_age_log':math.log1p(record.publisher_age_days or 0),'verified_posts_missing':int(record.prior_verified_posts is None),'prior_verified_posts_log':math.log1p(record.prior_verified_posts or 0),'https_missing':int(urlparse(record.url).scheme!='https'),'title_all_caps_ratio':(sum(c.isupper() for c in letters)/len(letters)) if letters else 0.0}

def vectorize(record):
    f=extract_features(record)
    return [f[n] for n in FEATURE_NAMES]

def hard_escalation(record):
    text=normalize_text(record.title+' '+record.description)
    domain=normalize_domain(record.url)
    return bool(record.application_fee>=50 or 'crypto payment' in text or _domain_is_ip(domain))
