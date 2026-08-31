import 'fake-indexeddb/auto';
import { beforeEach, describe, expect, it } from 'vitest';
import { appState } from './state.svelte';
import { calculateActivePlan, persistCurrentPlan, portableWeekConfig, restorePlan } from './plan-controller';
import { createDefaultWeekConfig } from './utils';
import type { ParseResult, SavedPlan } from './types';

const parsedData: ParseResult = {
  status: 'ok',
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
  appState.pdfPath = '/Users/example/private/original.pdf';
  appState.weekConfig = createDefaultWeekConfig();
  appState.weekConfig.pdf_path = '/Users/example/private/original.pdf';
  appState.shoppingList = [];
  appState.checkedShoppingItems = {};
  appState.activeListId = null;
  appState.activePlanId = null;
  appState.activePlanName = 'Semana abril';
});

describe('plan controller', () => {
  it('sanitizes a config without mutating the active value', () => {
    const portable = portableWeekConfig(appState.weekConfig);
    expect(portable.pdf_path).toBeNull();
    expect(appState.weekConfig.pdf_path).toBe('/Users/example/private/original.pdf');
  });

  it('persists no original path and restores parsed data with a source label', async () => {
    const saved = await persistCurrentPlan();
    expect(saved.weekConfig.pdf_path).toBeNull();
    expect(JSON.stringify(saved)).not.toContain('/Users/example/private/original.pdf');

    appState.parsedData = null;
    await restorePlan(saved);
    expect(appState.parsedData).toEqual(parsedData);
    expect(appState.pdfPath).toBeNull();
    expect(appState.weekConfig.pdf_path).toBeNull();
    expect(appState.planSourceLabel).toBe('Plan guardado: Semana abril');
  });

  it('calculates from restored parsed data without a PDF path', async () => {
    const plan: SavedPlan = {
      id: 'portable', schemaVersion: 1, name: 'Portable',
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      parsedData, weekConfig: portableWeekConfig(createDefaultWeekConfig()),
    };
    await restorePlan(plan);
    calculateActivePlan();
    expect(appState.shoppingList).toContainEqual({ name: 'arroz', quantity: 320, unit: 'g', count: 4 });
  });
});
