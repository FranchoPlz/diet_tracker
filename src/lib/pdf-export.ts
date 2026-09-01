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
const ROW_PADDING = 5;

interface PdfPage {
  content: string;
}

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

function fillRect(x: number, y: number, width: number, height: number, color: [number, number, number]): string {
  return `${color.join(' ')} rg ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f\n`;
}

function strokeRect(x: number, y: number, width: number, height: number, color: [number, number, number], lineWidth = 0.8): string {
  return `${color.join(' ')} RG ${lineWidth} w ${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S\n`;
}

function strokeLine(x1: number, y1: number, x2: number, y2: number, color: [number, number, number], lineWidth = 0.6): string {
  return `${color.join(' ')} RG ${lineWidth} w ${x1.toFixed(2)} ${y1.toFixed(2)} m ${x2.toFixed(2)} ${y2.toFixed(2)} l S\n`;
}

export function createPlanPdfBytes(payload: ExportPayload, title = 'Plan semanal'): Uint8Array {
  const pages: PdfPage[] = [];
  let content = '';
  let y = PAGE_HEIGHT - MARGIN;
  const tableX = MARGIN;
  const columnWidths = [76, 132, CONTENT_WIDTH - 76 - 132];
  const tableBorder: [number, number, number] = [0.84, 0.84, 0.86];
  const tableHeader: [number, number, number] = [0.98, 0.33, 0.12];
  const dayHeader: [number, number, number] = [0.86, 0.15, 0.15];
  const rowAlt: [number, number, number] = [0.98, 0.98, 0.98];

  function newPage() {
    if (content) pages.push({ content });
    content = '';
    y = PAGE_HEIGHT - MARGIN;
  }

  function ensureSpace(height: number) {
    if (y - height < MARGIN + 22) newPage();
  }

  function line(text: string, size = 10, indent = 0, font = 'F1') {
    const maxChars = Math.max(28, Math.floor((CONTENT_WIDTH - indent) / (size * 0.46)));
    for (const wrapped of wrapText(text, maxChars)) {
      ensureSpace(size + 5);
      content += textCommand(wrapped, MARGIN + indent, y, size, font);
      y -= size + 5;
    }
  }

  function drawPageFooter(pageNumber: number) {
    return `${strokeLine(MARGIN, 31, PAGE_WIDTH - MARGIN, 31, tableBorder, 0.5)}${textCommand(`Pagina ${pageNumber}`, PAGE_WIDTH - MARGIN - 54, 18, 8)}`;
  }

  function drawTableHeader() {
    const height = 20;
    ensureSpace(height + 8);
    content += fillRect(tableX, y - height, CONTENT_WIDTH, height, tableHeader);
    content += textCommand('Comida', tableX + ROW_PADDING, y - 13, 8.5, 'F2');
    content += textCommand('Opcion', tableX + columnWidths[0] + ROW_PADDING, y - 13, 8.5, 'F2');
    content += textCommand('Ingrediente', tableX + columnWidths[0] + columnWidths[1] + ROW_PADDING, y - 13, 8.5, 'F2');
    y -= height;
  }

  function drawIngredientRow(cells: [string, string, string], shaded: boolean) {
    const wrappedCells = [
      wrapText(cells[0], 12),
      wrapText(cells[1], 23),
      wrapText(cells[2], 56),
    ];
    const rowHeight = Math.max(...wrappedCells.map(lines => lines.length)) * 10 + ROW_PADDING * 2;
    if (y - rowHeight < MARGIN + 22) {
      newPage();
      drawTableHeader();
    }
    const bottom = y - rowHeight;
    if (shaded) content += fillRect(tableX, bottom, CONTENT_WIDTH, rowHeight, rowAlt);
    content += strokeRect(tableX, bottom, CONTENT_WIDTH, rowHeight, tableBorder, 0.45);
    content += strokeLine(tableX + columnWidths[0], bottom, tableX + columnWidths[0], y, tableBorder, 0.45);
    content += strokeLine(tableX + columnWidths[0] + columnWidths[1], bottom, tableX + columnWidths[0] + columnWidths[1], y, tableBorder, 0.45);
    wrappedCells.forEach((lines, index) => {
      const x = tableX + columnWidths.slice(0, index).reduce((sum, width) => sum + width, 0) + ROW_PADDING;
      let textY = y - ROW_PADDING - 7;
      for (const wrapped of lines) {
        if (!wrapped) continue;
        content += textCommand(wrapped, x, textY, 8, index === 0 ? 'F2' : 'F1');
        textY -= 10;
      }
    });
    y = bottom;
  }

  function drawMealRows(meal: ExportMeal, mealIndex: number) {
    const ingredients = meal.ingredients.length ? meal.ingredients : ['Sin ingredientes'];
    ingredients.forEach((ingredient, ingredientIndex) => {
      drawIngredientRow([
        ingredientIndex === 0 ? meal.type : '',
        ingredientIndex === 0 ? meal.option : '',
        ingredient,
      ], (mealIndex + ingredientIndex) % 2 === 1);
    });
  }

  function estimateMealHeight(meal: ExportMeal): number {
    const ingredients = meal.ingredients.length ? meal.ingredients : ['Sin ingredientes'];
    return ingredients.reduce((sum, ingredient, index) => {
      const cells = [index === 0 ? meal.type : '', index === 0 ? meal.option : '', ingredient];
      const lines = Math.max(wrapText(cells[0], 12).length, wrapText(cells[1], 23).length, wrapText(cells[2], 56).length);
      return sum + lines * 10 + ROW_PADDING * 2;
    }, 0);
  }

  function estimateDayHeight(day: ExportDay): number {
    return 24 + 24 + day.meals.reduce((sum, meal) => sum + estimateMealHeight(meal), 0) + 18;
  }

  content += fillRect(0, PAGE_HEIGHT - 108, PAGE_WIDTH, 108, [0.05, 0.05, 0.06]);
  content += fillRect(0, PAGE_HEIGHT - 108, PAGE_WIDTH, 7, [0.98, 0.33, 0.12]);
  content += textCommand(title, MARGIN, PAGE_HEIGHT - 58, 22, 'F2');
  content += textCommand(`Dieta seleccionada · ${new Date(payload.generated_at).toLocaleDateString('es-ES')}`, MARGIN, PAGE_HEIGHT - 82, 10);
  y = PAGE_HEIGHT - 136;

  for (const day of payload.days) {
    ensureSpace(Math.min(estimateDayHeight(day), 180));
    content += fillRect(MARGIN, y - 24, CONTENT_WIDTH, 24, dayHeader);
    content += textCommand(`Dia ${day.day}`, MARGIN + 10, y - 16, 11, 'F2');
    content += textCommand(day.diet, MARGIN + 74, y - 16, 11, 'F2');
    y -= 28;
    drawTableHeader();
    day.meals.forEach(drawMealRows);
    y -= 16;
  }
  if (content) pages.push({ content });
  pages.forEach((page, index) => page.content += drawPageFooter(index + 1));

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
