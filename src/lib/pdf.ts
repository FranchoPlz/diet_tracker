import type { ParseResult } from './types';
import { parseDietText, type DietPageText, type TrainingTable } from './diet-parser';
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

export interface PositionedTextItem {
  str: string;
  transform: ArrayLike<number>;
  width?: number;
  hasEOL?: boolean;
}

interface TextLine {
  y: number;
  items: Array<{ text: string; x: number }>;
}

const TRAINING_HEADERS = ['EJERCICIOS', 'SERIES', 'REPETICIONES', 'DETALLES'] as const;

function normalizedText(value: string): string {
  return value.trim().replace(/\s+/g, ' ').toUpperCase();
}

function appendCell(parts: string[], value: string): void {
  const text = value.trim().replace(/\s+/g, ' ');
  if (!text) return;
  if (parts.at(-1)?.endsWith('-')) parts[parts.length - 1] = parts.at(-1)!.slice(0, -1) + text;
  else parts.push(text);
}

/** Build a training table from PDF text coordinates without relying on PDF.js internals. */
export function extractTrainingTable(items: readonly PositionedTextItem[], yTolerance = 2): TrainingTable | undefined {
  const positioned = items.flatMap((item) => {
    const text = item.str.trim();
    const x = Number(item.transform[4]);
    const y = Number(item.transform[5]);
    return text && Number.isFinite(x) && Number.isFinite(y) ? [{ text, x, y }] : [];
  });
  const lines: TextLine[] = [];
  for (const item of [...positioned].sort((a, b) => b.y - a.y || a.x - b.x)) {
    const line = lines.find((value) => Math.abs(value.y - item.y) <= yTolerance);
    if (line) {
      line.items.push({ text: item.text, x: item.x });
      line.y = (line.y * (line.items.length - 1) + item.y) / line.items.length;
    } else {
      lines.push({ y: item.y, items: [{ text: item.text, x: item.x }] });
    }
  }
  for (const line of lines) line.items.sort((a, b) => a.x - b.x);

  const headerLine = lines.find((line) => TRAINING_HEADERS.every((header) => line.items.some((item) => normalizedText(item.text) === header)));
  if (!headerLine) return undefined;
  const anchors = TRAINING_HEADERS.map((header) => headerLine.items.find((item) => normalizedText(item.text) === header)!.x);
  if (!anchors.every((anchor, index) => index === 0 || anchor > anchors[index - 1])) return undefined;
  const boundaries = anchors.slice(0, -1).map((anchor, index) => (anchor + anchors[index + 1]) / 2);
  const nextDayY = lines.find((line) => line.y < headerLine.y && /^D[IÍ]A\s+\d/i.test(normalizedText(line.items.map((item) => item.text).join(' '))))?.y;

  const physicalRows = lines
    .filter((line) => line.y < headerLine.y - yTolerance && (nextDayY === undefined || line.y > nextDayY))
    .sort((a, b) => b.y - a.y)
    .map((line) => {
      const columns: string[][] = [[], [], [], []];
      for (const item of line.items) {
        let column = boundaries.findIndex((boundary) => item.x < boundary);
        if (column < 0) column = 3;
        appendCell(columns[column], item.text);
      }
      return { y: line.y, columns: columns.map((column) => column.join(' ')) };
    });

  const rows: string[][][] = [];
  let current: string[][] = [[], [], [], []];
  for (const row of physicalRows) {
    const startsSuperset = /^SUPERSERIE$/i.test(row.columns[0]);
    if ((row.columns[1] || startsSuperset) && current[1].length > 0) {
      rows.push(current);
      current = [[], [], [], []];
    }
    row.columns.forEach((value, column) => appendCell(current[column], value));
  }
  if (current[1].length > 0) rows.push(current);

  const tableRows = rows
    .map((columns): [string, string, string, string] => [
      columns[0].join('\n'), columns[1].join(' '), columns[2].join('\n'), columns[3].join('\n'),
    ])
    .filter((columns) => columns[0] && columns[1]);
  if (tableRows.length === 0) return undefined;
  return [[...TRAINING_HEADERS], ...tableRows];
}

/** Extract text in page order with the locally bundled PDF.js worker. */
export async function extractPdfPageTexts(file: File): Promise<DietPageText[]> {
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
      const pages: DietPageText[] = [];

      for (let pageNumber = 1; pageNumber <= document.numPages; pageNumber += 1) {
        const page = await document.getPage(pageNumber);
        const content = await page.getTextContent();
        let text = '';
        for (const item of content.items) {
          if (!('str' in item)) continue;
          text += item.str;
          text += item.hasEOL ? '\n' : ' ';
        }
        const trainingTable = extractTrainingTable(content.items.filter((item): item is typeof item & PositionedTextItem => 'str' in item && 'transform' in item));
        pages.push({ page: pageNumber, text: text.trim(), ...(trainingTable ? { trainingTable } : {}) });
      }

      if (!pages.some((page) => typeof page === 'string' ? page.trim().length > 0 : page.text.trim().length > 0)) {
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
