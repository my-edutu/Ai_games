from copy import deepcopy
def apply_correction(record,field,new_value,reviewer_id,ledger):
    corrected=deepcopy(record); target=getattr(corrected,field); old=target.value; target.value=new_value; target.confidence=1.0; ledger.append(record.document_id,field,old,new_value,reviewer_id); return corrected
