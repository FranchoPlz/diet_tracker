import { appState } from './state.svelte';
import type { ExercisePreviewKey } from './types';

function revoke(urls: Partial<Record<ExercisePreviewKey, string>>): void {
  for (const url of Object.values(urls)) if (url) URL.revokeObjectURL(url);
}

export function installExercisePreviewBlobs(blobs: Partial<Record<ExercisePreviewKey, Blob>>): void {
  const urls: Partial<Record<ExercisePreviewKey, string>> = {};
  for (const [key, blob] of Object.entries(blobs)) if (blob) urls[key as ExercisePreviewKey] = URL.createObjectURL(blob);
  revoke(appState.exercisePreviewUrls);
  appState.exercisePreviewUrls = urls;
}

export function clearExercisePreviews(): void {
  revoke(appState.exercisePreviewUrls);
  appState.exercisePreviewUrls = {};
}
