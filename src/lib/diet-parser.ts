import type { DietPlan, IngredientItem, IngredientLine, Meal, MealOption, ParseResult } from './types';

export type DietPageText = string | { page: number; text: string };

const MEAL_TYPES = ['ALMUERZO', 'COMIDA', 'MERIENDA', 'CENA'] as const;
const MEAL_HEADER_RE = /^\s*(ALMUERZO|COMIDA|MERIENDA|CENA)\s*$/;
const OPTION_HEADER_RE = /^\s*-?\s*((?:OPCI[ÓO]N\s+\d+(?:\s+DE\s+\w+)?(?:\s*[–-]\s*.+)?)|(?:OPCI[ÓO]N\s+\d+\s+\w.*?)|(?:CENA\s+\d+(?:\s*[–-]\s*.+)?))\s*$/i;
const SECTION_END_RE = /^\s*(?:SUPLEMENTACI[ÓO]N|ENTRENAMIENTO)\s*$/im;
const RECIPE_INDICATORS_RE = /\b(vamos|cortamos|cuando|llevamos|sartén|plancha\s+y|horno\s+y|mezclar|servir|añadir|batimos|prepararlo|hacerlo|pochando|introducimos|enrolladlo|calentamos|colocamos|rellenando|enrrollamos|listo|mandamos|batiremos|mezclamos|corregimos|tostamos|¿cómo|como lo vamos|condimentamos|salpimentándolos|hacerse)\b/i;
const RECIPE_VERB_START_RE = /^(Vamos|Cortamos|Cuando|Llevamos|Mezclar|Servir|Añadir|Batimos|Condimentamos|Calentamos|Colocamos|Rellenando|Enrrollamos|Tostamos|Mandamos|Mezclamos|Corregimos|Salpimentándolos|Hacerse|¿)/i;

const NUMBER_PATTERN = '(?:\\d+(?:[.,]\\d+)?|[¼½¾]|\\d+\\s*\\/\\s*\\d+)';
const QTY_UNIT_DE_RE = new RegExp(`^(${NUMBER_PATTERN})\\s*(kg|g|ml|l|litros?|gramos?|kilos?)\\s+de\\s+(.+)$`, 'i');
const QTY_UNIT_NOSPACE_RE = new RegExp(`^(${NUMBER_PATTERN})\\s*(kg|g|ml|l|litros?|gramos?|kilos?)\\s+([A-ZÁÉÍÓÚÑ].+)$`, 'u');
const QTY_MISSING_UNIT_RE = /^(\d+(?:\.\d+)?)\s+de\s+(.+)$/i;
const QTY_NAMED_UNIT_DE_RE = new RegExp(`^(${NUMBER_PATTERN})\\s+(Cucharadas?|Lonchas?|Onzas?|Puñados?|Vasitos?|Bolas?|Latas?|Paquetes?|Botes?|Tarros?|Tarrinas?|Botellas?)\\s+de\\s+(.+)$`, 'i');
const QTY_NAMED_UNIT_RE = new RegExp(`^(${NUMBER_PATTERN})\\s+(Cucharadas?|Lonchas?|Lonchad?|Onzas?|Puñados?|Vasitos?|Bolas?|Latas?|Paquetes?|Botes?|Tarros?|Tarrinas?|Botellas?)\\s+(.+)$`, 'i');
const QTY_COUNT_RE = /^(\d+)\s+(.+)$/i;
const FRACTION_RE = /^([¼½¾]|\d+\s*\/\s*\d+)\s+(.+)$/i;
const INGREDIENT_START_RE = /^(?:\d+(?:[.,]\d+)?\s*(?:kg|g|ml|l)\b|\d+\s*[A-ZÁÉÍÓÚÑ]|[¼½¾]\s+|\d+\s*\/\s*\d+\s+)/;

const TYPO_CORRECTIONS: ReadonlyArray<readonly [string, string]> = [
  ['planhca', 'plancha'],
  ['Lonchad e', 'Loncha de'],
  ['lonchad e', 'Loncha de'],
];
const FRACTIONS: Record<string, number> = { '¼': 0.25, '½': 0.5, '¾': 0.75 };
const NAMED_UNITS: Record<string, string> = {
  cucharada: 'cucharada', loncha: 'loncha', lonchad: 'loncha', onza: 'onza',
  puñado: 'puñado', vasito: 'vasito', bola: 'bola', lata: 'lata', paquete: 'paquete',
  bote: 'bote', tarro: 'tarro', tarrina: 'tarrina', botella: 'botella',
};

type MutableItem = Omit<IngredientItem, 'note'> & { note?: string };

function cleanEnd(value: string): string {
  return value.trim().replace(/[.,;]+$/, '');
}

function parseQuantity(value: string): number {
  const normalized = value.trim();
  if (normalized in FRACTIONS) return FRACTIONS[normalized];
  if (normalized.includes('/')) {
    const [numerator, denominator] = normalized.split('/', 2);
    return Number(numerator.trim()) / Number(denominator.trim());
  }
  return Number(normalized.replace(',', '.'));
}

function normalizeMeasure(quantity: number, unit: string): [number, string] {
  const normalized = unit.toLowerCase();
  if (['kg', 'kilo', 'kilos'].includes(normalized)) return [quantity * 1000, 'g'];
  if (['l', 'litro', 'litros'].includes(normalized)) return [quantity * 1000, 'ml'];
  if (['gramo', 'gramos'].includes(normalized)) return [quantity, 'g'];
  return [quantity, normalized];
}

function extractNote(name: string): [string, string | undefined] {
  const match = name.match(/\(([^)]+)\)\s*$/);
  if (!match || match.index === undefined) return [name, undefined];
  return [cleanEnd(name.slice(0, match.index)), match[1]];
}

function makeItem(name: string, quantity: number | null, unit: string | null, note?: string): MutableItem {
  const item: MutableItem = { name, quantity, unit };
  if (note) item.note = note;
  return item;
}

export function parseIngredient(rawValue: string): MutableItem {
  let raw = cleanEnd(rawValue);
  let note: string | undefined;

  if (/CANTIDAD LIBRE/i.test(raw)) {
    raw = cleanEnd(raw.replace(/\s*(?:PUEDE SER EN )?CANTIDAD LIBRE/i, '').replace(/\)$/, ''));
    note = 'cantidad libre';
  }

  const range = raw.match(/^(\d+)-(\d+)\s+(.+)$/);
  if (range) {
    const [name, parenthetical] = extractNote(cleanEnd(range[3]));
    return makeItem(name, null, null, note ?? parenthetical ?? `${range[1]}-${range[2]} unidades`);
  }

  let match = raw.match(QTY_UNIT_DE_RE) ?? raw.match(QTY_UNIT_NOSPACE_RE);
  if (match) {
    const [quantity, unit] = normalizeMeasure(parseQuantity(match[1]), match[2]);
    const [name, parenthetical] = extractNote(cleanEnd(match[3]));
    return makeItem(name, quantity, unit, note ?? parenthetical);
  }

  match = raw.match(QTY_MISSING_UNIT_RE);
  if (match) {
    const [name, parenthetical] = extractNote(cleanEnd(match[2]));
    return makeItem(name, parseQuantity(match[1]), 'g', note ?? parenthetical);
  }

  match = raw.match(QTY_NAMED_UNIT_DE_RE) ?? raw.match(QTY_NAMED_UNIT_RE);
  if (match) {
    const unit = match[2].toLowerCase().replace(/s$/, '');
    const [name, parenthetical] = extractNote(cleanEnd(match[3]));
    return makeItem(name, parseQuantity(match[1]), NAMED_UNITS[unit] ?? 'unidad', note ?? parenthetical);
  }

  match = raw.match(FRACTION_RE);
  if (match) {
    const [name, parenthetical] = extractNote(cleanEnd(match[2]));
    return makeItem(name, parseQuantity(match[1]), 'unidad', note ?? parenthetical);
  }

  match = raw.match(QTY_COUNT_RE);
  if (match) {
    const [name, parenthetical] = extractNote(cleanEnd(match[2]));
    return makeItem(name, Number(match[1]), 'unidad', note ?? parenthetical);
  }

  const [name, parenthetical] = extractNote(raw);
  return makeItem(name, null, null, note ?? parenthetical);
}

function isRecipeLine(line: string): boolean {
  return line.trim().length > 0 && RECIPE_INDICATORS_RE.test(line.trim());
}

export function joinWrappedLines(rawText: string): string[] {
  const logicalLines: string[] = [];
  let current: string | undefined;

  for (const rawLine of rawText.split('\n')) {
    const line = rawLine.trim();
    if (!line) continue;
    if (current?.endsWith('-')) {
      current = current.slice(0, -1) + line;
      continue;
    }
    if (line === '-') continue;

    if (line.startsWith('-')) {
      const content = line.replace(/^-+/, '').trim();
      if (content.startsWith('¿') || RECIPE_VERB_START_RE.test(content)) {
        if (current !== undefined) logicalLines.push(current);
        current = undefined;
        continue;
      }
      if (current !== undefined) logicalLines.push(current);
      current = line;
    } else if (INGREDIENT_START_RE.test(line)) {
      if (current?.trimEnd().endsWith('/')) {
        current += ` ${line}`;
        continue;
      }
      if (current !== undefined) logicalLines.push(current);
      current = `-${line}`;
    } else {
      if (isRecipeLine(line)) {
        if (current !== undefined) logicalLines.push(current);
        current = undefined;
        continue;
      }
      if (current !== undefined) current += ` ${line}`;
    }
  }

  if (current !== undefined) logicalLines.push(current);
  return logicalLines;
}

function parseCombination(raw: string): MutableItem {
  const subItems = raw.split(' + ').map((part) => parseIngredient(part.trim()));
  return {
    name: subItems.map((item) => item.name).join(' + '),
    quantity: null,
    unit: null,
    note: raw,
    is_combination: true,
    sub_items: subItems as IngredientItem[],
  };
}

function parseIngredientLine(line: string): IngredientLine {
  let content = line.replace(/^-+/, '').trim();
  for (const [wrong, replacement] of TYPO_CORRECTIONS) content = content.replaceAll(wrong, replacement);

  if (content.includes('/')) {
    return {
      items: content.split('/').map((part) => {
        const item = cleanEnd(part);
        return item.includes(' + ') ? parseCombination(item) : parseIngredient(item);
      }) as IngredientItem[],
      is_alternatives: true,
      is_combination: false,
    };
  }
  if (content.includes(' + ')) {
    return { items: [parseCombination(content) as IngredientItem], is_alternatives: false, is_combination: true };
  }
  return { items: [parseIngredient(content) as IngredientItem], is_alternatives: false, is_combination: false };
}

function parseIngredients(rawText: string): IngredientLine[] {
  return joinWrappedLines(rawText)
    .filter((line) => line.trim().startsWith('-'))
    .map(parseIngredientLine);
}

function splitIntoOptions(mealType: Meal['type'], body: string): MealOption[] {
  const lines = body.split('\n');
  const positions = lines.flatMap((line, index) => OPTION_HEADER_RE.test(line) ? [index] : []);
  if (positions.length === 0) {
    return [{ name: mealType, description: null, ingredient_lines: parseIngredients(body.trim()) }];
  }
  return positions.map((position, index) => ({
    name: lines[position].replace(/^\s*-\s*/, '').trim(),
    description: null,
    ingredient_lines: parseIngredients(lines.slice(position + 1, positions[index + 1] ?? lines.length).join('\n').trim()),
  }));
}

function parseDiet(name: string, body: string): DietPlan {
  const lines = body.split('\n');
  const firstMeal = lines.findIndex((line) => MEAL_HEADER_RE.test(line));
  const intro = (firstMeal < 0 ? lines : lines.slice(0, firstMeal)).map((line) => line.trim()).filter(Boolean).join('\n');
  const mealLines = firstMeal < 0 ? [] : lines.slice(firstMeal);
  const chunks: Array<{ type: Meal['type']; lines: string[] }> = [];

  for (const line of mealLines) {
    const header = line.match(MEAL_HEADER_RE);
    if (header) chunks.push({ type: header[1] as Meal['type'], lines: [] });
    else chunks.at(-1)?.lines.push(line);
  }

  return {
    name,
    intro,
    meals: chunks.map(({ type, lines: optionLines }) => ({ type, options: splitIntoOptions(type, optionLines.join('\n')) })),
  };
}

/** Parse already-extracted page text. This function has no PDF.js or browser dependency. */
export function parseDietText(pageTexts: readonly DietPageText[]): ParseResult {
  const relevantPages: string[] = [];
  for (const page of pageTexts) {
    const text = typeof page === 'string' ? page : page.text;
    if (SECTION_END_RE.test(text)) break;
    relevantPages.push(text);
  }

  const parts = relevantPages.join('\n').split(/(DIETA\s+\d+)/i);
  const diets: DietPlan[] = [];
  for (let index = 1; index < parts.length - 1; index += 2) {
    diets.push(parseDiet(parts[index].trim().toUpperCase(), parts[index + 1]));
  }
  if (diets.length === 0) throw new Error('No se han encontrado secciones DIETA en el PDF.');
  return { status: 'ok', diets };
}

export { MEAL_TYPES };
