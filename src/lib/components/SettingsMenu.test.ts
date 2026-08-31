import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it } from 'vitest';

import { appState } from '$lib/state.svelte';
import SettingsMenu from './SettingsMenu.svelte';

describe('SettingsMenu', () => {
  beforeEach(() => {
    localStorage.clear();
    appState.compactView = false;
  });

  afterEach(cleanup);

  it('enables and persists compact view', async () => {
    render(SettingsMenu);

    const toggle = screen.getByRole('checkbox', { name: 'Vista compacta' });
    await fireEvent.click(toggle);

    expect(appState.compactView).toBe(true);
    expect(localStorage.getItem('compactView')).toBe('true');
  });

  it('restores the saved preference', async () => {
    localStorage.setItem('compactView', 'true');
    render(SettingsMenu);

    await screen.findByRole('checkbox', { name: 'Vista compacta', checked: true });
    expect(appState.compactView).toBe(true);
  });
});
