import { useEffect, useMemo, useState } from 'react';
import { communicationHint } from '../simulation/experience';
import { useSimulationStore } from '../state/store';

export function CommunicationCoach() {
  const nearbyStakeholder = useSimulationStore((state) => state.nearbyStakeholder);
  const stage = useSimulationStore((state) => state.stage);
  const learnerName = useSimulationStore((state) => state.learnerName);
  const dispatch = useSimulationStore((state) => state.dispatch);
  const [dismissedKey, setDismissedKey] = useState<string | null>(null);
  const key = nearbyStakeholder ? `${nearbyStakeholder}:${stage}` : null;

  useEffect(() => {
    if (!nearbyStakeholder) setDismissedKey(null);
  }, [nearbyStakeholder]);

  const cue = useMemo(
    () => nearbyStakeholder ? communicationHint(nearbyStakeholder, stage, learnerName) : null,
    [nearbyStakeholder, stage, learnerName],
  );

  if (!nearbyStakeholder || !cue || dismissedKey === key) return null;

  const talk = () => {
    dispatch({ type: 'CONTACT_STAKEHOLDER', stakeholderId: nearbyStakeholder, topic: cue.suggestedTopic });
    setDismissedKey(key);
  };

  return (
    <aside className="communication-coach" aria-live="polite">
      <span className="eyebrow">YOU'VE MET SOMEONE</span>
      <h3>{cue.title}</h3>
      <p>{cue.message}</p>
      <div>
        <button className="primary" onClick={talk}>Talk now</button>
        <button onClick={() => setDismissedKey(key)}>Not now</button>
      </div>
    </aside>
  );
}
