export type AppTab = 'home' | 'diet' | 'training' | 'shopping';

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
  training?: TrainingPlan;
}

export interface TrainingPlan {
  tips: string[];
  defaultRestSeconds: number | null;
  days: TrainingDay[];
}

export interface TrainingDay {
  days: number[];
  title: string;
  activeRest: boolean;
  details: string;
  exercises: ExerciseRow[];
}

export interface ExerciseRow {
  exercise: string;
  series: string;
  repetitions: string;
  details: string;
  supersetExercises?: string[];
}

/**
 * Global defaults for a single diet (DIETA 1 or DIETA 2).
 * These apply to ALL days that use this diet unless a per-day exception exists.
 */
export interface DietDefaults {
  /** Which option is selected for each meal type. key: MealType, value: option index */
  mealOptionIndexes: Record<MealType, number>;
  /** Alternative ingredient choices. key: "mealIndex-optionIndex-lineIndex", value: selected item index */
  alternativeChoices: Record<string, number>;
}

export interface WeekConfig {
  weeks: number;
  pdf_path: string | null;
  days: DaySelection[];
  /** Global defaults per diet name. All days of that diet type share these selections. */
  dietDefaults: Record<string, DietDefaults>;
  /** Per-day exceptions that override the global defaults. key: day index (0-based) */
  dayExceptions: Record<number, DayException>;
  alternative_choices?: Record<string, number>;
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

/**
 * Per-day overrides. Only the fields present here override the global defaults.
 */
export interface DayException {
  /** Override meal option indexes for specific meal types */
  mealOptionIndexes?: Partial<Record<MealType, number>>;
  /** Override alternative choices for specific keys */
  alternativeChoices?: Record<string, number>;
}

export interface ShoppingItem {
  id?: string;
  name: string;
  quantity: number | null;
  unit: string | null;
  count: number;
  category?: ShoppingCategory;
  checked?: boolean;
  custom?: boolean;
}

export type ShoppingCategory = 'Fruta y verdura' | 'Carne y pescado' | 'Lácteos y huevos' | 'Panadería' | 'Despensa' | 'Congelados' | 'Bebidas' | 'Otros';

export interface SavedShoppingList {
  id: string;
  schemaVersion: 1;
  name: string;
  createdAt: string;
  updatedAt: string;
  items: Required<Pick<ShoppingItem, 'id' | 'name' | 'quantity' | 'unit' | 'count' | 'category' | 'checked' | 'custom'>>[];
}

export interface WeekTracker {
  startedAt: string;
  activeDayIndex: number;
  weekNumber: number;
  trainingWeights: Record<string, string[]>;
  trainingRepetitions?: Record<string, string[]>;
}

export interface SavedPlan {
  id: string;
  schemaVersion: 1 | 2 | 3 | 4;
  configured?: boolean;
  name: string;
  createdAt: string;
  updatedAt: string;
  parsedData: ParseResult;
  weekConfig: WeekConfig;
  weekTracker?: WeekTracker;
  shoppingListId?: string;
}

export interface BackendMealSelection {
  type: MealType;
  selected_option_index: number;
  alternative_choices: Record<string, number>;
}

export interface BackendSelection {
  weeks: number;
  pdf_path: string | null;
  days: Array<{
    day: number;
    diet: DaySelection['diet'];
    meals: BackendMealSelection[];
  }>;
}

export interface ShoppingList {
  status: string;
  items: ShoppingItem[];
}
