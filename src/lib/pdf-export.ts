interface ExportMeal {
  type: string;
  option: string;
  ingredients: string[];
}

interface ExportDay {
  day: number;
  diet: string;
  meals: ExportMeal[];
}

interface ExportPayload {
  generated_at: string;
  days: ExportDay[];
}

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 42;
const CONTENT_WIDTH = PAGE_WIDTH - MARGIN * 2;

function normalizeText(value: string): string {
  return value
    .replace(/[–—]/g, '-')
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/€/g, 'EUR');
}

function pdfString(value: string): string {
  const escaped = normalizeText(value).replace(/[\\()]/g, '\\$&');
  return `(${escaped})`;
}

function toBytes(value: string): Uint8Array {
  return Uint8Array.from(value, character => character.charCodeAt(0) & 0xff);
}

function wrapText(text: string, maxChars: number): string[] {
  const words = normalizeText(text).split(/\s+/).filter(Boolean);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const next = line ? `${line} ${word}` : word;
    if (next.length > maxChars && line) {
      lines.push(line);
      line = word;
    } else {
      line = next;
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

function textCommand(text: string, x: number, y: number, size: number, font = 'F1'): string {
  return `BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td ${pdfString(text)} Tj ET\n`;
}

export function createPlanPdfBytes(payload: ExportPayload, title = 'Plan semanal'): Uint8Array {
  const pages: string[] = [];
  let content = '';
  let y = PAGE_HEIGHT - MARGIN;

  function newPage() {
    if (content) pages.push(content);
    content = '';
    y = PAGE_HEIGHT - MARGIN;
  }

  function line(text: string, size = 10, indent = 0, font = 'F1') {
    const maxChars = Math.max(28, Math.floor((CONTENT_WIDTH - indent) / (size * 0.46)));
    for (const wrapped of wrapText(text, maxChars)) {
      if (y < MARGIN + 18) newPage();
      content += textCommand(wrapped, MARGIN + indent, y, size, font);
      y -= size + 5;
    }
  }

  line(title, 20, 0, 'F2');
  line(`Generado: ${new Date(payload.generated_at).toLocaleDateString('es-ES')}`, 9);
  y -= 8;

  for (const day of payload.days) {
    if (y < MARGIN + 92) newPage();
    line(`Dia ${day.day} - ${day.diet}`, 14, 0, 'F2');
    for (const meal of day.meals) {
      line(`${meal.type}: ${meal.option}`, 11, 10, 'F2');
      for (const ingredient of meal.ingredients) line(`- ${ingredient}`, 9, 22);
      y -= 3;
    }
    y -= 6;
  }
  if (content) pages.push(content);

  const objects: string[] = [];
  const catalogId = 1;
  const pagesId = 2;
  const fontRegularId = 3;
  const fontBoldId = 4;
  const firstPageId = 5;
  const contentStartId = firstPageId + pages.length;
  const pageIds = pages.map((_, index) => firstPageId + index);
  const contentIds = pages.map((_, index) => contentStartId + index);

  objects[catalogId] = `<< /Type /Catalog /Pages ${pagesId} 0 R >>`;
  objects[pagesId] = `<< /Type /Pages /Kids [${pageIds.map(id => `${id} 0 R`).join(' ')}] /Count ${pages.length} >>`;
  objects[fontRegularId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>';
  objects[fontBoldId] = '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>';

  for (const [index, page] of pages.entries()) {
    objects[pageIds[index]] = `<< /Type /Page /Parent ${pagesId} 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegularId} 0 R /F2 ${fontBoldId} 0 R >> >> /Contents ${contentIds[index]} 0 R >>`;
    objects[contentIds[index]] = `<< /Length ${toBytes(page).length} >>\nstream\n${page}endstream`;
  }

  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (let id = 1; id < objects.length; id += 1) {
    offsets[id] = toBytes(pdf).length;
    pdf += `${id} 0 obj\n${objects[id]}\nendobj\n`;
  }
  const xrefOffset = toBytes(pdf).length;
  pdf += `xref\n0 ${objects.length}\n0000000000 65535 f \n`;
  for (let id = 1; id < objects.length; id += 1) pdf += `${String(offsets[id]).padStart(10, '0')} 00000 n \n`;
  pdf += `trailer\n<< /Size ${objects.length} /Root ${catalogId} 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return toBytes(pdf);
}

export function createPlanPdfBlob(payload: ExportPayload, title?: string): Blob {
  return new Blob([createPlanPdfBytes(payload, title)], { type: 'application/pdf' });
}
