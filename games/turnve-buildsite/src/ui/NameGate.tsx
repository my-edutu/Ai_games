import { FormEvent, useState } from 'react';
import { sanitizeLearnerName } from '../simulation/experience';
import { useSimulationStore } from '../state/store';

export function NameGate() {
  const savedName = useSimulationStore((state) => state.learnerName);
  const setLearnerName = useSimulationStore((state) => state.setLearnerName);
  const [value, setValue] = useState(savedName);
  const clean = sanitizeLearnerName(value);

  const submit = (event: FormEvent) => {
    event.preventDefault();
    if (!clean) return;
    setLearnerName(clean);
  };

  return (
    <div className="name-gate-backdrop">
      <form className="name-gate" onSubmit={submit}>
        <span className="eyebrow">TURNVE BUILDSITE · SITE SIGN-IN</span>
        <h1>What should the site team call you?</h1>
        <p>Your name will appear in briefings, communication coaching, work records and your final readiness report.</p>
        <label>
          <span>Your name</span>
          <input
            aria-label="Your name"
            autoFocus
            autoComplete="name"
            maxLength={48}
            placeholder="e.g. Chidi Okafor"
            value={value}
            onChange={(event) => setValue(event.target.value)}
          />
        </label>
        <button className="primary" type="submit" disabled={!clean}>Enter BuildSite</button>
        <small>Training profile only · stored on this device.</small>
      </form>
    </div>
  );
}
