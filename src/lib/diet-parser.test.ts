import { describe, expect, it } from 'vitest';
import { joinWrappedLines, parseDietText, parseDietTextWithExerciseCrops, parseIngredient } from './diet-parser';
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

  it('extracts training tips, workout rows, superseries, and active-rest days', () => {
    const result = parseDietText([
      'DIETA 1\nALMUERZO\n-1 Huevo.',
      'SUPLEMENTACIÓN\n- Creatina.\nENTRENAMIENTO\nTIPS PARA CADA ENTRENAMIENTO\n- Los descansos entre series van a ser de 60 segundos de máximo.\n- Beber mínimo 1L de agua en cada entrenamiento.',
      'DÍA 1 – TORSO\nEJERCICIOS SERIES REPETICIONES DETALLES\nPres de banca plano\ncon barra recta\n4 1º - 10\n2º - 10\n3º - 8\n4º - 8\nSUPERSERIE\nCurl de bíceps\n+\nPres francés\n4\n12 - 12 - 10 - 8\n10 - 10 - 10 - 10\nCardio en cinta 1 30 Minutos de caminata',
      'DÍA 2 y 3 – DESCANSO ACTIVO\n45 MINUTOS DE CAMINATA A BUEN RITMO',
    ]);

    expect(result.diets[0].meals[0].options[0].ingredient_lines[0].items[0].name).toBe('Huevo');
    expect(JSON.stringify(result.diets)).not.toContain('Creatina');
    expect(result.training?.tips.join(' ')).not.toContain('Creatina');
    expect(result.training).toMatchObject({
      defaultRestSeconds: 60,
      tips: [
        'Los descansos entre series van a ser de 60 segundos de máximo.',
        'Beber mínimo 1L de agua en cada entrenamiento.',
      ],
      days: [
        {
          days: [1], title: 'TORSO', activeRest: false, details: '',
          exercises: [
            { exercise: 'Pres de banca plano con barra recta', series: '4', repetitions: '1º - 10\n2º - 10\n3º - 8\n4º - 8', details: '' },
            { exercise: 'Curl de bíceps + Pres francés', series: '4', repetitions: '12 - 12 - 10 - 8\n10 - 10 - 10 - 10', details: '', supersetExercises: ['Curl de bíceps', 'Pres francés'] },
            { exercise: 'Cardio en cinta', series: '1', repetitions: '30 Minutos de caminata', details: '' },
          ],
        },
        { days: [2, 3], title: 'DESCANSO ACTIVO', activeRest: true, details: '45 MINUTOS DE CAMINATA A BUEN RITMO', exercises: [] },
      ],
    });
  });

  it('overrides guessed exercise rows with the matching page geometry table', () => {
    const result = parseDietText([
      'DIETA 1\nALMUERZO\n-1 Huevo.',
      'ENTRENAMIENTO',
      {
        page: 2,
        text: 'DÍA 1 – TORSO\nEJERCICIOS SERIES REPETICIONES DETALLES\nRemo a 1 mano 3 12 1 parada de 3',
        trainingTable: { rows: [
          { columns: ['EJERCICIOS', 'SERIES', 'REPETICIONES', 'DETALLES'] },
          { columns: ['Remo a 1 mano', '3', '12', '1 parada de 3'], bounds: { left: 40, bottom: 600, right: 650, top: 640 } },
        ] },
      },
      {
        page: 3,
        text: 'DÍA 2 – PIERNA\nEJERCICIOS SERIES REPETICIONES DETALLES\nSentadilla 4 10',
        trainingTable: { rows: [
          { columns: ['EJERCICIOS', 'SERIES', 'REPETICIONES', 'DETALLES'] },
          { columns: ['Sentadilla búlgara', '4', '10\n8', '1 parada de 3 segundos'], bounds: { left: 40, bottom: 600, right: 650, top: 640 } },
        ] },
      },
    ]);

    expect(result.training?.days.map((day) => day.exercises)).toEqual([
      [{ exercise: 'Remo a 1 mano', series: '3', repetitions: '12', details: '1 parada de 3' }],
      [{ exercise: 'Sentadilla búlgara', series: '4', repetitions: '10\n8', details: '1 parada de 3 segundos' }],
    ]);
    expect(result.training?.days.flatMap((day) => day.exercises).map((row) => row.exercise)).not.toContain('mano');
  });

  it('maps preview crop sources by final day and exercise indexes without matching exercise text', () => {
    const parsed = parseDietTextWithExerciseCrops([
      'DIETA 1\nALMUERZO\n-1 Huevo.', 'ENTRENAMIENTO',
      { page: 3, text: 'DÍA 1 – TORSO', trainingTable: { rows: [
        { columns: ['EJERCICIOS', 'SERIES', 'REPETICIONES', 'DETALLES'] },
        { columns: ['Nombre original', '3', '12', ''], bounds: { left: 1, bottom: 2, right: 3, top: 4 } },
      ] } },
    ]);

    expect(parsed.result.training?.days[0].exercises[0].exercise).toBe('Nombre original');
    expect(parsed.exerciseCropSources).toEqual({ '0:0': { page: 3, bounds: { left: 1, bottom: 2, right: 3, top: 4 } } });
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
