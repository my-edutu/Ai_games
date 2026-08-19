import { useEffect } from 'react';
import { useSimulationStore } from '../state/store';
import { deriveSoundscape, setConstructionAudioEnabled, updateConstructionAudio } from './soundscape';

export function SiteAudio({ enabled, active }: { enabled: boolean; active: boolean }) {
  const weather = useSimulationStore((state) => state.weather);
  const truck = useSimulationStore((state) => state.truck);

  useEffect(() => {
    setConstructionAudioEnabled(enabled);
    updateConstructionAudio(deriveSoundscape({ active: enabled && active, weather, truck }));
  }, [enabled, active, weather, truck]);

  return null;
}
