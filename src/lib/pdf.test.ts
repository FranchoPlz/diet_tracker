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

import { MAX_PDF_SIZE, extractPdfPageTexts, validatePdfFile } from './pdf';

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
      'DIETA 1\nALMUERZO',
      '-1 Huevo.',
    ]);
  });

  it('reports scanned PDFs that contain no text', async () => {
    await expect(extractPdfPageTexts(pdfFile(['%PDF-']))).rejects.toThrow('documento escaneado');
  });
});
