import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({
  deleteShoppingList: vi.fn().mockResolvedValue(undefined),
  listShoppingLists: vi.fn().mockResolvedValue([]),
  saveShoppingList: vi.fn(),
}));

vi.mock('./storage', () => storage);

import { applyList, persistCurrentList, removeShoppingList } from './list-controller';
import { appState } from './state.svelte';

describe('removeShoppingList', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appState.activeListId = 'active';
    appState.activeListName = 'Compra';
    appState.shoppingList = [{ name: 'Leche', quantity: 1, unit: 'l', count: 1 }];
    appState.checkedShoppingItems = { 'Leche|l': true };
  });

  it('deletes and closes the active list', async () => {
    await removeShoppingList('active');

    expect(storage.deleteShoppingList).toHaveBeenCalledWith('active');
    expect(appState.activeListId).toBeNull();
    expect(appState.activeListName).toBe('Lista de la semana');
    expect(appState.shoppingList).toEqual([]);
    expect(appState.checkedShoppingItems).toEqual({});
  });
});

describe('shopping item state', () => {
  it('tracks and persists checked state by stable item id', async () => {
    const list = {
      id: 'list', schemaVersion: 1 as const, name: 'Compra',
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      items: [{ id: 'item', name: 'Leche', quantity: 1, unit: 'l', count: 1, category: 'Lácteos y huevos' as const, checked: true, custom: false }],
    };
    appState.savedLists = [list];

    applyList(list);
    appState.shoppingList[0].name = 'Leche entera';
    await persistCurrentList();

    expect(appState.checkedShoppingItems).toEqual({ item: true });
    expect(storage.saveShoppingList).toHaveBeenCalledWith(expect.objectContaining({
      items: [expect.objectContaining({ id: 'item', name: 'Leche entera', checked: true })],
    }));
  });
});
