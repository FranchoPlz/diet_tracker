import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

import { appState } from '$lib/state.svelte';
import { createDefaultWeekConfig } from '$lib/utils';
import GlobalDietConfiguration from './GlobalDietConfiguration.svelte';

describe('GlobalDietConfiguration', () => {
  beforeEach(() => {
    appState.weekConfig = createDefaultWeekConfig();
    appState.parsedData = {
      status: 'ok',
      diets: [
        { name: 'DIETA 1', intro: '', meals: [] },
        { name: 'DIETA 2', intro: '', meals: [] },
      ],
    };
  });

  afterEach(cleanup);

  it('renders both global editors and completes through its callback', async () => {
    const onComplete = vi.fn();
    render(GlobalDietConfiguration, { onComplete });

    expect(screen.getByRole('heading', { name: 'DIETA 1' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'DIETA 2' })).toBeTruthy();
    await fireEvent.click(screen.getByRole('button', { name: 'Guardar configuración global' }));
    expect(onComplete).toHaveBeenCalledOnce();
  });
});
