import { describe, expect, it } from 'vitest';
import { joinWrappedLines, parseDietText, parseIngredient } from './diet-parser';
import abrilFixtureText from '../../tests/fixtures/abril_raw_pages.txt?raw';

describe('parseDietText', () => {
  it('parses the extracted ABRIL page fixture deterministically', () => {
    const fixture = JSON.parse(abrilFixtureText);
    const first = parseDietText(fixture.pages);
    const second = parseDietText(fixture.pages);

    expect(first).toEqual(second);
    expect(first.diets.map((diet) => diet.name)).toEqual(['DIETA 1', 'DIETA 2']);
    expect(first.diets.map((diet) => diet.meals.map((meal) => [meal.type, meal.options.length]))).toEqual([
      [['ALMUERZO', 1], ['COMIDA', 2], ['MERIENDA', 1], ['CENA', 3]],
      [['ALMUERZO', 2], ['COMIDA', 2], ['MERIENDA', 1], ['CENA', 3]],
    ]);
    expect(first.diets[0].meals[1].options[1].ingredient_lines[0].items[4].name).toBe('Tortellinis de Queso');
  });

  it('accepts SEPTIEMBRE option heading variations', () => {
    const result = parseDietText([
      'SEPTIEMBRE\nDIETA 1\nALMUERZO\nOPCIÓN 1\n-1 Huevo.\nOPCIÓN 2 – BIZCOCHO DE COCO\n-20g de Coco.\nCENA\nOPCION 3 – PANCAKES DE VERDURA RELLENOS\n-100g de Calabacín.',
      'DIETA 2\nMERIENDA\n-15g de Frutos secos a elegir.\nCENA\nOPCIÓN 3 – SMASH BURGUER\n-1 Hamburguesa.',
    ]);

    expect(result.diets[0].meals[0].options.map((option) => option.name)).toEqual([
      'OPCIÓN 1',
      'OPCIÓN 2 – BIZCOCHO DE COCO',
    ]);
    expect(result.diets[0].meals[1].options[0].name).toBe('OPCION 3 – PANCAKES DE VERDURA RELLENOS');
    expect(result.diets[1].meals[0].options[0].ingredient_lines[0].items[0].name).toBe('Frutos secos a elegir');
    expect(result.diets[1].meals[1].options[0].name).toBe('OPCIÓN 3 – SMASH BURGUER');
  });

  it('stops before supplementation or training pages', () => {
    const result = parseDietText([
      'DIETA 1\nALMUERZO\n-1 Huevo.',
      'SUPLEMENTACIÓN\nDIETA 2\nALMUERZO\n-2 Huevos.',
    ]);
    expect(result.diets.map((diet) => diet.name)).toEqual(['DIETA 1']);
  });

  it('rejects text without diet sections in Spanish', () => {
    expect(() => parseDietText(['Documento sin estructura'])).toThrow('No se han encontrado secciones DIETA');
  });
});

describe('ingredient helpers', () => {
  it('normalizes metric and practical units', () => {
    expect(parseIngredient('1,5 kg de Pechuga de pollo')).toEqual({ name: 'Pechuga de pollo', quantity: 1500, unit: 'g' });
    expect(parseIngredient('0.75 l de Leche')).toEqual({ name: 'Leche', quantity: 750, unit: 'ml' });
    expect(parseIngredient('2 Latas de Atún')).toEqual({ name: 'Atún', quantity: 2, unit: 'lata' });
    expect(parseIngredient('1/2 Aguacate')).toEqual({ name: 'Aguacate', quantity: 0.5, unit: 'unidad' });
    expect(parseIngredient('2 Latas de Atún')).toEqual({ name: 'Atún', quantity: 2, unit: 'lata' });
  });

  it('joins wrapped alternatives and undashed ingredients', () => {
    expect(joinWrappedLines('-50g de Tomate Frito.\n70g de Queso Mozzarella / 80g de Queso Feta.')).toEqual([
      '-50g de Tomate Frito.',
      '-70g de Queso Mozzarella / 80g de Queso Feta.',
    ]);
    expect(joinWrappedLines('-80g de Pasta /\n250g de Garbanzos / 160g de Gnocchis.')).toEqual([
      '-80g de Pasta / 250g de Garbanzos / 160g de Gnocchis.',
    ]);
  });
});
