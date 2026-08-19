import numpy as np
SERVING_FEATURES=['tenure_days','history_count','completion_rate','cancel_rate','no_show_rate','avg_lateness_minutes','distance_km','expected_duration_hours','lead_time_hours','shift_night']

def build_event_features(worker,event,history,cutoff):
    prior=[h for h in history if h.occurred_at < cutoff]
    n=len(prior)
    completed=sum(h.outcome=='completed' for h in prior)
    cancelled=sum(h.outcome=='cancelled' for h in prior)
    no_show=sum(h.outcome=='no_show' for h in prior)
    avg_late=(sum(h.lateness_minutes for h in prior)/n) if n else 0.0
    return {'tenure_days':float(worker.tenure_days),'history_count':float(n),'completion_rate':completed/n if n else 0.0,'cancel_rate':cancelled/n if n else 0.0,'no_show_rate':no_show/n if n else 0.0,'avg_lateness_minutes':avg_late,'distance_km':float(event.distance_km),'expected_duration_hours':float(event.expected_duration_hours),'lead_time_hours':max(0.0,(event.starts_at-event.booking_created_at).total_seconds()/3600),'shift_night':1.0 if event.shift_type=='night' else 0.0}

def vectorize(features):
    return np.array([features[k] for k in SERVING_FEATURES],dtype=float)
