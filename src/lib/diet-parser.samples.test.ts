import { describe, expect, it, vi } from 'vitest';

import { parseDietText } from './diet-parser';

describe('PDF sample regressions', () => {
  it('parses SEPTIEMBRE 2 with breakfast and no empty snack meal', async () => {
    const fsModule = 'node:fs/promises';
    const { readFile } = await import(/* @vite-ignore */ fsModule);
    vi.stubGlobal('DOMMatrix', class DOMMatrix {});
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(await readFile('samples/SEPTIEMBRE 2.pdf'));
    const loadingTask = pdfjs.getDocument({ data, isEvalSupported: false });
    const document = await loadingTask.promise;
    const pages: string[] = [];

    try {
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        let text = '';
        for (const item of content.items) {
          if (!('str' in item)) continue;
          text += item.str;
          text += item.hasEOL ? '\n' : ' ';
        }
        pages.push(text.trim());
      }
    } finally {
      await loadingTask.destroy();
    }

    const result = parseDietText(pages);
    expect(result.status).toBe('ok');
    for (const diet of result.diets) {
      expect(diet.meals.map((meal) => meal.type)).toEqual([
        'DESAYUNO', 'ALMUERZO', 'COMIDA', 'CENA',
      ]);
      expect(diet.meals[0].options[0].ingredient_lines.length).toBeGreaterThan(0);
      expect(diet.meals.some((meal) => meal.type === 'MERIENDA')).toBe(false);
    }

    const dinner = result.diets[0].meals.find((meal) => meal.type === 'CENA');
    const nuggets = dinner?.options.find((option) => option.name.includes('NUGGETS HEALTHY'));
    expect(nuggets?.description).toContain('Vamos a cortar el salmón a taquitos');
    expect(nuggets?.description).toContain('AirFryer');
    expect(nuggets?.description).not.toContain('ne- gra');

    const secondDinner = result.diets[1].meals.find((meal) => meal.type === 'CENA');
    expect(secondDinner?.options.find((option) => option.name.includes('BURRITO'))?.description).toContain('Tostamos la tortilla');
    expect(secondDinner?.options.find((option) => option.name.includes('TORTILLA DE PATATAS'))?.description).toContain('Vamos a cortar la patata');
  });

  it('parses all options and alternatives from SEPTIEMBRE3', async () => {
    const fsModule = 'node:fs/promises';
    const { readFile } = await import(/* @vite-ignore */ fsModule);
    vi.stubGlobal('DOMMatrix', class DOMMatrix {});
    const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
    const data = new Uint8Array(await readFile('samples/SEPTIEMBRE3.pdf'));
    const loadingTask = pdfjs.getDocument({ data, isEvalSupported: false });
    const document = await loadingTask.promise;
    const pages: string[] = [];

    try {
      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        let text = '';
        for (const item of content.items) {
          if (!('str' in item)) continue;
          text += item.str;
          text += item.hasEOL ? '\n' : ' ';
        }
        pages.push(text.trim());
      }
    } finally {
      await loadingTask.destroy();
    }

    const result = parseDietText(pages);
    const [diet1, diet2] = result.diets;
    expect(diet1.meals.find((meal) => meal.type === 'ALMUERZO')?.options).toHaveLength(3);
    expect(diet1.meals.find((meal) => meal.type === 'COMIDA')?.options.map((option) => option.name)).toEqual([
      'COMIDA 1', 'COMIDA 2 – ENSALADA DE PASTA',
    ]);
    expect(diet1.meals.find((meal) => meal.type === 'CENA')?.options.map((option) => option.name)).toEqual([
      'COMIDA 1 - QUESADILLA FIT', 'COMIDA 2 – ALBONDIGAS EN TOMATE', 'CENA 3 – NUGGUETS DE POLLO',
    ]);
    expect(diet2.meals.find((meal) => meal.type === 'COMIDA')?.options).toHaveLength(2);
    expect(diet2.meals.find((meal) => meal.type === 'CENA')?.options).toHaveLength(2);

    const diet2Lunch = diet2.meals.find((meal) => meal.type === 'COMIDA')?.options[0];
    expect(diet2Lunch?.ingredient_lines[0].items).toHaveLength(11);
    const meatballs = diet1.meals.find((meal) => meal.type === 'CENA')?.options[1];
    expect(meatballs?.ingredient_lines[2].items[0].sub_items?.[0]).toMatchObject({ name: 'Cebolla', quantity: 0.5 });
  });
});
