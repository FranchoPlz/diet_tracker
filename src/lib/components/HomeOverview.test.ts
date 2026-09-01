import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

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

  it('shows plan status and navigation actions without repeating plan contents', async () => {
    const onOpenDiet = vi.fn();
    const onReconfigure = vi.fn();
    const onOpenShopping = vi.fn();
    render(HomeOverview, { onOpenDiet, onReconfigure, onOpenShopping });

    expect(screen.getByRole('heading', { name: 'Plan abril' })).toBeTruthy();
    expect(screen.getByText('Aún no hay lista calculada.')).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Ver dieta' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Reconfigurar' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Abrir compra' }));
    expect(onOpenDiet).toHaveBeenCalledOnce();
    expect(onReconfigure).toHaveBeenCalledOnce();
    expect(onOpenShopping).toHaveBeenCalledOnce();
  });
});
