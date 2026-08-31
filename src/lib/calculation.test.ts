import { describe, expect, it } from 'vitest';

import abrilFixture from '../../tests/fixtures/abril_golden.json';
import type { DietPlan, IngredientLine, ParseResult } from './types';
import { calculateShoppingList, canonicalIngredientName } from './calculation';
import { createDefaultWeekConfig } from './utils';

function dietWithComidaOptions(options: IngredientLine[][]): DietPlan {
  return {
    name: 'DIETA 1',
    intro: '',
    meals: [{
      type: 'COMIDA',
      options: options.map((ingredient_lines, index) => ({
        name: `Option ${index + 1}`,
        description: null,
        ingredient_lines,
      })),
    }],
  };
}

function oneDayConfig() {
  const config = createDefaultWeekConfig();
  config.days.length = 1;
  return config;
}

describe('calculateShoppingList', () => {
  it('uses conservative Spanish singular keys', () => {
    expect(canonicalIngredientName('Huevos')).toBe('huevo');
    expect(canonicalIngredientName('Tomates')).toBe('tomate');
    expect(canonicalIngredientName('Yogures')).toBe('yogur');
    expect(canonicalIngredientName('Nueces')).toBe('nuez');
    expect(canonicalIngredientName('Hummus')).toBe('hummus');
    expect(canonicalIngredientName('Cuscús')).toBe('cuscús');
    expect(canonicalIngredientName('Huevos cocidos')).toBe('huevos cocidos');
  });

  it('combines singular and plural ingredients into one item', () => {
    const parsedData: ParseResult = {
      status: 'ok',
      diets: [dietWithComidaOptions([[
        {
          items: [{ name: 'Huevos', quantity: 2, unit: 'unidad', note: null }],
          is_alternatives: false,
          is_combination: false,
        },
        {
          items: [{ name: 'Huevo', quantity: 1, unit: 'unidad', note: null }],
          is_alternatives: false,
          is_combination: false,
        },
      ]])],
    };

    expect(calculateShoppingList(parsedData, oneDayConfig())).toContainEqual({
      name: 'huevo', quantity: 3, unit: 'unidad', count: 2,
    });
  });

  it('normalizes, groups, sums, counts, unpacks combinations, and sorts names', () => {
    const parsedData: ParseResult = {
      status: 'ok',
      diets: [dietWithComidaOptions([[
        {
          items: [{ name: ' Pear ', quantity: 1, unit: 'unidad', note: null }],
          is_alternatives: false,
          is_combination: false,
        },
        {
          items: [{ name: 'pear', quantity: 2, unit: 'unidad', note: null }],
          is_alternatives: false,
          is_combination: false,
        },
        {
          items: [{ name: 'Pear', quantity: null, unit: null, note: null }],
          is_alternatives: false,
          is_combination: false,
        },
        {
          items: [{
            name: 'ignored wrapper',
            quantity: null,
            unit: null,
            note: null,
            is_combination: true,
            sub_items: [
              { name: 'apple', quantity: null, unit: null, note: null },
              { name: ' APPLE ', quantity: 2, unit: null, note: null },
            ],
          }],
          is_alternatives: false,
          is_combination: true,
        },
      ]])],
    };

    expect(calculateShoppingList(parsedData, oneDayConfig())).toEqual([
      { name: 'apple', quantity: 2, unit: null, count: 2 },
      { name: 'pear', quantity: 3, unit: 'unidad', count: 2 },
      { name: 'pear', quantity: null, unit: null, count: 1 },
    ]);
  });

  it('uses effective option and alternative choices, falling back to the first invalid alternative', () => {
    const line = (first: string, second: string): IngredientLine => ({
      items: [
        { name: first, quantity: 1, unit: 'unidad', note: null },
        { name: second, quantity: 1, unit: 'unidad', note: null },
      ],
      is_alternatives: true,
      is_combination: false,
    });
    const parsedData: ParseResult = {
      status: 'ok',
      diets: [dietWithComidaOptions([
        [line('default first', 'default choice')],
        [line('exception fallback', 'exception choice')],
      ])],
    };
    const config = createDefaultWeekConfig();
    config.days.length = 2;
    config.days[1].diet = 'DIETA 1';
    config.dietDefaults['DIETA 1'].alternativeChoices['0-0-0'] = 1;
    config.dayExceptions[1] = {
      mealOptionIndexes: { COMIDA: 1 },
      alternativeChoices: { '0-1-0': 99 },
    };

    expect(calculateShoppingList(parsedData, config)).toEqual([
      { name: 'default choice', quantity: 1, unit: 'unidad', count: 1 },
      { name: 'exception fallback', quantity: 1, unit: 'unidad', count: 1 },
    ]);
  });

  it('unpacks a selected combination from the abril fixture', () => {
    const parsedData = abrilFixture as ParseResult;
    const config = oneDayConfig();
    config.dietDefaults['DIETA 1'].mealOptionIndexes.COMIDA = 1;
    config.dietDefaults['DIETA 1'].alternativeChoices['1-1-1'] = 4;

    const shoppingList = calculateShoppingList(parsedData, config);

    expect(shoppingList).toContainEqual({
      name: 'lata de atún natural',
      quantity: 1,
      unit: 'unidad',
      count: 1,
    });
    expect(shoppingList).not.toContainEqual(expect.objectContaining({ name: 'huevo + lata de atún natural' }));
    expect(shoppingList.map(item => item.name)).toEqual(
      [...shoppingList.map(item => item.name)].sort(),
    );
  });
});
