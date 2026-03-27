import type { WeekConfig, DaySelection, DietDefaults, MealType, DayException } from './types';

const MEAL_TYPES: MealType[] = ['ALMUERZO', 'COMIDA', 'MERIENDA', 'CENA'];

function createDietDefaults(): DietDefaults {
  return {
    mealOptionIndexes: {
      ALMUERZO: 0,
      COMIDA: 0,
      MERIENDA: 0,
      CENA: 0,
    },
    alternativeChoices: {},
  };
}

export function createDefaultWeekConfig(weeks: number = 4): WeekConfig {
  const days = buildDaysArray(weeks);
  return {
    weeks,
    pdf_path: null,
    days,
    dietDefaults: {
      'DIETA 1': createDietDefaults(),
      'DIETA 2': createDietDefaults(),
    },
    dayExceptions: {},
  };
}

export function buildDaysArray(weeks: number): DaySelection[] {
  const days: DaySelection[] = [];
  const totalDays = weeks * 7;
  for (let i = 0; i < totalDays; i++) {
    days.push({
      day: i + 1,
      diet: i % 2 === 0 ? 'DIETA 1' : 'DIETA 2',
      meals: MEAL_TYPES.map(type => ({
        type,
        selected_option_index: 0,
      })),
    });
  }
  return days;
}

export function resizeWeeks(config: WeekConfig, newWeeks: number): void {
  const oldLen = config.days.length;
  const newLen = newWeeks * 7;
  config.weeks = newWeeks;

  if (newLen > oldLen) {
    for (let i = oldLen; i < newLen; i++) {
      config.days.push({
        day: i + 1,
        diet: i % 2 === 0 ? 'DIETA 1' : 'DIETA 2',
        meals: MEAL_TYPES.map(type => ({
          type,
          selected_option_index: 0,
        })),
      });
    }
  } else if (newLen < oldLen) {
    config.days.length = newLen;
    for (const key of Object.keys(config.dayExceptions)) {
      if (Number(key) >= newLen) {
        delete config.dayExceptions[Number(key)];
      }
    }
  }
}

export function getEffectiveMealOptionIndex(
  config: WeekConfig,
  dayIndex: number,
  mealType: MealType,
): number {
  const exception = config.dayExceptions[dayIndex];
  if (exception?.mealOptionIndexes?.[mealType] !== undefined) {
    return exception.mealOptionIndexes[mealType]!;
  }
  const day = config.days[dayIndex];
  const defaults = config.dietDefaults[day.diet];
  return defaults?.mealOptionIndexes[mealType] ?? 0;
}

export function getEffectiveAlternativeChoice(
  config: WeekConfig,
  dayIndex: number,
  altKey: string,
): number {
  const exception = config.dayExceptions[dayIndex];
  if (exception?.alternativeChoices?.[altKey] !== undefined) {
    return exception.alternativeChoices[altKey];
  }
  const day = config.days[dayIndex];
  const defaults = config.dietDefaults[day.diet];
  return defaults?.alternativeChoices[altKey] ?? 0;
}

export function setMealOptionIndex(
  config: WeekConfig,
  dayIndex: number,
  mealType: MealType,
  optionIndex: number,
  asException: boolean,
): void {
  if (asException) {
    if (!config.dayExceptions[dayIndex]) {
      config.dayExceptions[dayIndex] = {};
    }
    if (!config.dayExceptions[dayIndex].mealOptionIndexes) {
      config.dayExceptions[dayIndex].mealOptionIndexes = {};
    }
    config.dayExceptions[dayIndex].mealOptionIndexes![mealType] = optionIndex;
  } else {
    const day = config.days[dayIndex];
    const defaults = config.dietDefaults[day.diet];
    if (defaults) {
      defaults.mealOptionIndexes[mealType] = optionIndex;
    }
  }
}

export function setAlternativeChoice(
  config: WeekConfig,
  dayIndex: number,
  altKey: string,
  itemIndex: number,
  asException: boolean,
): void {
  if (asException) {
    if (!config.dayExceptions[dayIndex]) {
      config.dayExceptions[dayIndex] = {};
    }
    if (!config.dayExceptions[dayIndex].alternativeChoices) {
      config.dayExceptions[dayIndex].alternativeChoices = {};
    }
    config.dayExceptions[dayIndex].alternativeChoices![altKey] = itemIndex;
  } else {
    const day = config.days[dayIndex];
    const defaults = config.dietDefaults[day.diet];
    if (defaults) {
      defaults.alternativeChoices[altKey] = itemIndex;
    }
  }
}

export function hasException(config: WeekConfig, dayIndex: number): boolean {
  const exc = config.dayExceptions[dayIndex];
  if (!exc) return false;
  const hasMealOverrides = exc.mealOptionIndexes && Object.keys(exc.mealOptionIndexes).length > 0;
  const hasAltOverrides = exc.alternativeChoices && Object.keys(exc.alternativeChoices).length > 0;
  return !!(hasMealOverrides || hasAltOverrides);
}

export function clearException(config: WeekConfig, dayIndex: number): void {
  delete config.dayExceptions[dayIndex];
}

export function formatQuantity(qty: number | null, unit: string | null): string {
  if (qty === null && unit === null) return 'variable';
  if (qty === null) return unit ?? 'variable';
  if (unit === null) return String(qty);
  return `${qty}${unit}`;
}
