import { beforeEach, describe, expect, it, vi } from 'vitest';

const storage = vi.hoisted(() => ({
  deleteShoppingList: vi.fn().mockResolvedValue(undefined),
  listShoppingLists: vi.fn().mockResolvedValue([]),
  saveShoppingList: vi.fn(),
}));

vi.mock('./storage', () => storage);

import { removeShoppingList } from './list-controller';
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
