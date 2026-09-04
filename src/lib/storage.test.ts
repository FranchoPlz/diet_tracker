import 'fake-indexeddb/auto';
import { beforeAll, describe, expect, it } from 'vitest';
import { deletePlan, getActivePlanId, getActiveTab, listPlans, savePlan, setActivePlanId, setActiveTab } from './storage';
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

  it('stores active plan metadata and clears it with the active plan', async () => {
    await setActivePlanId('one');
    expect(await getActivePlanId()).toBe('one');
    await deletePlan('one');
    expect(await getActivePlanId()).toBeNull();
  });

  it('stores a valid active tab', async () => {
    await setActiveTab('training');
    expect(await getActiveTab()).toBe('training');
  });

  it('normalizes v1 plans on read without requiring an eager database rewrite', async () => {
    const legacy: SavedPlan = {
      id: 'legacy', schemaVersion: 1, name: 'Anterior',
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      parsedData: { status: 'ok', diets: [] },
      weekConfig: createDefaultWeekConfig(),
    };
    const request = indexedDB.open('diet-planner', 2);
    const db = await new Promise<IDBDatabase>((resolve, reject) => {
      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error);
    });
    await new Promise<void>((resolve, reject) => {
      const transaction = db.transaction('plans', 'readwrite');
      transaction.objectStore('plans').put(legacy);
      transaction.oncomplete = () => resolve();
      transaction.onerror = () => reject(transaction.error);
    });
    db.close();

    const migrated = (await listPlans()).find(plan => plan.id === 'legacy');
    expect(migrated).toMatchObject({
      schemaVersion: 3,
      configured: true,
      weekTracker: { activeDayIndex: 0, weekNumber: 1, trainingWeights: {} },
    });
  });
});
