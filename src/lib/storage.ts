import { openDB, type DBSchema } from 'idb';
import type { SavedPlan, SavedShoppingList } from './types';

interface DietDatabase extends DBSchema {
  lists: { key: string; value: SavedShoppingList; indexes: { updatedAt: string } };
  plans: { key: string; value: SavedPlan; indexes: { updatedAt: string } };
}

const database = () => openDB<DietDatabase>('diet-planner', 1, {
  upgrade(db) {
    const lists = db.createObjectStore('lists', { keyPath: 'id' });
    lists.createIndex('updatedAt', 'updatedAt');
    const plans = db.createObjectStore('plans', { keyPath: 'id' });
    plans.createIndex('updatedAt', 'updatedAt');
  },
});

export async function listShoppingLists(): Promise<SavedShoppingList[]> {
  const values = await (await database()).getAllFromIndex('lists', 'updatedAt');
  return values.reverse();
}

export async function saveShoppingList(list: SavedShoppingList): Promise<void> {
  list.updatedAt = new Date().toISOString();
  await (await database()).put('lists', structuredClone(list));
}

export async function deleteShoppingList(id: string): Promise<void> {
  await (await database()).delete('lists', id);
}

export async function savePlan(plan: SavedPlan): Promise<void> {
  const portable = JSON.parse(JSON.stringify(plan)) as SavedPlan;
  portable.updatedAt = new Date().toISOString();
  portable.weekConfig.pdf_path = null;
  await (await database()).put('plans', portable);
}

export async function listPlans(): Promise<SavedPlan[]> {
  return (await (await database()).getAllFromIndex('plans', 'updatedAt')).reverse();
}

export async function deletePlan(id: string): Promise<void> {
  await (await database()).delete('plans', id);
}
