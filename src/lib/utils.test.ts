import { describe, expect, it } from 'vitest';

import type { DietPlan } from './types';
import { createDefaultWeekConfig, resolveDayMeals, setAlternativeChoice, setDayDiet, setMealOptionIndex } from './utils';

const diets: DietPlan[] = [
  { name: 'DIETA 1', intro: '', meals: [] },
  { name: 'DIETA 2', intro: '', meals: [] },
];

describe('weekly selection', () => {
  it('starts with one alternating seven-day week', () => {
    const config = createDefaultWeekConfig();

    expect(config.days).toHaveLength(7);
    expect(config.days.map(day => day.diet)).toEqual([
      'DIETA 1', 'DIETA 2', 'DIETA 1', 'DIETA 2', 'DIETA 1', 'DIETA 2', 'DIETA 1',
    ]);
  });

  it('resolves a day with the diet assigned directly to it', () => {
    const config = createDefaultWeekConfig();
    const parsedDiets: DietPlan[] = [
      { ...diets[0], meals: [{ type: 'COMIDA', options: [{ name: 'Arroz', description: null, ingredient_lines: [] }] }] },
      { ...diets[1], meals: [{ type: 'COMIDA', options: [{ name: 'Pasta', description: null, ingredient_lines: [] }] }] },
    ];
    setDayDiet(config, 0, 'DIETA 2');

    expect(resolveDayMeals(config, parsedDiets, 0)[0].option?.name).toBe('Pasta');
  });

  it('applies day exceptions over diet defaults for options and alternatives', () => {
    const config = createDefaultWeekConfig();
    const rice = { name: 'Arroz', quantity: 80, unit: 'g', note: null };
    const pasta = { name: 'Pasta', quantity: 70, unit: 'g', note: null };
    const parsedDiets: DietPlan[] = [{
      name: 'DIETA 1', intro: '', meals: [{ type: 'COMIDA', options: [
        { name: 'A', description: null, ingredient_lines: [] },
        { name: 'B', description: null, ingredient_lines: [{ items: [rice, pasta], is_alternatives: true, is_combination: false }] },
      ] }],
    }];
    setMealOptionIndex(config, 2, 'COMIDA', 1, false);
    setAlternativeChoice(config, 2, '0-1-0', 1, true);

    expect(resolveDayMeals(config, parsedDiets, 0)[0].lines[0].items).toEqual([rice]);
    expect(resolveDayMeals(config, parsedDiets, 2)[0].lines[0].items).toEqual([pasta]);
  });

  it('resolves only meals present in the selected diet', () => {
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

    const meals = resolveDayMeals(config, parsedDiets, 0);

    expect(meals.map(({ meal }) => meal.type)).toEqual(['DESAYUNO', 'ALMUERZO', 'COMIDA', 'CENA']);
  });
});
