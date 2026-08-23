import { describe, expect, it } from 'vitest';
import { deriveSoundscape } from './soundscape';

describe('Turnve construction soundscape', () => {
  it('stays silent while site navigation is inactive', () => {
    expect(deriveSoundscape({ active: false, weather: 'clear', truck: 'scheduled' })).toEqual({ machinery: false, impacts: false, reversing: false, rain: false });
  });

  it('adds machinery and reversing cues when a concrete truck is waiting', () => {
    expect(deriveSoundscape({ active: true, weather: 'cloudy', truck: 'waiting' })).toEqual({ machinery: true, impacts: true, reversing: true, rain: false });
  });

  it('adds a rain layer when weather changes to rain', () => {
    expect(deriveSoundscape({ active: true, weather: 'rain', truck: 'arrived' }).rain).toBe(true);
  });
});
