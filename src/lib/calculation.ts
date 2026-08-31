import type { IngredientItem, ParseResult, ShoppingItem, WeekConfig } from './types';
import { buildBackendSelection } from './utils';

interface AggregatedItem {
  name: string;
  quantity: number | null;
  unit: string | null;
  count: number;
}

const INVARIABLE_ENDINGS = ['us', 'is', 'ís', 'ús', 'és'];
const IRREGULAR_SINGULARS: Record<string, string> = {
  yogures: 'yogur',
};

export function canonicalIngredientName(value: string): string {
  const name = value.toLowerCase().trim().replace(/\s+/g, ' ');
  if (name.includes(' ') || INVARIABLE_ENDINGS.some(ending => name.endsWith(ending))) return name;
  if (IRREGULAR_SINGULARS[name]) return IRREGULAR_SINGULARS[name];
  if (name.length > 5 && name.endsWith('ces')) return `${name.slice(0, -3)}z`;
  if (name.length > 4 && /[aeiouáéíóú]s$/i.test(name)) return name.slice(0, -1);
  if (name.length > 5 && /[^aeiouáéíóú]es$/i.test(name)) return name.slice(0, -2);
  return name;
}

export function calculateShoppingList(
  parsedData: ParseResult,
  config: WeekConfig,
): ShoppingItem[] {
  const selection = buildBackendSelection(config, parsedData.diets, config.pdf_path);
  const diets = new Map(
    parsedData.diets.map(diet => [diet.name.trim().toUpperCase(), diet]),
  );
  const aggregation = new Map<string, AggregatedItem>();

  function addItem(item: IngredientItem): void {
    const name = item.name.toLowerCase().trim();
    const canonicalName = canonicalIngredientName(name);
    const key = JSON.stringify([canonicalName, item.unit]);
    let entry = aggregation.get(key);

    if (!entry) {
      entry = {
        name,
        quantity: item.quantity === null ? null : 0,
        unit: item.unit,
        count: 0,
      };
      aggregation.set(key, entry);
    } else if (name === canonicalName) {
      entry.name = name;
    }

    entry.count += 1;
    if (item.quantity !== null) {
      entry.quantity = (entry.quantity ?? 0) + item.quantity;
    }
  }

  function addItemOrCombination(item: IngredientItem): void {
    if (item.is_combination) {
      for (const subItem of item.sub_items ?? []) {
        addItem(subItem);
      }
    } else {
      addItem(item);
    }
  }

  for (const day of selection.days) {
    const diet = diets.get(day.diet.trim().toUpperCase());
    if (!diet) continue;

    const meals = new Map(
      diet.meals.map(meal => [meal.type.trim().toUpperCase(), meal]),
    );

    for (const mealSelection of day.meals) {
      const meal = meals.get(mealSelection.type.trim().toUpperCase());
      if (!meal) continue;

      const option = meal.options[mealSelection.selected_option_index];
      if (!option) continue;

      option.ingredient_lines.forEach((line, lineIndex) => {
        if (line.items.length === 0) return;

        if (line.is_alternatives) {
          const selectedIndex = mealSelection.alternative_choices[String(lineIndex)] ?? 0;
          const item = line.items[selectedIndex] ?? line.items[0];
          addItemOrCombination(item);
        } else if (line.is_combination) {
          for (const subItem of line.items[0].sub_items ?? []) {
            addItem(subItem);
          }
        } else {
          addItemOrCombination(line.items[0]);
        }
      });
    }
  }

  return [...aggregation.values()]
    .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0)
    .map(({ name, quantity, unit, count }) => ({ name, quantity, unit, count }));
}
