import { useEffect } from 'react';
import { weatherForMinute } from '../simulation/experience';
import type { WeatherState } from '../simulation/types';
import { useSimulationStore } from '../state/store';
import { deriveSoundscape, setConstructionAudioEnabled, updateConstructionAudio } from './soundscape';

function effectiveWeather(stateWeather: WeatherState, minute: number): WeatherState {
  const timed = weatherForMinute(minute);
  if (stateWeather === 'rain' || timed === 'rain') return 'rain';
  if (stateWeather === 'cloudy' || timed === 'cloudy') return 'cloudy';
  return 'clear';
}

export function SiteAudio({ enabled, active }: { enabled: boolean; active: boolean }) {
  const stateWeather = useSimulationStore((state) => state.weather);
  const simulatedMinute = useSimulationStore((state) => state.simulatedMinute);
  const truck = useSimulationStore((state) => state.truck);
  const weather = effectiveWeather(stateWeather, simulatedMinute);

  useEffect(() => {
    setConstructionAudioEnabled(enabled);
    updateConstructionAudio(deriveSoundscape({ active: enabled && active, weather, truck }));
  }, [enabled, active, weather, truck]);

  return null;
}
