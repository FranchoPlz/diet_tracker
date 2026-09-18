import 'fake-indexeddb/auto';
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
    appState.activePlanName = 'Plan activo';
  });

  afterEach(cleanup);

  it('removes a calculated item that initially has no id', async () => {
    render(ShoppingList);
    await waitFor(() => expect(appState.shoppingList[0].id).toBeTruthy());

    await fireEvent.click(screen.getByRole('button', { name: 'Eliminar Arroz' }));

    expect(appState.shoppingList).toEqual([]);
  });

  it('exposes list naming, saving, library, and sharing controls', async () => {
    render(ShoppingList);

    expect((screen.getByRole('textbox', { name: 'Nombre de la lista' }) as HTMLInputElement).value).toBe('Lista calculada');
    expect(screen.getByRole('button', { name: 'Guardar lista' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Mis listas' })).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Compartir' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Lista calculada' })).toBeTruthy();
  });

  it('keeps an item checked when its name changes', async () => {
    render(ShoppingList);
    await waitFor(() => expect(appState.shoppingList[0].id).toBeTruthy());

    await fireEvent.click(screen.getByRole('checkbox', { name: 'Marcar Arroz' }));
    await fireEvent.click(screen.getByRole('button', { name: /Arroz 80 g/ }));
    await fireEvent.input(screen.getByRole('textbox', { name: 'Producto' }), { target: { value: 'Arroz integral' } });

    expect((screen.getByRole('checkbox', { name: 'Marcar Arroz integral' }) as HTMLInputElement).checked).toBe(true);
  });
});
