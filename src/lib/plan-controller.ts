import { calculateShoppingList } from './calculation';
import { applyList, persistCurrentList } from './list-controller';
import { appState } from './state.svelte';
import { deletePlan, listPlans, listShoppingLists, savePlan, saveShoppingList, setActivePlanId, setActiveTab } from './storage';
import { normalizeShoppingItem } from './shopping';
import type { SavedPlan, SavedShoppingList } from './types';
import { cloneData, createDefaultWeekConfig, createWeekTracker } from './utils';
import { migrateLegacyProgress, normalizeTrainingPlan } from './training-model';

function createPlan(name: string): SavedPlan {
  if (!appState.parsedData) throw new Error('No hay una dieta cargada para guardar.');
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    schemaVersion: 5,
    configured: appState.configured,
    name,
    createdAt: now,
    updatedAt: now,
    parsedData: cloneData(appState.parsedData),
    weekConfig: cloneData(appState.weekConfig),
    weekTracker: cloneData(appState.weekTracker),
  };
}

export async function initializePlans(): Promise<void> {
  appState.savedPlans = await listPlans();
}

export async function persistCurrentPlan(): Promise<SavedPlan> {
  const existing = appState.savedPlans.find(plan => plan.id === appState.activePlanId);
  const plan = existing ? cloneData(existing) : createPlan(appState.activePlanName);
  if (!appState.parsedData) throw new Error('No hay una dieta cargada para guardar.');

  plan.name = appState.activePlanName.trim() || 'Mi plan semanal';
  plan.schemaVersion = 5;
  plan.configured = appState.configured;
  plan.parsedData = cloneData(appState.parsedData);
  plan.weekConfig = cloneData(appState.weekConfig);
  plan.weekTracker = cloneData(appState.weekTracker);
  if (appState.shoppingList.length > 0 || appState.activeListId) {
    plan.shoppingListId = (await persistCurrentList()).id;
  } else {
    delete plan.shoppingListId;
  }

  await savePlan(plan);
  await setActivePlanId(plan.id);
  appState.activePlanId = plan.id;
  appState.activePlanName = plan.name;
  appState.configured = plan.configured ?? true;
  appState.savedPlans = await listPlans();
  return plan;
}

export async function restorePlan(plan: SavedPlan): Promise<void> {
  appState.activePlanId = plan.id;
  appState.activePlanName = plan.name;
  appState.configured = plan.configured ?? true;
  appState.parsedData = cloneData(plan.parsedData);
  if (appState.parsedData.training) appState.parsedData.training = normalizeTrainingPlan(appState.parsedData.training);
  for (const diet of appState.parsedData.diets) diet.name = diet.name.trim().replace(/\s+/g, ' ').toUpperCase();
  appState.weekConfig = cloneData(plan.weekConfig);
  appState.weekTracker = plan.weekTracker ? cloneData(plan.weekTracker) : createWeekTracker();
  if (appState.parsedData.training) migrateLegacyProgress(appState.parsedData.training, appState.weekTracker);
  appState.error = null;
  await setActivePlanId(plan.id);

  const linkedList = plan.shoppingListId
    ? (await listShoppingLists()).find(list => list.id === plan.shoppingListId)
    : undefined;
  if (linkedList) {
    applyList(linkedList);
  } else {
    appState.activeListId = null;
    appState.activeListName = `${plan.name} - compra`;
    appState.shoppingList = [];
  }
}

export function calculateActivePlan(): void {
  if (!appState.parsedData) return;
  appState.shoppingList = calculateShoppingList(appState.parsedData, appState.weekConfig).map(normalizeShoppingItem);
  appState.activeListId = null;
  appState.activeListName = `${appState.activePlanName} - compra`;
}

export async function renamePlan(plan: SavedPlan, name: string): Promise<void> {
  const renamed = cloneData(plan);
  renamed.name = name.trim() || plan.name;
  await savePlan(renamed);
  if (appState.activePlanId === renamed.id) appState.activePlanName = renamed.name;
  appState.savedPlans = await listPlans();
}

export async function duplicatePlan(plan: SavedPlan): Promise<SavedPlan> {
  const copy = cloneData(plan);
  copy.id = crypto.randomUUID();
  copy.name = `${plan.name} (copia)`;
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = copy.createdAt;

  if (plan.shoppingListId) {
    const linkedList = (await listShoppingLists()).find(list => list.id === plan.shoppingListId);
    if (linkedList) {
      const listCopy: SavedShoppingList = cloneData(linkedList);
      listCopy.id = crypto.randomUUID();
      listCopy.name = `${linkedList.name} (copia)`;
      listCopy.createdAt = copy.createdAt;
      listCopy.updatedAt = copy.createdAt;
      await saveShoppingList(listCopy);
      copy.shoppingListId = listCopy.id;
    }
  }

  await savePlan(copy);
  appState.savedPlans = await listPlans();
  return copy;
}

export async function removePlan(id: string): Promise<void> {
  const wasActive = appState.activePlanId === id;
  await deletePlan(id);
  appState.savedPlans = await listPlans();
  if (!wasActive) return;

  const replacement = appState.savedPlans[0];
  if (replacement) {
    await restorePlan(replacement);
    return;
  }

  appState.parsedData = null;
  appState.weekConfig = createDefaultWeekConfig();
  appState.weekTracker = createWeekTracker();
  appState.activePlanId = null;
  appState.activePlanName = 'Mi plan semanal';
  appState.configured = false;
  if (!appState.activeListId) appState.shoppingList = [];
  appState.activeTab = appState.activeListId ? 'shopping' : 'home';
  await setActiveTab(appState.activeTab);
}
