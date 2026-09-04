import { appState } from './state.svelte';
import { scheduleWorkspaceAutosave } from './workspace-controller';

const DAY_MS = 24 * 60 * 60 * 1000;

export function syncActiveDay(now = new Date()): boolean {
  const startedAt = new Date(appState.weekTracker.startedAt).getTime();
  if (!Number.isFinite(startedAt)) return false;
  const elapsedDays = Math.max(0, Math.floor((now.getTime() - startedAt) / DAY_MS));
  appState.weekTracker.activeDayIndex = Math.min(6, elapsedDays);
  return elapsedDays >= 7;
}

export function setActiveDay(dayIndex: number, now = new Date()): void {
  const nextDay = Math.max(0, Math.min(6, dayIndex));
  appState.weekTracker.activeDayIndex = nextDay;
  appState.weekTracker.startedAt = new Date(now.getTime() - nextDay * DAY_MS).toISOString();
  scheduleWorkspaceAutosave(0);
}

export function startNextWeek(resetTraining = true, now = new Date()): void {
  appState.weekTracker = {
    startedAt: now.toISOString(),
    activeDayIndex: 0,
    weekNumber: appState.weekTracker.weekNumber + 1,
    trainingWeights: resetTraining ? {} : appState.weekTracker.trainingWeights,
    trainingRepetitions: resetTraining ? {} : appState.weekTracker.trainingRepetitions,
  };
  scheduleWorkspaceAutosave(0);
}

export function exerciseWeightKey(dayIndex: number, exerciseIndex: number): string {
  return `${dayIndex}:${exerciseIndex}`;
}

export function seriesCount(value: string): number {
  const match = value.match(/\d+/);
  return Math.max(1, Math.min(20, Number(match?.[0]) || 1));
}

export function setExerciseWeight(dayIndex: number, exerciseIndex: number, seriesIndex: number, value: string): void {
  const key = exerciseWeightKey(dayIndex, exerciseIndex);
  const weights = [...(appState.weekTracker.trainingWeights[key] ?? [])];
  weights[seriesIndex] = value;
  appState.weekTracker.trainingWeights[key] = weights;
  scheduleWorkspaceAutosave();
}

export function setExerciseRepetitions(dayIndex: number, exerciseIndex: number, seriesIndex: number, value: string): void {
  const key = exerciseWeightKey(dayIndex, exerciseIndex);
  const repetitions = [...(appState.weekTracker.trainingRepetitions?.[key] ?? [])];
  repetitions[seriesIndex] = value;
  appState.weekTracker.trainingRepetitions ??= {};
  appState.weekTracker.trainingRepetitions[key] = repetitions;
  scheduleWorkspaceAutosave();
}
