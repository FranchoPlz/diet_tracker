import { describe, expect, it } from 'vitest';

import type { DietPlan } from './types';
import { buildBackendSelection, createDefaultWeekConfig, setDayDiet } from './utils';

const diets: DietPlan[] = [
  { name: 'DIETA 1', intro: '', meals: [] },
  { name: 'DIETA 2', intro: '', meals: [] },
];

describe('weekly selection', () => {
  it('starts with one alternating seven-day week', () => {
    const config = createDefaultWeekConfig();

    expect(config.weeks).toBe(1);
    expect(config.days).toHaveLength(7);
    expect(config.days.map(day => day.diet)).toEqual([
      'DIETA 1', 'DIETA 2', 'DIETA 1', 'DIETA 2', 'DIETA 1', 'DIETA 2', 'DIETA 1',
    ]);
  });

  it('serializes a diet assigned directly to a day', () => {
    const config = createDefaultWeekConfig();
    setDayDiet(config, 0, 'DIETA 2');

    const selection = buildBackendSelection(config, diets, '/diet.pdf');

    expect(selection.days[0].diet).toBe('DIETA 2');
    expect(selection.pdf_path).toBe('/diet.pdf');
  });

  it('serializes only meals present in the selected diet', () => {
    const config = createDefaultWeekConfig();
    const parsedDiets: DietPlan[] = [{
      name: 'DIETA 1',
      intro: '',
      meals: [
        { type: 'DESAYUNO', options: [{ name: 'DESAYUNO', description: null, ingredient_lines: [] }] },
        { type: 'ALMUERZO', options: [{ name: 'ALMUERZO', description: null, ingredient_lines: [] }] },
        { type: 'COMIDA', options: [{ name: 'COMIDA', description: null, ingredient_lines: [] }] },
        { type: 'CENA', options: [{ name: 'CENA', description: null, ingredient_lines: [] }] },
      ],
    }];

    const meals = buildBackendSelection(config, parsedDiets, '/diet.pdf').days[0].meals;

    expect(meals.map((meal) => meal.type)).toEqual(['DESAYUNO', 'ALMUERZO', 'COMIDA', 'CENA']);
    expect(meals.some((meal) => meal.type === 'MERIENDA')).toBe(false);
  });
});
