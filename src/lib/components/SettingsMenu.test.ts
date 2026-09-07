import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { initializePreferences } from '$lib/preferences';
import { appState } from '$lib/state.svelte';
import SettingsMenu from './SettingsMenu.svelte';

describe('SettingsMenu', () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.classList.remove('dark');
    appState.compactView = false;
    appState.askToModifyDiet = true;
    appState.autoDay = true;
    appState.darkMode = false;
  });

  afterEach(cleanup);

  it('renders every preference in the settings page', () => {
    render(SettingsMenu);

    expect(screen.getByRole('heading', { name: 'Ajustes' })).toBeTruthy();
    expect(screen.getAllByRole('checkbox').map(input => input.getAttribute('aria-label'))).toEqual([
      'Vista compacta', 'Día automático', 'Preguntar por la dieta', 'Modo oscuro',
    ]);
  });

  it('persists all changed preferences', async () => {
    render(SettingsMenu);

    await fireEvent.click(screen.getByRole('checkbox', { name: 'Vista compacta' }));
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Día automático' }));
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Preguntar por la dieta' }));
    await fireEvent.click(screen.getByRole('checkbox', { name: 'Modo oscuro' }));

    expect(localStorage.getItem('compactView')).toBe('true');
    expect(localStorage.getItem('autoDay')).toBe('false');
    expect(localStorage.getItem('askToModifyDiet')).toBe('false');
    expect(localStorage.getItem('darkMode')).toBe('true');
    expect(document.documentElement.classList.contains('dark')).toBe(true);
  });

  it('initializes persisted preferences before opening settings', () => {
    localStorage.setItem('compactView', 'true');
    localStorage.setItem('autoDay', 'false');
    localStorage.setItem('askToModifyDiet', 'false');
    localStorage.setItem('darkMode', 'false');

    initializePreferences();
    render(SettingsMenu);

    expect((screen.getByRole('checkbox', { name: 'Vista compacta' }) as HTMLInputElement).checked).toBe(true);
    expect((screen.getByRole('checkbox', { name: 'Día automático' }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole('checkbox', { name: 'Preguntar por la dieta' }) as HTMLInputElement).checked).toBe(false);
    expect((screen.getByRole('checkbox', { name: 'Modo oscuro' }) as HTMLInputElement).checked).toBe(false);
  });
});
