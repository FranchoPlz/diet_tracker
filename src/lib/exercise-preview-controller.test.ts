import { afterEach, describe, expect, it, vi } from 'vitest';
import { clearExercisePreviews, installExercisePreviewBlobs } from './exercise-preview-controller';
import { appState } from './state.svelte';

describe('exercise preview controller', () => {
  afterEach(() => {
    clearExercisePreviews();
    vi.restoreAllMocks();
  });

  it('creates URLs for new blobs and revokes replaced and cleared URLs', () => {
    Object.defineProperties(URL, {
      createObjectURL: { configurable: true, value: vi.fn() },
      revokeObjectURL: { configurable: true, value: vi.fn() },
    });
    const create = vi.spyOn(URL, 'createObjectURL').mockReturnValueOnce('blob:first').mockReturnValueOnce('blob:second');
    const revoke = vi.spyOn(URL, 'revokeObjectURL');

    installExercisePreviewBlobs({ '0:0': new Blob(['first']) });
    expect(appState.exercisePreviewUrls).toEqual({ '0:0': 'blob:first' });
    installExercisePreviewBlobs({ '1:0': new Blob(['second']) });
    expect(create).toHaveBeenCalledTimes(2);
    expect(revoke).toHaveBeenCalledWith('blob:first');
    expect(appState.exercisePreviewUrls).toEqual({ '1:0': 'blob:second' });

    clearExercisePreviews();
    expect(revoke).toHaveBeenCalledWith('blob:second');
    expect(appState.exercisePreviewUrls).toEqual({});
  });
});
