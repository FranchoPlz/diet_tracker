import type { IngredientItem, ParseResult, ShoppingItem, WeekConfig } from './types';
import { resolveDayMeals } from './utils';

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

function singularizeWord(word: string): string {
  if (INVARIABLE_ENDINGS.some(ending => word.endsWith(ending))) return word;
  if (IRREGULAR_SINGULARS[word]) return IRREGULAR_SINGULARS[word];
  if (word.length > 5 && word.endsWith('ces')) return `${word.slice(0, -3)}z`;
  if (word.length > 4 && /[aeiouáéíóú]s$/i.test(word)) return word.slice(0, -1);
  if (word.length > 5 && /[^aeiouáéíóú]es$/i.test(word)) return word.slice(0, -2);
  return word;
}

export function canonicalIngredientName(value: string): string {
  const words = value.toLowerCase().trim().replace(/\s+/g, ' ').split(' ');
  const qualifierIndex = words.findIndex(word => ['a', 'al', 'con', 'de', 'del', 'sin'].includes(word));
  return words.map((word, index) => qualifierIndex < 0 || index < qualifierIndex ? singularizeWord(word) : word).join(' ');
}

export function calculateShoppingList(
  parsedData: ParseResult,
  config: WeekConfig,
): ShoppingItem[] {
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

  config.days.forEach((_, dayIndex) => {
    for (const { lines } of resolveDayMeals(config, parsedData.diets, dayIndex)) {
      for (const { items } of lines) items.forEach(addItemOrCombination);
    }
  });

  return [...aggregation.values()]
    .sort((left, right) => left.name < right.name ? -1 : left.name > right.name ? 1 : 0)
    .map(({ name, quantity, unit, count }) => ({ name, quantity, unit, count }));
}
