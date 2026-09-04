import { openDB, type DBSchema } from 'idb';
import type { AppTab, SavedPlan, SavedShoppingList } from './types';

interface DietDatabase extends DBSchema {
  lists: { key: string; value: SavedShoppingList; indexes: { updatedAt: string } };
  plans: { key: string; value: SavedPlan; indexes: { updatedAt: string } };
  metadata: { key: string; value: { key: string; value: string | null } };
}

const database = () => openDB<DietDatabase>('diet-planner', 2, {
  upgrade(db, oldVersion) {
    if (oldVersion < 1) {
      const lists = db.createObjectStore('lists', { keyPath: 'id' });
      lists.createIndex('updatedAt', 'updatedAt');
      const plans = db.createObjectStore('plans', { keyPath: 'id' });
      plans.createIndex('updatedAt', 'updatedAt');
    }
    if (oldVersion < 2) db.createObjectStore('metadata', { keyPath: 'key' });
  },
});

function migratePlan(plan: SavedPlan): SavedPlan {
  if (plan.schemaVersion === 4 && plan.weekTracker?.trainingRepetitions) return plan;
  return {
    ...plan,
    schemaVersion: 4,
    configured: plan.configured ?? true,
    weekTracker: {
      ...(plan.weekTracker ?? {
      startedAt: new Date().toISOString(),
      activeDayIndex: 0,
      weekNumber: 1,
      trainingWeights: {},
      }),
      trainingRepetitions: plan.weekTracker?.trainingRepetitions ?? {},
    },
  };
}

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
  const portable = migratePlan(JSON.parse(JSON.stringify(plan)) as SavedPlan);
  portable.updatedAt = new Date().toISOString();
  portable.weekConfig.pdf_path = null;
  await (await database()).put('plans', portable);
}

export async function listPlans(): Promise<SavedPlan[]> {
  return (await (await database()).getAllFromIndex('plans', 'updatedAt')).reverse().map(migratePlan);
}

export async function deletePlan(id: string): Promise<void> {
  const db = await database();
  const transaction = db.transaction(['plans', 'metadata'], 'readwrite');
  await transaction.objectStore('plans').delete(id);
  const active = await transaction.objectStore('metadata').get('activePlanId');
  if (active?.value === id) await transaction.objectStore('metadata').put({ key: 'activePlanId', value: null });
  await transaction.done;
}

export async function getActivePlanId(): Promise<string | null> {
  return (await (await database()).get('metadata', 'activePlanId'))?.value ?? null;
}

export async function setActivePlanId(id: string | null): Promise<void> {
  await (await database()).put('metadata', { key: 'activePlanId', value: id });
}

export async function getActiveTab(): Promise<AppTab | null> {
  const value = (await (await database()).get('metadata', 'activeTab'))?.value;
  return value === 'home' || value === 'diet' || value === 'training' || value === 'shopping' ? value : null;
}

export async function setActiveTab(tab: AppTab): Promise<void> {
  await (await database()).put('metadata', { key: 'activeTab', value: tab });
}
