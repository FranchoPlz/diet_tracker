import { cleanup, render, screen, waitFor } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  applyList: vi.fn(),
  initializeLists: vi.fn().mockResolvedValue(undefined),
  readSharedListFromHash: vi.fn(),
  saveShoppingList: vi.fn().mockResolvedValue(undefined),
}));

vi.mock('$lib/list-controller', () => ({
  applyList: mocks.applyList,
  initializeLists: mocks.initializeLists,
}));
vi.mock('$lib/share', () => ({ readSharedListFromHash: mocks.readSharedListFromHash }));
vi.mock('$lib/storage', () => ({ saveShoppingList: mocks.saveShoppingList }));

import ShareImport from './ShareImport.svelte';

describe('ShareImport', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    history.replaceState(null, '', '/diet_tracker/#share=payload');
  });

  afterEach(cleanup);

  it('imports a QR link while the initial screen is empty', async () => {
    const imported = { id: 'copy', name: 'Compra (copia)', items: [] };
    mocks.readSharedListFromHash.mockReturnValue(imported);

    render(ShareImport);

    await waitFor(() => expect(mocks.applyList).toHaveBeenCalledWith(imported));
    expect(mocks.saveShoppingList).toHaveBeenCalledWith(imported);
    expect(location.hash).toBe('');
    expect(screen.getByRole('status').textContent).toContain('Lista compartida importada');
  });
});
