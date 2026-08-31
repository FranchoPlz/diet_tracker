import { cleanup, fireEvent, render, screen, within } from '@testing-library/svelte';
import { afterEach, describe, expect, it, vi } from 'vitest';

import AppTabs from './AppTabs.svelte';

describe('AppTabs', () => {
  afterEach(cleanup);

  it('renders three accessible tabs and reports tab changes', async () => {
    const onChange = vi.fn();
    render(AppTabs, { active: 'training', onChange, shoppingCount: 4 });

    const tablist = screen.getByRole('tablist');
    const tabs = within(tablist).getAllByRole('tab');

    expect(tabs).toHaveLength(3);
    expect(tabs.map((tab) => tab.getAttribute('aria-label'))).toEqual(['Dieta', 'Ejercicios', 'Compra']);
    expect(screen.getByRole('tab', { name: 'Ejercicios' }).getAttribute('aria-selected')).toBe('true');
    expect(screen.getByRole('tab', { name: 'Dieta' }).getAttribute('aria-selected')).toBe('false');
    expect(screen.getByText('4')).not.toBeNull();

    await fireEvent.click(screen.getByRole('tab', { name: 'Compra' }));

    expect(onChange).toHaveBeenCalledOnce();
    expect(onChange).toHaveBeenCalledWith('shopping');
  });

  it('omits the shopping badge when no count is provided', () => {
    render(AppTabs, { active: 'diet', onChange: vi.fn() });

    expect(screen.queryByText(/^\d+$/)).toBeNull();
  });
});
