import type { WeekConfig, DaySelection, MealType } from './types';

const MEAL_TYPES: MealType[] = ['ALMUERZO', 'COMIDA', 'MERIENDA', 'CENA'];

export function createDefaultWeekConfig(weeks: number = 4): WeekConfig {
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
  return {
    weeks,
    pdf_path: null,
    days,
    alternative_choices: {},
  };
}

export function formatQuantity(qty: number | null, unit: string | null): string {
  if (qty === null && unit === null) return 'variable';
  if (qty === null) return unit ?? 'variable';
  if (unit === null) return String(qty);
  return `${qty}${unit}`;
}
