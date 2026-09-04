import 'fake-indexeddb/auto';
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

  it('groups plan controls and allows closing the plan selector', async () => {
    const onResetWeek = vi.fn();
    render(HomeOverview, { onResetWeek });

    expect(screen.getByRole('heading', { name: 'Plan abril' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Cambiar plan' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Mis listas' })).toBeNull();
    expect(screen.getByRole('button', { name: 'Cambiar PDF' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Cambiar plan' }));
    expect(screen.getByRole('button', { name: 'Cerrar selector de planes' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Cerrar selector de planes' }));
    expect(screen.queryByRole('button', { name: 'Cerrar selector de planes' })).toBeNull();
    await fireEvent.click(screen.getByRole('button', { name: 'Reiniciar semana manualmente' }));
    expect(onResetWeek).toHaveBeenCalledOnce();
  });
});
