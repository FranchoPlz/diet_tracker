import { describe, expect, it, vi } from 'vitest';

vi.mock('pdfjs-dist', () => ({
  GlobalWorkerOptions: { workerSrc: '' },
  getDocument: ({ data }: { data: Uint8Array }) => ({
    promise: Promise.resolve({
      numPages: data.length === 5 ? 1 : 2,
      getPage: (pageNumber: number) => Promise.resolve({
        getTextContent: () => Promise.resolve({
          items: data.length === 5
            ? []
            : pageNumber === 1
              ? [{ str: 'DIETA 1', hasEOL: true }, { str: 'ALMUERZO', hasEOL: false }]
              : [{ str: '-1 Huevo.', hasEOL: false }],
        }),
      }),
    }),
    destroy: vi.fn().mockResolvedValue(undefined),
  }),
}));

import { MAX_PDF_SIZE, extractPdfPageTexts, extractTrainingTable, validatePdfFile } from './pdf';

function pdfFile(parts: BlobPart[], name = 'diet.pdf', type = 'application/pdf'): File {
  return new File(parts, name, { type });
}

describe('PDF validation', () => {
  it('rejects non-PDF files and oversized PDFs with Spanish errors', () => {
    expect(() => validatePdfFile(pdfFile(['text'], 'diet.txt', 'text/plain'))).toThrow('archivo PDF válido');
    expect(() => validatePdfFile(pdfFile([new Uint8Array(MAX_PDF_SIZE + 1)]))).toThrow('tamaño máximo es 20 MB');
  });

  it('rejects empty and malformed PDFs', async () => {
    expect(() => validatePdfFile(pdfFile([]))).toThrow('PDF está vacío');
    await expect(extractPdfPageTexts(pdfFile(['not a pdf']))).rejects.toThrow('archivo no esté dañado');
  });

  it('extracts page text in order', async () => {
    await expect(extractPdfPageTexts(pdfFile(['%PDF-text']))).resolves.toEqual([
      { page: 1, text: 'DIETA 1\nALMUERZO' },
      { page: 2, text: '-1 Huevo.' },
    ]);
  });

  it('reports scanned PDFs that contain no text', async () => {
    await expect(extractPdfPageTexts(pdfFile(['%PDF-']))).rejects.toThrow('documento escaneado');
  });
});

describe('training table geometry', () => {
  it('partitions columns, assembles wrapped rows, and dehyphenates words', () => {
    const item = (str: string, x: number, y: number) => ({ str, transform: [1, 0, 0, 1, x, y] });
    const table = extractTrainingTable([
      item('EJERCICIOS', 40, 700), item('SERIES', 260, 700), item('REPETICIONES', 330, 700), item('DETALLES', 470, 700),
      item('Press incli-', 40, 680), item('4', 260, 680), item('10', 330, 680), item('Con control', 470, 680),
      item('nado con mancuernas', 40, 668), item('8', 330, 668),
      item('Remo a 1 mano', 40, 645), item('3', 260, 645), item('12', 330, 645), item('1 parada de 3', 470, 645),
      item('DÍA 2', 240, 600), item('DESCANSO ACTIVO', 300, 600), item('45 MINUTOS', 200, 580),
    ]);

    expect(table?.rows.map((row) => row.columns)).toEqual([
      ['EJERCICIOS', 'SERIES', 'REPETICIONES', 'DETALLES'],
      ['Press inclinado con mancuernas', '4', '10\n8', 'Con control'],
      ['Remo a 1 mano', '3', '12', '1 parada de 3'],
    ]);
  });

  it('does not guess a table without four ordered header anchors', () => {
    const item = (str: string, x: number, y: number) => ({ str, transform: [1, 0, 0, 1, x, y] });
    expect(extractTrainingTable([item('EJERCICIOS SERIES REPETICIONES DETALLES', 40, 700)])).toBeUndefined();
  });
});
