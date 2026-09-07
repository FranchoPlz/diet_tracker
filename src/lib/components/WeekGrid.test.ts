import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appState } from '$lib/state.svelte';
import { createDefaultWeekConfig } from '$lib/utils';
import { scheduleWorkspaceAutosave } from '$lib/workspace-controller';
import WeekGrid from './WeekGrid.svelte';

vi.mock('$lib/workspace-controller', () => ({
  scheduleWorkspaceAutosave: vi.fn(),
}));

describe('WeekGrid', () => {
  beforeEach(() => {
    vi.mocked(scheduleWorkspaceAutosave).mockClear();
    appState.weekConfig = createDefaultWeekConfig();
    appState.shoppingList = [{ name: 'arroz', quantity: 80, unit: 'g', count: 1 }];
    appState.checkedShoppingItems = { 'arroz|g': true };
  });

  afterEach(cleanup);

  it('autosaves a changed day diet', async () => {
    render(WeekGrid, { onDayClick: vi.fn(), selectedDayIndex: null });

    await fireEvent.click(screen.getAllByRole('button', { name: 'Dieta 2' })[0]);

    expect(appState.weekConfig.days[0].diet).toBe('DIETA 2');
    expect(appState.shoppingList).toEqual([]);
    expect(appState.checkedShoppingItems).toEqual({});
    expect(scheduleWorkspaceAutosave).toHaveBeenCalledWith(0);
  });
});
