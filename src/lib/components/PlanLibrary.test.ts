import { cleanup, fireEvent, render, screen } from '@testing-library/svelte';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';

const mocks = vi.hoisted(() => ({
  calculateActivePlan: vi.fn(),
  duplicatePlan: vi.fn(),
  initializePlans: vi.fn().mockResolvedValue(undefined),
  persistCurrentPlan: vi.fn(),
  removePlan: vi.fn().mockResolvedValue(undefined),
  renamePlan: vi.fn(),
  restorePlan: vi.fn(),
}));

vi.mock('$lib/plan-controller', () => mocks);

import { appState } from '$lib/state.svelte';
import PlanLibrary from './PlanLibrary.svelte';

describe('PlanLibrary', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    appState.parsedData = { status: 'ok', diets: [] };
    appState.activePlanId = 'active';
    appState.activePlanName = 'Plan activo';
    appState.savedPlans = [{
      id: 'active', schemaVersion: 4, configured: true, name: 'Plan activo',
      createdAt: '2026-01-01T00:00:00.000Z', updatedAt: '2026-01-01T00:00:00.000Z',
      parsedData: appState.parsedData,
      weekConfig: appState.weekConfig,
    }];
  });

  afterEach(cleanup);

  it('requires confirmation before deleting a saved plan', async () => {
    vi.spyOn(window, 'confirm').mockReturnValue(false);
    render(PlanLibrary);
    await fireEvent.click(screen.getByRole('button', { name: 'Cambiar plan' }));
    await fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(mocks.removePlan).not.toHaveBeenCalled();

    vi.mocked(confirm).mockReturnValue(true);
    await fireEvent.click(screen.getByRole('button', { name: 'Eliminar' }));
    expect(mocks.removePlan).toHaveBeenCalledWith('active');
  });
});
