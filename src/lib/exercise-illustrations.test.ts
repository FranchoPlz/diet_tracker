import { describe, expect, it } from 'vitest';

import { findExerciseIllustration } from './exercise-illustrations';

describe('exercise illustrations', () => {
  it('matches normalized Spanish names and common parser typos', () => {
    const illustration = findExerciseIllustration('Pres de banca plano con barra recta');

    expect(illustration?.exercise.slug).toBe('bench-press');
    expect(illustration?.frameUrls).toEqual([
      '/exercise-illustrations/bench-press/frame-1.png',
      '/exercise-illustrations/bench-press/frame-2.png',
      '/exercise-illustrations/bench-press/frame-3.png',
    ]);
  });

  it('does not guess ambiguous or unavailable exercises', () => {
    expect(findExerciseIllustration('Remo')).toBeNull();
    expect(findExerciseIllustration('Back Extension')).toBeNull();
  });
});
