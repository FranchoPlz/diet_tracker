import { cleanup, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import FloatingPreferences from './FloatingPreferences.svelte';

describe('FloatingPreferences', () => {
  afterEach(cleanup);

  it('groups theme and settings controls in a floating preference bar', () => {
    render(FloatingPreferences);

    expect(screen.getByLabelText('Preferencias')).toBeTruthy();
    expect(screen.getByLabelText('Ajustes')).toBeTruthy();
    expect(screen.getByRole('button', { name: /modo (claro|oscuro)/i })).toBeTruthy();
  });
});
