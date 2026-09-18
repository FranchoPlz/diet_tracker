import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appState } from '$lib/state.svelte';
import Page from './+page.svelte';

describe('application workspace', () => {
  beforeEach(() => {
    appState.persistenceReady = true;
    appState.parsedData = null;
    appState.activeListId = 'shared-list';
    appState.activeListName = 'Compra compartida';
    appState.shoppingList = [{
      id: 'item-1', name: 'Arroz', quantity: 1, unit: 'kg', count: 1,
      category: 'Despensa', checked: false, custom: false,
    }];
    appState.checkedShoppingItems = {};
    appState.savedLists = [];
    appState.error = null;
  });

  afterEach(cleanup);

  it('shows an imported standalone list without requiring a diet plan', () => {
    render(Page);

    expect(screen.getByRole('heading', { name: 'Compra compartida' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cargar dieta' })).toBeTruthy();
    expect(screen.queryByText('Carga tu plan de dieta')).toBeNull();
  });
});
