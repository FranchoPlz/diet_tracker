import { describe, expect, it } from 'vitest';
import abrilFixture from '../../tests/fixtures/abril_golden.json';
import type { ParseResult } from './types';
import { createPlanPdfBytes } from './pdf-export';
import { buildExportPayload } from './utils';
import { createDefaultWeekConfig } from './utils';

async function extractText(bytes: Uint8Array): Promise<string> {
  if (!('DOMMatrix' in globalThis)) {
    Object.defineProperty(globalThis, 'DOMMatrix', {
      configurable: true,
      value: class DOMMatrix {
        a = 1; b = 0; c = 0; d = 1; e = 0; f = 0;
        multiplySelf() { return this; }
        preMultiplySelf() { return this; }
        translateSelf() { return this; }
        scaleSelf() { return this; }
        rotateSelf() { return this; }
        invertSelf() { return this; }
        transformPoint(point: { x?: number; y?: number }) { return { x: point.x ?? 0, y: point.y ?? 0 }; }
      },
    });
  }
  const pdfjs = await import('pdfjs-dist/legacy/build/pdf.mjs');
  const document = await pdfjs.getDocument({ data: bytes.slice() }).promise;
  const pages: string[] = [];
  for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
    const page = await document.getPage(pageNumber);
    const content = await page.getTextContent();
    pages.push(content.items.map(item => 'str' in item ? item.str : '').join(' '));
  }
  await document.destroy();
  return pages.join('\n');
}

describe('PDF plan export', () => {
  it('creates a readable PDF with all selected meals and ingredients', async () => {
    const bytes = createPlanPdfBytes({
      generated_at: '2026-09-01T00:00:00.000Z',
      days: [{
        day: 1,
        diet: 'DIETA 1',
        meals: [
          { type: 'ALMUERZO', option: 'Opción tostada', ingredients: ['Pan integral', 'Aceite de oliva'] },
          { type: 'COMIDA', option: 'Opción arroz', ingredients: ['100 g arroz', '2 huevos'] },
          { type: 'MERIENDA', option: 'Opción yogur', ingredients: ['Yogur natural'] },
          { type: 'CENA', option: 'Opción pescado', ingredients: ['Merluza', 'Verduras'] },
        ],
      }],
    }, 'Plan prueba');
    const content = new TextDecoder('latin1').decode(bytes);
    const extracted = await extractText(bytes);

    expect(content.startsWith('%PDF-1.4')).toBe(true);
    expect(content).toContain('/Type /Page');
    expect(content).toContain('Plan prueba');
    expect(extracted).toContain('Dia 1');
    expect(extracted).toContain('DIETA 1');
    expect(extracted).toContain('ALMUERZO');
    expect(extracted).toContain('COMIDA');
    expect(extracted).toContain('MERIENDA');
    expect(extracted).toContain('CENA');
    expect(extracted).toContain('Opción tostada');
    expect(extracted).toContain('Opción arroz');
    expect(extracted).toContain('Opción yogur');
    expect(extracted).toContain('Opción pescado');
    expect(extracted).toContain('Pan integral');
    expect(extracted).toContain('Aceite de oliva');
    expect(extracted).toContain('100 g arroz');
    expect(extracted).toContain('2 huevos');
    expect(extracted).toContain('Yogur natural');
    expect(extracted).toContain('Merluza');
    expect(extracted).toContain('Verduras');
    expect(content).toContain('COMIDA');
    expect(content).toContain(' re f');
    expect(content).toContain(' re S');
    expect(content).toContain('Pagina 1');
  });

  it('exports the real ABRIL fixture with seven days and every meal type readable', async () => {
    const payload = buildExportPayload(abrilFixture as ParseResult, createDefaultWeekConfig(), null, []);
    const bytes = createPlanPdfBytes(payload, 'ABRIL');
    const extracted = await extractText(bytes);

    for (const day of [1, 2, 3, 4, 5, 6, 7]) expect(extracted).toContain(`Dia ${day}`);
    for (const meal of ['ALMUERZO', 'COMIDA', 'MERIENDA', 'CENA']) expect(extracted).toContain(meal);
    expect(extracted).toContain('DIETA 1');
    expect(extracted).toContain('DIETA 2');
    expect(extracted).toContain('Barra de Pan');
    expect(extracted).toContain('NUGGETS HEALTHY');
    expect(extracted).toContain('Garbanzos');
  });
});
