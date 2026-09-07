import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AppTabs from './AppTabs.svelte';

describe('AppTabs', () => {
  afterEach(cleanup);

  it('renders five accessible tabs and reports tab changes', async () => {
    const onChange = vi.fn();
    render(AppTabs, { active: 'training', onChange, shoppingCount: 4 });

    const tablist = screen.getByRole('tablist');
    const tabs = within(tablist).getAllByRole('tab');

    expect(tabs).toHaveLength(5);
    expect(tabs.map((tab) => tab.getAttribute('aria-label'))).toEqual(['Inicio', 'Dieta', 'Ejercicios', 'Compra', 'Ajustes']);
    expect(screen.getByRole('tab', { name: 'Ejercicios' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Dieta' }).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByText('4')).not.toBeNull();

    await fireEvent.click(screen.getByRole('tab', { name: 'Compra' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('shopping');
  });

  it('shows icons on phones and reveals text labels at the desktop breakpoint', () => {
    render(AppTabs, { active: 'settings', onChange: vi.fn() });

    const settings = screen.getByRole('tab', { name: 'Ajustes' });
    expect(settings.querySelector('svg')).not.toBeNull();
    expect(settings.querySelector('span')?.className).toContain('hidden');
    expect(settings.querySelector('span')?.className).toContain('sm:inline');
  });

  it('omits the shopping badge when no count is provided', () => {
    render(AppTabs, { active: 'home', onChange: vi.fn() });

    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });
});
