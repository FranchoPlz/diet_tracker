import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { appState } from './state.svelte';
import { calculateActivePlan, persistCurrentPlan, removePlan, restorePlan } from './plan-controller';
import { createDefaultWeekConfig } from './utils';
import { deletePlan, listPlans } from './storage';
import type { ParseResult, SavedPlan } from './types';

const parsedData: ParseResult = {
  diets: [{
    name: 'DIETA 1', intro: '', meals: [{ type: 'COMIDA', options: [{
      name: 'Arroz', description: null, ingredient_lines: [{
        items: [{ name: 'Arroz', quantity: 80, unit: 'g', note: null }],
        is_alternatives: false, is_combination: false,
      }],
    }] }],
  }],
};

beforeEach(() => {
  appState.parsedData = structuredClone(parsedData);
  appState.weekConfig = createDefaultWeekConfig();
  appState.shoppingList = [];
  appState.activeListId = null;
  appState.activePlanId = null;
  appState.activePlanName = 'Semana abril';
  appState.configured = false;
});

describe('plan controller', () => {
  it('persists and restores parsed data', async () => {
    const saved = await persistCurrentPlan();

    appState.parsedData = null;
    await restorePlan(saved);
    expect(appState.parsedData).toEqual(parsedData);
    expect(appState.configured).toBe(false);
  });

  it('normalizes legacy diet names before calculating a restored plan', async () => {
    const plan: SavedPlan = {
      id: 'portable', schemaVersion: 1, name: 'Portable',
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      parsedData: {
        ...parsedData,
        diets: [{ ...parsedData.diets[0], name: 'DIETA   1' }],
      },
      weekConfig: createDefaultWeekConfig(),
    };
    await restorePlan(plan);
    calculateActivePlan();
    expect(appState.parsedData?.diets[0].name).toBe('DIETA 1');
    expect(appState.shoppingList).toContainEqual(expect.objectContaining({ name: 'arroz', quantity: 320, unit: 'g', count: 4 }));
  });

  it('persists and restores the active weekly training organization', async () => {
    appState.parsedData = {
      ...structuredClone(parsedData),
      training: { tips: [], defaultRestSeconds: 60, days: [{
        id: 'monday', days: [1], title: 'Pierna', type: 'leg', activeRest: false, details: '', exercises: [],
      }, {
        id: 'tuesday', days: [2], title: 'Entrenamiento personalizado', type: 'custom', activeRest: false, details: '', exercises: [],
      }] },
    };

    const saved = await persistCurrentPlan();
    appState.parsedData = null;
    await restorePlan(saved);
    const restored = appState.parsedData as ParseResult | null;

    expect(restored?.training?.days[0]).toMatchObject({ title: 'Pierna', type: 'leg' });
    expect(restored?.training?.days[1]).toMatchObject({ title: 'Entrenamiento personalizado', type: 'custom' });
  });

  it('clears the active workspace when its only saved plan is deleted', async () => {
    for (const plan of await listPlans()) await deletePlan(plan.id);
    const saved = await persistCurrentPlan();

    await removePlan(saved.id);

    expect(appState.savedPlans).toEqual([]);
    expect(appState.activePlanId).toBeNull();
    expect(appState.parsedData).toBeNull();
    expect(appState.configured).toBe(false);
  });
});
