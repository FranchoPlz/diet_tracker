import { calculateShoppingList } from './calculation';
import { applyList, persistCurrentList } from './list-controller';
import { appState } from './state.svelte';
import { listPlans, listShoppingLists, savePlan, saveShoppingList, setActivePlanId } from './storage';
import type { SavedPlan, SavedShoppingList, WeekConfig } from './types';

function cloneData<T>(value: T): T {
  return JSON.parse(JSON.stringify(value)) as T;
}

export function portableWeekConfig(config: WeekConfig): WeekConfig {
  const portable = cloneData(config);
  portable.pdf_path = null;
  return portable;
}

function createPlan(name: string): SavedPlan {
  if (!appState.parsedData) throw new Error('No hay una dieta cargada para guardar.');
  const now = new Date().toISOString();
  return {
    id: crypto.randomUUID(),
    schemaVersion: 2,
    configured: appState.configured,
    name,
    createdAt: now,
    updatedAt: now,
    parsedData: cloneData(appState.parsedData),
    weekConfig: portableWeekConfig(appState.weekConfig),
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
  plan.schemaVersion = 2;
  plan.configured = appState.configured;
  plan.parsedData = cloneData(appState.parsedData);
  plan.weekConfig = portableWeekConfig(appState.weekConfig);
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
  appState.planSourceLabel = `Plan guardado: ${plan.name}`;
  appState.savedPlans = await listPlans();
  return plan;
}

export async function restorePlan(plan: SavedPlan): Promise<void> {
  appState.activePlanId = plan.id;
  appState.activePlanName = plan.name;
  appState.configured = plan.configured ?? true;
  appState.parsedData = cloneData(plan.parsedData);
  appState.weekConfig = portableWeekConfig(plan.weekConfig);
  appState.pdfPath = null;
  appState.planSourceLabel = `Plan guardado: ${plan.name}`;
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
    appState.checkedShoppingItems = {};
  }
}

export function calculateActivePlan(): void {
  if (!appState.parsedData) return;
  appState.shoppingList = calculateShoppingList(appState.parsedData, portableWeekConfig(appState.weekConfig));
  appState.checkedShoppingItems = {};
  appState.activeListId = null;
  appState.activeListName = `${appState.activePlanName} - compra`;
}

export async function renamePlan(plan: SavedPlan, name: string): Promise<void> {
  const renamed = cloneData(plan);
  renamed.name = name.trim() || plan.name;
  renamed.weekConfig = portableWeekConfig(renamed.weekConfig);
  await savePlan(renamed);
  if (appState.activePlanId === renamed.id) {
    appState.activePlanName = renamed.name;
    appState.planSourceLabel = `Plan guardado: ${renamed.name}`;
  }
  appState.savedPlans = await listPlans();
}

export async function duplicatePlan(plan: SavedPlan): Promise<SavedPlan> {
  const copy = cloneData(plan);
  copy.id = crypto.randomUUID();
  copy.name = `${plan.name} (copia)`;
  copy.createdAt = new Date().toISOString();
  copy.updatedAt = copy.createdAt;
  copy.weekConfig = portableWeekConfig(copy.weekConfig);

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
