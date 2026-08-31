import type { SavedShoppingList, ShoppingCategory, ShoppingItem } from './types';

export const SHOPPING_CATEGORIES: ShoppingCategory[] = [
  'Fruta y verdura', 'Carne y pescado', 'Lácteos y huevos', 'Panadería',
  'Despensa', 'Congelados', 'Bebidas', 'Otros',
];

const rules: Array<[ShoppingCategory, RegExp]> = [
  ['Fruta y verdura', /fruta|verdura|tomate|aguacate|fresa|cebolla|lechuga|calabac|patata|plátano|manzana/i],
  ['Carne y pescado', /pollo|pavo|jamón|merluza|atún|salmón|carne|ternera|gamba|huevo/i],
  ['Lácteos y huevos', /leche|yogur|queso|mozzarella|feta|quesito/i],
  ['Panadería', /pan|tortilla|brioche/i],
  ['Congelados', /congelad/i],
  ['Bebidas', /agua|bebida|zumo|café/i],
];

export function inferCategory(name: string): ShoppingCategory {
  return rules.find(([, pattern]) => pattern.test(name))?.[0] ?? 'Despensa';
}

export function normalizeShoppingItem(item: ShoppingItem): SavedShoppingList['items'][number] {
  return {
    id: item.id ?? crypto.randomUUID(),
    name: item.name,
    quantity: item.quantity,
    unit: item.unit,
    count: item.count,
    category: item.category ?? inferCategory(item.name),
    checked: item.checked ?? false,
    custom: item.custom ?? false,
  };
}

export function createShoppingList(name = 'Lista de la semana', items: ShoppingItem[] = []): SavedShoppingList {
  const now = new Date().toISOString();
  return { id: crypto.randomUUID(), schemaVersion: 1, name, createdAt: now, updatedAt: now, items: items.map(normalizeShoppingItem) };
}

export function isSavedShoppingList(value: unknown): value is SavedShoppingList {
  if (!value || typeof value !== 'object') return false;
  const list = value as Partial<SavedShoppingList>;
  return list.schemaVersion === 1 && typeof list.id === 'string' && typeof list.name === 'string' && Array.isArray(list.items)
    && list.items.every(item => typeof item?.id === 'string' && typeof item?.name === 'string');
}
