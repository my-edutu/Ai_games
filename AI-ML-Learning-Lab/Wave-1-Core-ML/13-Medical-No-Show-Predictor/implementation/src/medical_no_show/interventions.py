PROHIBITED_ACTIONS={"deny_care","cancel_appointment","deprioritize_care","punitive_fee"}
def recommend_interventions(risk: float, transport_barrier: bool=False):
    actions=[]
    if risk>=0.35: actions.append("reminder_outreach")
    if risk>=0.55: actions.append("scheduling_support")
    if transport_barrier and risk>=0.35: actions.append("transport_support")
    if risk>=0.70: actions.append("human_followup")
    return actions
