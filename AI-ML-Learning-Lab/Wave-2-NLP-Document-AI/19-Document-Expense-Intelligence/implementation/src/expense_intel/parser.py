import re, hashlib
from .schemas import DocumentInput, ExpenseRecord, FieldValue
CURRENCIES={"$":"USD","USD":"USD","NGN":"NGN","₦":"NGN","GBP":"GBP","£":"GBP","EUR":"EUR","€":"EUR"}
KEYWORDS={"travel":["uber","flight","hotel"],"office":["stationery","printer","paper"],"meals":["restaurant","cafe","food"],"software":["software","subscription","cloud"]}
def _money(text,label):
    m=re.search(rf"(?<![A-Za-z]){label}\b\s*[:\-]?\s*(?:USD|NGN|GBP|EUR|\$|₦|£|€)?\s*([0-9][0-9,]*(?:\.[0-9]{{1,2}})?)",text,re.I)
    return float(m.group(1).replace(",","")) if m else None
def _fv(value,conf,source=None): return FieldValue(value=value,confidence=conf,source_text=source)
def parse_document(doc:DocumentInput)->ExpenseRecord:
    text=doc.raw_text.strip(); lines=[x.strip() for x in text.splitlines() if x.strip()]; vendor=lines[0] if lines else None
    dm=re.search(r'(\d{4}[-/]\d{2}[-/]\d{2}|\d{2}[-/]\d{2}[-/]\d{4})',text)
    currency=next((code for token,code in CURRENCIES.items() if token in text),None)
    subtotal,tax,total=_money(text,"subtotal"),_money(text,"tax"),_money(text,"total")
    lower=text.lower(); category="other"; cat_conf=.55
    for cat,words in KEYWORDS.items():
        if any(w in lower for w in words): category=cat; cat_conf=.85; break
    vals=[vendor,dm.group(1) if dm else None,currency,subtotal,tax,total]
    confs=[.95 if vendor else .2,.9 if dm else .2,.9 if currency else .2,.92 if subtotal is not None else .2,.92 if tax is not None else .3,.95 if total is not None else .2]
    return ExpenseRecord(document_id=doc.document_id,vendor=_fv(vendor,confs[0],vendor),date=_fv(vals[1],confs[1],vals[1]),currency=_fv(currency,confs[2],currency),subtotal=_fv(subtotal,confs[3],str(subtotal) if subtotal is not None else None),tax=_fv(tax,confs[4],str(tax) if tax is not None else None),total=_fv(total,confs[5],str(total) if total is not None else None),category=_fv(category,cat_conf,category),needs_review=min(confs)<.65,validation_errors=[])
def parser_artifact_sha256(): return hashlib.sha256(b"expense-parser-v1").hexdigest()
