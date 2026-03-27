export interface DietPlan {
  name: string;
  intro: string;
  meals: Meal[];
}

export interface Meal {
  type: MealType;
  options: MealOption[];
}

export type MealType = 'ALMUERZO' | 'COMIDA' | 'MERIENDA' | 'CENA';

export interface MealOption {
  name: string;
  description: string | null;
  ingredient_lines: IngredientLine[];
}

export interface IngredientLine {
  items: IngredientItem[];
  is_alternatives: boolean;
  is_combination: boolean;
}

export interface IngredientItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  note: string | null;
  is_combination?: boolean;
  sub_items?: IngredientItem[];
}

export interface ParseResult {
  status: string;
  diets: DietPlan[];
}

// IMPORTANT: alternative_choices is GLOBAL (not per-day) — one choice per "/" line applies to ALL days
export interface WeekConfig {
  weeks: number;
  pdf_path: string | null;
  days: DaySelection[];
  alternative_choices: Record<string, number>; // key: "dietIndex-mealIndex-optionIndex-lineIndex", value: selected item index
}

export interface DaySelection {
  day: number;
  diet: 'DIETA 1' | 'DIETA 2';
  meals: MealSelection[];
}

export interface MealSelection {
  type: MealType;
  selected_option_index: number;
}

export interface ShoppingItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  count: number;
}

export interface ShoppingList {
  status: string;
  items: ShoppingItem[];
}
