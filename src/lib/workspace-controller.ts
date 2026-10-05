import { restorePlan, persistCurrentPlan } from './plan-controller';
import { appState } from './state.svelte';
import { getActivePlanId, getActiveTab, listPlans, listShoppingLists, setActivePlanId, setActiveTab } from './storage';
import type { AppTab, ParseResult, SavedPlan } from './types';
import { createDefaultWeekConfig } from './utils';
import { normalizeTrainingPlan } from './training-model';

let autosaveTimer: ReturnType<typeof setTimeout> | undefined;
let pendingSave: Promise<SavedPlan | undefined> | undefined;
let saveRequested = false;

function sourceLabel(sourceName: string): string {
  const source = sourceName.split(/[\\/]/).pop()?.replace(/\.pdf$/i, '') || 'Plan semanal';
  return `${source} · ${new Date().toISOString().slice(0, 10)}`;
}

export async function createWorkspaceFromDocument(result: ParseResult, sourceName: string): Promise<SavedPlan> {
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = undefined;
  appState.parsedData = structuredClone(result);
  if (appState.parsedData.training) appState.parsedData.training = normalizeTrainingPlan(appState.parsedData.training);
  appState.pdfPath = null;
  appState.weekConfig = createDefaultWeekConfig();
  appState.weekTracker = {
    startedAt: new Date().toISOString(),
    activeDayIndex: 0,
    weekNumber: 1,
    trainingWeights: {},
    trainingRepetitions: {},
    exerciseNotes: {}, cardioByDay: {}, stepsByDay: {},
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
  saveRequested = true;
  appState.saveStatus = 'saving';
  if (autosaveTimer) clearTimeout(autosaveTimer);
  autosaveTimer = setTimeout(() => {
    autosaveTimer = undefined;
    void runPendingSave();
  }, delay);
}

async function runPendingSave(): Promise<SavedPlan | undefined> {
  if (!saveRequested || !appState.parsedData || !appState.activePlanId) return pendingSave;
  if (pendingSave) {
    await pendingSave;
    if (!saveRequested) return undefined;
  }
  saveRequested = false;
  appState.saveStatus = 'saving';
  pendingSave = persistCurrentPlan()
    .then(plan => {
      appState.saveStatus = 'saved';
      return plan;
    })
    .catch(error => {
      appState.saveStatus = 'error';
      appState.error = error instanceof Error ? error.message : String(error);
      throw error;
    })
    .finally(() => { pendingSave = undefined; });
  const result = await pendingSave;
  if (saveRequested) return runPendingSave();
  return result;
}

export async function flushWorkspaceAutosave(): Promise<SavedPlan | undefined> {
  if (autosaveTimer) {
    clearTimeout(autosaveTimer);
    autosaveTimer = undefined;
    saveRequested = true;
  }
  return runPendingSave();
}

export async function saveWorkspaceNow(message?: string): Promise<SavedPlan | undefined> {
  if (!appState.parsedData || !appState.activePlanId) return undefined;
  saveRequested = true;
  const plan = await flushWorkspaceAutosave();
  if (message) appState.toast = message;
  return plan;
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
