import { beforeEach, describe, expect, it } from 'vitest';

import { appState } from './state.svelte';
import { seriesCount, setActiveDay, setExerciseRepetitions, startNextWeek, syncActiveDay } from './week-tracker';

describe('week tracker', () => {
  beforeEach(() => {
    appState.activePlanId = null;
    appState.weekTracker = { startedAt: '2026-09-01T12:00:00.000Z', activeDayIndex: 0, weekNumber: 1, trainingWeights: {}, trainingRepetitions: {} };
  });

  it('follows elapsed calendar days and reports when the week is complete', () => {
    expect(syncActiveDay(new Date('2026-09-04T12:00:00.000Z'))).toBe(false);
    expect(appState.weekTracker.activeDayIndex).toBe(3);
    expect(syncActiveDay(new Date('2026-09-08T12:00:00.000Z'))).toBe(true);
    expect(appState.weekTracker.activeDayIndex).toBe(6);
  });

  it('moves manually and rebases automatic tracking from the chosen day', () => {
    setActiveDay(4, new Date('2026-09-04T12:00:00.000Z'));
    expect(appState.weekTracker.startedAt).toBe('2026-08-31T12:00:00.000Z');
    expect(appState.weekTracker.activeDayIndex).toBe(4);
  });

  it('starts another week and optionally retains training weights', () => {
    appState.weekTracker.trainingWeights = { '0:0': ['25'] };
    startNextWeek(false, new Date('2026-09-08T12:00:00.000Z'));
    expect(appState.weekTracker).toEqual({
      startedAt: '2026-09-08T12:00:00.000Z', activeDayIndex: 0, weekNumber: 2, trainingWeights: { '0:0': ['25'] }, trainingRepetitions: {},
    });
  });

  it('derives a safe number of weight fields from the series label', () => {
    expect(seriesCount('4')).toBe(4);
    expect(seriesCount('3 series')).toBe(3);
    expect(seriesCount('')).toBe(1);
  });

  it('records completed repetitions for each series', () => {
    setExerciseRepetitions(0, 1, 2, '9');
    expect(appState.weekTracker.trainingRepetitions?.['0:1']).toEqual([undefined, undefined, '9']);
  });
});
