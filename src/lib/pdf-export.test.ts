import { describe, expect, it } from 'vitest';
import { createPlanPdfBytes } from './pdf-export';

describe('PDF plan export', () => {
  it('creates a downloadable PDF with selected meals and ingredients', () => {
    const bytes = createPlanPdfBytes({
      generated_at: '2026-09-01T00:00:00.000Z',
      days: [{
        day: 1,
        diet: 'DIETA 1',
        meals: [{ type: 'COMIDA', option: 'Opción arroz', ingredients: ['100 g arroz', '2 huevos'] }],
      }],
    }, 'Plan prueba');
    const content = new TextDecoder('latin1').decode(bytes);

    expect(content.startsWith('%PDF-1.4')).toBe(true);
    expect(content).toContain('/Type /Page');
    expect(content).toContain('Plan prueba');
    expect(content).toContain('Comida');
    expect(content).toContain('Opcion');
    expect(content).toContain('Ingrediente');
    expect(content).toContain('COMIDA');
    expect(content).toContain('Opción arroz');
    expect(content).toContain('100 g arroz');
    expect(content).toContain('2 huevos');
    expect(content).not.toContain('100 g arroz · 2 huevos');
    expect(content).toContain(' re f');
    expect(content).toContain(' re S');
    expect(content).toContain('Pagina 1');
  });
});
