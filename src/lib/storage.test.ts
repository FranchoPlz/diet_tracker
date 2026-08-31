import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { deletePlan, listPlans, savePlan } from './storage';
import type { SavedPlan } from './types';
import { createDefaultWeekConfig } from './utils';

beforeAll(async () => {
  await new Promise<void>((resolve, reject) => {
    const request = indexedDB.deleteDatabase('diet-planner');
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
});

describe('plan storage', () => {
  it('saves, orders, and deletes plans', async () => {
    const makePlan = (id: string, name: string): SavedPlan => ({
      id, schemaVersion: 1, name,
      createdAt: '2026-01-01T00:00:00.000Z',
      updatedAt: '2026-01-01T00:00:00.000Z',
      parsedData: { status: 'ok', diets: [] },
      weekConfig: { ...createDefaultWeekConfig(), pdf_path: '/private/original.pdf' },
    });
    await savePlan(makePlan('one', 'Uno'));
    await new Promise(resolve => setTimeout(resolve, 2));
    await savePlan(makePlan('two', 'Dos'));

    const saved = await listPlans();
    expect(saved.map(plan => plan.id)).toEqual(['two', 'one']);
    expect(saved.every(plan => plan.weekConfig.pdf_path === null)).toBe(true);
    expect(JSON.stringify(saved)).not.toContain('/private/original.pdf');
    await deletePlan('two');
    expect((await listPlans()).map(plan => plan.id)).toEqual(['one']);
  });
});
