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
    expect(content).toContain('COMIDA: Opción arroz');
    expect(content).toContain('- 2 huevos');
  });
});
