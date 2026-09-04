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
const ROW_PADDING = 6;
const FOOTER_TOP = MARGIN + 24;
const PAGE_START_Y = PAGE_HEIGHT - MARGIN;
const FIRST_PAGE_START_Y = PAGE_HEIGHT - 134;

interface PdfPage {
  content: string;
}

type PdfColor = [number, number, number];

const COLORS = {
  ink: [0.08, 0.08, 0.09] as PdfColor,
  muted: [0.34, 0.34, 0.38] as PdfColor,
  border: [0.82, 0.82, 0.85] as PdfColor,
  header: [0.05, 0.05, 0.06] as PdfColor,
  red: [0.86, 0.15, 0.15] as PdfColor,
  orange: [0.98, 0.45, 0.10] as PdfColor,
  orangeSoft: [1, 0.94, 0.86] as PdfColor,
  row: [1, 1, 1] as PdfColor,
  rowAlt: [0.985, 0.985, 0.99] as PdfColor,
  white: [1, 1, 1] as PdfColor,
};

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

function ingredientHeight(ingredient: string): number {
  return wrapText(ingredient, 90).length * 10 + ROW_PADDING * 2;
}

function mealHeight(meal: ExportMeal): number {
  const ingredients = meal.ingredients.length ? meal.ingredients : ['Sin ingredientes'];
  return 24 + Math.max(0, wrapText(meal.option, 62).length - 1) * 13
    + ingredients.reduce((height, ingredient) => height + ingredientHeight(ingredient), 0)
    + 10;
}

function dayHeight(day: ExportDay): number {
  return 34 + day.meals.reduce((height, meal) => height + mealHeight(meal), 0) + 8;
}

function colorCommand(color: PdfColor, operator: 'rg' | 'RG'): string {
  return `${color.join(' ')} ${operator}`;
}

function textCommand(text: string, x: number, y: number, size: number, font = 'F1', color = COLORS.ink): string {
  return `${colorCommand(color, 'rg')} BT /${font} ${size} Tf ${x.toFixed(2)} ${y.toFixed(2)} Td ${pdfString(text)} Tj ET\n`;
}

function fillRect(x: number, y: number, width: number, height: number, color: PdfColor): string {
  return `${colorCommand(color, 'rg')} ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f\n`;
}

function strokeRect(x: number, y: number, width: number, height: number, color: PdfColor, lineWidth = 0.6): string {
  return `${colorCommand(color, 'RG')} ${lineWidth} w ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S\n`;
}

function strokeLine(x1: number, y1: number, x2: number, y2: number, color: PdfColor, lineWidth = 0.5): string {
  return `${colorCommand(color, 'RG')} ${lineWidth} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;
}

export function createPlanPdfBytes(payload: ExportPayload, title = 'Plan semanal'): Uint8Array {
  const pages: PdfPage[] = [];
  let content = '';
  let y = PAGE_START_Y;

  function newPage(): void {
    if (content) pages.push({ content });
    content = '';
    y = PAGE_START_Y;
  }

  function ensureSpace(height: number): void {
    if (y - height < FOOTER_TOP) newPage();
  }

  function drawFooter(pageNumber: number): string {
    return `${strokeLine(MARGIN, 31, PAGE_WIDTH - MARGIN, 31, COLORS.border)}${textCommand(`Pagina ${pageNumber}`, PAGE_WIDTH - MARGIN - 54, 18, 8, 'F1', COLORS.muted)}`;
  }

  function drawDocumentHeader(): void {
    content += fillRect(0, PAGE_HEIGHT - 108, PAGE_WIDTH, 108, COLORS.header);
    content += fillRect(0, PAGE_HEIGHT - 108, PAGE_WIDTH, 7, COLORS.orange);
    content += textCommand(title, MARGIN, PAGE_HEIGHT - 58, 22, 'F2', COLORS.white);
    content += textCommand(`Resumen semanal · ${new Date(payload.generated_at).toLocaleDateString('es-ES')}`, MARGIN, PAGE_HEIGHT - 82, 10, 'F1', [0.88, 0.88, 0.90]);
    y = FIRST_PAGE_START_Y;
  }

  function drawDayHeader(day: ExportDay, continued = false): void {
    ensureSpace(36);
    content += fillRect(MARGIN, y - 25, CONTENT_WIDTH, 25, COLORS.red);
    content += textCommand(`Dia ${day.day}${continued ? ' (continuacion)' : ''}`, MARGIN + 10, y - 17, 11, 'F2', COLORS.white);
    content += textCommand(day.diet, MARGIN + 146, y - 17, 11, 'F2', COLORS.white);
    y -= 34;
  }

  function drawMealHeader(day: ExportDay, meal: ExportMeal): void {
    const requiredHeight = mealHeight(meal);
    const freshPageCapacity = PAGE_START_Y - FOOTER_TOP - 34;
    if (requiredHeight <= freshPageCapacity && y - requiredHeight < FOOTER_TOP) {
      newPage();
      drawDayHeader(day, true);
    } else if (y - 42 < FOOTER_TOP) {
      newPage();
      drawDayHeader(day, true);
    }
    content += fillRect(MARGIN, y - 24, CONTENT_WIDTH, 24, COLORS.orangeSoft);
    content += strokeRect(MARGIN, y - 24, CONTENT_WIDTH, 24, COLORS.border);
    content += textCommand(meal.type, MARGIN + 10, y - 16, 9, 'F2', COLORS.ink);
    const optionLines = wrapText(meal.option, 62);
    content += textCommand(optionLines[0] ?? meal.option, MARGIN + 96, y - 16, 9, 'F1', COLORS.ink);
    y -= 24;
    for (const extra of optionLines.slice(1)) {
      ensureSpace(13);
      content += textCommand(extra, MARGIN + 96, y - 9, 8, 'F1', COLORS.muted);
      y -= 13;
    }
  }

  function drawIngredientRow(day: ExportDay, meal: ExportMeal, ingredient: string, index: number): void {
    const lines = wrapText(ingredient, 90);
    const rowHeight = lines.length * 10 + ROW_PADDING * 2;
    if (y - rowHeight < FOOTER_TOP) {
      newPage();
      drawDayHeader(day, true);
      drawMealHeader(day, meal);
    }
    const bottom = y - rowHeight;
    content += fillRect(MARGIN, bottom, CONTENT_WIDTH, rowHeight, index % 2 === 0 ? COLORS.row : COLORS.rowAlt);
    content += strokeRect(MARGIN, bottom, CONTENT_WIDTH, rowHeight, COLORS.border, 0.4);
    let textY = y - ROW_PADDING - 8;
    for (const line of lines) {
      content += textCommand(line, MARGIN + 12, textY, 8.5, 'F1', COLORS.ink);
      textY -= 10;
    }
    y = bottom;
  }

  drawDocumentHeader();

  for (const day of payload.days) {
    const requiredHeight = dayHeight(day);
    const freshPageCapacity = PAGE_START_Y - FOOTER_TOP;
    if (requiredHeight <= freshPageCapacity && y - requiredHeight < FOOTER_TOP) newPage();
    drawDayHeader(day);
    for (const meal of day.meals) {
      drawMealHeader(day, meal);
      const ingredients = meal.ingredients.length ? meal.ingredients : ['Sin ingredientes'];
      ingredients.forEach((ingredient, index) => drawIngredientRow(day, meal, ingredient, index));
      y -= 10;
    }
    y -= 8;
  }

  if (content) pages.push({ content });
  pages.forEach((page, index) => page.content += drawFooter(index + 1));

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
    objects[contentIds[index]] = `<< /Length ${toBytes(page.content).length} >>\nstream\n${page.content}endstream`;
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
