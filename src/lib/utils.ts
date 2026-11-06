import {
  MEAL_TYPES,
  type DaySelection,
  type DietDefaults,
  type DietPlan,
  type IngredientItem,
  type IngredientLine,
  type Meal,
  type MealOption,
  type MealType,
  type ParseResult,
  type WeekConfig,
  type WeekTracker,
} from './types';

export const WEEKDAY_NAMES = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

/** Deep copy of plain JSON data; also unwraps Svelte state proxies. */
export function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function createWeekTracker(overrides: Partial<WeekTracker> = {}): WeekTracker {
  return {
    startedAt: new Date().toISOString(),
    activeDayIndex: 0,
    weekNumber: 1,
    trainingWeights: {},
    trainingRepetitions: {},
    exerciseNotes: {},
    cardioByDay: {},
    stepsByDay: {},
    ...overrides,
  };
}

function createDietDefaults(): DietDefaults {
  return {
    mealOptionIndexes: Object.fromEntries(MEAL_TYPES.map(type => [type, 0])) as Record<MealType, number>,
    alternativeChoices: {},
  };
}

function createDay(index: number): DaySelection {
  return { day: index + 1, diet: index % 2 === 0 ? 'DIETA 1' : 'DIETA 2' };
}

export function createDefaultWeekConfig(): WeekConfig {
  return {
    days: Array.from({ length: 7 }, (_, index) => createDay(index)),
    dietDefaults: {
      'DIETA 1': createDietDefaults(),
      'DIETA 2': createDietDefaults(),
    },
    dayExceptions: {},
  };
}

export function alternativeKey(mealIndex: number, optionIndex: number, lineIndex: number): string {
  return `${mealIndex}-${optionIndex}-${lineIndex}`;
}

export function getEffectiveMealOptionIndex(
  config: WeekConfig,
  dayIndex: number,
  mealType: MealType,
  ignoreException = false,
): number {
  const override = ignoreException ? undefined : config.dayExceptions[dayIndex]?.mealOptionIndexes?.[mealType];
  return override ?? config.dietDefaults[config.days[dayIndex].diet]?.mealOptionIndexes[mealType] ?? 0;
}

export function getEffectiveAlternativeChoice(
  config: WeekConfig,
  dayIndex: number,
  altKey: string,
  ignoreException = false,
): number {
  const override = ignoreException ? undefined : config.dayExceptions[dayIndex]?.alternativeChoices?.[altKey];
  return override ?? config.dietDefaults[config.days[dayIndex].diet]?.alternativeChoices[altKey] ?? 0;
}

export function setMealOptionIndex(
  config: WeekConfig,
  dayIndex: number,
  mealType: MealType,
  optionIndex: number,
  asException: boolean,
): void {
  if (asException) {
    const exception = (config.dayExceptions[dayIndex] ??= {});
    (exception.mealOptionIndexes ??= {})[mealType] = optionIndex;
    return;
  }
  const defaults = config.dietDefaults[config.days[dayIndex].diet];
  if (defaults) defaults.mealOptionIndexes[mealType] = optionIndex;
}

export function setAlternativeChoice(
  config: WeekConfig,
  dayIndex: number,
  altKey: string,
  itemIndex: number,
  asException: boolean,
): void {
  if (asException) {
    const exception = (config.dayExceptions[dayIndex] ??= {});
    (exception.alternativeChoices ??= {})[altKey] = itemIndex;
    return;
  }
  const defaults = config.dietDefaults[config.days[dayIndex].diet];
  if (defaults) defaults.alternativeChoices[altKey] = itemIndex;
}

export function hasException(config: WeekConfig, dayIndex: number): boolean {
  const exception = config.dayExceptions[dayIndex];
  return Object.keys(exception?.mealOptionIndexes ?? {}).length > 0
    || Object.keys(exception?.alternativeChoices ?? {}).length > 0;
}

export function clearException(config: WeekConfig, dayIndex: number): void {
  delete config.dayExceptions[dayIndex];
}

export function setDayDiet(config: WeekConfig, dayIndex: number, diet: DaySelection['diet']): void {
  config.days[dayIndex].diet = diet;
  delete config.dayExceptions[dayIndex];
}

export interface ResolvedLine {
  line: IngredientLine;
  /** Items eaten for this line: the chosen alternative, or every item of a fixed line. */
  items: IngredientItem[];
}

export interface ResolvedMeal {
  meal: Meal;
  mealIndex: number;
  optionIndex: number;
  option: MealOption | undefined;
  lines: ResolvedLine[];
}

/** The meals, chosen options and chosen ingredients for one day of the week. */
export function resolveDayMeals(config: WeekConfig, diets: DietPlan[], dayIndex: number): ResolvedMeal[] {
  const day = config.days[dayIndex];
  const diet = day && diets.find(candidate => candidate.name === day.diet);
  return (diet?.meals ?? []).map((meal, mealIndex) => {
    const optionIndex = getEffectiveMealOptionIndex(config, dayIndex, meal.type);
    const option = meal.options[optionIndex];
    const lines = (option?.ingredient_lines ?? []).map((line, lineIndex) => {
      if (!line.is_alternatives) return { line, items: line.items };
      const selected = getEffectiveAlternativeChoice(config, dayIndex, alternativeKey(mealIndex, optionIndex, lineIndex));
      const item = line.items[selected] ?? line.items[0];
      return { line, items: item ? [item] : [] };
    });
    return { meal, mealIndex, optionIndex, option, lines };
  });
}

export function formatIngredient(item: IngredientItem): string {
  if (item.is_combination && item.sub_items?.length) return item.sub_items.map(formatIngredient).join(' + ');
  const quantity = formatQuantity(item.quantity, item.unit);
  return quantity === 'sin cantidad' ? item.name : `${item.name} ${quantity}`;
}

export function buildExportPayload(parsedData: ParseResult, config: WeekConfig) {
  return {
    generated_at: new Date().toISOString(),
    days: config.days.map((day, dayIndex) => ({
      day: day.day,
      diet: day.diet,
      meals: resolveDayMeals(config, parsedData.diets, dayIndex).map(({ meal, optionIndex, option, lines }) => ({
        type: meal.type,
        option: option?.name ?? `Opción ${optionIndex + 1}`,
        ingredients: lines.flatMap(({ items }) => items.map(formatIngredient)),
      })),
    })),
  };
}

/** Lowercase ASCII slug for download file names. */
export function fileSlug(value: string): string {
  return value.replace(/[^a-z0-9]+/gi, '-').toLowerCase();
}

export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement('a');
  anchor.href = url;
  anchor.download = filename;
  anchor.click();
  // Revoking synchronously can cancel the download in Safari and Firefox.
  window.setTimeout(() => URL.revokeObjectURL(url), 1_000);
}

export function formatQuantity(qty: number | null, unit: string | null): string {
  if (qty === null && unit === null) return 'sin cantidad';
  if (qty === null) return unit ?? 'sin cantidad';
  if (unit === null) return String(qty);
  if (unit === 'g' || unit === 'ml') return `${qty} ${unit}`;
  const plurals: Record<string, string> = {
    unidad: 'unidades',
    loncha: 'lonchas',
    lata: 'latas',
    paquete: 'paquetes',
    bote: 'botes',
    tarro: 'tarros',
    tarrina: 'tarrinas',
    botella: 'botellas',
    cucharada: 'cucharadas',
    onza: 'onzas',
    puñado: 'puñados',
    vasito: 'vasitos',
    bola: 'bolas',
  };
  return `${qty} ${qty === 1 ? unit : (plurals[unit] ?? unit)}`;
}
