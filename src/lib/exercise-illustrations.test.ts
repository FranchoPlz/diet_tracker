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
    expect(findExerciseIllustration('Ejercicio inventado')).toBeNull();
  });

  it.each([
    ['Hiperextensiones', 'back-extension'],
    ['H ipere xtensiones', 'back-extension'],
    ['Sentadilla Sumo', 'dumbbell-sumo-squat'],
    ['Crunch abdominal con disco', 'crunch'],
    ['Plancha lateral', 'side-plank'],
    ['Dead Bug', 'dead-bug'],
    ['C ardio en cinta', 'treadmill-incline-walk'],
  ])('matches real PDF exercise %s', (name, slug) => {
    expect(findExerciseIllustration(name)?.exercise.slug).toBe(slug);
  });
});
