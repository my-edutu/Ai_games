def anomaly_reasons(record,seen_totals=None):
    reasons=[]; total=record.total.value
    if isinstance(total,(int,float)) and total>1_000_000: reasons.append("extreme_total")
    if record.duplicate_of: reasons.append("possible_duplicate")
    if "amount_reconciliation_failed" in record.validation_errors: reasons.append("reconciliation_conflict")
    if record.total.confidence<.7 or record.currency.confidence<.7: reasons.append("low_confidence_financial_field")
    return reasons
