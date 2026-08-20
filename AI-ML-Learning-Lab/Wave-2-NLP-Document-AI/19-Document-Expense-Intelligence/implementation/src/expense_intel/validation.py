from datetime import datetime
from .schemas import ExpenseRecord
SUPPORTED={"USD","NGN","GBP","EUR"}
def validate_record(rec:ExpenseRecord,tolerance=.02):
    errors=[]
    try:
        if rec.date.value:
            s=str(rec.date.value).replace("/","-"); parts=s.split("-")
            if len(parts)==3 and len(parts[0])==2: s=f"{parts[2]}-{parts[1]}-{parts[0]}"
            datetime.fromisoformat(s)
    except Exception: errors.append("invalid_date")
    if rec.currency.value not in SUPPORTED: errors.append("unsupported_currency")
    vals=[rec.subtotal.value,rec.tax.value,rec.total.value]
    if all(isinstance(v,(int,float)) for v in vals) and abs((float(vals[0])+float(vals[1]))-float(vals[2]))>max(.01,abs(float(vals[2]))*tolerance): errors.append("amount_reconciliation_failed")
    if isinstance(rec.total.value,(int,float)) and float(rec.total.value)<0: errors.append("negative_total")
    rec.validation_errors=errors; rec.needs_review=rec.needs_review or bool(errors); return rec
