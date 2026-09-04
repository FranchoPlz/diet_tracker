import 'fake-indexeddb/auto';
import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appState } from '$lib/state.svelte';
import { createDefaultWeekConfig } from '$lib/utils';
import HomeOverview from './HomeOverview.svelte';

describe('HomeOverview', () => {
  beforeEach(() => {
    appState.activePlanName = 'Plan abril';
    appState.weekConfig = createDefaultWeekConfig();
    appState.parsedData = { status: 'ok', diets: [{ name: 'DIETA 1', intro: '', meals: [] }, { name: 'DIETA 2', intro: '', meals: [] }] };
    appState.shoppingList = [];
    appState.checkedShoppingItems = {};
  });

  afterEach(cleanup);

  it('groups plan libraries and PDF controls on Inicio', () => {
    render(HomeOverview);

    expect(screen.getByRole('heading', { name: 'Plan abril' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cambiar plan' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mis listas' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Crear nuevo plan' })).toBeTruthy();
  });
});
