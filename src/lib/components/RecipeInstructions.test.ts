import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, describe, expect, it } from 'vitest';

import RecipeInstructions from './RecipeInstructions.svelte';

describe('RecipeInstructions', () => {
  afterEach(cleanup);

  it('is collapsed by default and opens from its mobile-friendly summary', async () => {
    render(RecipeInstructions, { text: 'Cocinar a fuego lento y servir.' });

    const summary = screen.getByText('Cómo prepararlo').closest('summary')!;
    const details = summary.closest('details')!;
    expect(details.open).toBe(false);
    expect(summary.className).toContain('min-h-12');

    await fireEvent.click(summary);

    expect(details.open).toBe(true);
    expect(screen.getByText('Cocinar a fuego lento y servir.')).toBeTruthy();
  });
});
