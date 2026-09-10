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
  });
});
