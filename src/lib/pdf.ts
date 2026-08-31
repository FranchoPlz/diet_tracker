import type { ParseResult } from './types';
import { parseDietText } from './diet-parser';
import pdfWorkerUrl from 'pdfjs-dist/build/pdf.worker.min.mjs?url';

export const MAX_PDF_SIZE = 20 * 1024 * 1024;

export function validatePdfFile(file: File): void {
  const hasPdfName = file.name.toLowerCase().endsWith('.pdf');
  const hasPdfType = file.type === 'application/pdf' || file.type === '';
  if (!hasPdfName || !hasPdfType) {
    throw new Error('Por favor, selecciona un archivo PDF válido.');
  }
  if (file.size === 0) throw new Error('El archivo PDF está vacío.');
  if (file.size > MAX_PDF_SIZE) {
    throw new Error('El archivo PDF es demasiado grande. El tamaño máximo es 20 MB.');
  }
}

function readFileBytes(file: File): Promise<ArrayBuffer> {
  if (typeof file.arrayBuffer === 'function') return file.arrayBuffer();
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result as ArrayBuffer);
    reader.onerror = () => reject(reader.error);
    reader.readAsArrayBuffer(file);
  });
}

/** Extract text in page order with the locally bundled PDF.js worker. */
export async function extractPdfPageTexts(file: File): Promise<string[]> {
  validatePdfFile(file);
  const data = new Uint8Array(await readFileBytes(file));
  if (String.fromCharCode(...data.slice(0, 5)) !== '%PDF-') {
    throw new Error('No se ha podido leer el PDF. Comprueba que el archivo no esté dañado.');
  }

  try {
    const pdfjs = await import('pdfjs-dist');
    pdfjs.GlobalWorkerOptions.workerSrc = pdfWorkerUrl;
    const loadingTask = pdfjs.getDocument({ data });
    try {
      const document = await loadingTask.promise;
      const pages: string[] = [];

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

      if (!pages.some((page) => page.trim().length > 0)) {
        throw new Error('No se ha encontrado texto en el PDF. Puede ser un documento escaneado.');
      }
      return pages;
    } finally {
      await loadingTask.destroy();
    }
  } catch (error) {
    if (error instanceof Error && error.message.startsWith('No se ha encontrado texto')) throw error;
    throw new Error('No se ha podido leer el PDF. Comprueba que el archivo no esté dañado.');
  }
}

export async function parsePdf(file: File): Promise<ParseResult> {
  return parseDietText(await extractPdfPageTexts(file));
}
