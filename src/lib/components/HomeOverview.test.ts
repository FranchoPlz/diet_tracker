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

  it('shows only the active plan context', () => {
    render(HomeOverview);

    expect(screen.getByRole('heading', { name: 'Plan abril' })).toBeTruthy();
    expect(screen.getByText('Elige una pestaña para consultar tu dieta, entrenamiento o compra.')).toBeTruthy();
    expect(screen.queryByRole('button')).toBeNull();
  });
});
