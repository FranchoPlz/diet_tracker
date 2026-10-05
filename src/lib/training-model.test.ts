import { describe, expect, it } from 'vitest';
import { normalizeTrainingPlan, progressKey } from './training-model';

describe('training model', () => {
  it('expands grouped template days into seven independently editable days', () => {
    const plan = normalizeTrainingPlan({ tips: [], defaultRestSeconds: null, days: [
      { days: [1, 3], title: 'Pierna', activeRest: false, details: '', exercises: [{ exercise: 'Sentadilla', series: '3', repetitions: '10', details: '' }] },
      { days: [2], title: 'Torso', activeRest: false, details: '', exercises: [] },
    ] });
    expect(plan.days).toHaveLength(7);
    expect(plan.days[0].days).toEqual([1]);
    expect(plan.days[2].days).toEqual([3]);
    expect(plan.days[0].id).not.toBe(plan.days[2].id);
    expect(plan.templateDays).toHaveLength(7);
  });

  it('creates independent keys for every superserie member', () => {
    const day = { id: 'day', days: [1], title: 'Pierna', activeRest: false, details: '', exercises: [] };
    const exercise = { id: 'superset', exercise: 'Hiperextensiones + Sentadilla Sumo', series: '3', repetitions: '12\n10', details: '', supersetExercises: ['Hiperextensiones', 'Sentadilla Sumo'] };
    expect(progressKey(day, exercise, 0)).toBe('day:superset:member:0');
    expect(progressKey(day, exercise, 1)).toBe('day:superset:member:1');
  });

  it('clones proxied training days without structuredClone', () => {
    const day = new Proxy({ days: [1], title: 'Torso', activeRest: false, details: '', exercises: [] }, {});
    const plan = normalizeTrainingPlan({ tips: [], defaultRestSeconds: null, days: [day] });
    expect(plan.days[0].title).toBe('Torso');
    expect(plan.days).toHaveLength(7);
  });

});
