import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appState } from '$lib/state.svelte';
import ShoppingList from './ShoppingList.svelte';

describe('ShoppingList', () => {
  beforeEach(() => {
    appState.activeListId = null;
    appState.activeListName = 'Lista calculada';
    appState.shoppingList = [{ name: 'Arroz', quantity: 80, unit: 'g', count: 1 }];
    appState.checkedShoppingItems = {};
  });

  afterEach(cleanup);

  it('removes a calculated item that initially has no id', async () => {
    render(ShoppingList);
    await waitFor(() => expect(appState.shoppingList[0].id).toBeTruthy());

    await fireEvent.click(screen.getByRole('button', { name: 'Eliminar Arroz' }));

    expect(appState.shoppingList).toEqual([]);
  });
});
