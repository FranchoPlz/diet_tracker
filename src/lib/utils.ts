import type {
  BackendSelection,
  DaySelection,
  DietDefaults,
  DietPlan,
  IngredientItem,
  MealType,
  ParseResult,
  ShoppingItem,
  WeekConfig,
} from './types';

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

export function createDefaultWeekConfig(weeks: number = 1): WeekConfig {
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

export function setDayDiet(config: WeekConfig, dayIndex: number, diet: DaySelection['diet']): void {
  config.days[dayIndex].diet = diet;
  delete config.dayExceptions[dayIndex];
}

export function buildBackendSelection(
  config: WeekConfig,
  diets: DietPlan[],
  pdfPath: string | null,
): BackendSelection {
  return {
    weeks: config.weeks,
    pdf_path: config.pdf_path ?? pdfPath,
    days: config.days.map((day, dayIndex) => {
      const diet = diets.find(candidate => candidate.name === day.diet);
      return {
        day: day.day,
        diet: day.diet,
        meals: MEAL_TYPES.map((mealType) => {
          const selectedOptionIndex = getEffectiveMealOptionIndex(config, dayIndex, mealType);
          const mealIndex = diet?.meals.findIndex(meal => meal.type === mealType) ?? -1;
          const alternativeChoices: Record<string, number> = {};
          const option = mealIndex >= 0 ? diet?.meals[mealIndex]?.options[selectedOptionIndex] : undefined;

          option?.ingredient_lines.forEach((line, lineIndex) => {
            if (line.is_alternatives) {
              const key = `${mealIndex}-${selectedOptionIndex}-${lineIndex}`;
              alternativeChoices[String(lineIndex)] = getEffectiveAlternativeChoice(config, dayIndex, key);
            }
          });

          return {
            type: mealType,
            selected_option_index: selectedOptionIndex,
            alternative_choices: alternativeChoices,
          };
        }),
      };
    }),
  };
}

function itemLabel(item: IngredientItem): string {
  if (item.is_combination && item.sub_items) {
    return item.sub_items.map(itemLabel).join(' + ');
  }
  const quantity = formatQuantity(item.quantity, item.unit);
  return quantity === 'sin cantidad' ? item.name : `${quantity} ${item.name}`;
}

export function buildExportPayload(
  parsedData: ParseResult,
  config: WeekConfig,
  pdfPath: string | null,
  shoppingList: ShoppingItem[],
) {
  const selection = buildBackendSelection(config, parsedData.diets, pdfPath);
  const days = selection.days.map((day, dayIndex) => {
    const diet = parsedData.diets.find(candidate => candidate.name === day.diet);
    return {
      day: day.day,
      diet: day.diet,
      meals: day.meals.map(mealSelection => {
        const meal = diet?.meals.find(candidate => candidate.type === mealSelection.type);
        const option = meal?.options[mealSelection.selected_option_index];
        const ingredients = option?.ingredient_lines.flatMap((line, lineIndex) => {
          if (line.is_alternatives) {
            const selectedIndex = mealSelection.alternative_choices[String(lineIndex)] ?? 0;
            return line.items[selectedIndex] ? [itemLabel(line.items[selectedIndex])] : [];
          }
          return line.items.map(itemLabel);
        }) ?? [];
        return {
          type: mealSelection.type,
          option: option?.name ?? `Opción ${mealSelection.selected_option_index + 1}`,
          ingredients,
        };
      }),
    };
  });

  return {
    version: 1,
    generated_at: new Date().toISOString(),
    source_pdf: pdfPath,
    days,
    shopping_list: shoppingList,
  };
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
