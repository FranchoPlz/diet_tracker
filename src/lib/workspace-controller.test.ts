import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { appState } from './state.svelte';
import { getActivePlanId, listPlans, setActivePlanId } from './storage';
import type { ParseResult } from './types';
import {
  completeConfiguration,
  createWorkspaceFromDocument,
  flushWorkspaceAutosave,
  initializeWorkspace,
  scheduleWorkspaceAutosave,
} from './workspace-controller';

const parsedData = {
  status: 'ok',
  diets: [],
  exercise: { days: ['lunes'], notes: 'future schema data' },
} as ParseResult & { exercise: { days: string[]; notes: string } };

beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('diet-planner');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
});

describe('workspace controller', () => {
  it('persists a document immediately and restores the active plan and linked list after restart', async () => {
    const created = await createWorkspaceFromDocument(parsedData, '/private/plans/Septiembre.pdf');
    expect(created.name).toBe('Septiembre');
    expect(created.configured).toBe(false);
    expect(await getActivePlanId()).toBe(created.id);
    expect(JSON.stringify(await listPlans())).not.toContain('/private/plans');

    appState.shoppingList = [{ name: 'arroz', quantity: 80, unit: 'g', count: 4 }];
    appState.checkedShoppingItems = { 'arroz|g': true };
    const configured = await completeConfiguration();
    expect(configured.configured).toBe(true);
    expect(configured.shoppingListId).toBeTruthy();

    appState.parsedData = null;
    appState.shoppingList = [];
    appState.checkedShoppingItems = {};
    appState.activePlanId = null;
    appState.activeListId = null;
    appState.configured = false;
    appState.persistenceReady = false;

    const restored = await initializeWorkspace();
    expect(restored?.id).toBe(created.id);
    expect(appState.activePlanId).toBe(created.id);
    expect(appState.activeListId).toBe(configured.shoppingListId);
    expect(appState.shoppingList).toEqual([{
      id: expect.any(String), name: 'arroz', quantity: 80, unit: 'g', count: 4,
      category: 'Despensa', checked: true, custom: false,
    }]);
    expect(appState.parsedData).toEqual(parsedData);
    if (!appState.parsedData) throw new Error('Expected restored parsed data');
    expect((appState.parsedData as typeof parsedData).exercise).toEqual(parsedData.exercise);
    expect(appState.configured).toBe(true);
    expect(appState.pdfPath).toBeNull();
    expect(appState.persistenceReady).toBe(true);
  });

  it('flushes a scheduled autosave reliably', async () => {
    appState.activePlanName = 'Nombre actualizado';
    scheduleWorkspaceAutosave(60_000);
    await flushWorkspaceAutosave();
    expect((await listPlans()).find(plan => plan.id === appState.activePlanId)?.name).toBe('Nombre actualizado');
  });

  it('restores the most recent legacy plan when no active pointer exists', async () => {
    await setActivePlanId(null);
    appState.parsedData = null;
    appState.activePlanId = null;
    appState.persistenceReady = false;

    const restored = await initializeWorkspace();

    expect(restored).not.toBeNull();
    expect(appState.activePlanId).toBe(restored?.id);
    expect(await getActivePlanId()).toBe(restored?.id);
  });
});
