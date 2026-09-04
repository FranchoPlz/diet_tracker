import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appState } from '$lib/state.svelte';
import { createDefaultWeekConfig } from '$lib/utils';
import CurrentDayDiet from './CurrentDayDiet.svelte';

describe('CurrentDayDiet', () => {
  beforeEach(() => {
    appState.weekTracker.activeDayIndex = 0;
    appState.weekConfig = createDefaultWeekConfig();
    appState.parsedData = {
      status: 'ok',
      diets: [{
        name: 'DIETA 1',
        intro: '',
        meals: [{ type: 'COMIDA', options: [{ name: 'Arroz', description: null, ingredient_lines: [] }] }],
      }],
    };
  });

  afterEach(cleanup);

  it('shows every meal collapsed and expands each one independently', async () => {
    render(CurrentDayDiet, { onEdit: vi.fn() });
    expect(screen.queryByText('Día 1')).toBeNull();
    expect(screen.getByRole('heading', { name: 'Hoy toca DIETA 1' })).toBeTruthy();
    const toggle = screen.getByRole('button', { name: /COMIDA Arroz/ });

    expect(toggle.getAttribute('aria-expanded')).toBe('false');
    await fireEvent.click(toggle);
    expect(toggle.getAttribute('aria-expanded')).toBe('true');
  });
});
