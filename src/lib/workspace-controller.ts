import { restorePlan, persistCurrentPlan } from './plan-controller';
import { appState } from './state.svelte';
import { getActivePlanId, getActiveTab, listPlans, listShoppingLists, setActivePlanId, setActiveTab } from './storage';
import type { AppTab, ParseResult, SavedPlan } from './types';
import { createDefaultWeekConfig } from './utils';

let autosaveTimer: ReturnType<typeof setTimeout> | undefined;
let pendingSave: Promise<SavedPlan | undefined> | undefined;

function sourceLabel(sourceName: string): string {
  const source = sourceName.split(/[\\/]/).pop()?.replace(/\.pdf$/i, '') || 'Plan semanal';
  return `${source} · ${new Date().toISOString().slice(0, 10)}`;
}

export async function createWorkspaceFromDocument(result: ParseResult, sourceName: string): Promise<SavedPlan> {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = undefined;
  appState.parsedData = structuredClone(result);
  appState.pdfPath = null;
  appState.weekConfig = createDefaultWeekConfig();
  appState.weekTracker = {
    startedAt: new Date().toISOString(),
    activeDayIndex: 0,
    weekNumber: 1,
    trainingWeights: {},
    trainingRepetitions: {},
  };
  appState.shoppingList = [];
  appState.checkedShoppingItems = {};
  appState.activeListId = null;
  appState.activeListName = `${sourceLabel(sourceName)} - compra`;
  appState.activePlanId = null;
  appState.activePlanName = sourceLabel(sourceName);
  appState.configured = false;
  appState.activeTab = 'diet';
  await setActiveTab('diet');
  appState.planSourceLabel = null;
  appState.error = null;
  return persistCurrentPlan();
}

export async function completeConfiguration(): Promise<SavedPlan> {
  appState.configured = true;
  return persistCurrentPlan();
}

export async function selectActiveTab(tab: AppTab): Promise<void> {
  appState.activeTab = tab;
  await setActiveTab(tab);
}

export function scheduleWorkspaceAutosave(delay = 250): void {
  if (!appState.parsedData || !appState.activePlanId) return;
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    autosaveTimer = undefined;
    pendingSave = persistCurrentPlan().finally(() => { pendingSave = undefined; });
  }, delay);
}

export async function flushWorkspaceAutosave(): Promise<SavedPlan | undefined> {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = undefined;
    pendingSave = persistCurrentPlan().finally(() => { pendingSave = undefined; });
  }
  if (pendingSave) return pendingSave;
  return undefined;
}

export async function initializeWorkspace(): Promise<SavedPlan | null> {
  try {
    const [plans, lists, activePlanId, activeTab] = await Promise.all([
      listPlans(),
      listShoppingLists(),
      getActivePlanId(),
      getActiveTab(),
    ]);
    appState.savedPlans = plans;
    appState.savedLists = lists;
    const activePlan = plans.find(plan => plan.id === activePlanId) ?? plans[0];
    if (!activePlan) {
      if (activePlanId) await setActivePlanId(null);
      return null;
    }
    await restorePlan(activePlan);
    appState.activeTab = activeTab ?? 'home';
    return activePlan;
  } finally {
    appState.persistenceReady = true;
  }
}
